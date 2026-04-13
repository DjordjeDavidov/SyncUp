import { SyncUpPost } from "@/lib/post-types";

type PostRecord = {
  id: string;
  post_type: "STANDARD_POST" | "ALERT_POST" | "INVITE_POST" | "POLL_POST" | "COMMUNITY_POST" | "ACTIVITY_POST";
  invite_visibility?: "PUBLIC" | "FOLLOWERS_FRIENDS" | null;
  title: string | null;
  content: string;
  image_url: string | null;
  location_text: string | null;
  starts_at: Date | null;
  max_participants: number | null;
  poll_question: string | null;
  poll_ends_at: Date | null;
  created_at: Date;
  users: {
    id: string;
    username: string;
    profiles: {
      full_name: string;
      avatar_url: string | null;
    } | null;
  };
  communities: {
    id: string;
    name: string;
    slug: string;
  } | null;
  activities: {
    id: string;
    creator_id: string;
    title: string;
    location_text: string | null;
    start_time: Date;
    max_participants: number | null;
    status: "OPEN" | "FULL" | "COMPLETED" | "CANCELLED";
    _count?: {
      activity_participants: number;
    };
    activity_participants?: { user_id: string }[];
  } | null;
  post_likes: { user_id: string }[];
  post_saves: { user_id: string }[];
  post_comments: {
    id: string;
    content: string;
    created_at: Date;
    users: {
      id: string;
      username: string;
      profiles: {
        full_name: string;
        avatar_url: string | null;
      } | null;
    };
  }[];
  poll_options: {
    id: string;
    label: string;
    position: number;
    poll_votes: { user_id: string }[];
  }[];
  poll_votes: { user_id: string; option_id: string }[];
};

function toPostType(postType: PostRecord["post_type"]): SyncUpPost["type"] {
  switch (postType) {
    case "ALERT_POST":
      return "alert_post";
    case "INVITE_POST":
      return "invite_post";
    case "POLL_POST":
      return "poll_post";
    case "COMMUNITY_POST":
      return "community_post";
    case "ACTIVITY_POST":
      return "activity_post";
    case "STANDARD_POST":
    default:
      return "standard_post";
  }
}

export function mapPostRecordToPost(post: PostRecord, currentUserId: string): SyncUpPost {
  const activityJoinedCount = post.activities
    ? (post.activities._count?.activity_participants ?? 0) + 1
    : 0;
  const viewerHasJoinedActivity =
    post.activities?.creator_id === currentUserId ||
    post.activities?.activity_participants?.some((participant) => participant.user_id === currentUserId) ||
    false;
  const derivedActivityStatus = (() => {
    if (!post.activities) {
      return "open" as const;
    }

    if (post.activities.status === "CANCELLED") {
      return "cancelled" as const;
    }

    if (post.activities.status === "COMPLETED" || post.activities.start_time.getTime() < Date.now()) {
      return "closed" as const;
    }

    if (
      post.activities.status === "FULL" ||
      (post.activities.max_participants !== null && activityJoinedCount >= post.activities.max_participants)
    ) {
      return "full" as const;
    }

    return "open" as const;
  })();
  const base = {
    id: post.id,
    type: toPostType(post.post_type),
    author: {
      id: post.users.id,
      username: post.users.username,
      name: post.users.profiles?.full_name ?? post.users.username,
      avatarUrl: post.users.profiles?.avatar_url ?? null,
    },
    content: post.content,
    imageUrl: post.image_url,
    createdAt: post.created_at,
    likesCount: post.post_likes.length,
    likedByCurrentUser: post.post_likes.some((like) => like.user_id === currentUserId),
    savedByCurrentUser: post.post_saves.some((save) => save.user_id === currentUserId),
    commentsCount: post.post_comments.length,
    comments: post.post_comments.map((comment) => ({
      id: comment.id,
      content: comment.content,
      createdAt: comment.created_at,
      author: {
        id: comment.users.id,
        username: comment.users.username,
        name: comment.users.profiles?.full_name ?? comment.users.username,
        avatarUrl: comment.users.profiles?.avatar_url ?? null,
      },
    })),
    community: post.communities,
    isOwner: post.users.id === currentUserId,
    activity: post.activities
      ? {
          id: post.activities.id,
          title: post.activities.title,
        }
      : null,
  } as const;

  switch (base.type) {
    case "invite_post":
      return {
        ...base,
        type: "invite_post",
        invite: {
          activityId: post.activities?.id ?? null,
          title: post.title ?? "Open invite",
          description: post.content,
          startsAt: post.starts_at,
          locationText: post.location_text,
          maxParticipants: post.max_participants,
          joinedCount: activityJoinedCount,
          viewerHasJoined: viewerHasJoinedActivity,
          canJoin: Boolean(
            post.activities &&
              !viewerHasJoinedActivity &&
              derivedActivityStatus === "open",
          ),
          visibility:
            post.invite_visibility === "FOLLOWERS_FRIENDS" ? "followers_friends" : "public",
          status: derivedActivityStatus,
        },
      };
    case "alert_post":
      return {
        ...base,
        type: "alert_post",
        alert: {
          title: post.title ?? "Community alert",
        },
      };
    case "poll_post": {
      const totalVotes = post.poll_votes.length;
      const isClosed = Boolean(post.poll_ends_at && post.poll_ends_at.getTime() < Date.now());

      return {
        ...base,
        type: "poll_post",
        poll: {
          question: post.poll_question ?? post.title ?? "Quick poll",
          endsAt: post.poll_ends_at,
          totalVotes,
          hasVoted: post.poll_votes.some((vote) => vote.user_id === currentUserId),
          canVote:
            !isClosed &&
            !post.poll_votes.some((vote) => vote.user_id === currentUserId),
          status: isClosed ? "closed" : "open",
          options: [...post.poll_options]
            .sort((left, right) => left.position - right.position)
            .map((option) => {
              const voteCount = option.poll_votes.length;

              return {
                id: option.id,
                label: option.label,
                voteCount,
                percentage: totalVotes > 0 ? Math.round((voteCount / totalVotes) * 100) : 0,
                isSelectedByCurrentUser: option.poll_votes.some((vote) => vote.user_id === currentUserId),
              };
            }),
        },
      };
    }
    case "community_post":
      return {
        ...base,
        type: "community_post",
        community: base.community ?? {
          id: "unknown-community",
          name: "Community",
          slug: "community",
        },
      };
    case "activity_post":
      return {
        ...base,
        type: "activity_post",
        activityPost: {
          activityId: post.activities?.id ?? null,
          title: post.title ?? post.activities?.title ?? "Activity plan",
          startsAt: post.starts_at,
          locationText: post.location_text,
          goingCount: activityJoinedCount,
          ctaLabel: viewerHasJoinedActivity ? "Joined" : "I'm in",
          maxParticipants: post.activities?.max_participants ?? post.max_participants,
          viewerHasJoined: viewerHasJoinedActivity,
          canJoin: Boolean(
            post.activities &&
              !viewerHasJoinedActivity &&
              derivedActivityStatus === "open",
          ),
          status: derivedActivityStatus,
        },
      };
    case "standard_post":
    default:
      return {
        ...base,
        type: "standard_post",
      };
  }
}
