import { social_mode } from "@/lib/prisma-generated";
import { z } from "zod";
import { inviteVisibilityValues, postTypeValues } from "@/lib/post-types";

export type FormState = {
  message: string;
  errors?: Record<string, string[] | undefined>;
  success?: boolean;
};

export const registerSchema = z.object({
  email: z.email("Enter a valid email address."),
  username: z
    .string()
    .min(3, "Username must be at least 3 characters.")
    .max(30, "Username must be 30 characters or less.")
    .regex(/^[a-zA-Z0-9_]+$/, "Use letters, numbers, or underscores only."),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters.")
    .regex(/[A-Z]/, "Include at least one uppercase letter.")
    .regex(/[0-9]/, "Include at least one number.")
    .regex(/[^A-Za-z0-9]/, "Include at least one special symbol."),
});

export const loginSchema = z.object({
  email: z.email("Enter a valid email address."),
  password: z.string().min(1, "Enter your password."),
});

export const profileSchema = z.object({
  full_name: z.string().min(2, "Add your full name."),
  username: z
    .string()
    .min(3, "Username must be at least 3 characters.")
    .max(30, "Username must be 30 characters or less.")
    .regex(/^[a-zA-Z0-9_]+$/, "Use letters, numbers, or underscores only."),
  bio: z.string().max(400, "Bio must be 400 characters or less.").optional(),
  city: z.string().max(100, "City must be 100 characters or less.").optional(),
  country: z.string().max(100, "Country must be 100 characters or less.").optional(),
  social_mode: z.nativeEnum(social_mode),
});

const nullableText = z
  .string()
  .trim()
  .max(280, "Keep this field a bit shorter.")
  .optional()
  .transform((value) => (value ? value : undefined));

const optionalTextField = (max: number, message: string) =>
  z.preprocess(
    (value) => (typeof value === "string" ? value : ""),
    z.string().trim().max(max, message).optional(),
  );

const basePostSchema = z.object({
  postType: z.enum(postTypeValues),
  hasImage: z.boolean().optional(),
  inviteVisibility: z.enum(inviteVisibilityValues).optional(),
  communityId: optionalTextField(120, "Choose a valid community."),
  activityId: optionalTextField(120, "Choose a valid activity."),
  content: optionalTextField(2000, "Post is too long."),
  title: optionalTextField(180, "Title must be 180 characters or less."),
  locationText: optionalTextField(255, "Location must be 255 characters or less."),
  startsAt: z.preprocess(
    (value) => (typeof value === "string" ? value : ""),
    z.string().optional(),
  ),
  maxParticipants: z.preprocess(
    (value) => {
      if (value === "" || value === null || value === undefined) {
        return undefined;
      }

      return value;
    },
    z.coerce.number().int().positive("Max participants must be at least 1.").max(500, "Max participants must be 500 or less.").optional(),
  ),
  pollQuestion: optionalTextField(280, "Poll question must be 280 characters or less."),
  pollEndsAt: z.preprocess(
    (value) => (typeof value === "string" ? value : ""),
    z.string().optional(),
  ),
  pollOptions: z.array(z.string().trim().max(160, "Poll options must be 160 characters or less.")).optional(),
});

const standardPostSchema = basePostSchema.extend({
  postType: z.literal("standard_post"),
}).superRefine((value, ctx) => {
  if (!value.content?.trim() && !value.hasImage) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["content"],
      message: "Add some text or an image before posting.",
    });
  }
});

const invitePostSchema = basePostSchema.extend({
  postType: z.literal("invite_post"),
  title: z.string().trim().min(1, "Add an invite title.").max(180, "Title must be 180 characters or less."),
  startsAt: z.string().min(1, "Choose a date and time for your invite."),
});

const pollPostSchema = basePostSchema.extend({
  postType: z.literal("poll_post"),
  pollQuestion: z.string().trim().min(1, "Ask a poll question.").max(280, "Poll question must be 280 characters or less."),
  pollOptions: z
    .array(z.string().trim().min(1, "Poll options cannot be empty.").max(160, "Poll options must be 160 characters or less."))
    .min(2, "Add at least two poll options.")
    .max(6, "You can add up to six poll options."),
  content: nullableText,
});

const communityPostSchema = basePostSchema.extend({
  postType: z.literal("community_post"),
  communityId: z.string().min(1, "Choose a community for this post."),
}).superRefine((value, ctx) => {
  if (!value.content?.trim() && !value.hasImage) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["content"],
      message: "Add some text or an image for your community post.",
    });
  }
});

const activityPostSchema = basePostSchema.extend({
  postType: z.literal("activity_post"),
  title: z.string().trim().min(1, "Add an activity title.").max(180, "Title must be 180 characters or less."),
  startsAt: z.string().min(1, "Choose a date and time for your activity."),
});

export const postSchema = z.discriminatedUnion("postType", [
  standardPostSchema,
  invitePostSchema,
  pollPostSchema,
  communityPostSchema,
  activityPostSchema,
]);

export const commentSchema = z.object({
  postId: z.string().uuid("Invalid post."),
  content: z
    .string()
    .trim()
    .min(1, "Write a comment before sending.")
    .max(800, "Comments must be 800 characters or less."),
});

export function fromZodError(error: z.ZodError): FormState {
  return {
    message: "Please fix the highlighted fields.",
    errors: error.flatten().fieldErrors,
    success: false,
  };
}
