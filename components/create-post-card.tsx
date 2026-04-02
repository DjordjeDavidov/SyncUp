"use client";

import Link from "next/link";
import {
  CalendarClock,
  ChevronDown,
  Globe2,
  ImagePlus,
  Loader2,
  MapPin,
  Plus,
  Sparkles,
  SquarePen,
  Trash2,
  Upload,
  Users,
  Vote,
  X,
} from "lucide-react";
import { type FormEvent, useActionState, useEffect, useMemo, useRef, useState } from "react";
import { useFormStatus } from "react-dom";
import { getImageUploadError } from "@/lib/image-upload";
import { SyncUpPostType } from "@/lib/post-types";
import { FormState } from "@/lib/validation";
import { getInitials } from "@/lib/utils";

type Props = {
  action: (state: FormState, formData: FormData) => Promise<FormState>;
  currentUser: {
    id: string;
    username: string;
    profile: {
      full_name: string;
      avatar_url: string | null;
    } | null;
    communities?: { id: string; name: string }[];
    community_members?: { communities: { id: string; name: string } }[];
    activities?: { id: string; title: string }[];
    activity_participants?: { activities: { id: string; title: string } }[];
  };
};

const initialState: FormState = {
  message: "",
  errors: {},
  success: false,
};

const postTypeOptions: {
  value: SyncUpPostType;
  label: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
}[] = [
  { value: "standard_post", label: "Post", description: "Thoughts, memes, quick updates", icon: SquarePen },
  { value: "invite_post", label: "Invite", description: "Find people for an idea tonight", icon: Sparkles },
  { value: "poll_post", label: "Poll", description: "Ask the room and get quick votes", icon: Vote },
  { value: "activity_post", label: "Activity", description: "Share a plan with timing and place", icon: CalendarClock },
  { value: "community_post", label: "Community", description: "Post into one of your spaces", icon: Users },
];

const primaryPostTypeOptions = postTypeOptions.filter((option) =>
  ["standard_post", "invite_post", "poll_post"].includes(option.value),
);

const secondaryPostTypeOptions = postTypeOptions.filter((option) =>
  ["activity_post", "community_post"].includes(option.value),
);

function surfaceClass(hasError: boolean) {
  return hasError
    ? "border-rose-400/45 bg-rose-500/10 shadow-[0_0_0_1px_rgba(248,113,113,0.18),0_0_24px_rgba(248,113,113,0.08)]"
    : "border-white/8 bg-white/[0.03] focus-within:border-indigo-300/24 focus-within:bg-white/[0.05] focus-within:shadow-[0_0_0_1px_rgba(129,140,248,0.12),0_0_24px_rgba(99,102,241,0.08)]";
}

function baseInputClass(hasError: boolean) {
  return `w-full outline-none transition-all duration-200 placeholder:text-slate-500 ${hasError ? "border-rose-300/20 bg-transparent text-rose-50" : "border-transparent bg-transparent text-slate-100"}`;
}

function FieldError({ error }: { error?: string | null }) {
  if (!error) {
    return null;
  }

  return <p className="text-sm text-rose-300">{error}</p>;
}

function SubmitButton({
  postType,
  disabled,
}: {
  postType: SyncUpPostType;
  disabled?: boolean;
}) {
  const { pending } = useFormStatus();
  const label =
    postType === "invite_post"
      ? "Publish Invite"
      : postType === "poll_post"
        ? "Publish Poll"
        : postType === "activity_post"
          ? "Publish Activity"
          : postType === "community_post"
            ? "Publish to Community"
            : "Post";

  return (
    <button
      className="rounded-2xl bg-[linear-gradient(135deg,rgba(99,102,241,1),rgba(59,130,246,0.92))] px-6 py-3 text-sm font-semibold text-white shadow-[0_16px_36px_rgba(99,102,241,0.32),0_0_18px_rgba(99,102,241,0.16)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_20px_44px_rgba(99,102,241,0.38),0_0_24px_rgba(99,102,241,0.22)] active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-70 disabled:hover:translate-y-0"
      disabled={pending || disabled}
      type="submit"
    >
      {pending ? "Posting..." : label}
    </button>
  );
}

function FieldShell({
  icon: Icon,
  label,
  error,
  children,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  error?: string | null;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-2">
      <label
        className={`flex flex-col gap-3 rounded-2xl border px-4 py-4 transition-all duration-200 ${surfaceClass(Boolean(error))}`}
      >
        <span className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
          <Icon className="h-3.5 w-3.5" />
          {label}
        </span>
        {children}
      </label>
      <FieldError error={error} />
    </div>
  );
}

