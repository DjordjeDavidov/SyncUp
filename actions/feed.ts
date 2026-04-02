"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { destroySession } from "@/lib/session";
import { FormState, fromZodError, postSchema } from "@/lib/validation";
import { getCurrentUserOrRedirect } from "@/server/auth";
import { uploadImage } from "@/server/storage";

export async function createPostAction(_: FormState, formData: FormData): Promise<FormState> {
  const currentUser = await getCurrentUserOrRedirect();
  const parsed = postSchema.safeParse({
    content: formData.get("content"),
  });

  if (!parsed.success) {
    return fromZodError(parsed.error);
  }

  try {
    let imagePayload:
      | {
          path: string;
          url: string;
        }
      | undefined;

    const image = formData.get("image");

    if (image instanceof File && image.size > 0) {
      imagePayload = await uploadImage({
        file: image,
        userId: currentUser.id,
        kind: "post",
      });
    }

    await prisma.posts.create({
      data: {
        author_id: currentUser.id,
        content: parsed.data.content,
        image_path: imagePayload?.path,
        image_url: imagePayload?.url,
      },
    });
  } catch (error) {
    return {
      message: error instanceof Error ? error.message : "Could not create your post.",
    };
  }

  revalidatePath("/home");

  return {
    message: "",
    errors: {},
  };
}

export async function toggleLikeAction(formData: FormData) {
  const currentUser = await getCurrentUserOrRedirect();
  const postId = String(formData.get("postId"));

  const existing = await prisma.post_likes.findUnique({
    where: {
      post_id_user_id: {
        post_id: postId,
        user_id: currentUser.id,
      },
    },
  });

  if (existing) {
    await prisma.post_likes.delete({
      where: {
        post_id_user_id: {
          post_id: postId,
          user_id: currentUser.id,
        },
      },
    });
  } else {
    await prisma.post_likes.create({
      data: {
        post_id: postId,
        user_id: currentUser.id,
      },
    });
  }

  revalidatePath("/home");
}

export async function logoutAction() {
  await destroySession();
  redirect("/");
}
