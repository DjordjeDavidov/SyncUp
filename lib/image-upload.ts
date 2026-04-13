export const MAX_IMAGE_UPLOAD_SIZE_BYTES = 5 * 1024 * 1024;
export const MAX_COMMUNITY_COVER_SIZE_BYTES = 8 * 1024 * 1024;
export const MAX_COMMUNITY_ICON_SIZE_BYTES = 4 * 1024 * 1024;

export function getImageUploadError(
  file: Pick<File, "size" | "type"> | null | undefined,
  options?: {
    maxSizeBytes?: number;
    label?: string;
  },
) {
  if (!file) {
    return null;
  }

  const maxSizeBytes = options?.maxSizeBytes ?? MAX_IMAGE_UPLOAD_SIZE_BYTES;
  const label = options?.label ?? "Image";

  if (!file.type || !file.type.startsWith("image/")) {
    return "Only image files are supported.";
  }

  if (file.size > maxSizeBytes) {
    return `${label} must be ${Math.floor(maxSizeBytes / (1024 * 1024))}MB or smaller.`;
  }

  return null;
}
