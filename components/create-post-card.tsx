"use client";

import Link from "next/link";
import {
  AlertTriangle,
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
import { type SyncUpPostType } from "@/lib/post-types";
import { FormState } from "@/lib/validation";
import { getInitials } from "@/lib/utils";

type CommunityOption = {
  id: string;
  name: string;
  slug?: string;
};

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
  };
  forcedCommunity?: CommunityOption | null;
};

const initialState: FormState = {
  message: "",
  errors: {},
  success: false,
};

const postTypeOptions: {
  value: Exclude<SyncUpPostType, "community_post"> | "alert_post";
  label: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
}[] = [
  { value: "standard_post", label: "Post", description: "Quick updates, photos, and conversation starters", icon: SquarePen },
  { value: "alert_post", label: "Alert", description: "Important heads-up for your people or community", icon: AlertTriangle },
  { value: "invite_post", label: "Invite", description: "Bring people into a plan", icon: Sparkles },
  { value: "poll_post", label: "Poll", description: "Collect fast opinions", icon: Vote },
  { value: "activity_post", label: "Activity", description: "Schedule an upcoming plan", icon: CalendarClock },
];

function surfaceClass(hasError: boolean) {
  return hasError
    ? "border-rose-400/45 bg-rose-500/10 shadow-[0_0_0_1px_rgba(248,113,113,0.18),0_0_24px_rgba(248,113,113,0.08)]"
    : "border-white/8 bg-white/[0.03] focus-within:border-indigo-300/24 focus-within:bg-white/[0.05] focus-within:shadow-[0_0_0_1px_rgba(129,140,248,0.12),0_0_24px_rgba(99,102,241,0.08)]";
}

function baseInputClass(hasError: boolean) {
  return `w-full outline-none transition-all duration-200 placeholder:text-slate-500 ${hasError ? "text-rose-50" : "text-slate-100"}`;
}

