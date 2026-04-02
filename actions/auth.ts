"use server";

import bcrypt from "bcrypt";
import { Prisma } from "@/lib/prisma-generated";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { createSession } from "@/lib/session";
import { FormState, fromZodError, loginSchema, registerSchema } from "@/lib/validation";

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
