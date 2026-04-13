import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";

type PageProps = {
  params: Promise<{ slug: string }>;
};

export default async function CommunityChatRedirectPage({ params }: PageProps) {
  const { slug } = await params;

  if (!slug) {
    notFound();
  }

  const community = await prisma.communities.findUnique({
    where: { slug },
    select: {
      id: true,
    },
  });

  if (!community) {
    notFound();
  }

  redirect(`/chats/${community.id}`);
}