function FieldError({ error }: { error?: string | null }) {
  if (!error) {
    return null;
  }

  return <p className="text-sm text-rose-300">{error}</p>;
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
      <label className={`flex flex-col gap-3 rounded-2xl border px-4 py-4 transition-all duration-200 ${surfaceClass(Boolean(error))}`}>
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

function SubmitButton({
  postType,
  disabled,
}: {
  postType: string;
  disabled?: boolean;
}) {
  const { pending } = useFormStatus();
  const label =
    postType === "alert_post"
      ? "Publish Alert"
      : postType === "invite_post"
        ? "Publish Invite"
        : postType === "poll_post"
          ? "Publish Poll"
          : postType === "activity_post"
            ? "Publish Activity"
            : "Post";

  return (
    <button
      className="rounded-2xl bg-[linear-gradient(135deg,rgba(99,102,241,1),rgba(59,130,246,0.92))] px-6 py-3 text-sm font-semibold text-white shadow-[0_16px_36px_rgba(99,102,241,0.32),0_0_18px_rgba(99,102,241,0.16)] transition-all duration-200 hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-70"
      disabled={pending || disabled}
      type="submit"
    >
      {pending ? "Posting..." : label}
    </button>
  );
}

function UploadDropzone({
  inputRef,
  previewUrl,
  fileName,
  error,
  isPreparing,
  onSelectFile,
  onRemove,
}: {
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
      <input accept="image/*" className="sr-only" name="image" onChange={(event) => void onSelectFile(event.target.files?.[0] ?? null)} ref={inputRef} type="file" />
      <button
        className={`relative block w-full cursor-pointer overflow-hidden rounded-2xl border border-dashed px-4 py-4 text-left transition-all duration-200 sm:px-6 ${
          error ? "border-rose-400/40 bg-rose-500/10" : isDragOver ? "border-indigo-300/28 bg-indigo-400/10" : "border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.03),rgba(255,255,255,0.015))] hover:border-indigo-300/20 hover:bg-indigo-400/5"
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
            <p className="text-sm font-semibold text-slate-100">{previewUrl ? "Image ready" : isPreparing ? "Processing image..." : "Add image"}</p>
            <p className="text-xs text-muted-foreground">{previewUrl ? fileName ?? "Selected image" : isDragOver ? "Drop your image here" : "Click anywhere or drag and drop an image"}</p>
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
          <button className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2.5 text-sm font-medium text-slate-200 transition-all duration-200 hover:border-indigo-300/20 hover:bg-indigo-400/10 hover:text-white" onClick={() => inputRef.current?.click()} type="button">
            <Upload className="h-4 w-4" />
            Change image
          </button>
          <button className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2.5 text-sm font-medium text-slate-200 transition-all duration-200 hover:border-rose-300/24 hover:bg-rose-400/10 hover:text-rose-100" onClick={onRemove} type="button">
            <X className="h-4 w-4" />
            Remove image
          </button>
        </div>
      ) : null}
      <FieldError error={error} />
    </div>
  );
}

export function CreatePostCard({ action, currentUser, forcedCommunity = null }: Props) {
  const [state, formAction] = useActionState(action, initialState);
  const [postType, setPostType] = useState<"standard_post" | "alert_post" | "invite_post" | "poll_post" | "activity_post">("standard_post");
  const [titleValue, setTitleValue] = useState("");
  const [contentValue, setContentValue] = useState("");
  const [startsAtValue, setStartsAtValue] = useState("");
  const [locationTextValue, setLocationTextValue] = useState("");
  const [maxParticipantsValue, setMaxParticipantsValue] = useState("");
  const [pollQuestionValue, setPollQuestionValue] = useState("");
  const [pollEndsAtValue, setPollEndsAtValue] = useState("");
  const [pollOptions, setPollOptions] = useState(["", ""]);
  const [selectedCommunityId, setSelectedCommunityId] = useState(forcedCommunity?.id ?? "");
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

  const selectedCommunity = forcedCommunity ?? joinedCommunities.find((community) => community.id === selectedCommunityId) ?? null;
  const selectedType = postTypeOptions.find((option) => option.value === postType) ?? postTypeOptions[0];
  const SelectedTypeIcon = selectedType.icon;
  const trimmedContent = contentValue.trim();
  const trimmedTitle = titleValue.trim();
  const trimmedPollQuestion = pollQuestionValue.trim();
  const filledPollOptionsCount = pollOptions.filter((option) => option.trim().length > 0).length;
  const hasImage = Boolean(previewUrl);

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

    setTitleValue("");
    setContentValue("");
    setStartsAtValue("");
    setLocationTextValue("");
    setMaxParticipantsValue("");
    setPollQuestionValue("");
    setPollEndsAtValue("");
    setPollOptions(["", ""]);
    setInviteVisibilityValue("public");
    setTouchedFields({});
    setHasSubmitted(false);
    setChangedSinceSubmit({});
    setPreviewUrl(null);
    setSelectedFileName(null);
    setLocalImageError(null);

    if (!forcedCommunity) {
      setSelectedCommunityId("");
    }

    formRef.current?.reset();
  }, [forcedCommunity, state.success]);

  function markFieldTouched(field: string) {
    setTouchedFields((current) => (current[field] ? current : { ...current, [field]: true }));
  }

  function markFieldChanged(field: string) {
    if (hasSubmitted) {
      setChangedSinceSubmit((current) => (current[field] ? current : { ...current, [field]: true }));
    }
  }

  async function handleSelectedFile(file: File | null) {
    markFieldTouched("image");
    markFieldChanged("image");
    setIsPreparingImage(true);

    if (!file) {
      setPreviewUrl(null);
      setSelectedFileName(null);
      setLocalImageError(null);
      setIsPreparingImage(false);
      return;
    }

    const error = getImageUploadError(file);

    if (error) {
      setLocalImageError(error);
      setIsPreparingImage(false);
      return;
    }

    setPreviewUrl(URL.createObjectURL(file));
    setSelectedFileName(file.name);
    setLocalImageError(null);
    setIsPreparingImage(false);
  }

  function switchPostType(nextType: typeof postType) {
    setPostType(nextType);
    setCreateMenuOpen(false);
    setTitleValue("");
    setContentValue("");
    setStartsAtValue("");
    setLocationTextValue("");
    setMaxParticipantsValue("");
    setPollQuestionValue("");
    setPollEndsAtValue("");
    setPollOptions(["", ""]);
    setTouchedFields({});
    setHasSubmitted(false);
    setChangedSinceSubmit({});
    setLocalImageError(null);
  }

  function updatePollOption(index: number, value: string) {
    markFieldChanged("pollOptions");
    setPollOptions((current) => current.map((option, optionIndex) => (optionIndex === index ? value : option)));
  }

  function addPollOption() {
    setPollOptions((current) => (current.length >= 6 ? current : [...current, ""]));
  }

  function removePollOption(index: number) {
    setPollOptions((current) => (current.length <= 2 ? current : current.filter((_, optionIndex) => optionIndex !== index)));
  }

  const clientErrors: Record<string, string | undefined> = {
    title:
      postType === "invite_post" || postType === "activity_post" || postType === "alert_post"
        ? !trimmedTitle
          ? "Title is required."
          : undefined
        : undefined,
    content:
      postType === "standard_post"
        ? !trimmedContent && !hasImage
          ? "Add some text or an image before posting."
          : undefined
        : postType === "alert_post"
          ? !trimmedContent && !hasImage
            ? "Add the alert details before publishing."
            : undefined
          : undefined,
    startsAt:
      postType === "invite_post" || postType === "activity_post"
        ? !startsAtValue
          ? "Date and time is required."
          : undefined
        : undefined,
    pollQuestion: postType === "poll_post" && !trimmedPollQuestion ? "Question is required." : undefined,
    pollOptions: postType === "poll_post" && filledPollOptionsCount < 2 ? "Add at least two poll options." : undefined,
    communityId: !forcedCommunity && selectedCommunityId && !selectedCommunity ? "Choose a valid community." : undefined,
    maxParticipants:
      postType === "invite_post" && maxParticipantsValue
        ? Number(maxParticipantsValue) < 1 || Number(maxParticipantsValue) > 500 || Number.isNaN(Number(maxParticipantsValue))
          ? "Max participants must be between 1 and 500."
          : undefined
        : undefined,
    image: localImageError ?? undefined,
  };

  function getFieldError(field: string) {
    const serverError = state.errors?.[field]?.[0];
    const shouldShow = Boolean((touchedFields[field] || hasSubmitted) && (clientErrors[field] || serverError));

    if (!shouldShow) {
      return null;
    }

    if (changedSinceSubmit[field]) {
      return clientErrors[field] ?? null;
    }

    return clientErrors[field] ?? serverError ?? null;
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    setHasSubmitted(true);
    setChangedSinceSubmit({});

    const focusOrder = ["title", "content", "pollQuestion", "pollOptions", "startsAt", "communityId", "maxParticipants", "image"];
    const firstInvalid = focusOrder.find((field) => clientErrors[field]);

    if (firstInvalid) {
      event.preventDefault();
      if (firstInvalid === "image") {
        fileInputRef.current?.focus();
      } else {
        formRef.current?.querySelector<HTMLElement>(`[name="${firstInvalid}"]`)?.focus();
      }
    }
  }

  const helperMessage = forcedCommunity
    ? `Publishing into ${forcedCommunity.name}`
    : selectedCommunity
      ? `Publishing into ${selectedCommunity.name}`
      : "Publish to your main feed or choose a community";

  return (
    <form
      action={formAction}
      className="surface-card overflow-hidden rounded-3xl border border-white/10 p-6 shadow-[0_24px_70px_rgba(2,6,23,0.3)] sm:p-8"
      onSubmit={handleSubmit}
      ref={formRef}
    >
      <input name="postType" type="hidden" value={postType} />
      <input name="inviteVisibility" type="hidden" value={inviteVisibilityValue} />
      <input name="communityId" type="hidden" value={forcedCommunity?.id ?? selectedCommunityId} />

      <div className="flex items-start gap-4">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-full border border-white/10 bg-[linear-gradient(135deg,rgba(99,102,241,0.36),rgba(59,130,246,0.18))] text-sm font-semibold text-white shadow-[0_10px_24px_rgba(15,23,42,0.35)]">
          {currentUser.profile?.avatar_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img alt={currentUser.profile.full_name} className="h-full w-full object-cover" src={currentUser.profile.avatar_url} />
          ) : (
            getInitials(currentUser.profile?.full_name ?? currentUser.username)
          )}
        </div>

        <div className="min-w-0 flex-1 space-y-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-indigo-300">
                {forcedCommunity ? "Community Composer" : "Create"}
              </p>
              <h2 className="mt-2 text-2xl font-semibold tracking-tight text-white">
                {forcedCommunity ? `Post in ${forcedCommunity.name}` : "Share something on SyncUp"}
              </h2>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">{helperMessage}</p>
            </div>

            <div className="relative" ref={createMenuRef}>
              <button
                className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm font-semibold text-white transition-all duration-200 hover:border-white/20 hover:bg-white/[0.06]"
                onClick={() => setCreateMenuOpen((current) => !current)}
                type="button"
              >
                <SelectedTypeIcon className="h-4 w-4" />
                {selectedType.label}
                <ChevronDown className={`h-4 w-4 transition-transform duration-200 ${createMenuOpen ? "rotate-180" : ""}`} />
              </button>

              <div
                className={`absolute right-0 top-[calc(100%+0.75rem)] z-20 w-[320px] overflow-hidden rounded-2xl border border-white/10 bg-[linear-gradient(180deg,rgba(14,20,36,0.98),rgba(9,14,26,0.98))] p-2 shadow-[0_22px_50px_rgba(2,6,23,0.48)] transition-all duration-200 ${
                  createMenuOpen ? "pointer-events-auto translate-y-0 opacity-100" : "pointer-events-none -translate-y-2 opacity-0"
                }`}
              >
                <div className="space-y-1">
                  {postTypeOptions.map((option) => {
                    const Icon = option.icon;
                    const active = option.value === postType;

                    return (
                      <button
                        className={`flex w-full items-start gap-3 rounded-xl px-3 py-3 text-left transition-all duration-200 ${
                          active ? "bg-indigo-400/12 text-slate-50" : "text-slate-200 hover:bg-white/[0.05] hover:text-slate-50"
                        }`}
                        key={option.value}
                        onClick={() => switchPostType(option.value)}
                        type="button"
                      >
                        <div className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border ${active ? "border-indigo-300/20 bg-indigo-400/14 text-indigo-100" : "border-white/8 bg-white/[0.03] text-slate-300"}`}>
                          <Icon className="h-4 w-4" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold">{option.label}</p>
                          <p className="mt-1 text-xs text-muted-foreground">{option.description}</p>
                        </div>
                      </button>
                    );
                  })}
                  <Link className="flex w-full items-start gap-3 rounded-xl px-3 py-3 text-left text-slate-200 transition-all duration-200 hover:bg-white/[0.05] hover:text-slate-50" href="/communities/new">
                    <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-white/8 bg-white/[0.03] text-slate-300">
                      <Users className="h-4 w-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold">Create Community</p>
                      <p className="mt-1 text-xs text-muted-foreground">Open the dedicated community setup flow</p>
                    </div>
                  </Link>
                </div>
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
                <p className="text-xs text-muted-foreground">{selectedType.description}</p>
              </div>
            </div>

            <div className="space-y-6">
              {forcedCommunity ? (
                <div className="rounded-2xl border border-emerald-300/18 bg-emerald-400/10 p-4 text-sm text-emerald-100">
                  Posting directly into <span className="font-semibold">{forcedCommunity.name}</span>.
                </div>
              ) : (
                <FieldShell error={getFieldError("communityId")} icon={Users} label="Destination">
                  <select
                    className={`${baseInputClass(Boolean(getFieldError("communityId")))} rounded-xl border border-white/8 bg-white/[0.03] px-4 py-3 text-sm`}
                    name="communityDestination"
                    onChange={(event) => {
                      markFieldChanged("communityId");
                      setSelectedCommunityId(event.target.value);
                    }}
                    value={selectedCommunityId}
                  >
                    <option value="">Main feed</option>
                    {joinedCommunities.map((community) => (
                      <option key={community.id} value={community.id}>
                        {community.name}
                      </option>
                    ))}
                  </select>
                </FieldShell>
              )}

              {(postType === "invite_post" || postType === "activity_post" || postType === "alert_post") ? (
                <FieldShell error={getFieldError("title")} icon={postType === "alert_post" ? AlertTriangle : Sparkles} label="Title">
                  <input
                    className={`${baseInputClass(Boolean(getFieldError("title")))} rounded-xl border border-white/8 bg-white/[0.03] px-4 py-3 text-sm`}
                    name="title"
                    onBlur={() => markFieldTouched("title")}
                    onChange={(event) => {
                      markFieldChanged("title");
                      setTitleValue(event.target.value);
                    }}
                    placeholder={
                      postType === "alert_post"
                        ? "Important update for the group"
                        : postType === "invite_post"
                          ? "Movie night, coffee run, board game table..."
                          : "Sunset walk, skill-share, weekend ride..."
                    }
                    value={titleValue}
                  />
                </FieldShell>
              ) : null}

              {(postType === "invite_post" || postType === "activity_post") ? (
                <div className="grid gap-4 md:grid-cols-2">
                  <FieldShell error={getFieldError("startsAt")} icon={CalendarClock} label="Date & Time">
                    <input
                      className={`${baseInputClass(Boolean(getFieldError("startsAt")))} rounded-xl border border-white/8 bg-white/[0.03] px-4 py-3 text-sm`}
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
                      className={`${baseInputClass(false)} rounded-xl border border-white/8 bg-white/[0.03] px-4 py-3 text-sm`}
                      name="locationText"
                      onChange={(event) => setLocationTextValue(event.target.value)}
                      placeholder="Optional location"
                      value={locationTextValue}
                    />
                  </FieldShell>
                </div>
              ) : null}

              {postType === "invite_post" ? (
                <div className="grid gap-4 md:grid-cols-2">
                  <FieldShell error={getFieldError("maxParticipants")} icon={Users} label="Max Participants">
                    <input
                      className={`${baseInputClass(Boolean(getFieldError("maxParticipants")))} rounded-xl border border-white/8 bg-white/[0.03] px-4 py-3 text-sm`}
                      inputMode="numeric"
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
                              active ? "bg-[linear-gradient(135deg,rgba(99,102,241,0.24),rgba(59,130,246,0.18))] text-white" : "text-slate-300 hover:bg-white/[0.05] hover:text-slate-100"
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
                </div>
              ) : null}

              {postType === "poll_post" ? (
                <div className="space-y-4">
                  <FieldShell error={getFieldError("pollQuestion")} icon={Vote} label="Question">
                    <input
                      className={`${baseInputClass(Boolean(getFieldError("pollQuestion")))} rounded-xl border border-white/8 bg-white/[0.03] px-4 py-3 text-sm`}
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
                        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Options</p>
                        <p className="mt-1 text-xs text-muted-foreground">Add between 2 and 6 options.</p>
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
                          <div className={`flex-1 rounded-2xl border px-4 py-3 transition-all duration-200 ${surfaceClass(Boolean(getFieldError("pollOptions")))}`}>
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
                    <FieldError error={getFieldError("pollOptions")} />
                  </div>

                  <FieldShell error={undefined} icon={CalendarClock} label="Poll Expiration">
                    <input
                      className={`${baseInputClass(false)} rounded-xl border border-white/8 bg-white/[0.03] px-4 py-3 text-sm`}
                      name="pollEndsAt"
                      onChange={(event) => setPollEndsAtValue(event.target.value)}
                      type="datetime-local"
                      value={pollEndsAtValue}
                    />
                  </FieldShell>
                </div>
              ) : null}

              <FieldShell error={getFieldError("content")} icon={postType === "alert_post" ? AlertTriangle : SquarePen} label={postType === "alert_post" ? "Details" : "Message"}>
                <textarea
                  className={`${baseInputClass(Boolean(getFieldError("content")))} min-h-[140px] resize-none rounded-xl border border-white/8 bg-white/[0.03] px-4 py-4 text-sm leading-7`}
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
                        : postType === "alert_post"
                          ? "What do members need to know right now?"
                          : postType === "poll_post"
                            ? "Optional context for your poll"
                            : selectedCommunity
                              ? `Share something with ${selectedCommunity.name}...`
                              : "What's on your mind?"
                  }
                  value={contentValue}
                />
              </FieldShell>

              <div className="space-y-3">
                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                  <ImagePlus className="h-3.5 w-3.5" />
                  Image
                </div>
                <UploadDropzone
                  error={getFieldError("image")}
                  fileName={selectedFileName}
                  inputRef={fileInputRef}
                  isPreparing={isPreparingImage}
                  onRemove={() => {
                    markFieldTouched("image");
                    markFieldChanged("image");
                    setPreviewUrl(null);
                    setSelectedFileName(null);
                    setLocalImageError(null);
                  }}
                  onSelectFile={handleSelectedFile}
                  previewUrl={previewUrl}
                />
              </div>
            </div>
          </div>

          {state.message && !state.success ? <p className="text-sm text-rose-300">{state.message}</p> : null}

          <div className="flex flex-col gap-4 border-t border-white/8 pt-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-medium text-slate-200">Ready when you are.</p>
              <p className="mt-1 text-xs text-muted-foreground">
                {selectedCommunity ? `This will appear in ${selectedCommunity.name}.` : "Publish to your feed or scope it to a community."}
              </p>
            </div>
            <SubmitButton disabled={isPreparingImage} postType={postType} />
          </div>
        </div>
      </div>
    </form>
  );
}
