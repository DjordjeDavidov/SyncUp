"use server";

import { Prisma, community_visibility } from "@/lib/prisma-generated";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { communityCategoryValues } from "@/lib/community-categories";
import {
  getImageUploadError,
  MAX_COMMUNITY_COVER_SIZE_BYTES,
  MAX_COMMUNITY_ICON_SIZE_BYTES,
} from "@/lib/image-upload";
import { FormState, fromZodError } from "@/lib/validation";
import { getCurrentUserOrRedirect } from "@/server/auth";
import {
  canChangeCommunityRole,
  canEditCommunity,
  canRemoveCommunityMember,
  type CommunityRole,
} from "@/server/community-permissions";
import { uploadImage } from "@/server/storage";

const communitySchema = z
  .object({
    name: z.string().trim().min(3, "Community name must be at least 3 characters.").max(120),
    description: z.string().trim().min(12, "Add a short description so people know the vibe.").max(1000),
    category: z.enum(communityCategoryValues, {
      error: () => ({ message: "Choose a category for this community." }),
    }),
    customCategory: z.string().trim().max(120, "Custom category must be 120 characters or less.").optional(),
    visibility: z.nativeEnum(community_visibility),
  })
  .superRefine((value, ctx) => {
    if (value.category === "custom" && !value.customCategory?.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["customCategory"],
        message: "Add a custom category name.",
      });
    }
  });

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function getTextValue(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

function getBooleanValue(formData: FormData, key: string) {
  return getTextValue(formData, key) === "true";
}

function refreshCommunitySurfaces(args: {
  username: string;
  slug?: string | null;
  communityId?: string | null;
}) {
  revalidatePath("/home");
  revalidatePath("/communities");
  revalidatePath("/profile");
  revalidatePath(`/profile/${args.username}`);
  revalidatePath("/chats");

  if (args.slug) {
    revalidatePath(`/communities/${args.slug}`);
    revalidatePath(`/communities/${args.slug}/edit`);
    revalidatePath(`/communities/${args.slug}/chat`);
  }

  if (args.communityId) {
    revalidatePath(`/chats/${args.communityId}`);
  }
}

async function validateCommunityImages(formData: FormData) {
  const cover = formData.get("cover");
  const icon = formData.get("icon");
  const errors: Record<string, string[]> = {};

  const coverError =
    cover instanceof File && cover.size > 0
      ? getImageUploadError(cover, {
          maxSizeBytes: MAX_COMMUNITY_COVER_SIZE_BYTES,
          label: "Banner image",
        })
      : null;
  const iconError =
    icon instanceof File && icon.size > 0
      ? getImageUploadError(icon, {
          maxSizeBytes: MAX_COMMUNITY_ICON_SIZE_BYTES,
          label: "Community icon",
        })
      : null;

  if (coverError) {
    errors.cover = [coverError];
  }

  if (iconError) {
    errors.icon = [iconError];
  }

  return {
    cover: cover instanceof File && cover.size > 0 ? cover : null,
    icon: icon instanceof File && icon.size > 0 ? icon : null,
    errors,
  };
}

async function buildCommunityPayload(args: {
  currentUserId: string;
  formData: FormData;
}) {
  const imageValidation = await validateCommunityImages(args.formData);

  if (Object.keys(imageValidation.errors).length > 0) {
    return {
      parsed: null,
      coverPayload: undefined,
      iconPayload: undefined,
      errors: imageValidation.errors,
    };
  }

  const parsed = communitySchema.safeParse({
    name: getTextValue(args.formData, "name"),
    description: getTextValue(args.formData, "description"),
    category: getTextValue(args.formData, "category"),
    customCategory: getTextValue(args.formData, "customCategory"),
    visibility: args.formData.get("visibility") || community_visibility.PUBLIC,
  });

  if (!parsed.success) {
    return {
      parsed: null,
      coverPayload: undefined,
      iconPayload: undefined,
      errors: fromZodError(parsed.error).errors ?? {},
    };
  }

  const [coverPayload, iconPayload] = await Promise.all([
    imageValidation.cover
      ? uploadImage({
          file: imageValidation.cover,
          userId: args.currentUserId,
          kind: "community",
        })
      : Promise.resolve(undefined),
    imageValidation.icon
      ? uploadImage({
          file: imageValidation.icon,
          userId: args.currentUserId,
          kind: "community",
        })
      : Promise.resolve(undefined),
  ]);

  return {
    parsed: parsed.data,
    coverPayload,
    iconPayload,
    errors: {},
  };
}

export async function createCommunityAction(_: FormState, formData: FormData): Promise<FormState> {
  const currentUser = await getCurrentUserOrRedirect();
  const payload = await buildCommunityPayload({
    currentUserId: currentUser.id,
    formData,
  });

  if (!payload.parsed) {
    return {
      message: "Please fix the highlighted fields.",
      errors: payload.errors,
      success: false,
    };
  }

  const baseSlug = slugify(payload.parsed.name);

  if (!baseSlug) {
    return {
      message: "Please choose a community name that can be turned into a valid slug.",
      success: false,
    };
  }

  try {
    let slug = baseSlug;
    let suffix = 1;

    while (
      await prisma.communities.findUnique({
        where: { slug },
        select: { id: true },
      })
    ) {
      suffix += 1;
      slug = `${baseSlug}-${suffix}`;
    }

    const community = await prisma.$transaction(async (tx) => {
      const createdCommunity = await tx.communities.create({
        data: {
          owner_id: currentUser.id,
          name: payload.parsed.name,
          slug,
          description: payload.parsed.description,
          category: payload.parsed.category,
          custom_category:
            payload.parsed.category === "custom" ? payload.parsed.customCategory?.trim() || null : null,
          visibility: payload.parsed.visibility,
          icon_path: payload.iconPayload?.path,
          icon_url: payload.iconPayload?.url,
          cover_path: payload.coverPayload?.path,
          cover_url: payload.coverPayload?.url,
        },
      });

      await tx.community_members.create({
        data: {
          community_id: createdCommunity.id,
          user_id: currentUser.id,
          role: "OWNER",
        },
      });

      return createdCommunity;
    });

    refreshCommunitySurfaces({
      username: currentUser.username,
      slug: community.slug,
      communityId: community.id,
    });

    return {
      message: "Community created successfully.",
      errors: {},
      success: true,
      redirectTo: `/communities/${community.slug}`,
    };
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return {
        message: "A community with that slug already exists. Try a slightly different name.",
        success: false,
      };
    }

    return {
      message: error instanceof Error ? error.message : "Could not create the community right now.",
      success: false,
    };
  }
}

