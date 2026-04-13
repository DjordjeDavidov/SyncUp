"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { initialInteractionState, InteractionState } from "@/lib/interaction-state";
import { destroySession } from "@/lib/session";
import { commentSchema, FormState, fromZodError, postSchema } from "@/lib/validation";
import { getImageUploadError } from "@/lib/image-upload";
import { invite_visibility } from "@/lib/prisma-generated";
import { getCurrentUserOrRedirect } from "@/server/auth";
import { uploadImage } from "@/server/storage";

function refreshPostSurfaces() {
  revalidatePath("/home");
  revalidatePath("/profile");
  revalidatePath("/profile/[username]", "page");
}

async function getOwnedPostOrThrow(postId: string, userId: string) {
  const post = await prisma.posts.findUnique({
    where: { id: postId },
    include: {
      activities: true,
    },
  });

  if (!post || post.author_id !== userId) {
    throw new Error("You can only manage your own posts.");
  }

  return post;
}

export async function createPostAction(_: FormState, formData: FormData): Promise<FormState> {
  const currentUser = await getCurrentUserOrRedirect();
  const image = formData.get("image");
  const imageError = image instanceof File && image.size > 0 ? getImageUploadError(image) : null;

  if (imageError) {
    return {
      message: "Please fix the highlighted fields.",
      errors: {
        image: [imageError],
      },
      success: false,
    };
  }

  const pollOptions = formData
    .getAll("pollOptions")
    .map((value) => String(value).trim())
    .filter(Boolean);
  const getTextValue = (key: string) => {
    const value = formData.get(key);
    return typeof value === "string" ? value : "";
  };
  const getOptionalTextValue = (key: string) => {
    const value = formData.get(key);
    return typeof value === "string" ? value : undefined;
  };
  const maxParticipantsValue = getTextValue("maxParticipants");
  const parsed = postSchema.safeParse({
    postType: String(formData.get("postType") || "standard_post"),
    hasImage: image instanceof File && image.size > 0,
    inviteVisibility: String(formData.get("inviteVisibility") || "public"),
    communityId: getTextValue("communityId"),
    activityId: getOptionalTextValue("activityId"),
    title: getTextValue("title"),
    content: getTextValue("content"),
    locationText: getTextValue("locationText"),
    startsAt: getTextValue("startsAt"),
    maxParticipants: maxParticipantsValue,
    pollQuestion: getTextValue("pollQuestion"),
    pollEndsAt: getTextValue("pollEndsAt"),
    pollOptions,
  });

  if (!parsed.success) {
    return fromZodError(parsed.error);
  }

  try {
    let targetCommunity:
      | {
          id: string;
          slug: string;
          community_members: {
            role: string;
          }[];
        }
      | null = null;

    if (parsed.data.communityId) {
      targetCommunity = await prisma.communities.findUnique({
        where: { id: parsed.data.communityId },
        select: {
          id: true,
          slug: true,
          community_members: {
            where: {
              user_id: currentUser.id,
            },
            select: {
              role: true,
            },
          },
        },
      });

      if (!targetCommunity || targetCommunity.community_members.length === 0) {
        return {
          message: "You need to be a community member to publish there.",
          success: false,
        };
      }
    }

    const inviteVisibility =
      parsed.data.inviteVisibility === "followers_friends"
        ? invite_visibility.FOLLOWERS_FRIENDS
        : invite_visibility.PUBLIC;

    let imagePayload:
      | {
          path: string;
          url: string;
        }
      | undefined;

    if (image instanceof File && image.size > 0) {
      imagePayload = await uploadImage({
        file: image,
        userId: currentUser.id,
        kind: "post",
      });
    }

    let activityId = parsed.data.activityId || undefined;

    if (parsed.data.postType === "invite_post" || parsed.data.postType === "activity_post") {
      if (activityId) {
        const existingActivity = await prisma.activities.findUnique({
          where: { id: activityId },
        });

        if (!existingActivity || existingActivity.creator_id !== currentUser.id) {
          return {
            message: "You can only attach activities you created.",
            success: false,
          };
        }

        if (parsed.data.postType === "invite_post") {
          await prisma.activities.update({
            where: { id: activityId },
            data: {
              invite_visibility: inviteVisibility,
            },
          });
        }
      } else {
        const startsAt = parsed.data.startsAt ? new Date(parsed.data.startsAt) : null;

        if (!startsAt) {
          return {
            message: "Invite and activity posts need a valid date and time.",
            success: false,
          };
        }

        const createdActivity = await prisma.activities.create({
          data: {
            creator_id: currentUser.id,
            community_id: targetCommunity?.id,
            title: parsed.data.title ?? "Untitled activity",
            description: parsed.data.content ?? "",
            location_text: parsed.data.locationText,
            start_time: startsAt,
            max_participants: parsed.data.maxParticipants,
            image_path: imagePayload?.path,
            image_url: imagePayload?.url,
            invite_visibility:
              parsed.data.postType === "invite_post" ? inviteVisibility : invite_visibility.PUBLIC,
            status:
              parsed.data.maxParticipants && parsed.data.maxParticipants <= 1 ? "FULL" : "OPEN",
            activity_participants: {
              create: {
                user_id: currentUser.id,
              },
            },
          },
        });

        activityId = createdActivity.id;
      }
    }

    await prisma.posts.create({
      data: {
        author_id: currentUser.id,
        community_id: targetCommunity?.id ?? (parsed.data.postType === "community_post" ? parsed.data.communityId : undefined),
        activity_id: activityId,
        invite_visibility:
          parsed.data.postType === "invite_post" ? inviteVisibility : invite_visibility.PUBLIC,
        post_type:
          parsed.data.postType === "alert_post"
            ? "ALERT_POST"
            : parsed.data.postType === "invite_post"
            ? "INVITE_POST"
            : parsed.data.postType === "poll_post"
              ? "POLL_POST"
              : parsed.data.postType === "community_post"
                ? "COMMUNITY_POST"
                : parsed.data.postType === "activity_post"
                  ? "ACTIVITY_POST"
                  : targetCommunity?.id
                    ? "COMMUNITY_POST"
                  : "STANDARD_POST",
        title: parsed.data.title,
        content: parsed.data.content ?? "",
        image_path: imagePayload?.path,
        image_url: imagePayload?.url,
        location_text: parsed.data.locationText,
        starts_at: parsed.data.startsAt ? new Date(parsed.data.startsAt) : undefined,
        max_participants: parsed.data.maxParticipants,
        poll_question: parsed.data.postType === "poll_post" ? parsed.data.pollQuestion : undefined,
        poll_ends_at:
          parsed.data.postType === "poll_post" && parsed.data.pollEndsAt
            ? new Date(parsed.data.pollEndsAt)
            : undefined,
        poll_options:
          parsed.data.postType === "poll_post"
            ? {
                create: parsed.data.pollOptions.map((option, index) => ({
                  label: option,
                  position: index,
                })),
              }
            : undefined,
      },
    });

    refreshPostSurfaces();

    if (targetCommunity?.slug) {
      revalidatePath(`/communities/${targetCommunity.slug}`);
    }
  } catch (error) {
    return {
      message: error instanceof Error ? error.message : "Could not create your post.",
      success: false,
    };
  }

  return {
    message: "Published successfully.",
    errors: {},
    success: true,
  };
}

