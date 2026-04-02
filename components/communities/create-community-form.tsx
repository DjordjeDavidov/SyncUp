"use client";

import Link from "next/link";
import { type FormEvent, useActionState, useEffect, useRef, useState } from "react";
import { useFormStatus } from "react-dom";
import {
  Check,
  ChevronDown,
  ImagePlus,
  Loader2,
  Lock,
  Sparkles,
  Upload,
  Users,
  X,
} from "lucide-react";
import {
  communityCategoryOptions,
  type CommunityCategoryValue,
} from "@/lib/community-categories";
import { getImageUploadError, MAX_COMMUNITY_COVER_SIZE_BYTES } from "@/lib/image-upload";
import { FormState } from "@/lib/validation";

type Props = {
  action: (state: FormState, formData: FormData) => Promise<FormState>;
};

const initialState: FormState = {
  message: "",
  errors: {},
  success: false,
};

function surfaceClass(hasError: boolean) {
  return hasError
    ? "border-rose-400/45 bg-rose-500/10 shadow-[0_0_0_1px_rgba(248,113,113,0.18),0_0_24px_rgba(248,113,113,0.08)]"
    : "border-white/8 bg-white/[0.03] focus-within:border-indigo-300/24 focus-within:bg-white/[0.05] focus-within:shadow-[0_0_0_1px_rgba(129,140,248,0.12),0_0_24px_rgba(99,102,241,0.08)]";
}

function baseInputClass(hasError: boolean) {
  return `w-full bg-transparent outline-none transition-all duration-200 placeholder:text-slate-500 ${
    hasError ? "text-rose-50" : "text-slate-100"
  }`;
}

function FieldError({ error }: { error?: string | null }) {
  if (!error) {
    return null;
  }

  return <p className="text-sm text-rose-300">{error}</p>;
}

