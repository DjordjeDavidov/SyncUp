import { NextResponse } from "next/server";
import { z } from "zod";
import { runAiSearch } from "@/lib/ai/services/ai-search";
import { getSessionUserId } from "@/lib/session";

const requestSchema = z.object({
  query: z.string().trim().min(6).max(500),
});

export async function POST(request: Request) {
  const userId = await getSessionUserId();

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const parsed = requestSchema.safeParse(await request.json().catch(() => null));

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Describe what you want to discover in at least a few words." },
      { status: 400 },
    );
  }

  try {
    const data = await runAiSearch(userId, parsed.data.query);
    return NextResponse.json(data);
  } catch (error) {
    console.error("AI Search failed", error);
    const message = error instanceof Error ? error.message : "AI Search is unavailable right now.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