export async function updateCommunityAction(
  communityId: string,
  _: FormState,
  formData: FormData,
): Promise<FormState> {
  const currentUser = await getCurrentUserOrRedirect();
  const membership = await prisma.community_members.findUnique({
    where: {
      community_id_user_id: {
        community_id: communityId,
        user_id: currentUser.id,
      },
    },
    select: {
      role: true,
    },
  });

  if (!canEditCommunity((membership?.role as CommunityRole | undefined) ?? null)) {
    return {
      message: "You do not have permission to edit this community.",
      success: false,
    };
  }

  const existingCommunity = await prisma.communities.findUnique({
    where: { id: communityId },
    select: {
      id: true,
      slug: true,
      owner_id: true,
    },
  });

  if (!existingCommunity) {
    return {
      message: "Community not found.",
      success: false,
    };
  }

  const payload = await buildCommunityPayload({
    currentUserId: currentUser.id,
    formData,
  });

  if (!payload.parsed) {
    return {
      message: "Please fix the highlighted fields.",
      errors: payload.errors,
      success: false,
    };
  }

  const removeCover = getBooleanValue(formData, "removeCover");
  const removeIcon = getBooleanValue(formData, "removeIcon");
  const proposedSlug = slugify(payload.parsed.name);

  if (!proposedSlug) {
    return {
      message: "Please choose a community name that can be turned into a valid slug.",
      success: false,
    };
  }

  try {
    let slug = existingCommunity.slug;

    if (payload.parsed.name !== getTextValue(formData, "currentName")) {
      slug = proposedSlug;
      let suffix = 1;

      while (
        await prisma.communities.findFirst({
          where: {
            slug,
            id: {
              not: communityId,
            },
          },
          select: { id: true },
        })
      ) {
        suffix += 1;
        slug = `${proposedSlug}-${suffix}`;
      }
    }

    const community = await prisma.communities.update({
      where: { id: communityId },
      data: {
        name: payload.parsed.name,
        slug,
        description: payload.parsed.description,
        category: payload.parsed.category,
        custom_category:
          payload.parsed.category === "custom" ? payload.parsed.customCategory?.trim() || null : null,
        visibility: payload.parsed.visibility,
        icon_path: payload.iconPayload?.path ?? (removeIcon ? null : undefined),
        icon_url: payload.iconPayload?.url ?? (removeIcon ? null : undefined),
        cover_path: payload.coverPayload?.path ?? (removeCover ? null : undefined),
        cover_url: payload.coverPayload?.url ?? (removeCover ? null : undefined),
        updated_at: new Date(),
      },
    });

    refreshCommunitySurfaces({
      username: currentUser.username,
      slug: community.slug,
      communityId: community.id,
    });

    return {
      message: "Community updated successfully.",
      errors: {},
      success: true,
      redirectTo: `/communities/${community.slug}`,
    };
  } catch (error) {
    return {
      message: error instanceof Error ? error.message : "Could not update the community right now.",
      success: false,
    };
  }
}

