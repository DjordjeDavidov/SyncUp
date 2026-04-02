export const communityCategoryValues = [
  "hiking",
  "sports",
  "movies",
  "gaming",
  "travel",
  "food",
  "nightlife",
  "music",
  "tech",
  "art",
  "study",
  "fitness",
  "photography",
  "custom",
] as const;

export const communityCategoryOptions = [
  { value: "hiking", label: "Hiking" },
  { value: "sports", label: "Sports" },
  { value: "movies", label: "Movies" },
  { value: "gaming", label: "Gaming" },
  { value: "travel", label: "Travel" },
  { value: "food", label: "Food" },
  { value: "nightlife", label: "Nightlife" },
  { value: "music", label: "Music" },
  { value: "tech", label: "Tech" },
  { value: "art", label: "Art" },
  { value: "study", label: "Study" },
  { value: "fitness", label: "Fitness" },
  { value: "photography", label: "Photography" },
  { value: "custom", label: "Other / Custom" },
] as const;

export type CommunityCategoryValue = (typeof communityCategoryValues)[number];

const communityCategoryLabelMap = new Map<string, string>(
  communityCategoryOptions.map((option) => [option.value, option.label] as const),
);

export function getCommunityCategoryLabel(
  category: string | null | undefined,
  customCategory?: string | null,
) {
  if (!category) {
    return null;
  }

  if (category === "custom") {
    return customCategory?.trim() || "Custom";
  }

  return communityCategoryLabelMap.get(category) ?? category;
}
