import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft, MessageCircleMore, SendHorizonal, Users } from "lucide-react";
import { logoutAction } from "@/actions/feed";
import { sendCommunityChatMessageAction } from "@/actions/messages";
import { Navbar } from "@/components/navbar";
import { MobileNav } from "@/components/mobile-nav";
import { getCurrentUserOrRedirect } from "@/server/auth";
import { getCommunityChatPageData } from "@/server/queries";
import { formatDistanceToNow } from "@/lib/utils";

type CommunityChatMessage = {
  id: string;
  sender: {
    id: string;
    username: string;
    profile: {
      full_name: string;
      avatar_url: string | null;
    } | null;
  };
  text: string;
  createdAt: Date;
};

type CommunityChatPageData = {
  community: {
    id: string;
    slug: string;
    name: string;
    description: string | null;
    visibility: string;
    coverUrl: string | null;
    owner: {
      id: string;
      username: string;
      profile: {
        full_name: string;
        avatar_url: string | null;
      } | null;
    };
    memberCount: number;
    isMember: boolean;
    canChat: boolean;
  };
  messages: CommunityChatMessage[];
};

export default async function CommunityChatPage({ params }: { params: { slug: string } }) {
  const currentUser = await getCurrentUserOrRedirect();
  const data = (await getCommunityChatPageData(currentUser.id, params.slug)) as CommunityChatPageData | null;

  if (!data) {
    redirect("/communities");
  }

  const { community, messages } = data;
  const canChat = community.canChat;

  return (
    <div className="app-shell">
      <div className="mx-auto min-h-screen w-full max-w-6xl px-4 pb-28 pt-4 sm:px-6 lg:px-8 lg:pb-12">
        <Navbar user={currentUser} logoutAction={logoutAction} />

        <div className="mt-8 space-y-6">
          <Link
            href={`/communities/${community.slug}`}
            className="inline-flex items-center gap-2 text-sm font-semibold text-indigo-200 transition-all duration-200 hover:text-indigo-100"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to community
          </Link>

          <section className="surface-card rounded-[2rem] border border-white/8 bg-slate-950/80 p-6 shadow-[0_30px_60px_rgba(0,0,0,0.35)]">
            <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-4">
                <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-indigo-500 to-fuchsia-500 text-2xl font-semibold text-white">
                  {community.name
                    .split(" ")
                    .map((part) => part[0])
                    .join("")
                    .slice(0, 2)
                    .toUpperCase()}
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-sky-300">Community chat</p>
                  <h1 className="mt-2 text-3xl font-semibold text-white">{community.name}</h1>
                  <p className="mt-2 text-sm text-slate-400">Chat with members in this community space.</p>
                </div>
              </div>
              <div className="rounded-3xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-slate-200">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-slate-300" />
                  {community.memberCount} members
                </div>
              </div>
            </div>
          </section>

          <section className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
            <div className="surface-card flex min-h-[64vh] flex-col overflow-hidden rounded-[2rem] border border-white/8 bg-slate-950/80">
              <div className="border-b border-white/8 px-6 py-5">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04] text-slate-100">
                    <MessageCircleMore className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-[0.24em] text-sky-300">Community chat</p>
                    <p className="text-sm text-slate-400">{canChat ? "Everyone in this community can join." : "Only members can send messages."}</p>
                  </div>
                </div>
              </div>
              <div className="flex-1 overflow-hidden">
                {messages.length > 0 ? (
                  <div className="max-h-[56vh] overflow-y-auto px-6 py-5 space-y-4">
                    {messages.map((message) => {
                      const isMine = message.sender.id === currentUser.id;
                      return (
                        <div
                          key={message.id}
                          className={
                            isMine
                              ? "ml-auto max-w-[78%] rounded-[1.5rem] bg-indigo-500/15 px-4 py-3 text-slate-100"
                              : "mr-auto max-w-[78%] rounded-[1.5rem] border border-white/10 bg-white/[0.04] px-4 py-3 text-slate-100"
                          }
                        >
                          <div className="flex items-center gap-3 pb-2">
                            <div className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-full border border-white/10 bg-slate-900 text-sm font-semibold text-white">
                              {message.sender.profile?.avatar_url ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img alt={message.sender.username} className="h-full w-full object-cover" src={message.sender.profile.avatar_url} />
                              ) : (
                                message.sender.username
                                  .split(" ")
                                  .map((part) => part[0])
                                  .join("")
                                  .slice(0, 2)
                                  .toUpperCase()
                              )}
                            </div>
                            <div>
                              <p className="text-sm font-semibold text-white">{message.sender.profile?.full_name || message.sender.username}</p>
                              <p className="text-xs text-slate-500">{formatDistanceToNow(message.createdAt)}</p>
                            </div>
                          </div>
                          <p className="whitespace-pre-wrap text-sm leading-7 text-slate-200">{message.text}</p>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="flex h-[56vh] flex-col items-center justify-center gap-4 px-6 text-center text-slate-400">
                    <div className="flex h-16 w-16 items-center justify-center rounded-3xl border border-white/10 bg-white/[0.04] text-slate-200">
                      <MessageCircleMore className="h-6 w-6" />
                    </div>
                    <p className="text-lg font-semibold text-white">No messages yet</p>
                    <p className="max-w-sm text-sm leading-6 text-slate-400">
                      Start the conversation in this community by sending the first message. Messages are shared with all members.
                    </p>
                  </div>
                )}
              </div>

              <div className="border-t border-white/8 px-6 py-5">
                {canChat ? (
                  <form action={sendCommunityChatMessageAction} className="flex flex-col gap-3 sm:flex-row sm:items-center">
                    <input name="communityId" type="hidden" value={community.id} />
                    <label className="sr-only" htmlFor="community-message">
                      Send a message
                    </label>
                    <input
                      id="community-message"
                      name="message"
                      placeholder="Write a message to the community..."
                      className="min-h-[56px] w-full rounded-2xl border border-white/10 bg-slate-900/80 px-4 py-3 text-sm text-slate-100 outline-none placeholder:text-slate-500 focus:border-indigo-300/30 focus:ring-2 focus:ring-indigo-300/10"
                      type="text"
                      required
                    />
                    <button
                      type="submit"
                      className="inline-flex h-14 items-center justify-center rounded-2xl bg-indigo-500 px-5 text-sm font-semibold text-white transition-all duration-200 hover:bg-indigo-400"
                    >
                      <SendHorizonal className="h-4 w-4" />
                    </button>
                  </form>
                ) : (
                  <div className="rounded-3xl border border-dashed border-white/10 bg-white/[0.03] p-6 text-center text-slate-400">
                    <p className="text-base font-semibold text-white">Join to access the community chat.</p>
                    <p className="mt-2 text-sm text-slate-400">Only members can send messages here.</p>
                    <Link href={`/communities/${community.slug}`} className="mt-4 inline-flex rounded-2xl bg-indigo-500 px-4 py-2 text-sm font-semibold text-white transition-all duration-200 hover:bg-indigo-400">
                      View community page
                    </Link>
                  </div>
                )}
              </div>
            </div>

            <aside className="space-y-6">
              <section className="rounded-[2rem] border border-white/8 bg-slate-950/80 p-6 shadow-[0_30px_60px_rgba(0,0,0,0.24)]">
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-sky-300">Community details</p>
                <div className="mt-4 space-y-4">
                  <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-4">
                    <p className="text-xs uppercase tracking-[0.22em] text-slate-400">Creator</p>
                    <Link href={`/profile/${community.owner.username}`} className="mt-3 block text-sm font-semibold text-white hover:text-indigo-200">
                      {community.owner.profile?.full_name || community.owner.username}
                    </Link>
                    <p className="text-xs text-muted-foreground">@{community.owner.username}</p>
                  </div>
                </div>
              </section>
            </aside>
          </section>
        </div>

        <MobileNav />
      </div>
    </div>
  );
}