export async function toggleLikeAction(formData: FormData) {
  const currentUser = await getCurrentUserOrRedirect();
  const postId = String(formData.get("postId"));

  const existing = await prisma.post_likes.findUnique({
    where: {
      post_id_user_id: {
        post_id: postId,
        user_id: currentUser.id,
      },
    },
  });

  if (existing) {
    await prisma.post_likes.delete({
      where: {
        post_id_user_id: {
          post_id: postId,
          user_id: currentUser.id,
        },
      },
    });
  } else {
    await prisma.post_likes.create({
      data: {
        post_id: postId,
        user_id: currentUser.id,
      },
    });
  }

  refreshPostSurfaces();
}

export async function toggleSaveAction(formData: FormData) {
  const currentUser = await getCurrentUserOrRedirect();
  const postId = String(formData.get("postId"));

  const existing = await prisma.post_saves.findUnique({
    where: {
      post_id_user_id: {
        post_id: postId,
        user_id: currentUser.id,
      },
    },
  });

  if (existing) {
    await prisma.post_saves.delete({
      where: {
        post_id_user_id: {
          post_id: postId,
          user_id: currentUser.id,
        },
      },
    });
  } else {
    await prisma.post_saves.create({
      data: {
        post_id: postId,
        user_id: currentUser.id,
      },
    });
  }

  refreshPostSurfaces();
}

