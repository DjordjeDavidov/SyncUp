export const postTypeValues = [
  "standard_post",
  "invite_post",
  "poll_post",
  "community_post",
  "activity_post",
] as const;

export type SyncUpPostType = (typeof postTypeValues)[number];

export const inviteVisibilityValues = ["public", "followers_friends"] as const;

export type InviteVisibility = (typeof inviteVisibilityValues)[number];

export type PostAuthor = {
  id: string;
  username: string;
  name: string;
  avatarUrl: string | null;
};

export type PostCommunityBadge = {
  id: string;
  name: string;
  slug: string;
};

export type PostActivityBadge = {
  id: string;
  title: string;
};

export type PostComment = {
  id: string;
  content: string;
  createdAt: Date;
  author: PostAuthor;
};

export type BasePost = {
  id: string;
  type: SyncUpPostType;
  author: PostAuthor;
  content: string;
  imageUrl: string | null;
  createdAt: Date;
  likesCount: number;
  likedByCurrentUser: boolean;
  savedByCurrentUser: boolean;
  commentsCount: number;
  comments: PostComment[];
  community: PostCommunityBadge | null;
  activity: PostActivityBadge | null;
  isOwner: boolean;
};

export type StandardPost = BasePost & {
  type: "standard_post";
};

export type InvitePost = BasePost & {
  type: "invite_post";
  invite: {
    activityId: string | null;
    title: string;
    description: string;
    startsAt: Date | null;
    locationText: string | null;
    maxParticipants: number | null;
    joinedCount: number;
    viewerHasJoined: boolean;
    canJoin: boolean;
    visibility: InviteVisibility;
    status: "open" | "full" | "closed" | "cancelled";
  };
};

export type PollPostOption = {
  id: string;
  label: string;
  voteCount: number;
  percentage: number;
  isSelectedByCurrentUser: boolean;
};

export type PollPost = BasePost & {
  type: "poll_post";
  poll: {
    question: string;
    endsAt: Date | null;
    totalVotes: number;
    options: PollPostOption[];
    hasVoted: boolean;
    canVote: boolean;
    status: "open" | "closed";
  };
};

export type CommunityPost = BasePost & {
  type: "community_post";
  community: PostCommunityBadge;
};

export type ActivityPost = BasePost & {
  type: "activity_post";
  activityPost: {
    activityId: string | null;
    title: string;
    startsAt: Date | null;
    locationText: string | null;
    goingCount: number;
    ctaLabel: string;
    maxParticipants: number | null;
    viewerHasJoined: boolean;
    canJoin: boolean;
    status: "open" | "full" | "closed" | "cancelled";
  };
};

export type SyncUpPost =
  | StandardPost
  | InvitePost
  | PollPost
  | CommunityPost
  | ActivityPost;
