import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSessionUserId } from "@/lib/session";

export async function getCurrentUser() {
  const userId = await getSessionUserId();

  if (!userId) {
    return null;
  }

  return prisma.users.findUnique({
    where: { id: userId },
    include: {
      profiles: true,
      user_languages: true,
      user_interests: true,
      user_vibe_tags: true,
      user_activity_preferences: true,
    },
  });
}

export async function getCurrentUserOrRedirect() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  return {
    ...user,
    profile: user.profiles,
  };
}