function UploadDropzone({
  inputId,
  inputRef,
  previewUrl,
  fileName,
  error,
  isPreparing,
  onSelectFile,
  onRemove,
}: {
  inputId: string;
  inputRef: React.RefObject<HTMLInputElement | null>;
  previewUrl: string | null;
  fileName: string | null;
  error?: string | null;
  isPreparing: boolean;
  onSelectFile: (file: File | null) => Promise<void> | void;
  onRemove: () => void;
}) {
  const [isDragOver, setIsDragOver] = useState(false);

  async function syncDroppedFile(file: File | null) {
    if (inputRef.current) {
      if (file) {
        const transfer = new DataTransfer();
        transfer.items.add(file);
        inputRef.current.files = transfer.files;
      } else {
        inputRef.current.value = "";
      }
    }

    await onSelectFile(file);
  }

  return (
    <div className="flex flex-col gap-3">
      <input
        accept="image/*"
        className="sr-only"
        id={inputId}
        name="image"
        onChange={(event) => void onSelectFile(event.target.files?.[0] ?? null)}
        ref={inputRef}
        type="file"
      />

      <button
        aria-describedby={error ? `${inputId}-error` : undefined}
        className={`relative block w-full cursor-pointer overflow-hidden rounded-2xl border border-dashed px-4 py-4 text-left transition-all duration-200 sm:px-6 ${
          error
            ? "border-rose-400/40 bg-rose-500/10 shadow-[0_0_0_1px_rgba(248,113,113,0.18),0_0_24px_rgba(248,113,113,0.08)]"
            : isDragOver
              ? "border-indigo-300/28 bg-indigo-400/10 shadow-[0_0_0_1px_rgba(129,140,248,0.16),0_0_28px_rgba(99,102,241,0.12)]"
              : "border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.03),rgba(255,255,255,0.015))] hover:border-indigo-300/20 hover:bg-indigo-400/5"
        }`}
        onClick={() => inputRef.current?.click()}
        onDragEnter={(event) => {
          event.preventDefault();
          setIsDragOver(true);
        }}
        onDragLeave={(event) => {
          event.preventDefault();
          if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
            setIsDragOver(false);
          }
        }}
        onDragOver={(event) => {
          event.preventDefault();
          setIsDragOver(true);
        }}
        onDrop={(event) => {
          event.preventDefault();
          setIsDragOver(false);
          void syncDroppedFile(event.dataTransfer.files?.[0] ?? null);
        }}
        type="button"
      >
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-indigo-400/20 bg-indigo-400/10 text-indigo-200">
            {isPreparing ? <Loader2 className="h-5 w-5 animate-spin" /> : <ImagePlus className="h-5 w-5" />}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-slate-100">
              {previewUrl ? "Image ready" : isPreparing ? "Processing image..." : "Add image"}
            </p>
            <p className="text-xs text-muted-foreground">
              {previewUrl
                ? fileName ?? "Selected image"
                : isDragOver
                  ? "Drop your image here"
                  : "Click anywhere or drag and drop an image"}
            </p>
          </div>
        </div>

        {previewUrl ? (
          <div className="mt-4 overflow-hidden rounded-2xl border border-white/8 bg-slate-950/50">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img alt="Selected upload preview" className="max-h-72 w-full object-cover" src={previewUrl} />
          </div>
        ) : null}
      </button>

      {previewUrl ? (
        <div className="flex flex-wrap items-center gap-3">
          <button
            className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2.5 text-sm font-medium text-slate-200 transition-all duration-200 hover:border-indigo-300/20 hover:bg-indigo-400/10 hover:text-white"
            onClick={() => inputRef.current?.click()}
            type="button"
          >
            <Upload className="h-4 w-4" />
            Change image
          </button>
          <button
            className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2.5 text-sm font-medium text-slate-200 transition-all duration-200 hover:border-rose-300/24 hover:bg-rose-400/10 hover:text-rose-100"
            onClick={onRemove}
            type="button"
          >
            <X className="h-4 w-4" />
            Remove image
          </button>
        </div>
      ) : null}

      {error ? (
        <p className="text-sm text-rose-300" id={`${inputId}-error`}>
          {error}
        </p>
      ) : null}
    </div>
  );
}

