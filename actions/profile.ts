"use server";

import { Prisma, social_mode } from "@/lib/prisma-generated";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { FormState, fromZodError, profileSchema } from "@/lib/validation";
import { getCurrentUserOrRedirect } from "@/server/auth";
import { uploadImage } from "@/server/storage";

const socialModeLabels: Record<social_mode, string> = {
  JUST_CHAT: "Just chat",
  ONLINE_GAMING: "Online gaming",
  GROUP_HANGOUTS: "Group hangouts",
  REAL_LIFE_MEETUPS: "Real-life meetups",
};

function toStringArray(value: FormDataEntryValue[]) {
  return value.map((item) => String(item));
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export async function onboardingAction(_: FormState, formData: FormData): Promise<FormState> {
  const currentUser = await getCurrentUserOrRedirect();
  const socialModeCustomValues = toStringArray(formData.getAll("social_mode_custom")).filter(Boolean);
  const selectedSocialMode = String(formData.get("social_mode") || social_mode.JUST_CHAT);
  const socialModeValue = socialModeCustomValues.length
    ? (Object.entries(socialModeLabels).find(([, label]) => label.toLowerCase() === socialModeCustomValues[0].toLowerCase())?.[0] as social_mode | undefined) || selectedSocialMode
    : selectedSocialMode;

  const parsed = profileSchema.safeParse({
    full_name: formData.get("full_name"),
    username: formData.get("username"),
    bio: formData.get("bio") || "",
    city: formData.get("city") || "",
    country: formData.get("country") || "",
    social_mode: socialModeValue as social_mode,
  });

  if (!parsed.success) {
    return fromZodError(parsed.error);
  }

  const languageIds = toStringArray(formData.getAll("language_ids"));
  const customLanguageNames = toStringArray(formData.getAll("language_ids_custom")).filter(Boolean);
  const interestIds = toStringArray(formData.getAll("interest_ids"));
  const customInterestNames = toStringArray(formData.getAll("interest_ids_custom")).filter(Boolean);
  const vibeTagIds = toStringArray(formData.getAll("vibe_tag_ids"));
  const customVibeNames = toStringArray(formData.getAll("vibe_tag_ids_custom")).filter(Boolean);
  const activityCategoryIds = toStringArray(formData.getAll("activity_category_ids"));
  const customActivityNames = toStringArray(formData.getAll("activity_category_ids_custom")).filter(Boolean);
  const avatar = formData.get("avatar");

  try {
    let avatarPayload:
      | {
          path: string;
          url: string;
        }
      | undefined;

    if (avatar instanceof File && avatar.size > 0) {
      if (avatar.size > 5 * 1024 * 1024) {
        return {
          message: "Avatar file is too large. Use a file smaller than 5MB.",
        };
      }

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

      const resolvedLanguageIds = [...languageIds];
      for (const name of customLanguageNames) {
        const code = slugify(name).slice(0, 10) || name.toLowerCase().slice(0, 10);
        const record = await tx.languages.upsert({
          where: { name },
          create: { name, code },
          update: {},
        });
        resolvedLanguageIds.push(record.id);
      }

      const resolvedInterestIds = [...interestIds];
      for (const name of customInterestNames) {
        const slug = slugify(name);
        const record = await tx.interests.upsert({
          where: { name },
          create: { name, slug },
          update: {},
        });
        resolvedInterestIds.push(record.id);
      }

      const resolvedVibeTagIds = [...vibeTagIds];
      for (const name of customVibeNames) {
        const slug = slugify(name);
        const record = await tx.vibe_tags.upsert({
          where: { name },
          create: { name, slug },
          update: {},
        });
        resolvedVibeTagIds.push(record.id);
      }

      const resolvedActivityCategoryIds = [...activityCategoryIds];
      for (const name of customActivityNames) {
        const slug = slugify(name);
        const record = await tx.activity_categories.upsert({
          where: { name },
          create: { name, slug },
          update: {},
        });
        resolvedActivityCategoryIds.push(record.id);
      }

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
      if (resolvedLanguageIds.length > 0) {
        await tx.user_languages.createMany({
          data: resolvedLanguageIds.map((language_id) => ({
            user_id: currentUser.id,
            language_id,
          })),
          skipDuplicates: true,
        });
      }

      await tx.user_interests.deleteMany({ where: { user_id: currentUser.id } });
      if (resolvedInterestIds.length > 0) {
        await tx.user_interests.createMany({
          data: resolvedInterestIds.map((interest_id) => ({
            user_id: currentUser.id,
            interest_id,
          })),
          skipDuplicates: true,
        });
      }

      await tx.user_vibe_tags.deleteMany({ where: { user_id: currentUser.id } });
      if (resolvedVibeTagIds.length > 0) {
        await tx.user_vibe_tags.createMany({
          data: resolvedVibeTagIds.map((vibe_tag_id) => ({
            user_id: currentUser.id,
            vibe_tag_id,
          })),
          skipDuplicates: true,
        });
      }

      await tx.user_activity_preferences.deleteMany({ where: { user_id: currentUser.id } });
      if (resolvedActivityCategoryIds.length > 0) {
        await tx.user_activity_preferences.createMany({
          data: resolvedActivityCategoryIds.map((category_id) => ({
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