export async function joinCommunityAction(communityId: string): Promise<{ success: boolean; message: string }> {
  try {
    const currentUser = await getCurrentUserOrRedirect();

    const community = await prisma.communities.findUnique({
      where: { id: communityId },
      select: { id: true, slug: true },
    });

    if (!community) {
      return { success: false, message: "Community not found." };
    }

    const existingMembership = await prisma.community_members.findUnique({
      where: {
        community_id_user_id: {
          community_id: communityId,
          user_id: currentUser.id,
        },
      },
      select: { user_id: true },
    });

    if (existingMembership) {
      return { success: false, message: "You are already a member of this community." };
    }

    await prisma.community_members.create({
      data: {
        community_id: communityId,
        user_id: currentUser.id,
        role: "MEMBER",
      },
    });

    refreshCommunitySurfaces({
      username: currentUser.username,
      slug: community.slug,
      communityId,
    });

    return { success: true, message: "Successfully joined the community!" };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : "Could not join the community right now.",
    };
  }
}

export async function leaveCommunityAction(communityId: string): Promise<{ success: boolean; message: string }> {
  try {
    const currentUser = await getCurrentUserOrRedirect();

    const membership = await prisma.community_members.findUnique({
      where: {
        community_id_user_id: {
          community_id: communityId,
          user_id: currentUser.id,
        },
      },
      include: {
        communities: {
          select: {
            id: true,
            slug: true,
          },
        },
      },
    });

    if (!membership) {
      return { success: false, message: "You are not a member of this community." };
    }

    if (membership.role === "OWNER") {
      return {
        success: false,
        message: "Community owners cannot leave. Transfer ownership before leaving.",
      };
    }

    await prisma.community_members.delete({
      where: {
        community_id_user_id: {
          community_id: communityId,
          user_id: currentUser.id,
        },
      },
    });

    refreshCommunitySurfaces({
      username: currentUser.username,
      slug: membership.communities.slug,
      communityId,
    });

    return { success: true, message: "Successfully left the community." };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : "Could not leave the community right now.",
    };
  }
}

export async function updateCommunityMemberRoleAction(args: {
  communityId: string;
  targetUserId: string;
  nextRole: CommunityRole;
}) {
  const currentUser = await getCurrentUserOrRedirect();
  const [actorMembership, targetMembership, community] = await Promise.all([
    prisma.community_members.findUnique({
      where: {
        community_id_user_id: {
          community_id: args.communityId,
          user_id: currentUser.id,
        },
      },
      select: {
        role: true,
      },
    }),
    prisma.community_members.findUnique({
      where: {
        community_id_user_id: {
          community_id: args.communityId,
          user_id: args.targetUserId,
        },
      },
      select: {
        role: true,
      },
    }),
    prisma.communities.findUnique({
      where: { id: args.communityId },
      select: {
        id: true,
        slug: true,
      },
    }),
  ]);

  if (!actorMembership || !targetMembership || !community) {
    throw new Error("Community membership could not be found.");
  }

  if (
    !canChangeCommunityRole({
      actorRole: actorMembership.role as CommunityRole,
      targetRole: targetMembership.role as CommunityRole,
      nextRole: args.nextRole,
      isSelf: currentUser.id === args.targetUserId,
    })
  ) {
    throw new Error("You cannot make that role change.");
  }

  await prisma.community_members.update({
    where: {
      community_id_user_id: {
        community_id: args.communityId,
        user_id: args.targetUserId,
      },
    },
    data: {
      role: args.nextRole,
    },
  });

  refreshCommunitySurfaces({
    username: currentUser.username,
    slug: community.slug,
    communityId: args.communityId,
  });
}

export async function removeCommunityMemberAction(args: {
  communityId: string;
  targetUserId: string;
}) {
  const currentUser = await getCurrentUserOrRedirect();
  const [actorMembership, targetMembership, community] = await Promise.all([
    prisma.community_members.findUnique({
      where: {
        community_id_user_id: {
          community_id: args.communityId,
          user_id: currentUser.id,
        },
      },
      select: {
        role: true,
      },
    }),
    prisma.community_members.findUnique({
      where: {
        community_id_user_id: {
          community_id: args.communityId,
          user_id: args.targetUserId,
        },
      },
      select: {
        role: true,
      },
    }),
    prisma.communities.findUnique({
      where: { id: args.communityId },
      select: {
        id: true,
        slug: true,
      },
    }),
  ]);

  if (!actorMembership || !targetMembership || !community) {
    throw new Error("Community membership could not be found.");
  }

  if (
    !canRemoveCommunityMember({
      actorRole: actorMembership.role as CommunityRole,
      targetRole: targetMembership.role as CommunityRole,
      isSelf: currentUser.id === args.targetUserId,
    })
  ) {
    throw new Error("You cannot remove this member.");
  }

  await prisma.community_members.delete({
    where: {
      community_id_user_id: {
        community_id: args.communityId,
        user_id: args.targetUserId,
      },
    },
  });

  refreshCommunitySurfaces({
    username: currentUser.username,
    slug: community.slug,
    communityId: args.communityId,
  });
}
