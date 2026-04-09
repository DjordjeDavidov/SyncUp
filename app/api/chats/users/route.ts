import { NextResponse } from "next/server";
import { getSessionUserId } from "@/lib/session";
import { searchDirectMessageUsers } from "@/server/direct-messages";

export async function GET(request: Request) {
  const currentUserId = await getSessionUserId();

  if (!currentUserId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q") ?? "";

  try {
    const users = await searchDirectMessageUsers(currentUserId, query);

    return NextResponse.json({ users });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to search users.";

    return NextResponse.json({ error: message }, { status: 400 });
  }
}