export async function createCommentAction(
  _: InteractionState = initialInteractionState,
  formData: FormData,
): Promise<InteractionState> {
  const currentUser = await getCurrentUserOrRedirect();
  const parsed = commentSchema.safeParse({
    postId: formData.get("postId"),
    content: formData.get("content"),
  });

  if (!parsed.success) {
    const firstError = parsed.error.issues[0]?.message ?? "Could not add your comment.";

    return {
      status: "error",
      message: firstError,
    };
  }

  const post = await prisma.posts.findUnique({
    where: { id: parsed.data.postId },
    select: { id: true },
  });

  if (!post) {
    return {
      status: "error",
      message: "That post is no longer available.",
    };
  }

  await prisma.posts.update({
    where: { id: parsed.data.postId },
    data: {
      post_comments: {
        create: {
          user_id: currentUser.id,
          content: parsed.data.content,
        },
      },
    },
  });

  refreshPostSurfaces();

  return {
    status: "success",
    message: "Comment added.",
  };
}

export async function voteOnPollAction(
  _: InteractionState = initialInteractionState,
  formData: FormData,
): Promise<InteractionState> {
  const currentUser = await getCurrentUserOrRedirect();
  const postId = String(formData.get("postId"));
  const optionId = String(formData.get("optionId"));
  const post = await prisma.posts.findUnique({
    where: { id: postId },
    include: {
      poll_options: {
        select: {
          id: true,
        },
      },
    },
  });

  if (!post || post.post_type !== "POLL_POST") {
    return {
      status: "error",
      message: "That poll is not available anymore.",
    };
  }

  if (post.poll_ends_at && post.poll_ends_at.getTime() < Date.now()) {
    return {
      status: "error",
      message: "This poll has already closed.",
    };
  }

  if (!post.poll_options.some((option) => option.id === optionId)) {
    return {
      status: "error",
      message: "That poll option is invalid.",
    };
  }

  const existingVote = await prisma.poll_votes.findUnique({
    where: {
      post_id_user_id: {
        post_id: postId,
        user_id: currentUser.id,
      },
    },
  });

  if (existingVote) {
    refreshPostSurfaces();
    return {
      status: "error",
      message: "You already voted on this poll.",
    };
  }

  await prisma.poll_votes.create({
    data: {
      post_id: postId,
      option_id: optionId,
      user_id: currentUser.id,
    },
  });

  refreshPostSurfaces();

  return {
    status: "success",
    message: "Vote recorded.",
  };
}

