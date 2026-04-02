import { LikeButton } from "@/components/post-like-button";
import { formatDistanceToNow, getInitials } from "@/lib/utils";

type Post = {
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
      city: string | null;
      country: string | null;
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

type Props = {
  post: Post;
  currentUserId: string;
  action: (formData: FormData) => Promise<void>;
};

export function PostCard({ post, currentUserId, action }: Props) {
  const authorName = post.users.profiles?.full_name ?? post.users.username;
  const liked = post.post_likes.some((like) => like.user_id === currentUserId);

  return (
    <article className="surface-card rounded-[28px] p-5 sm:p-6">
      <div className="flex items-start gap-3">
        <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-full bg-indigo-500/30 text-sm font-semibold text-white">
          {post.users.profiles?.avatar_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img alt={authorName} className="h-full w-full object-cover" src={post.users.profiles.avatar_url} />
          ) : (
            getInitials(authorName)
          )}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <p className="text-sm font-semibold text-slate-50">{authorName}</p>
            <p className="text-xs text-slate-500">@{post.users.username}</p>
            <span className="text-xs text-slate-600">•</span>
            <p className="text-xs text-slate-400">{formatDistanceToNow(post.created_at)}</p>
          </div>
          {post.communities ? <p className="mt-1 text-xs text-indigo-300">Posted in {post.communities.name}</p> : null}
          {post.activities ? <p className="mt-1 text-xs text-emerald-300">Linked to {post.activities.title}</p> : null}
        </div>
      </div>
      <p className="mt-4 whitespace-pre-wrap text-sm leading-7 text-slate-200">{post.content}</p>
      {post.image_url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img alt="Post attachment" className="mt-4 max-h-[420px] w-full rounded-[24px] border border-white/8 object-cover" src={post.image_url} />
      ) : null}
      <div className="mt-5 flex items-center justify-between border-t border-white/6 pt-4">
        <p className="text-sm text-slate-400">{post.post_likes.length} likes</p>
        <LikeButton action={action} liked={liked} postId={post.id} />
      </div>
    </article>
  );
}
