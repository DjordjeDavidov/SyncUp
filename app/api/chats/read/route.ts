import { NextRequest, NextResponse } from "next/server";
import { getCurrentUserOrRedirect } from "@/server/auth";
import { markCommunityChatAsRead, markDirectThreadAsRead } from "@/server/direct-messages";

export async function POST(request: NextRequest) {
  const currentUser = await getCurrentUserOrRedirect();
  const body = await request.json();
  const chatId = body?.chatId as string | undefined;
  const chatType = body?.chatType as "dm" | "community" | undefined;

  if (!chatId || !chatType) {
    return NextResponse.json({ error: "Chat id and chat type are required." }, { status: 400 });
  }

  if (chatType === "dm") {
    await markDirectThreadAsRead(currentUser.id, chatId);
  } else {
    await markCommunityChatAsRead(currentUser.id, chatId);
  }

  return NextResponse.json({ ok: true });
}
