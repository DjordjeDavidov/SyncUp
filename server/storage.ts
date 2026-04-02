import { createAdminSupabaseClient } from "@/lib/supabase";

type UploadKind = "avatar" | "post";

function sanitizeFileName(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9.-]+/g, "-");
}

export async function uploadImage({
  file,
  userId,
  kind,
}: {
  file: File;
  userId: string;
  kind: UploadKind;
}) {
  const client = createAdminSupabaseClient();
  const { data: buckets, error: bucketError } = await client.storage.listBuckets();

  if (bucketError || !buckets || buckets.length === 0) {
    throw new Error("No Supabase Storage bucket is available for uploads.");
  }

  const preferredNames =
    kind === "avatar"
      ? ["avatar", "avatars", "profile", "profiles", "media", "uploads", "images"]
      : ["posts", "post", "media", "uploads", "images"];

  const bucket =
    buckets.find((item) => preferredNames.some((keyword) => item.name.includes(keyword))) ??
    buckets[0];

  const path = `${kind}/${userId}/${Date.now()}-${sanitizeFileName(file.name || `${kind}.jpg`)}`;
  const bytes = Buffer.from(await file.arrayBuffer());
  const { error } = await client.storage.from(bucket.name).upload(path, bytes, {
    contentType: file.type || "application/octet-stream",
    upsert: true,
  });

  if (error) {
    throw new Error(error.message);
  }

  const {
    data: { publicUrl },
  } = client.storage.from(bucket.name).getPublicUrl(path);

  return {
    bucket: bucket.name,
    path,
    url: publicUrl,
  };
}
