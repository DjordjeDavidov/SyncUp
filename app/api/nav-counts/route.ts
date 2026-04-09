import { NextResponse } from "next/server";
import { getSessionUserId } from "@/lib/session";
import { getUnreadNavCounts } from "@/server/queries";

export const dynamic = "force-dynamic";

export async function GET() {
  const currentUserId = await getSessionUserId();

  if (!currentUserId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const counts = await getUnreadNavCounts(currentUserId);

  return NextResponse.json(counts, {
    headers: {
      "Cache-Control": "no-store, no-cache, must-revalidate",
    },
  });
}
