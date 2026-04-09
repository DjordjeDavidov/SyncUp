"use server";

import { revalidatePath } from "next/cache";
import { getImageUploadError } from "@/lib/image-upload";
import { getCurrentUserOrRedirect } from "@/server/auth";
import {
  assertDirectMessageThreadAccess,
  assertDirectMessageThreadCanSend,
  blockDirectMessageUser,
  ensureDirectMessageMediaSupport,
  getOrCreateDirectConversation,
  hideDirectMessageThread,
} from "@/server/direct-messages";
import { prisma } from "@/lib/prisma";
import { uploadImage } from "@/server/storage";
import { ensureDirectThreadHiddenAtColumn, ensureDirectThreadLastReadAtColumn } from "@/server/chat-read-state";
import { ensureCommunityMessageInteractionSchema, ensureDirectMessageInteractionSchema } from "@/server/message-interaction-schema";

function revalidateMessagingSurfaces(threadId?: string) {
  revalidatePath("/chats");
  revalidatePath("/messages");

  if (threadId) {
    revalidatePath(`/chats/${threadId}`);
  }
}

export async function sendCommunityChatMessageAction(formData: FormData) {
  const currentUser = await getCurrentUserOrRedirect();
  const communityId = formData.get("communityId");
  const message = formData.get("message");
  const replyToMessageId = formData.get("replyToMessageId");
  const messageText = typeof message === "string" ? message.trim() : "";

  if (!communityId || typeof communityId !== "string") {
    throw new Error("Community is required.");
  }

  if (!messageText) {
    throw new Error("Enter a message before sending.");
  }

  await ensureCommunityMessageInteractionSchema();

  const community = await prisma.communities.findUnique({
    where: { id: communityId },
    include: {
      community_members: {
        where: {
          user_id: currentUser.id,
        },
        select: {
          user_id: true,
        },
      },
      community_chat: {
        select: {
          id: true,
        },
      },
      users: true,
    },
  });

  if (!community) {
    throw new Error("Community not found.");
  }

  const isMember = community.community_members.length > 0;

  if (!isMember) {
    throw new Error("Only community members can send messages.");
  }

  const communityChatId =
    community.community_chat?.id ||
    (
      await prisma.community_chats.create({
        data: { community_id: communityId },
        select: { id: true },
      })
    ).id;

  await prisma.$transaction(async (tx) => {
    if (replyToMessageId && typeof replyToMessageId === "string") {
      const replyTarget = await tx.community_chat_messages.findUnique({
        where: { id: replyToMessageId },
        select: {
          id: true,
          community_chat_id: true,
        },
      });

      if (!replyTarget || replyTarget.community_chat_id !== communityChatId) {
        throw new Error("Reply target is not part of this chat.");
      }
    }

    await tx.community_chat_messages.create({
      data: {
        community_chat_id: communityChatId,
        sender_id: currentUser.id,
        message: messageText,
        reply_to_message_id: typeof replyToMessageId === "string" ? replyToMessageId : null,
      },
    });

    await tx.community_chats.update({
      where: { id: communityChatId },
      data: {
        updated_at: new Date(),
      },
    });
  });

  revalidatePath(`/communities/${community.slug}/chat`);
  revalidatePath(`/chats/${communityId}`);
  revalidatePath("/chats");
  revalidatePath("/messages");
}

export async function getOrCreateDirectConversationAction(targetUserId: string) {
  const currentUser = await getCurrentUserOrRedirect();
  const thread = await getOrCreateDirectConversation(currentUser.id, targetUserId);

  revalidateMessagingSurfaces(thread.id);

  return {
    threadId: thread.id,
  };
}

export async function sendDirectMessageAction(formData: FormData) {
  const currentUser = await getCurrentUserOrRedirect();
  const threadId = formData.get("threadId");
  const message = formData.get("message");
  const image = formData.get("image");
  const replyToMessageId = formData.get("replyToMessageId");
  const messageText = typeof message === "string" ? message.trim() : "";
  const imageError = image instanceof File && image.size > 0 ? getImageUploadError(image, { label: "Attachment" }) : null;

  if (!threadId || typeof threadId !== "string") {
    throw new Error("Conversation is required.");
  }

  if (imageError) {
    throw new Error(imageError);
  }

  if (!messageText && !(image instanceof File && image.size > 0)) {
    throw new Error("Enter a message or attach an image before sending.");
  }

  let imagePayload:
    | {
        path: string;
        url: string;
      }
    | undefined;

  if (image instanceof File && image.size > 0) {
    await ensureDirectMessageMediaSupport();
    imagePayload = await uploadImage({
      file: image,
      userId: currentUser.id,
      kind: "post",
    });
  }

  const access = await assertDirectMessageThreadCanSend(currentUser.id, threadId);
  await ensureDirectThreadHiddenAtColumn();
  await ensureDirectThreadLastReadAtColumn();
  await ensureDirectMessageInteractionSchema();

  await prisma.$transaction(async (tx) => {
    if (replyToMessageId && typeof replyToMessageId === "string") {
      const replyTarget = await tx.direct_messages.findUnique({
        where: { id: replyToMessageId },
        select: {
          id: true,
          thread_id: true,
        },
      });

      if (!replyTarget || replyTarget.thread_id !== threadId) {
        throw new Error("Reply target is not part of this conversation.");
      }
    }

    await tx.direct_messages.create({
      data: {
        thread_id: threadId,
        sender_id: currentUser.id,
        message: messageText,
        reply_to_message_id: typeof replyToMessageId === "string" ? replyToMessageId : null,
        image_path: imagePayload?.path,
        image_url: imagePayload?.url,
      },
    });

    await tx.direct_message_thread_participants.updateMany({
      where: {
        thread_id: threadId,
      },
      data: {
        hidden_at: null,
      },
    });

    await tx.direct_message_thread_participants.updateMany({
      where: {
        thread_id: threadId,
        user_id: currentUser.id,
      },
      data: {
        last_read_at: new Date(),
      },
    });

    await tx.direct_message_threads.update({
      where: { id: threadId },
      data: {
        updated_at: new Date(),
      },
    });
  });

  revalidateMessagingSurfaces(threadId);

  return {
    recipientUserId: access.otherParticipantId,
  };
}