export function CreatePostCard({ action, currentUser }: Props) {
  const [state, formAction] = useActionState(action, initialState);
  const [postType, setPostType] = useState<SyncUpPostType>("standard_post");
  const [contentValue, setContentValue] = useState("");
  const [titleValue, setTitleValue] = useState("");
  const [startsAtValue, setStartsAtValue] = useState("");
  const [locationTextValue, setLocationTextValue] = useState("");
  const [maxParticipantsValue, setMaxParticipantsValue] = useState("");
  const [pollQuestionValue, setPollQuestionValue] = useState("");
  const [pollEndsAtValue, setPollEndsAtValue] = useState("");
  const [pollOptions, setPollOptions] = useState(["", ""]);
  const [selectedCommunityId, setSelectedCommunityId] = useState("");
  const [selectedActivityId] = useState("");
  const [inviteVisibilityValue, setInviteVisibilityValue] = useState<"public" | "followers_friends">("public");
  const [createMenuOpen, setCreateMenuOpen] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [selectedFileName, setSelectedFileName] = useState<string | null>(null);
  const [localImageError, setLocalImageError] = useState<string | null>(null);
  const [isPreparingImage, setIsPreparingImage] = useState(false);
  const [touchedFields, setTouchedFields] = useState<Record<string, boolean>>({});
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [changedSinceSubmit, setChangedSinceSubmit] = useState<Record<string, boolean>>({});
  const fileInputRef = useRef<HTMLInputElement>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const createMenuRef = useRef<HTMLDivElement>(null);

  const joinedCommunities = useMemo(() => {
    const owned = currentUser.communities ?? [];
    const joined = (currentUser.community_members ?? []).map((entry) => entry.communities);
    return [...owned, ...joined.filter((community) => !owned.some((item) => item.id === community.id))];
  }, [currentUser.communities, currentUser.community_members]);

  const linkedActivities = useMemo(() => {
    const created = currentUser.activities ?? [];
    const joined = (currentUser.activity_participants ?? []).map((entry) => entry.activities);
    return [...created, ...joined.filter((activity) => !created.some((item) => item.id === activity.id))];
  }, [currentUser.activities, currentUser.activity_participants]);

  const selectedType = postTypeOptions.find((option) => option.value === postType) ?? postTypeOptions[0];
  const SelectedTypeIcon = selectedType.icon;
  const supportsImage = postType !== "poll_post";
  const selectedTypeIsSecondary = secondaryPostTypeOptions.some((option) => option.value === postType);
  const selectedCommunity =
    postType === "community_post"
      ? joinedCommunities.find((community) => community.id === selectedCommunityId) ?? null
      : null;
  const trimmedContent = contentValue.trim();
  const trimmedTitle = titleValue.trim();
  const trimmedPollQuestion = pollQuestionValue.trim();
  const filledPollOptionsCount = pollOptions.filter((option) => option.trim().length > 0).length;
  const hasImage = Boolean(previewUrl);
  const hasServerFieldErrors = Boolean(state.errors && Object.keys(state.errors).length > 0);

  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  useEffect(() => {
    function handleOutsideClick(event: MouseEvent) {
      if (!createMenuRef.current?.contains(event.target as Node)) {
        setCreateMenuOpen(false);
      }
    }

    if (createMenuOpen) {
      document.addEventListener("mousedown", handleOutsideClick);
    }

    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
    };
  }, [createMenuOpen]);

  useEffect(() => {
    if (!state.success) {
      return;
    }

    const preserveCommunitySelection = postType === "community_post" ? selectedCommunityId : "";

    setContentValue("");
    setTitleValue("");
    setStartsAtValue("");
    setLocationTextValue("");
    setMaxParticipantsValue("");
    setPollQuestionValue("");
    setPollEndsAtValue("");
    setPollOptions(["", ""]);
    setSelectedCommunityId(preserveCommunitySelection);
    setInviteVisibilityValue("public");
    setTouchedFields({});
    setHasSubmitted(false);
    setChangedSinceSubmit({});
    resetImageState();

    formRef.current?.reset();

    if (preserveCommunitySelection) {
      const communitySelect = formRef.current?.querySelector<HTMLSelectElement>('[name="communityId"]');
      if (communitySelect) {
        communitySelect.value = preserveCommunitySelection;
      }
    }
  }, [postType, selectedCommunityId, state.success]);

  useEffect(() => {
    if (!state.errors || Object.keys(state.errors).length === 0) {
      return;
    }

    const focusOrder = [
      "title",
      "content",
      "pollQuestion",
      "pollOptions",
      "startsAt",
      "communityId",
      "maxParticipants",
      "image",
    ];
    const firstField = focusOrder.find((field) => state.errors?.[field]?.[0]);

    if (!firstField) {
      return;
    }

    setHasSubmitted(true);
    focusField(firstField);
  }, [state.errors]);

  function markFieldTouched(field: string) {
    setTouchedFields((current) => (current[field] ? current : { ...current, [field]: true }));
  }

  function markFieldChanged(field: string) {
    if (hasSubmitted) {
      setChangedSinceSubmit((current) => (current[field] ? current : { ...current, [field]: true }));
    }
  }

  function resetImageState() {
    setPreviewUrl((currentUrl) => {
      if (currentUrl) {
        URL.revokeObjectURL(currentUrl);
      }
      return null;
    });
    setSelectedFileName(null);
    setLocalImageError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  async function handleSelectedFile(file: File | null) {
    markFieldTouched("image");
    markFieldChanged("image");
    setIsPreparingImage(true);

    if (!file) {
      resetImageState();
      setIsPreparingImage(false);
      return;
    }

    const error = getImageUploadError(file);

    if (error) {
      resetImageState();
      setLocalImageError(error);
      setIsPreparingImage(false);
      return;
    }

    setPreviewUrl((currentUrl) => {
      if (currentUrl) {
        URL.revokeObjectURL(currentUrl);
      }

      return URL.createObjectURL(file);
    });
    setSelectedFileName(file.name);
    setLocalImageError(null);
    setIsPreparingImage(false);
  }

  function switchPostType(nextType: SyncUpPostType) {
    setPostType(nextType);
    setCreateMenuOpen(false);
    setTitleValue("");
    setStartsAtValue("");
    setLocationTextValue("");
    setMaxParticipantsValue("");
    setPollQuestionValue("");
    setPollEndsAtValue("");
    setContentValue("");
    setSelectedCommunityId("");
    setInviteVisibilityValue("public");
    setTouchedFields({});
    setHasSubmitted(false);
    setChangedSinceSubmit({});
    resetImageState();

    if (nextType !== "poll_post") {
      setPollOptions(["", ""]);
    }
  }

  function updatePollOption(index: number, value: string) {
    markFieldChanged("pollOptions");
    setPollOptions((current) =>
      current.map((option, optionIndex) => (optionIndex === index ? value : option)),
    );
  }

  function addPollOption() {
    setPollOptions((current) => (current.length >= 6 ? current : [...current, ""]));
    markFieldChanged("pollOptions");
  }

  function removePollOption(index: number) {
    setPollOptions((current) =>
      current.length <= 2 ? current : current.filter((_, optionIndex) => optionIndex !== index),
    );
    markFieldChanged("pollOptions");
  }

  const clientErrors: Record<string, string | undefined> = {
    title:
      postType === "invite_post" || postType === "activity_post"
        ? !trimmedTitle
          ? "Title is required."
          : undefined
        : undefined,
    content:
      postType === "standard_post"
        ? !trimmedContent && !hasImage
          ? "Add some text or an image before posting."
          : undefined
        : postType === "community_post"
          ? !trimmedContent && !hasImage
            ? "Add a message or an image for your community post."
            : undefined
          : undefined,
    pollQuestion:
      postType === "poll_post" && !trimmedPollQuestion ? "Question is required." : undefined,
    pollOptions:
      postType === "poll_post" && filledPollOptionsCount < 2
        ? "Add at least two poll options."
        : undefined,
    startsAt:
      postType === "invite_post" || postType === "activity_post"
        ? !startsAtValue
          ? "Date and time is required."
          : undefined
        : undefined,
    communityId:
      postType === "community_post" && !selectedCommunityId ? "Choose a community." : undefined,
    maxParticipants:
      postType === "invite_post" && maxParticipantsValue
        ? Number(maxParticipantsValue) < 1 ||
          Number(maxParticipantsValue) > 500 ||
          Number.isNaN(Number(maxParticipantsValue))
          ? "Max participants must be between 1 and 500."
          : undefined
        : undefined,
    image: localImageError ?? undefined,
  };

  function getFieldError(field: string) {
    const serverError = state.errors?.[field]?.[0];
    const shouldShowError = Boolean((touchedFields[field] || hasSubmitted) && (clientErrors[field] || serverError));

    if (!shouldShowError) {
      return null;
    }

    if (changedSinceSubmit[field]) {
      return clientErrors[field] ?? null;
    }

    return clientErrors[field] ?? serverError ?? null;
  }

  const titleError = getFieldError("title");
  const contentError = getFieldError("content");
  const startsAtError = getFieldError("startsAt");
  const communityIdError = getFieldError("communityId");
  const pollQuestionError = getFieldError("pollQuestion");
  const pollOptionsError = getFieldError("pollOptions");
  const maxParticipantsError = getFieldError("maxParticipants");
  const imageError = getFieldError("image");

  const isComposerValid =
    postType === "standard_post"
      ? Boolean(trimmedContent || hasImage) && !imageError
      : postType === "invite_post"
        ? Boolean(trimmedTitle && startsAtValue) && !maxParticipantsError && !imageError
        : postType === "poll_post"
          ? Boolean(trimmedPollQuestion && filledPollOptionsCount >= 2)
          : postType === "community_post"
            ? Boolean(selectedCommunityId && (trimmedContent || hasImage)) && !imageError
            : Boolean(trimmedTitle && startsAtValue) && !imageError;

  const helperMessage =
    postType === "invite_post"
      ? "Make the plan clear at a glance so people know when and where to join."
      : postType === "poll_post"
        ? "Keep it simple and let the room vote quickly."
        : postType === "community_post"
          ? selectedCommunity
            ? `Posting to ${selectedCommunity.name}`
            : "Choose the community where this update belongs."
          : postType === "activity_post"
            ? "Share the plan, timing, and place so others can jump in."
            : "Share a thought, photo, or quick update.";

  const surfaceInputClass =
    "h-12 w-full rounded-xl border px-4 text-sm outline-none transition-all duration-200 placeholder:text-slate-500";
  const richInputClass =
    "w-full rounded-2xl border px-4 py-3 text-[15px] outline-none transition-all duration-200 placeholder:text-slate-500";
  const richTextareaClass =
    "w-full resize-none rounded-2xl border px-4 py-4 text-[15px] leading-7 outline-none transition-all duration-200 placeholder:text-slate-500";

  function focusField(field: string) {
    if (field === "image") {
      fileInputRef.current?.focus();
      return;
    }

    formRef.current?.querySelector<HTMLElement>(`[name="${field}"]`)?.focus();
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    setHasSubmitted(true);
    setChangedSinceSubmit({});

    if (isComposerValid) {
      return;
    }

    event.preventDefault();

    const focusOrder = [
      "title",
      "content",
      "pollQuestion",
      "pollOptions",
      "startsAt",
      "communityId",
      "maxParticipants",
      "image",
    ];
    const firstInvalidField = focusOrder.find((field) => clientErrors[field]);

    if (firstInvalidField) {
      focusField(firstInvalidField);
    }
  }

  return (
    <form
      action={formAction}
      className="group relative overflow-hidden rounded-2xl border border-white/8 bg-[linear-gradient(180deg,rgba(24,32,52,0.94),rgba(11,16,28,0.97))] p-4 shadow-[0_18px_48px_rgba(2,6,23,0.34),0_0_0_1px_rgba(255,255,255,0.02),0_0_28px_rgba(99,102,241,0.05)] transition-all duration-200 focus-within:border-indigo-300/30 focus-within:shadow-[0_22px_54px_rgba(2,6,23,0.4),0_0_0_1px_rgba(129,140,248,0.08),0_0_34px_rgba(99,102,241,0.12)] sm:p-6"
      onSubmit={handleSubmit}
      ref={formRef}
    >
      <input name="postType" type="hidden" value={postType} />
      <input name="inviteVisibility" type="hidden" value={inviteVisibilityValue} />
      <input name="activityId" type="hidden" value={selectedActivityId} />

      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(129,140,248,0.12),transparent_32%),radial-gradient(circle_at_bottom_left,rgba(56,189,248,0.06),transparent_28%)] opacity-80" />

      <div className="relative flex items-start gap-4">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-full border border-white/10 bg-[linear-gradient(135deg,rgba(99,102,241,0.36),rgba(59,130,246,0.18))] text-sm font-semibold text-white shadow-[0_10px_24px_rgba(15,23,42,0.35)]">
          {currentUser.profile?.avatar_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              alt={currentUser.profile.full_name ?? currentUser.username}
              className="h-full w-full object-cover"
              src={currentUser.profile.avatar_url}
            />
          ) : (
            getInitials(currentUser.profile?.full_name ?? currentUser.username)
          )}
        </div>

        <div className="min-w-0 flex-1 space-y-6">
          <div className="flex flex-wrap items-center gap-3" ref={createMenuRef}>
            <div className="inline-flex rounded-2xl border border-white/8 bg-white/[0.04] p-1 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]">
              {primaryPostTypeOptions.map((option) => {
                const Icon = option.icon;
                const active = option.value === postType;

                return (
                  <button
                    className={`relative inline-flex items-center gap-2 rounded-[1rem] px-4 py-2.5 text-sm font-semibold transition-all duration-200 ${
                      active
                        ? "bg-[linear-gradient(135deg,rgba(99,102,241,0.28),rgba(59,130,246,0.2))] text-white shadow-[0_8px_24px_rgba(99,102,241,0.18),0_0_18px_rgba(99,102,241,0.12)]"
                        : "text-slate-300 hover:bg-white/[0.05] hover:text-slate-100 active:scale-[0.99]"
                    }`}
                    key={option.value}
                    onClick={() => switchPostType(option.value)}
                    type="button"
                  >
                    <Icon
                      className={`h-4 w-4 transition-colors duration-200 ${
                        active ? "text-indigo-100" : "text-slate-400"
                      }`}
                    />
                    <span>{option.label}</span>
                  </button>
                );
              })}
            </div>

            <div className="relative">
              <button
                aria-expanded={createMenuOpen}
                className={`inline-flex items-center gap-2 rounded-2xl border px-4 py-2.5 text-sm font-semibold transition-all duration-200 ${
                  createMenuOpen || selectedTypeIsSecondary
                    ? "border-indigo-300/24 bg-[linear-gradient(135deg,rgba(99,102,241,0.18),rgba(59,130,246,0.12))] text-slate-50 shadow-[0_10px_24px_rgba(99,102,241,0.12),0_0_18px_rgba(99,102,241,0.08)]"
                    : "border-white/8 bg-white/[0.03] text-slate-200 hover:border-white/14 hover:bg-white/[0.05]"
                }`}
                onClick={() => setCreateMenuOpen((open) => !open)}
                type="button"
              >
                <Plus className="h-4 w-4" />
                <span>+ Create</span>
                <ChevronDown
                  className={`h-4 w-4 transition-transform duration-200 ${
                    createMenuOpen ? "rotate-180" : ""
                  }`}
                />
              </button>

              <div
                className={`absolute left-0 top-[calc(100%+0.75rem)] z-20 w-64 rounded-2xl border border-white/10 bg-[linear-gradient(180deg,rgba(14,20,36,0.98),rgba(9,14,26,0.98))] p-2 shadow-[0_22px_50px_rgba(2,6,23,0.48),0_0_24px_rgba(99,102,241,0.1)] transition-all duration-200 ${
                  createMenuOpen
                    ? "pointer-events-auto translate-y-0 opacity-100"
                    : "pointer-events-none -translate-y-2 opacity-0"
                }`}
              >
                {secondaryPostTypeOptions.map((option) => {
                  const Icon = option.icon;
                  const active = option.value === postType;

                  return (
                    <button
                      className={`flex w-full items-start gap-3 rounded-xl px-3 py-3 text-left transition-all duration-200 ${
                        active
                          ? "bg-indigo-400/12 text-slate-50"
                          : "text-slate-200 hover:bg-white/[0.05] hover:text-slate-50"
                      }`}
                      key={option.value}
                      onClick={() => switchPostType(option.value)}
                      type="button"
                    >
                      <div
                        className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border transition-all duration-200 ${
                          active
                            ? "border-indigo-300/20 bg-indigo-400/14 text-indigo-100"
                            : "border-white/8 bg-white/[0.03] text-slate-300"
                        }`}
                      >
                        <Icon className="h-4 w-4" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold">{option.label}</p>
                        <p className="mt-1 text-xs text-muted-foreground">{option.description}</p>
                      </div>
                    </button>
                  );
                })}

                <Link
                  className="flex w-full items-start gap-3 rounded-xl px-3 py-3 text-left text-slate-200 transition-all duration-200 hover:bg-white/[0.05] hover:text-slate-50"
                  href="/communities/new"
                  onClick={() => setCreateMenuOpen(false)}
                >
                  <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-white/8 bg-white/[0.03] text-slate-300">
                    <Users className="h-4 w-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold">Create Community</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Open the dedicated flow with cover image and privacy controls
                    </p>
                  </div>
                </Link>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-white/6 bg-[linear-gradient(180deg,rgba(9,14,26,0.92),rgba(13,20,37,0.96))] px-4 py-4 transition-all duration-200 sm:px-6">
            <div className="mb-4 flex items-center gap-3 border-b border-white/6 pb-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-indigo-300/16 bg-indigo-400/10 text-indigo-200">
                <SelectedTypeIcon className="h-4.5 w-4.5" />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-100">{selectedType.label}</p>
                <p className="text-xs text-muted-foreground">{helperMessage}</p>
              </div>
            </div>

            <div className="space-y-6">
              {postType === "community_post" ? (
                <div className="space-y-3">
                  <div className="rounded-2xl border border-white/8 bg-white/[0.03] p-4">
                    <div className="flex flex-wrap items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-emerald-300/18 bg-emerald-400/10 text-emerald-100">
                          <Users className="h-4.5 w-4.5" />
                        </div>
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-300">
                            Posting to
                          </p>
                          <p className="text-sm font-semibold text-slate-100">
                            {selectedCommunity?.name ?? "Choose a community"}
                          </p>
                        </div>
                      </div>
                      <button
                        className="rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2 text-sm font-medium text-slate-200 transition-all duration-200 hover:border-emerald-300/20 hover:bg-emerald-400/10 hover:text-white"
                        onClick={() =>
                          formRef.current?.querySelector<HTMLSelectElement>('[name="communityId"]')?.focus()
                        }
                        type="button"
                      >
                        Change
                      </button>
                    </div>
                  </div>

                  <FieldShell error={communityIdError} icon={Users} label="Community">
                    <select
                      className={`${surfaceInputClass} ${baseInputClass(Boolean(communityIdError))}`}
                      name="communityId"
                      onBlur={() => markFieldTouched("communityId")}
                      onChange={(event) => {
                        markFieldChanged("communityId");
                        setSelectedCommunityId(event.target.value);
                      }}
                      value={selectedCommunityId}
                    >
                      <option value="">Select a community</option>
                      {joinedCommunities.map((community) => (
                        <option key={community.id} value={community.id}>
                          {community.name}
                        </option>
                      ))}
                    </select>
                  </FieldShell>
                </div>
              ) : null}

              {(postType === "invite_post" || postType === "activity_post") && (
                <div className="space-y-4">
                  <FieldShell error={titleError} icon={Sparkles} label="Title">
                    <input
                      className={`${richInputClass} ${baseInputClass(Boolean(titleError))}`}
                      name="title"
                      onBlur={() => markFieldTouched("title")}
                      onChange={(event) => {
                        markFieldChanged("title");
                        setTitleValue(event.target.value);
                      }}
                      placeholder={
                        postType === "invite_post"
                          ? "Movie night, ramen run, rooftop coffee..."
                          : "Sunset walk, weekend plan, pickup game..."
                      }
                      value={titleValue}
                    />
                  </FieldShell>

                  <div className="grid gap-4 md:grid-cols-2">
                    <FieldShell error={startsAtError} icon={CalendarClock} label="Date & Time">
                      <input
                        className={`${surfaceInputClass} ${baseInputClass(Boolean(startsAtError))}`}
                        name="startsAt"
                        onBlur={() => markFieldTouched("startsAt")}
                        onChange={(event) => {
                          markFieldChanged("startsAt");
                          setStartsAtValue(event.target.value);
                        }}
                        type="datetime-local"
                        value={startsAtValue}
                      />
                    </FieldShell>

                    <FieldShell error={undefined} icon={MapPin} label="Location">
                      <input
                        className={`${surfaceInputClass} ${baseInputClass(false)}`}
                        name="locationText"
                        onChange={(event) => {
                          markFieldChanged("locationText");
                          setLocationTextValue(event.target.value);
                        }}
                        placeholder="Optional location"
                        value={locationTextValue}
                      />
                    </FieldShell>
                  </div>

                  <div className={`grid gap-4 ${postType === "invite_post" ? "md:grid-cols-2" : ""}`}>
                    {postType === "invite_post" ? (
                      <FieldShell error={maxParticipantsError} icon={Users} label="Max Participants">
                        <input
                          className={`${surfaceInputClass} ${baseInputClass(Boolean(maxParticipantsError))}`}
                          inputMode="numeric"
                          min={1}
                          name="maxParticipants"
                          onBlur={() => markFieldTouched("maxParticipants")}
                          onChange={(event) => {
                            markFieldChanged("maxParticipants");
                            setMaxParticipantsValue(event.target.value);
                          }}
                          placeholder="Optional limit"
                          type="number"
                          value={maxParticipantsValue}
                        />
                      </FieldShell>
                    ) : null}

                    {linkedActivities.length > 0 && postType === "activity_post" ? (
                      <FieldShell error={undefined} icon={CalendarClock} label="Linked Activity">
                        <select
                          className={`${surfaceInputClass} ${baseInputClass(false)}`}
                          disabled
                          value={selectedActivityId}
                        >
                          <option value="">Create a fresh activity post</option>
                          {linkedActivities.map((activity) => (
                            <option key={activity.id} value={activity.id}>
                              {activity.title}
                            </option>
                          ))}
                        </select>
                      </FieldShell>
                    ) : null}
                  </div>

                  {postType === "invite_post" ? (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                        <Globe2 className="h-3.5 w-3.5" />
                        Visibility
                      </div>
                      <div className="inline-flex flex-wrap rounded-2xl border border-white/8 bg-white/[0.04] p-1">
                        {[
                          { value: "public", label: "Public", icon: Globe2 },
                          { value: "followers_friends", label: "Followers & Friends", icon: Users },
                        ].map((option) => {
                          const Icon = option.icon;
                          const active = inviteVisibilityValue === option.value;

                          return (
                            <button
                              className={`inline-flex items-center gap-2 rounded-[1rem] px-4 py-2.5 text-sm font-semibold transition-all duration-200 ${
                                active
                                  ? "bg-[linear-gradient(135deg,rgba(99,102,241,0.24),rgba(59,130,246,0.18))] text-white shadow-[0_10px_20px_rgba(99,102,241,0.16)]"
                                  : "text-slate-300 hover:bg-white/[0.05] hover:text-slate-100"
                              }`}
                              key={option.value}
                              onClick={() => setInviteVisibilityValue(option.value as "public" | "followers_friends")}
                              type="button"
                            >
                              <Icon className="h-4 w-4" />
                              {option.label}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ) : null}
                </div>
              )}

              {postType === "poll_post" ? (
                <div className="space-y-4">
                  <FieldShell error={pollQuestionError} icon={Vote} label="Question">
                    <input
                      className={`${richInputClass} ${baseInputClass(Boolean(pollQuestionError))}`}
                      name="pollQuestion"
                      onBlur={() => markFieldTouched("pollQuestion")}
                      onChange={(event) => {
                        markFieldChanged("pollQuestion");
                        setPollQuestionValue(event.target.value);
                      }}
                      placeholder="What should the group do next?"
                      value={pollQuestionValue}
                    />
                  </FieldShell>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                          Options
                        </p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          Add between 2 and 6 options.
                        </p>
                      </div>
                      <button
                        className="inline-flex items-center gap-2 rounded-xl border border-indigo-300/20 bg-indigo-400/10 px-4 py-2.5 text-sm font-semibold text-indigo-100 transition-all duration-200 hover:border-indigo-300/28 hover:bg-indigo-400/14"
                        disabled={pollOptions.length >= 6}
                        onClick={addPollOption}
                        type="button"
                      >
                        <Plus className="h-4 w-4" />
                        Add option
                      </button>
                    </div>

                    <div className="space-y-3">
                      {pollOptions.map((option, index) => (
                        <div className="flex flex-col gap-3 sm:flex-row" key={`poll-option-${index}`}>
                          <div
                            className={`flex-1 rounded-2xl border px-4 py-3 transition-all duration-200 ${surfaceClass(Boolean(pollOptionsError))}`}
                          >
                            <input
                              className="w-full bg-transparent text-[15px] text-slate-100 outline-none placeholder:text-slate-500"
                              name="pollOptions"
                              onBlur={() => markFieldTouched("pollOptions")}
                              onChange={(event) => updatePollOption(index, event.target.value)}
                              placeholder={`Option ${index + 1}`}
                              value={option}
                            />
                          </div>
                          <button
                            className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/[0.04] px-4 text-sm font-medium text-slate-200 transition-all duration-200 hover:border-rose-300/24 hover:bg-rose-400/10 hover:text-rose-100 disabled:cursor-not-allowed disabled:opacity-50"
                            disabled={pollOptions.length <= 2}
                            onClick={() => removePollOption(index)}
                            type="button"
                          >
                            <Trash2 className="h-4 w-4" />
                            Remove
                          </button>
                        </div>
                      ))}
                    </div>
                    <FieldError error={pollOptionsError} />
                  </div>

                  <FieldShell error={undefined} icon={CalendarClock} label="Poll Expiration">
                    <input
                      className={`${surfaceInputClass} ${baseInputClass(false)}`}
                      name="pollEndsAt"
                      onChange={(event) => setPollEndsAtValue(event.target.value)}
                      type="datetime-local"
                      value={pollEndsAtValue}
                    />
                  </FieldShell>
                </div>
              ) : null}

              <FieldShell error={contentError} icon={SquarePen} label="Message">
                <textarea
                  className={`${richTextareaClass} ${baseInputClass(Boolean(contentError))} min-h-[140px] ${postType === "community_post" ? "px-5 py-5" : ""}`}
                  name="content"
                  onBlur={() => markFieldTouched("content")}
                  onChange={(event) => {
                    markFieldChanged("content");
                    setContentValue(event.target.value);
                  }}
                  placeholder={
                    postType === "invite_post"
                      ? "Tell people what the plan is, why it sounds fun, and who should join."
                      : postType === "activity_post"
                        ? "Share the vibe, what to expect, and any useful details."
                        : postType === "community_post"
                          ? selectedCommunity
                            ? `Share something with ${selectedCommunity.name}...`
                            : "Share something with your community..."
                          : postType === "poll_post"
                            ? "Optional context for your poll"
                            : "What's on your mind?"
                  }
                  value={contentValue}
                />
              </FieldShell>

              {supportsImage ? (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                    <ImagePlus className="h-3.5 w-3.5" />
                    Image
                  </div>
                  <UploadDropzone
                    error={imageError}
                    fileName={selectedFileName}
                    inputId="composer-image-upload"
                    inputRef={fileInputRef}
                    isPreparing={isPreparingImage}
                    onRemove={() => {
                      markFieldTouched("image");
                      markFieldChanged("image");
                      resetImageState();
                    }}
                    onSelectFile={handleSelectedFile}
                    previewUrl={previewUrl}
                  />
                </div>
              ) : null}
            </div>
          </div>

          {state.message && !hasServerFieldErrors ? (
            <p className="text-sm text-rose-300">{state.message}</p>
          ) : null}

          <div className="flex flex-col gap-4 border-t border-white/8 pt-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-medium text-slate-200">Ready when you are.</p>
              <p className="mt-1 text-xs text-muted-foreground">
                {postType === "poll_post"
                  ? `${filledPollOptionsCount}/6 options filled`
                  : supportsImage && previewUrl
                    ? "Image will be included when you publish."
                    : "Add the details that make people want to join in."}
              </p>
            </div>
            <SubmitButton disabled={isPreparingImage} postType={postType} />
          </div>
        </div>
      </div>
    </form>
  );
}
