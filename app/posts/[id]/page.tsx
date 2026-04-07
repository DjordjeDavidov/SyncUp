import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft, CalendarDays, MapPin, Users } from "lucide-react";
import { logoutAction } from "@/actions/feed";
import { Navbar } from "@/components/navbar";
import { MobileNav } from "@/components/mobile-nav";
import { getCurrentUserOrRedirect } from "@/server/auth";
import { prisma } from "@/lib/prisma";
import { formatDistanceToNow } from "@/lib/utils";

export default async function PostDetailPage({ params }: { params: { id: string } }) {
  const currentUser = await getCurrentUserOrRedirect();

  const post = await prisma.posts.findUnique({
    where: { id: params.id },
    include: {
      users: {
        include: {
          profiles: true,
        },
      },
      communities: true,
      activities: true,
    },
  });

  if (!post) {
    redirect("/communities");
  }

  const author = post.users;

  return (
    <div className="app-shell">
      <div className="mx-auto min-h-screen w-full max-w-5xl px-4 pb-28 pt-4 sm:px-6 lg:px-8 lg:pb-12">
        <Navbar user={currentUser} logoutAction={logoutAction} />

        <div className="mt-8 space-y-6">
          <Link
            href={post.communities ? `/communities/${post.communities.slug}` : "/communities"}
            className="inline-flex items-center gap-2 text-sm font-semibold text-indigo-200 transition-all duration-200 hover:text-indigo-100"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to community
          </Link>

          <article className="rounded-[2rem] border border-white/8 bg-slate-950/80 p-8 shadow-[0_32px_80px_rgba(0,0,0,0.35)]">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
              <div className="flex-1">
                <div className="flex flex-wrap items-center gap-3 text-sm text-slate-400">
                  <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-2">
                    <Users className="h-4 w-4 text-slate-300" />
                    {author.profiles?.full_name || author.username}
                  </span>
                  {post.communities ? (
                    <Link
                      href={`/communities/${post.communities.slug}`}
                      className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-2 text-slate-200 transition-all duration-200 hover:border-white/20 hover:text-white"
                    >
                      {post.communities.name}
                    </Link>
                  ) : null}
                  {post.activities ? (
                    <Link
                      href={`/activity/${post.activities.id}`}
                      className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-2 text-slate-200 transition-all duration-200 hover:border-white/20 hover:text-white"
                    >
                      {post.activities.title}
                    </Link>
                  ) : null}
                </div>
                <div className="mt-6 space-y-4">
                  <div>
                    <p className="text-xs uppercase tracking-[0.24em] text-sky-300">Published</p>
                    <h1 className="mt-3 text-3xl font-semibold tracking-tight text-white">{post.title || "Community post"}</h1>
                  </div>
                  <div className="flex flex-wrap gap-3 text-sm text-slate-400">
                    <span className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.04] px-3 py-2">
                      <CalendarDays className="h-4 w-4" />
                      {formatDistanceToNow(post.created_at)}
                    </span>
                    {post.location_text || post.activities?.location_text ? (
                      <span className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.04] px-3 py-2">
                        <MapPin className="h-4 w-4" />
                        {post.location_text || post.activities?.location_text}
                      </span>
                    ) : null}
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-8 space-y-6">
              <p className="text-base leading-8 text-slate-200 whitespace-pre-wrap">{post.content}</p>

              {post.image_url ? (
                <div className="overflow-hidden rounded-3xl border border-white/10 bg-slate-900/60">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img alt="Post media" className="w-full object-cover" src={post.image_url} />
                </div>
              ) : null}

              <div className="grid gap-4 sm:grid-cols-2">
                {post.communities ? (
                  <Link
                    href={`/communities/${post.communities.slug}`}
                    className="rounded-3xl border border-white/10 bg-white/[0.03] p-5 text-sm font-semibold text-white transition-all duration-200 hover:border-white/20"
                  >
                    View community: {post.communities.name}
                  </Link>
                ) : null}
                {post.activities ? (
                  <Link
                    href={`/activity/${post.activities.id}`}
                    className="rounded-3xl border border-white/10 bg-white/[0.03] p-5 text-sm font-semibold text-white transition-all duration-200 hover:border-white/20"
                  >
                    View activity: {post.activities.title}
                  </Link>
                ) : null}
              </div>
            </div>
          </article>
        </div>

        <MobileNav />
      </div>
    </div>
  );
}