export async function blockDirectMessageUserAction(threadId: string) {
  const currentUser = await getCurrentUserOrRedirect();
  await blockDirectMessageUser(currentUser.id, threadId);
  revalidateMessagingSurfaces(threadId);
}

export async function deleteDirectMessageThreadAction(threadId: string) {
  const currentUser = await getCurrentUserOrRedirect();
  await hideDirectMessageThread(currentUser.id, threadId);
  revalidateMessagingSurfaces(threadId);
}

export async function toggleMessageLikeAction(chatType: "dm" | "community", chatId: string, messageId: string) {
  const currentUser = await getCurrentUserOrRedirect();

  if (chatType === "dm") {
    await ensureDirectMessageInteractionSchema();
    await assertDirectMessageThreadAccess(currentUser.id, chatId);

    const message = await prisma.direct_messages.findUnique({
      where: { id: messageId },
      select: {
        id: true,
        thread_id: true,
      },
    });

    if (!message || message.thread_id !== chatId) {
      throw new Error("Message not found.");
    }

    const existingLike = await prisma.direct_message_likes.findUnique({
      where: {
        message_id_user_id: {
          message_id: messageId,
          user_id: currentUser.id,
        },
      },
    });

    if (existingLike) {
      await prisma.direct_message_likes.delete({
        where: {
          message_id_user_id: {
            message_id: messageId,
            user_id: currentUser.id,
          },
        },
      });
    } else {
      await prisma.direct_message_likes.create({
        data: {
          message_id: messageId,
          user_id: currentUser.id,
        },
      });
    }
  } else {
    await ensureCommunityMessageInteractionSchema();

    const membership = await prisma.community_members.findUnique({
      where: {
        community_id_user_id: {
          community_id: chatId,
          user_id: currentUser.id,
        },
      },
      select: {
        user_id: true,
      },
    });

    if (!membership) {
      throw new Error("You do not have access to this chat.");
    }

    const message = await prisma.community_chat_messages.findUnique({
      where: { id: messageId },
      select: {
        id: true,
        community_chat_id: true,
      },
    });

    const communityChat = await prisma.community_chats.findUnique({
      where: { community_id: chatId },
      select: { id: true },
    });

    if (!message || !communityChat || message.community_chat_id !== communityChat.id) {
      throw new Error("Message not found.");
    }

    const existingLike = await prisma.community_chat_message_likes.findUnique({
      where: {
        message_id_user_id: {
          message_id: messageId,
          user_id: currentUser.id,
        },
      },
    });

    if (existingLike) {
      await prisma.community_chat_message_likes.delete({
        where: {
          message_id_user_id: {
            message_id: messageId,
            user_id: currentUser.id,
          },
        },
      });
    } else {
      await prisma.community_chat_message_likes.create({
        data: {
          message_id: messageId,
          user_id: currentUser.id,
        },
      });
    }
  }

  revalidateMessagingSurfaces(chatId);
}

export async function deleteMessageAction(chatType: "dm" | "community", chatId: string, messageId: string) {
  const currentUser = await getCurrentUserOrRedirect();

  if (chatType === "dm") {
    await ensureDirectMessageInteractionSchema();
    await assertDirectMessageThreadAccess(currentUser.id, chatId);

    const message = await prisma.direct_messages.findUnique({
      where: { id: messageId },
      select: {
        id: true,
        thread_id: true,
        sender_id: true,
      },
    });

    if (!message || message.thread_id !== chatId) {
      throw new Error("Message not found.");
    }

    if (message.sender_id !== currentUser.id) {
      throw new Error("You can only delete your own messages.");
    }

    await prisma.direct_messages.update({
      where: { id: messageId },
      data: {
        message: "",
        image_url: null,
        image_path: null,
        is_deleted: true,
        deleted_at: new Date(),
      },
    });

    await prisma.direct_message_likes.deleteMany({
      where: {
        message_id: messageId,
      },
    });
  } else {
    await ensureCommunityMessageInteractionSchema();

    const membership = await prisma.community_members.findUnique({
      where: {
        community_id_user_id: {
          community_id: chatId,
          user_id: currentUser.id,
        },
      },
      select: {
        user_id: true,
      },
    });

    if (!membership) {
      throw new Error("You do not have access to this chat.");
    }

    const communityChat = await prisma.community_chats.findUnique({
      where: { community_id: chatId },
      select: { id: true },
    });

    const message = await prisma.community_chat_messages.findUnique({
      where: { id: messageId },
      select: {
        id: true,
        community_chat_id: true,
        sender_id: true,
      },
    });

    if (!message || !communityChat || message.community_chat_id !== communityChat.id) {
      throw new Error("Message not found.");
    }

    if (message.sender_id !== currentUser.id) {
      throw new Error("You can only delete your own messages.");
    }

    await prisma.community_chat_messages.update({
      where: { id: messageId },
      data: {
        message: "",
        is_deleted: true,
        deleted_at: new Date(),
      },
    });

    await prisma.community_chat_message_likes.deleteMany({
      where: {
        message_id: messageId,
      },
    });
  }

  revalidateMessagingSurfaces(chatId);
}
