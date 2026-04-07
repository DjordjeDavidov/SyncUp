import { NextRequest, NextResponse } from "next/server";
import { getCurrentUserOrRedirect } from "@/server/auth";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  const currentUser = await getCurrentUserOrRedirect();
  const body = await request.json();
  const action = body?.action as string | undefined;
  const notificationId = body?.notificationId as string | undefined;

  if (!action) {
    return NextResponse.json({ error: "Action is required." }, { status: 400 });
  }

  if (action === "markRead") {
    if (!notificationId) {
      return NextResponse.json({ error: "Notification id is required." }, { status: 400 });
    }

    await prisma.notifications.updateMany({
      where: {
        id: notificationId,
        user_id: currentUser.id,
      },
      data: {
        read: true,
      },
    });

    return NextResponse.json({ ok: true });
  }

  if (action === "markAllRead") {
    await prisma.notifications.updateMany({
      where: {
        user_id: currentUser.id,
        read: false,
      },
      data: {
        read: true,
      },
    });

    return NextResponse.json({ ok: true });
  }

  if (action === "dismiss") {
    if (!notificationId) {
      return NextResponse.json({ error: "Notification id is required." }, { status: 400 });
    }

    await prisma.notifications.deleteMany({
      where: {
        id: notificationId,
        user_id: currentUser.id,
      },
    });

    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: "Invalid action." }, { status: 400 });
}
