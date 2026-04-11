export type ProfileUser = {
  id: string;
  username: string;
  created_at: Date;
  isFollowedByViewer: boolean;
  matchScore?: number | null;
  cautionBanner?: string | null;
  profile: {
    full_name: string;
    bio: string | null;
    avatar_url: string | null;
    cover_url: string | null;
    city: string | null;
    country: string | null;
  } | null;
  user_interests: {
    interests: {
      id: string;
      name: string;
      slug: string;
    };
  }[];
  user_vibe_tags: {
    vibe_tags: {
      id: string;
      name: string;
      slug: string;
    };
  }[];
};

export type ProfilePost = {
  id: string;
  content: string;
  image_url: string | null;
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
    title: string;
  } | null;
  post_likes: { user_id: string }[];
};

export type MeetupFeedbackPrompt = {
  activityId: string;
  activityTitle: string;
  activityStartsAt: Date;
  participantCount: number;
  targets: {
    id: string;
    username: string;
    name: string;
    avatarUrl: string | null;
    bio: string | null;
  }[];
};

export type ProfileCommunity = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  city: string | null;
  country: string | null;
  created_at: Date;
  _count: {
    community_members: number;
  };
};

export type ProfileActivity = {
  id: string;
  creator_id: string;
  title: string;
  description: string | null;
  city: string | null;
  country: string | null;
  start_time: Date;
  created_at: Date;
  image_url: string | null;
  communities: {
    id: string;
    name: string;
    slug: string;
  } | null;
  _count: {
    activity_participants: number;
  };
};

export type ProfileStats = {
  posts: number;
  followers: number;
  following: number;
  communities: number;
  activities: number;
};

export type ProfileFollowListUser = {
  id: string;
  username: string;
  profile: {
    full_name: string;
    avatar_url: string | null;
    bio: string | null;
  } | null;
  isFollowedByViewer: boolean;
};
