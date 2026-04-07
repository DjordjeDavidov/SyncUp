"use server";

import { revalidatePath } from "next/cache";
import { getCurrentUserOrRedirect } from "@/server/auth";
import { prisma } from "@/lib/prisma";

export async function sendCommunityChatMessageAction(formData: FormData) {
  const currentUser = await getCurrentUserOrRedirect();
  const communityId = formData.get("communityId");
  const message = formData.get("message");
  const messageText = typeof message === "string" ? message.trim() : "";

  if (!communityId || typeof communityId !== "string") {
    throw new Error("Community is required.");
  }

  if (!messageText) {
    throw new Error("Enter a message before sending.");
  }

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

  await prisma.community_chat_messages.create({
    data: {
      community_chat_id: community.community_chat?.id || (await prisma.community_chats.create({
        data: { community_id: communityId },
        select: { id: true }
      })).id,
      sender_id: currentUser.id,
      message: messageText,
    },
  });

  revalidatePath(`/communities/${community.slug}/chat`);
  revalidatePath("/messages");
}
