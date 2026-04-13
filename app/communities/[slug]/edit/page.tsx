import { notFound } from "next/navigation";
import { updateCommunityAction } from "@/actions/communities";
import { logoutAction } from "@/actions/feed";
import { CreateCommunityForm } from "@/components/communities/create-community-form";
import { MobileNav } from "@/components/mobile-nav";
import { Navbar } from "@/components/navbar";
import { type CommunityCategoryValue } from "@/lib/community-categories";
import { prisma } from "@/lib/prisma";
import { getCurrentUserOrRedirect } from "@/server/auth";
import { canEditCommunity, type CommunityRole } from "@/server/community-permissions";

type PageProps = {
  params: Promise<{ slug: string }>;
};

export default async function EditCommunityPage({ params }: PageProps) {
  const { slug } = await params;
  const currentUser = await getCurrentUserOrRedirect();
  const community = await prisma.communities.findUnique({
    where: { slug },
    include: {
      community_members: {
        where: {
          user_id: currentUser.id,
        },
        select: {
          role: true,
        },
      },
    },
  });

  if (!community) {
    notFound();
  }

  const role = (community.community_members[0]?.role as CommunityRole | undefined) ?? null;

  if (!canEditCommunity(role)) {
    notFound();
  }

  return (
    <div className="app-shell">
      <div className="mx-auto min-h-screen w-full max-w-5xl px-4 pb-28 pt-4 sm:px-6 lg:px-8 lg:pb-12">
        <Navbar user={currentUser} logoutAction={logoutAction} />
        <div className="py-8">
          <CreateCommunityForm
            action={updateCommunityAction.bind(null, community.id)}
            initialValues={{
              id: community.id,
              slug: community.slug,
              name: community.name,
              description: community.description ?? "",
              category: (community.category as CommunityCategoryValue | null) ?? "",
              customCategory: community.custom_category ?? "",
              visibility: community.visibility,
              coverUrl: community.cover_url,
              iconUrl: community.icon_url,
            }}
            mode="edit"
          />
        </div>
        <MobileNav />
      </div>
    </div>
  );
}
