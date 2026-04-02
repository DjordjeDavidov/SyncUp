import { activity_status, community_visibility } from "@/lib/prisma-generated";
import { prisma } from "@/lib/prisma";

export async function getOnboardingData() {
  const [languages, interests, vibeTags, activityCategories] = await Promise.all([
    prisma.languages.findMany({ orderBy: { name: "asc" } }),
    prisma.interests.findMany({ orderBy: { name: "asc" } }),
    prisma.vibe_tags.findMany({ orderBy: { name: "asc" } }),
    prisma.activity_categories.findMany({ orderBy: { name: "asc" } }),
  ]);

  return {
    languages,
    interests,
    vibeTags,
    activityCategories,
  };
}

export async function getHomeFeedData(userId: string) {
  const [posts, people, communities, activities] = await Promise.all([
    prisma.posts.findMany({
      orderBy: { created_at: "desc" },
      take: 20,
      include: {
        users: {
          include: {
            profiles: true,
          },
        },
        communities: true,
        activities: true,
        post_likes: true,
      },
    }),
    prisma.users.findMany({
      where: {
        id: { not: userId },
        profiles: {
          isNot: null,
        },
      },
      include: {
        profiles: true,
      },
      orderBy: { created_at: "desc" },
      take: 4,
    }),
    prisma.communities.findMany({
      where: {
        visibility: community_visibility.PUBLIC,
      },
      orderBy: { created_at: "desc" },
      take: 4,
      include: {
        _count: {
          select: {
            community_members: true,
          },
        },
      },
    }),
    prisma.activities.findMany({
      where: {
        status: activity_status.OPEN,
      },
      orderBy: { start_time: "asc" },
      take: 4,
      include: {
        _count: {
          select: {
            activity_participants: true,
          },
        },
      },
    }),
  ]);

  return {
    posts,
    people,
    communities,
    activities,
  };
}
