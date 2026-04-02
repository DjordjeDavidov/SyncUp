"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useFormStatus } from "react-dom";
import { MessageCircle, Send, X } from "lucide-react";
import { initialInteractionState, InteractionState } from "@/lib/interaction-state";
import { PostComment } from "@/lib/post-types";
import { formatDistanceToNow } from "@/lib/utils";

type Props = {
  postId: string;
  commentsCount: number;
  comments: PostComment[];
  action: (state: InteractionState, formData: FormData) => Promise<InteractionState>;
};

function CommentSubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button
      className="inline-flex items-center gap-2 rounded-2xl bg-[linear-gradient(135deg,#6366f1,#8b5cf6)] px-4 py-3 text-sm font-semibold text-white shadow-[0_12px_30px_rgba(99,102,241,0.28)] transition-all duration-200 hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60"
      disabled={pending}
      type="submit"
    >
      <Send className="h-4 w-4" />
      <span>{pending ? "Sending..." : "Reply"}</span>
    </button>
  );
}

function CommentAvatar({ name, avatarUrl }: { name: string; avatarUrl: string | null }) {
  return (
    <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full border border-white/10 bg-[linear-gradient(135deg,rgba(99,102,241,0.36),rgba(59,130,246,0.18))] text-xs font-semibold text-white shadow-[0_10px_24px_rgba(15,23,42,0.35)]">
      {avatarUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img alt={name} className="h-full w-full object-cover" src={avatarUrl} />
      ) : (
        name
          .split(" ")
          .map((part) => part[0])
          .join("")
          .slice(0, 2)
          .toUpperCase()
      )}
    </div>
  );
}

export function PostCommentsModal({ postId, commentsCount, comments, action }: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const [state, formAction] = useActionState(action, initialInteractionState);
  const formRef = useRef<HTMLFormElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const router = useRouter();

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isOpen]);

  useEffect(() => {
    if (state.status !== "success") {
      return;
    }

    formRef.current?.reset();
    textareaRef.current?.focus();
    router.refresh();
  }, [router, state.status]);

  return (
    <>
      <button
        className="flex w-full items-center justify-center gap-2 rounded-2xl border border-white/6 bg-white/[0.03] px-4 py-3 text-sm font-medium text-slate-400 transition-all duration-200 hover:border-indigo-400/20 hover:bg-indigo-400/8 hover:text-indigo-200"
        onClick={() => setIsOpen(true)}
        type="button"
      >
        <MessageCircle className="h-4 w-4" />
        <span>Comment</span>
        {commentsCount > 0 ? <span className="text-xs text-slate-500">{commentsCount}</span> : null}
      </button>

      {isOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(3,7,18,0.78)] p-4 backdrop-blur-md">
          <button
            aria-label="Close comments"
            className="absolute inset-0 cursor-default"
            onClick={() => setIsOpen(false)}
            type="button"
          />

          <div
            aria-labelledby={`comments-title-${postId}`}
            aria-modal="true"
            className="relative z-10 flex max-h-[85vh] w-full max-w-2xl flex-col overflow-hidden rounded-[28px] border border-white/10 bg-[linear-gradient(180deg,rgba(20,28,44,0.98),rgba(8,12,24,0.98))] shadow-[0_32px_90px_rgba(2,6,23,0.55),0_0_40px_rgba(99,102,241,0.1)]"
            role="dialog"
          >
            <div className="flex items-center justify-between border-b border-white/8 px-5 py-4 sm:px-6">
              <div>
                <h2 className="text-base font-semibold text-white" id={`comments-title-${postId}`}>
                  Comments
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  {commentsCount === 0 ? "Start the conversation." : `${commentsCount} ${commentsCount === 1 ? "reply" : "replies"}`}
                </p>
              </div>
              <button
                aria-label="Close comments"
                className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] text-slate-300 transition-all duration-200 hover:border-white/15 hover:bg-white/[0.08] hover:text-white"
                onClick={() => setIsOpen(false)}
                type="button"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="flex-1 space-y-4 overflow-y-auto px-5 py-5 sm:px-6">
              {comments.length > 0 ? (
                comments.map((comment) => (
                  <div className="flex items-start gap-3" key={comment.id}>
                    <CommentAvatar avatarUrl={comment.author.avatarUrl} name={comment.author.name} />
                    <div className="min-w-0 flex-1 rounded-2xl border border-white/8 bg-white/[0.03] px-4 py-3">
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                        <p className="text-sm font-semibold text-white">{comment.author.name}</p>
                        <p className="text-xs text-muted-foreground">@{comment.author.username}</p>
                        <span className="text-[11px] text-slate-600">&bull;</span>
                        <p className="text-[11px] uppercase tracking-[0.12em] text-slate-500">
                          {formatDistanceToNow(comment.createdAt)}
                        </p>
                      </div>
                      <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-200">
                        {comment.content}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="rounded-2xl border border-dashed border-white/10 bg-white/[0.02] px-5 py-8 text-center">
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04] text-indigo-200">
                    <MessageCircle className="h-5 w-5" />
                  </div>
                  <p className="mt-4 text-base font-semibold text-white">No comments yet</p>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">
                    Be the first person to reply on this post.
                  </p>
                </div>
              )}
            </div>

            <div className="border-t border-white/8 bg-white/[0.02] px-5 py-4 sm:px-6">
              <form action={formAction} className="space-y-3" ref={formRef}>
                <input name="postId" type="hidden" value={postId} />
                <div className="rounded-2xl border border-white/8 bg-white/[0.03] p-3 transition-all duration-200 focus-within:border-indigo-300/24 focus-within:bg-white/[0.05] focus-within:shadow-[0_0_0_1px_rgba(129,140,248,0.18),0_0_24px_rgba(99,102,241,0.08)]">
                  <textarea
                    className="min-h-[92px] w-full resize-none bg-transparent text-sm leading-6 text-slate-100 outline-none placeholder:text-slate-500"
                    name="content"
                    placeholder="Write a comment..."
                    ref={textareaRef}
                  />
                </div>
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <p
                    className={`text-sm ${
                      state.status === "error"
                        ? "text-rose-300"
                        : state.status === "success"
                          ? "text-emerald-300"
                          : "text-muted-foreground"
                    }`}
                  >
                    {state.message || "Replies update right here after you post."}
                  </p>
                  <CommentSubmitButton />
                </div>
              </form>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
