"use server";

import { Prisma, social_mode } from "@/lib/prisma-generated";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { FormState, fromZodError, profileSchema } from "@/lib/validation";
import { getCurrentUserOrRedirect } from "@/server/auth";
import { uploadImage } from "@/server/storage";

function toStringArray(value: FormDataEntryValue[]) {
  return value.map((item) => String(item));
}

export async function onboardingAction(_: FormState, formData: FormData): Promise<FormState> {
  const currentUser = await getCurrentUserOrRedirect();
  const parsed = profileSchema.safeParse({
    full_name: formData.get("full_name"),
    username: formData.get("username"),
    bio: formData.get("bio") || "",
    city: formData.get("city") || "",
    country: formData.get("country") || "",
    social_mode: formData.get("social_mode") || social_mode.JUST_CHAT,
  });

  if (!parsed.success) {
    return fromZodError(parsed.error);
  }

  const languageIds = toStringArray(formData.getAll("language_ids"));
  const interestIds = toStringArray(formData.getAll("interest_ids"));
  const vibeTagIds = toStringArray(formData.getAll("vibe_tag_ids"));
  const activityCategoryIds = toStringArray(formData.getAll("activity_category_ids"));
  const avatar = formData.get("avatar");

  try {
    let avatarPayload:
      | {
          path: string;
          url: string;
        }
      | undefined;

    if (avatar instanceof File && avatar.size > 0) {
      avatarPayload = await uploadImage({
        file: avatar,
        userId: currentUser.id,
        kind: "avatar",
      });
    }

    await prisma.$transaction(async (tx) => {
      await tx.users.update({
        where: { id: currentUser.id },
        data: {
          username: parsed.data.username.toLowerCase(),
        },
      });

      await tx.profiles.upsert({
        where: { user_id: currentUser.id },
        create: {
          user_id: currentUser.id,
          full_name: parsed.data.full_name,
          bio: parsed.data.bio || null,
          city: parsed.data.city || null,
          country: parsed.data.country || null,
          social_mode: parsed.data.social_mode,
          avatar_path: avatarPayload?.path,
          avatar_url: avatarPayload?.url,
        },
        update: {
          full_name: parsed.data.full_name,
          bio: parsed.data.bio || null,
          city: parsed.data.city || null,
          country: parsed.data.country || null,
          social_mode: parsed.data.social_mode,
          ...(avatarPayload
            ? {
                avatar_path: avatarPayload.path,
                avatar_url: avatarPayload.url,
              }
            : {}),
        },
      });

      await tx.user_languages.deleteMany({ where: { user_id: currentUser.id } });
      if (languageIds.length > 0) {
        await tx.user_languages.createMany({
          data: languageIds.map((language_id) => ({
            user_id: currentUser.id,
            language_id,
          })),
          skipDuplicates: true,
        });
      }

      await tx.user_interests.deleteMany({ where: { user_id: currentUser.id } });
      if (interestIds.length > 0) {
        await tx.user_interests.createMany({
          data: interestIds.map((interest_id) => ({
            user_id: currentUser.id,
            interest_id,
          })),
          skipDuplicates: true,
        });
      }

      await tx.user_vibe_tags.deleteMany({ where: { user_id: currentUser.id } });
      if (vibeTagIds.length > 0) {
        await tx.user_vibe_tags.createMany({
          data: vibeTagIds.map((vibe_tag_id) => ({
            user_id: currentUser.id,
            vibe_tag_id,
          })),
          skipDuplicates: true,
        });
      }

      await tx.user_activity_preferences.deleteMany({ where: { user_id: currentUser.id } });
      if (activityCategoryIds.length > 0) {
        await tx.user_activity_preferences.createMany({
          data: activityCategoryIds.map((category_id) => ({
            user_id: currentUser.id,
            category_id,
          })),
          skipDuplicates: true,
        });
      }
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return {
        message: "That username is already in use.",
      };
    }

    return {
      message: error instanceof Error ? error.message : "Could not save your profile right now.",
    };
  }

  redirect("/home");
}
