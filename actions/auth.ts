"use server";

import bcrypt from "bcrypt";
import { Prisma } from "@/lib/prisma-generated";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { createSession } from "@/lib/session";
import { getCurrentUserOrRedirect } from "@/server/auth";
import { FormState, fromZodError, loginSchema, passwordChangeSchema, registerSchema } from "@/lib/validation";

export async function registerAction(_: FormState, formData: FormData): Promise<FormState> {
  const parsed = registerSchema.safeParse({
    email: formData.get("email"),
    username: formData.get("username"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return fromZodError(parsed.error);
  }

  const { email, username, password } = parsed.data;

  try {
    const password_hash = await bcrypt.hash(password, 10);
    const user = await prisma.users.create({
      data: {
        email: email.toLowerCase(),
        username: username.toLowerCase(),
        password_hash,
      },
    });

    await createSession(user.id);
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return {
        message: "That email or username is already taken.",
      };
    }

    return {
      message: "Something went wrong while creating your account.",
    };
  }

  redirect("/onboarding");
}

export async function loginAction(_: FormState, formData: FormData): Promise<FormState> {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return fromZodError(parsed.error);
  }

  const { email, password } = parsed.data;
  const user = await prisma.users.findUnique({
    where: {
      email: email.toLowerCase(),
    },
    include: {
      profiles: true,
    },
  });

  if (!user) {
    return {
      message: "We could not find an account with those details.",
    };
  }

  const valid = await bcrypt.compare(password, user.password_hash);

  if (!valid) {
    return {
      message: "Incorrect password. Try again.",
    };
  }

  await createSession(user.id);

  redirect(user.profiles?.full_name ? "/home" : "/onboarding");
}

export async function changePasswordAction(_: FormState, formData: FormData): Promise<FormState> {
  const parsed = passwordChangeSchema.safeParse({
    current_password: formData.get("current_password"),
    new_password: formData.get("new_password"),
  });

  if (!parsed.success) {
    return fromZodError(parsed.error);
  }

  const currentUser = await getCurrentUserOrRedirect();
  const user = await prisma.users.findUnique({
    where: { id: currentUser.id },
  });

  if (!user) {
    return {
      message: "Unable to verify your account.",
    };
  }

  const valid = await bcrypt.compare(parsed.data.current_password, user.password_hash);

  if (!valid) {
    return {
      message: "Current password is incorrect.",
      errors: {
        current_password: ["Current password is incorrect."],
      },
      success: false,
    };
  }

  try {
    const password_hash = await bcrypt.hash(parsed.data.new_password, 10);
    await prisma.users.update({
      where: { id: currentUser.id },
      data: {
        password_hash,
      },
    });
  } catch (error) {
    return {
      message: error instanceof Error ? error.message : "Unable to update your password.",
    };
  }

  return {
    message: "Your password has been updated successfully.",
    success: true,
  };
}
