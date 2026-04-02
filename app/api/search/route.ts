import { NextResponse } from "next/server";
import { activity_status, community_visibility } from "@/lib/prisma-generated";
import { prisma } from "@/lib/prisma";
import { getSessionUserId } from "@/lib/session";

export async function GET(request: Request) {
  const userId = await getSessionUserId();

  if (!userId) {
    return NextResponse.json({ results: [] }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q")?.trim() ?? "";

  if (query.length < 2) {
    return NextResponse.json({ results: [] });
  }

  const [users, communities, activities] = await Promise.all([
    prisma.users.findMany({
      where: {
        id: { not: userId },
        OR: [
          {
            username: {
              contains: query,
              mode: "insensitive",
            },
          },
          {
            profiles: {
              is: {
                full_name: {
                  contains: query,
                  mode: "insensitive",
                },
              },
            },
          },
        ],
      },
      include: {
        profiles: true,
      },
      take: 4,
      orderBy: { created_at: "desc" },
    }),
    prisma.communities.findMany({
      where: {
        visibility: community_visibility.PUBLIC,
        OR: [
          {
            name: {
              contains: query,
              mode: "insensitive",
            },
          },
          {
            description: {
              contains: query,
              mode: "insensitive",
            },
          },
          {
            category: {
              contains: query,
              mode: "insensitive",
            },
          },
          {
            custom_category: {
              contains: query,
              mode: "insensitive",
            },
          },
        ],
      },
      include: {
        _count: {
          select: {
            community_members: true,
          },
        },
      },
      take: 4,
      orderBy: { created_at: "desc" },
    }),
    prisma.activities.findMany({
      where: {
        status: activity_status.OPEN,
        OR: [
          {
            title: {
              contains: query,
              mode: "insensitive",
            },
          },
          {
            description: {
              contains: query,
              mode: "insensitive",
            },
          },
          {
            location_text: {
              contains: query,
              mode: "insensitive",
            },
          },
        ],
      },
      include: {
        _count: {
          select: {
            activity_participants: true,
          },
        },
      },
      take: 4,
      orderBy: { start_time: "asc" },
    }),
  ]);

  return NextResponse.json({
    results: [
      ...users.map((user) => ({
        id: `user-${user.id}`,
        type: "user",
        title: user.profiles?.full_name ?? user.username,
        subtitle: `@${user.username}`,
        imageUrl: user.profiles?.avatar_url ?? null,
        href: `/profile/${user.username}`,
      })),
      ...communities.map((community) => ({
        id: `community-${community.id}`,
        type: "community",
        title: community.name,
        subtitle: `${community._count.community_members} members`,
        imageUrl: community.cover_url ?? null,
        href: "/communities",
      })),
      ...activities.map((activity) => ({
        id: `activity-${activity.id}`,
        type: "activity",
        title: activity.title,
        subtitle: `${activity._count.activity_participants} going`,
        imageUrl: activity.image_url ?? null,
        href: "/activity",
      })),
    ],
  });
}