export async function joinActivityPostAction(
  _: InteractionState = initialInteractionState,
  formData: FormData,
): Promise<InteractionState> {
  const currentUser = await getCurrentUserOrRedirect();
  const activityId = String(formData.get("activityId"));

  const activity = await prisma.activities.findUnique({
    where: { id: activityId },
    include: {
      activity_participants: {
        select: {
          user_id: true,
        },
      },
    },
  });

  if (!activity) {
    return {
      status: "error",
      message: "This plan is no longer available.",
    };
  }

  if (activity.status === "CANCELLED") {
    return {
      status: "error",
      message: "This plan was cancelled.",
    };
  }

  if (activity.status === "COMPLETED" || activity.start_time.getTime() < Date.now()) {
    return {
      status: "error",
      message: "This plan is already closed.",
    };
  }

  const alreadyJoined =
    activity.creator_id === currentUser.id ||
    activity.activity_participants.some((participant) => participant.user_id === currentUser.id);

  if (alreadyJoined) {
    return {
      status: "error",
      message: "You already joined this plan.",
    };
  }

  const joinedCount = activity.activity_participants.length + 1;

  if (activity.max_participants !== null && joinedCount >= activity.max_participants) {
    await prisma.activities.update({
      where: { id: activity.id },
      data: {
        status: "FULL",
      },
    });

    refreshPostSurfaces();

    return {
      status: "error",
      message: "This plan is already full.",
    };
  }

  const willBeFull =
    activity.max_participants !== null && joinedCount + 1 >= activity.max_participants;

  await prisma.activity_participants.create({
    data: {
      activity_id: activity.id,
      user_id: currentUser.id,
    },
  });

  if (willBeFull) {
    await prisma.activities.update({
      where: { id: activity.id },
      data: {
        status: "FULL",
      },
    });
  }

  refreshPostSurfaces();

  return {
    status: "success",
    message: "You joined the plan.",
  };
}

export async function cancelActivityPostAction(
  _: InteractionState = initialInteractionState,
  formData: FormData,
): Promise<InteractionState> {
  const currentUser = await getCurrentUserOrRedirect();
  const postId = String(formData.get("postId"));
  const post = await getOwnedPostOrThrow(postId, currentUser.id);

  if (!post.activity_id) {
    return {
      status: "error",
      message: "This post is not linked to a joinable plan.",
    };
  }

  await prisma.activities.update({
    where: { id: post.activity_id },
    data: {
      status: "CANCELLED",
    },
  });

  refreshPostSurfaces();

  return {
    status: "success",
    message: "Plan cancelled.",
  };
}

export async function deleteOwnPostAction(
  _: InteractionState = initialInteractionState,
  formData: FormData,
): Promise<InteractionState> {
  const currentUser = await getCurrentUserOrRedirect();
  const postId = String(formData.get("postId"));
  const post = await getOwnedPostOrThrow(postId, currentUser.id);

  await prisma.posts.delete({
    where: { id: post.id },
  });

  if (post.activity_id) {
    await prisma.activities.delete({
      where: { id: post.activity_id },
    }).catch(() => null);
  }

  refreshPostSurfaces();

  return {
    status: "success",
    message: "Post deleted.",
  };
}

export async function updateActivityPostAction(
  _: InteractionState = initialInteractionState,
  formData: FormData,
): Promise<InteractionState> {
  const currentUser = await getCurrentUserOrRedirect();
  const postId = String(formData.get("postId"));
  const title = String(formData.get("title") || "").trim();
  const content = String(formData.get("content") || "").trim();
  const locationText = String(formData.get("locationText") || "").trim();
  const startsAtValue = String(formData.get("startsAt") || "");
  const startsAt = startsAtValue ? new Date(startsAtValue) : null;
  const post = await getOwnedPostOrThrow(postId, currentUser.id);

  if (!post.activity_id) {
    return {
      status: "error",
      message: "Only invite and activity posts can be edited here.",
    };
  }

  if (!title || !content || !startsAt) {
    return {
      status: "error",
      message: "Title, description, and date/time are required.",
    };
  }

  await prisma.$transaction([
    prisma.posts.update({
      where: { id: post.id },
      data: {
        title,
        content,
        location_text: locationText || null,
        starts_at: startsAt,
      },
    }),
    prisma.activities.update({
      where: { id: post.activity_id },
      data: {
        title,
        description: content,
        location_text: locationText || null,
        start_time: startsAt,
      },
    }),
  ]);

  refreshPostSurfaces();

  return {
    status: "success",
    message: "Plan updated.",
  };
}

export async function logoutAction() {
  await destroySession();
  redirect("/");
}
