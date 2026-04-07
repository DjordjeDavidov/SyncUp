"use server";

import { Prisma, community_visibility } from "@/lib/prisma-generated";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { communityCategoryValues } from "@/lib/community-categories";
import { getImageUploadError, MAX_COMMUNITY_COVER_SIZE_BYTES } from "@/lib/image-upload";
import { FormState, fromZodError } from "@/lib/validation";
import { getCurrentUserOrRedirect } from "@/server/auth";
import { uploadImage } from "@/server/storage";

const createCommunitySchema = z.object({
  name: z.string().trim().min(3, "Community name must be at least 3 characters.").max(120),
  description: z.string().trim().min(12, "Add a short description so people know the vibe.").max(1000),
  category: z.enum(communityCategoryValues, {
    error: () => ({ message: "Choose a category for this community." }),
  }),
  customCategory: z.string().trim().max(120, "Custom category must be 120 characters or less.").optional(),
  visibility: z.nativeEnum(community_visibility),
}).superRefine((value, ctx) => {
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

function refreshCommunitySurfaces(username: string) {
  revalidatePath("/home");
  revalidatePath("/communities");
  revalidatePath("/profile");
  revalidatePath(`/profile/${username}`);
}

export async function createCommunityAction(_: FormState, formData: FormData): Promise<FormState> {
  const currentUser = await getCurrentUserOrRedirect();
  const cover = formData.get("cover");
  const coverError =
    cover instanceof File && cover.size > 0
      ? getImageUploadError(cover, {
          maxSizeBytes: MAX_COMMUNITY_COVER_SIZE_BYTES,
          label: "Cover image",
        })
      : null;

  if (coverError) {
    return {
      message: "Please fix the highlighted fields.",
      errors: {
        cover: [coverError],
      },
      success: false,
    };
  }

  const parsed = createCommunitySchema.safeParse({
    name: typeof formData.get("name") === "string" ? formData.get("name") : "",
    description: typeof formData.get("description") === "string" ? formData.get("description") : "",
    category: typeof formData.get("category") === "string" ? formData.get("category") : "",
    customCategory:
      typeof formData.get("customCategory") === "string" ? formData.get("customCategory") : "",
    visibility: formData.get("visibility") || community_visibility.PUBLIC,
  });

  if (!parsed.success) {
    return fromZodError(parsed.error);
  }

  const baseSlug = slugify(parsed.data.name);

  if (!baseSlug) {
    return {
      message: "Please choose a community name that can be turned into a valid slug.",
      success: false,
    };
  }

  try {
    let coverPayload:
      | {
          path: string;
          url: string;
        }
      | undefined;

    if (cover instanceof File && cover.size > 0) {
      coverPayload = await uploadImage({
        file: cover,
        userId: currentUser.id,
        kind: "community",
      });
    }

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

    await prisma.$transaction(async (tx) => {
      const community = await tx.communities.create({
        data: {
          owner_id: currentUser.id,
          name: parsed.data.name,
          slug,
          description: parsed.data.description,
          category: parsed.data.category,
          custom_category: parsed.data.category === "custom" ? parsed.data.customCategory?.trim() || null : null,
          visibility: parsed.data.visibility,
          cover_path: coverPayload?.path,
          cover_url: coverPayload?.url,
        },
      });

      await tx.community_members.create({
        data: {
          community_id: community.id,
          user_id: currentUser.id,
          role: "OWNER",
        },
      });
    });
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

  refreshCommunitySurfaces(currentUser.username);

  return {
    message: "Community created successfully.",
    errors: {},
    success: true,
  };
}

export async function joinCommunityAction(communityId: string): Promise<{ success: boolean; message: string }> {
  try {
    const currentUser = await getCurrentUserOrRedirect();

    const community = await prisma.communities.findUnique({
      where: { id: communityId },
      select: { id: true, visibility: true },
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

    revalidatePath("/communities");
    revalidatePath("/home");

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
      select: { role: true },
    });

    if (!membership) {
      return { success: false, message: "You are not a member of this community." };
    }

    if (membership.role === "OWNER") {
      return {
        success: false,
        message: "Community owners cannot leave. Transfer ownership or delete the community first.",
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

    revalidatePath("/communities");
    revalidatePath("/home");

    return { success: true, message: "Successfully left the community." };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : "Could not leave the community right now.",
    };
  }
}
