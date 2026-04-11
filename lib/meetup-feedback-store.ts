import { prisma } from "@/lib/prisma";

type MeetupFeedbackDelegate = {
  findMany(args?: unknown): Promise<any[]>;
  findFirst?(args?: unknown): Promise<any | null>;
  create?(args?: unknown): Promise<any>;
  update?(args?: unknown): Promise<any>;
};

declare global {
  // eslint-disable-next-line no-var
  var __syncup_meetup_feedback_warning_logged__: boolean | undefined;
}

function warnMeetupFeedbackUnavailable(context: string, error?: unknown) {
  if (globalThis.__syncup_meetup_feedback_warning_logged__) {
    return;
  }

  const reason =
    error instanceof Error
      ? error.message
      : "Meetup feedback model is not available in the active Prisma client.";

  console.warn(`[meetup-feedback] ${context}: ${reason}`);
  globalThis.__syncup_meetup_feedback_warning_logged__ = true;
}

export function getMeetupFeedbackDelegate(): MeetupFeedbackDelegate | null {
  const prismaWithDynamicModels = prisma as unknown as Record<string, unknown>;
  const candidate =
    prismaWithDynamicModels.meetupFeedback ?? prismaWithDynamicModels.meetup_feedback;

  if (
    candidate &&
    typeof candidate === "object" &&
    "findMany" in candidate &&
    typeof (candidate as MeetupFeedbackDelegate).findMany === "function"
  ) {
    return candidate as MeetupFeedbackDelegate;
  }

  return null;
}

export async function safeFindManyMeetupFeedback(args: unknown, context: string) {
  const delegate = getMeetupFeedbackDelegate();

  if (!delegate) {
    warnMeetupFeedbackUnavailable(context);
    return [];
  }

  try {
    return await delegate.findMany(args);
  } catch (error) {
    warnMeetupFeedbackUnavailable(context, error);
    return [];
  }
}

export async function safeFindFirstMeetupFeedback(args: unknown, context: string) {
  const delegate = getMeetupFeedbackDelegate();

  if (!delegate?.findFirst) {
    warnMeetupFeedbackUnavailable(context);
    return null;
  }

  try {
    return await delegate.findFirst(args);
  } catch (error) {
    warnMeetupFeedbackUnavailable(context, error);
    return null;
  }
}

export async function safeCreateMeetupFeedback(args: unknown, context: string) {
  const delegate = getMeetupFeedbackDelegate();

  if (!delegate?.create) {
    warnMeetupFeedbackUnavailable(context);
    return null;
  }

  try {
    return await delegate.create(args);
  } catch (error) {
    warnMeetupFeedbackUnavailable(context, error);
    return null;
  }
}

export async function safeUpdateMeetupFeedback(args: unknown, context: string) {
  const delegate = getMeetupFeedbackDelegate();

  if (!delegate?.update) {
    warnMeetupFeedbackUnavailable(context);
    return null;
  }

  try {
    return await delegate.update(args);
  } catch (error) {
    warnMeetupFeedbackUnavailable(context, error);
    return null;
  }
}
