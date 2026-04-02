import { social_mode } from "@/lib/prisma-generated";
import { z } from "zod";

export type FormState = {
  message: string;
  errors?: Record<string, string[] | undefined>;
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

export const postSchema = z.object({
  content: z.string().min(1, "Write something before posting.").max(2000, "Post is too long."),
});

export function fromZodError(error: z.ZodError): FormState {
  return {
    message: "Please fix the highlighted fields.",
    errors: error.flatten().fieldErrors,
  };
}