function FieldShell({
  label,
  icon: Icon,
  error,
  children,
}: {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
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

function CategoryDropdown({
  value,
  onChange,
  onBlur,
  error,
}: {
  value: CommunityCategoryValue | "";
  onChange: (value: CommunityCategoryValue) => void;
  onBlur: () => void;
  error?: string | null;
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const optionRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const selectedOption =
    communityCategoryOptions.find((option) => option.value === value) ?? null;
  const standardOptions = communityCategoryOptions.filter((option) => option.value !== "custom");
  const customOption = communityCategoryOptions.find((option) => option.value === "custom");

  useEffect(() => {
    function handleOutsideClick(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    if (open) {
      document.addEventListener("mousedown", handleOutsideClick);
    }

    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
    };
  }, [open]);

  useEffect(() => {
    if (!open) {
      return;
    }

    const selectedIndex = communityCategoryOptions.findIndex((option) => option.value === value);
    const nextIndex = selectedIndex >= 0 ? selectedIndex : 0;
    optionRefs.current[nextIndex]?.focus();
  }, [open, value]);

  function selectOption(nextValue: CommunityCategoryValue) {
    onChange(nextValue);
    setOpen(false);
    requestAnimationFrame(() => triggerRef.current?.focus());
  }

  function moveFocus(currentIndex: number, direction: 1 | -1) {
    const total = communityCategoryOptions.length;
    const nextIndex = (currentIndex + direction + total) % total;
    optionRefs.current[nextIndex]?.focus();
  }

  return (
    <div className="relative" ref={rootRef}>
      <input name="category" type="hidden" value={value} />
      <button
        aria-controls="community-category-listbox"
        aria-expanded={open}
        className={`flex w-full items-center justify-between gap-3 rounded-2xl border px-4 py-3 text-left transition-all duration-200 ${
          error
            ? "border-rose-400/45 bg-rose-500/10 text-rose-50 shadow-[0_0_0_1px_rgba(248,113,113,0.18),0_0_24px_rgba(248,113,113,0.08)]"
            : "border-white/8 bg-[linear-gradient(180deg,rgba(255,255,255,0.04),rgba(255,255,255,0.02))] text-slate-100 hover:border-indigo-300/20 hover:bg-indigo-400/5 focus:border-indigo-300/24 focus:bg-white/[0.05] focus:shadow-[0_0_0_1px_rgba(129,140,248,0.12),0_0_24px_rgba(99,102,241,0.08)]"
        }`}
        onBlur={(event) => {
          if (!rootRef.current?.contains(event.relatedTarget as Node | null)) {
            onBlur();
          }
        }}
        onClick={() => setOpen((current) => !current)}
        onKeyDown={(event) => {
          if (event.key === "ArrowDown" || event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            setOpen(true);
          }

          if (event.key === "Escape") {
            setOpen(false);
          }
        }}
        ref={triggerRef}
        type="button"
      >
        <span className={selectedOption ? "text-slate-100" : "text-slate-500"}>
          {selectedOption?.label ?? "Select a category"}
        </span>
        <ChevronDown
          className={`h-4 w-4 text-slate-400 transition-transform duration-200 ${
            open ? "rotate-180 text-indigo-200" : ""
          }`}
        />
      </button>

      <div
        className={`absolute left-0 top-[calc(100%+0.75rem)] z-20 w-full overflow-hidden rounded-2xl border border-white/10 bg-[linear-gradient(180deg,rgba(14,20,36,0.98),rgba(9,14,26,0.98))] p-2 shadow-[0_22px_50px_rgba(2,6,23,0.48),0_0_24px_rgba(99,102,241,0.1)] transition-all duration-200 ${
          open
            ? "pointer-events-auto translate-y-0 opacity-100"
            : "pointer-events-none -translate-y-2 opacity-0"
        }`}
      >
        <div className="mb-2 rounded-xl border border-white/8 bg-white/[0.03] px-3 py-2 text-xs uppercase tracking-[0.18em] text-slate-500">
          Pick one primary category
        </div>
        <div className="max-h-72 space-y-1 overflow-y-auto pr-1" id="community-category-listbox" role="listbox">
          {standardOptions.map((option, index) => {
            const active = option.value === value;

            return (
              <button
                aria-selected={active}
                className={`flex w-full items-center justify-between gap-3 rounded-xl px-3 py-3 text-left text-sm transition-all duration-200 ${
                  active
                    ? "bg-[linear-gradient(135deg,rgba(99,102,241,0.22),rgba(59,130,246,0.14))] text-white shadow-[0_10px_24px_rgba(99,102,241,0.12)]"
                    : "text-slate-200 hover:bg-white/[0.05] hover:text-slate-50"
                }`}
                key={option.value}
                onClick={() => selectOption(option.value)}
                onKeyDown={(event) => {
                  if (event.key === "ArrowDown") {
                    event.preventDefault();
                    moveFocus(index, 1);
                  }

                  if (event.key === "ArrowUp") {
                    event.preventDefault();
                    moveFocus(index, -1);
                  }

                  if (event.key === "Escape") {
                    event.preventDefault();
                    setOpen(false);
                    triggerRef.current?.focus();
                  }
                }}
                ref={(element) => {
                  optionRefs.current[index] = element;
                }}
                role="option"
                type="button"
              >
                <span>{option.label}</span>
                {active ? <Check className="h-4 w-4 text-indigo-100" /> : null}
              </button>
            );
          })}
        </div>
        {customOption ? (
          <div className="mt-2 border-t border-white/8 pt-2">
            <button
              aria-selected={customOption.value === value}
              className={`flex w-full items-center justify-between gap-3 rounded-xl px-3 py-3 text-left text-sm transition-all duration-200 ${
                customOption.value === value
                  ? "bg-[linear-gradient(135deg,rgba(99,102,241,0.22),rgba(59,130,246,0.14))] text-white shadow-[0_10px_24px_rgba(99,102,241,0.12)]"
                  : "text-slate-200 hover:bg-white/[0.05] hover:text-slate-50"
              }`}
              onClick={() => selectOption(customOption.value)}
              type="button"
            >
              <div>
                <p>{customOption.label}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Add your own category if none of the presets fit
                </p>
              </div>
              {customOption.value === value ? <Check className="h-4 w-4 text-indigo-100" /> : null}
            </button>
          </div>
        ) : null}
      </div>
    </div>
  );
}

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button
      className="rounded-2xl bg-[linear-gradient(135deg,#6366f1,#8b5cf6)] px-5 py-3 text-sm font-semibold text-white shadow-[0_14px_34px_rgba(99,102,241,0.28)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_20px_44px_rgba(99,102,241,0.34)] disabled:cursor-not-allowed disabled:opacity-70"
      disabled={pending}
      type="submit"
    >
      {pending ? "Creating..." : "Create Community"}
    </button>
  );
}

function CoverUploader({
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
      <input
        accept="image/*"
        className="sr-only"
        name="cover"
        onChange={(event) => void onSelectFile(event.target.files?.[0] ?? null)}
        ref={inputRef}
        type="file"
      />

      <button
        className={`relative block w-full cursor-pointer overflow-hidden rounded-2xl border border-dashed px-4 py-5 text-left transition-all duration-200 ${
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
              {previewUrl ? "Cover image ready" : isPreparing ? "Processing cover..." : "Add cover image"}
            </p>
            <p className="text-xs text-muted-foreground">
              {previewUrl
                ? fileName ?? "Selected cover image"
                : isDragOver
                  ? "Drop your cover image here"
                  : "Click anywhere or drag and drop an image"}
            </p>
          </div>
        </div>

        {previewUrl ? (
          <div className="mt-4 overflow-hidden rounded-2xl border border-white/8 bg-slate-950/50">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img alt="Community cover preview" className="max-h-72 w-full object-cover" src={previewUrl} />
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

      <FieldError error={error} />
    </div>
  );
}

export function CreateCommunityForm({ action }: Props) {
  const [state, formAction] = useActionState(action, initialState);
  const [nameValue, setNameValue] = useState("");
  const [descriptionValue, setDescriptionValue] = useState("");
  const [categoryValue, setCategoryValue] = useState<CommunityCategoryValue | "">("");
  const [customCategoryValue, setCustomCategoryValue] = useState("");
  const [visibilityValue, setVisibilityValue] = useState<"PUBLIC" | "PRIVATE">("PUBLIC");
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [selectedFileName, setSelectedFileName] = useState<string | null>(null);
  const [localCoverError, setLocalCoverError] = useState<string | null>(null);
  const [isPreparingCover, setIsPreparingCover] = useState(false);
  const [touchedFields, setTouchedFields] = useState<Record<string, boolean>>({});
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [changedSinceSubmit, setChangedSinceSubmit] = useState<Record<string, boolean>>({});
  const formRef = useRef<HTMLFormElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  useEffect(() => {
    if (!state.success) {
      return;
    }

    setNameValue("");
    setDescriptionValue("");
    setCategoryValue("");
    setCustomCategoryValue("");
    setVisibilityValue("PUBLIC");
    setTouchedFields({});
    setHasSubmitted(false);
    setChangedSinceSubmit({});
    resetCoverState();
    formRef.current?.reset();
  }, [state.success]);

  useEffect(() => {
    if (!state.errors || Object.keys(state.errors).length === 0) {
      return;
    }

    setHasSubmitted(true);
    const focusOrder = ["name", "description", "category", "customCategory", "cover"];
    const firstField = focusOrder.find((field) => state.errors?.[field]?.[0]);

    if (!firstField) {
      return;
    }

    if (firstField === "cover") {
      coverInputRef.current?.focus();
      return;
    }

    formRef.current?.querySelector<HTMLElement>(`[name="${firstField}"]`)?.focus();
  }, [state.errors]);

  function markFieldTouched(field: string) {
    setTouchedFields((current) => (current[field] ? current : { ...current, [field]: true }));
  }

  function markFieldChanged(field: string) {
    if (hasSubmitted) {
      setChangedSinceSubmit((current) => (current[field] ? current : { ...current, [field]: true }));
    }
  }

  function resetCoverState() {
    setPreviewUrl((currentUrl) => {
      if (currentUrl) {
        URL.revokeObjectURL(currentUrl);
      }
      return null;
    });
    setSelectedFileName(null);
    setLocalCoverError(null);
    if (coverInputRef.current) {
      coverInputRef.current.value = "";
    }
  }

  async function handleSelectedFile(file: File | null) {
    markFieldTouched("cover");
    markFieldChanged("cover");
    setIsPreparingCover(true);

    if (!file) {
      resetCoverState();
      setIsPreparingCover(false);
      return;
    }

    const error = getImageUploadError(file, {
      maxSizeBytes: MAX_COMMUNITY_COVER_SIZE_BYTES,
      label: "Cover image",
    });

    if (error) {
      resetCoverState();
      setLocalCoverError(error);
      setIsPreparingCover(false);
      return;
    }

    setPreviewUrl((currentUrl) => {
      if (currentUrl) {
        URL.revokeObjectURL(currentUrl);
      }
      return URL.createObjectURL(file);
    });
    setSelectedFileName(file.name);
    setLocalCoverError(null);
    setIsPreparingCover(false);
  }

  const clientErrors: Record<string, string | undefined> = {
    name: !nameValue.trim() ? "Community name is required." : undefined,
    description: !descriptionValue.trim()
      ? "Description is required."
      : descriptionValue.trim().length < 12
        ? "Add a short description so people know the vibe."
        : undefined,
    category: !categoryValue ? "Choose a category for this community." : undefined,
    customCategory:
      categoryValue === "custom" && !customCategoryValue.trim()
        ? "Add a custom category name."
        : undefined,
    cover: localCoverError ?? undefined,
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

  const nameError = getFieldError("name");
  const descriptionError = getFieldError("description");
  const categoryError = getFieldError("category");
  const customCategoryError = getFieldError("customCategory");
  const coverError = getFieldError("cover");

  const isFormValid =
    Boolean(nameValue.trim()) &&
    descriptionValue.trim().length >= 12 &&
    Boolean(categoryValue) &&
    (categoryValue !== "custom" || Boolean(customCategoryValue.trim())) &&
    !coverError;

  function focusField(field: string) {
    if (field === "cover") {
      coverInputRef.current?.focus();
      return;
    }

    formRef.current?.querySelector<HTMLElement>(`[name="${field}"]`)?.focus();
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    setHasSubmitted(true);
    setChangedSinceSubmit({});

    if (isFormValid) {
      return;
    }

    event.preventDefault();

    const focusOrder = ["name", "description", "category", "customCategory", "cover"];
    const firstInvalidField = focusOrder.find((field) => clientErrors[field]);

    if (firstInvalidField) {
      focusField(firstInvalidField);
    }
  }

  return (
    <form
      action={formAction}
      className="surface-card overflow-hidden rounded-2xl border border-white/8 bg-[linear-gradient(180deg,rgba(18,24,43,0.94),rgba(10,14,28,0.98))] p-6 shadow-[0_24px_60px_rgba(2,6,23,0.34),0_0_24px_rgba(99,102,241,0.08)]"
      onSubmit={handleSubmit}
      ref={formRef}
    >
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-emerald-300">
            Create Community
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-white">
            Start a new space on SyncUp
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">
            Build a community around a vibe, interest, or local scene. You&apos;ll become the first admin automatically.
          </p>
        </div>
        <Link
          className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold text-slate-100 transition-all duration-200 hover:-translate-y-0.5 hover:border-white/16 hover:bg-white/8"
          href="/communities"
        >
          Back to Communities
        </Link>
      </div>

      <div className="mt-8 space-y-5">
        <FieldShell error={nameError} icon={Users} label="Name">
          <input
            className={`${baseInputClass(Boolean(nameError))} text-base`}
            name="name"
            onBlur={() => markFieldTouched("name")}
            onChange={(event) => {
              markFieldChanged("name");
              setNameValue(event.target.value);
            }}
            placeholder="Late Night Film Club"
            value={nameValue}
          />
        </FieldShell>

        <FieldShell error={descriptionError} icon={Sparkles} label="Description">
          <textarea
            className={`${baseInputClass(Boolean(descriptionError))} min-h-[140px] resize-none text-sm leading-7`}
            name="description"
            onBlur={() => markFieldTouched("description")}
            onChange={(event) => {
              markFieldChanged("description");
              setDescriptionValue(event.target.value);
            }}
            placeholder="What kind of people, plans, and energy does this community bring together?"
            value={descriptionValue}
          />
        </FieldShell>

        <div className="grid gap-4 sm:grid-cols-2">
          <FieldShell error={categoryError} icon={Sparkles} label="Category">
            <CategoryDropdown
              error={categoryError}
              onBlur={() => markFieldTouched("category")}
              onChange={(nextValue) => {
                markFieldChanged("category");
                setCategoryValue(nextValue);
                if (nextValue !== "custom") {
                  setCustomCategoryValue("");
                }
              }}
              value={categoryValue}
            />
          </FieldShell>

          <FieldShell error={undefined} icon={Lock} label="Privacy">
            <select
              className={`${baseInputClass(false)} text-sm`}
              name="visibility"
              onChange={(event) => setVisibilityValue(event.target.value as "PUBLIC" | "PRIVATE")}
              value={visibilityValue}
            >
              <option value="PUBLIC">Public</option>
              <option value="PRIVATE">Private</option>
            </select>
          </FieldShell>
        </div>

        {categoryValue === "custom" ? (
          <FieldShell error={customCategoryError} icon={Sparkles} label="Custom Category">
            <input
              className={`${baseInputClass(Boolean(customCategoryError))} text-sm`}
              name="customCategory"
              onBlur={() => markFieldTouched("customCategory")}
              onChange={(event) => {
                markFieldChanged("customCategory");
                setCustomCategoryValue(event.target.value);
              }}
              placeholder="Tell us what this community is about"
              value={customCategoryValue}
            />
          </FieldShell>
        ) : (
          <input name="customCategory" type="hidden" value="" />
        )}

        <div className="space-y-3">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            <ImagePlus className="h-3.5 w-3.5" />
            Cover Image
          </div>
          <CoverUploader
            error={coverError}
            fileName={selectedFileName}
            inputRef={coverInputRef}
            isPreparing={isPreparingCover}
            onRemove={() => {
              markFieldTouched("cover");
              markFieldChanged("cover");
              resetCoverState();
            }}
            onSelectFile={handleSelectedFile}
            previewUrl={previewUrl}
          />
        </div>
      </div>

      {state.message ? (
        <div
          className={`mt-5 rounded-2xl px-4 py-3 text-sm ${
            state.success
              ? "border border-emerald-500/30 bg-emerald-500/10 text-emerald-200"
              : "border border-rose-500/30 bg-rose-500/10 text-rose-200"
          }`}
        >
          {state.message}
        </div>
      ) : null}

      <div className="mt-6 flex items-center justify-between gap-4">
        <p className="text-sm text-muted-foreground">
          Choose a category people can discover now, with room for custom communities too.
        </p>
        <SubmitButton />
      </div>
    </form>
  );
}
