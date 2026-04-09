"use client";

import { ImagePlus, SendHorizonal, X } from "lucide-react";
import { ChangeEvent, FormEvent, useEffect, useRef, useState } from "react";
import { getImageUploadError } from "@/lib/image-upload";

type Props = {
  onSubmit: (payload: FormData) => Promise<void>;
  placeholder?: string;
  disabled?: boolean;
  allowAttachments?: boolean;
  replyTarget?: {
    id: string;
    senderId: string;
    senderName: string;
    text: string;
    imageUrl?: string | null;
    isDeleted?: boolean;
  } | null;
  onCancelReply?: () => void;
};

export function MessageComposer({
  onSubmit,
  placeholder = "Write a message...",
  disabled = false,
  allowAttachments = false,
  replyTarget = null,
  onCancelReply,
}: Props) {
  const [value, setValue] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [attachmentError, setAttachmentError] = useState("");
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    
    const text = value.trim();
    if ((!text && !selectedImage) || isSubmitting || disabled) return;

    setIsSubmitting(true);
    try {
      const formData = new FormData();
      formData.append("message", text);

      if (selectedImage) {
        formData.append("image", selectedImage);
      }

      await onSubmit(formData);
      setValue("");
      clearSelectedImage();
    } finally {
      setIsSubmitting(false);
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      const form = e.currentTarget.form;
      if (form) {
        form.dispatchEvent(new Event("submit", { bubbles: true }));
      }
    }
  };

  const handleImageChange = (event: ChangeEvent<HTMLInputElement>) => {
    const nextFile = event.target.files?.[0] ?? null;
    const error = getImageUploadError(nextFile, { label: "Attachment" });

    if (error) {
      setSelectedImage(null);
      setPreviewUrl(null);
      setAttachmentError(error);
      event.target.value = "";
      return;
    }

    setAttachmentError("");
    setSelectedImage(nextFile);

    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }

    setPreviewUrl(nextFile ? URL.createObjectURL(nextFile) : null);
  };

  function clearSelectedImage() {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }

    setSelectedImage(null);
    setPreviewUrl(null);
    setAttachmentError("");

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  return (
    <form className="flex-shrink-0 border-t border-white/8 px-6 py-5" onSubmit={handleSubmit}>
      <div className="overflow-hidden rounded-[1.6rem] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.05),rgba(255,255,255,0.03))] shadow-[0_16px_32px_rgba(2,6,23,0.16)]">
        {previewUrl ? (
          <div className="border-b border-white/8 px-4 py-4 sm:px-5">
            <div className="flex items-start gap-3 rounded-2xl border border-white/8 bg-slate-950/35 p-3">
              <div className="overflow-hidden rounded-xl border border-white/10">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img alt="Selected attachment preview" className="h-20 w-20 object-cover sm:h-24 sm:w-24" src={previewUrl} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-white">{selectedImage?.name}</p>
                <p className="mt-1 text-xs leading-5 text-slate-400">Will send as a permanent image attachment</p>
              </div>
              <button
                className="inline-flex shrink-0 items-center gap-1 rounded-full border border-white/10 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-300 transition hover:border-white/20 hover:text-white"
                onClick={clearSelectedImage}
                type="button"
              >
                <X className="h-3 w-3" />
                Remove
              </button>
            </div>
          </div>
        ) : null}

        {replyTarget ? (
          <div className="border-b border-white/8 px-4 py-3 sm:px-5">
            <div className="flex items-start gap-3 rounded-2xl border border-white/8 bg-slate-950/35 px-3 py-3">
              <div className="min-w-0 flex-1">
                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-indigo-300">
                  Replying to {replyTarget.senderName}
                </p>
                <p className="mt-1 truncate text-sm text-slate-300">
                  {replyTarget.isDeleted
                    ? "Deleted message"
                    : replyTarget.text || (replyTarget.imageUrl ? "Image attachment" : "Message")}
                </p>
              </div>
              <button
                className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-white/10 text-slate-300 transition hover:border-white/20 hover:text-white"
                onClick={onCancelReply}
                type="button"
              >
                <X className="h-3.5 w-3.5" />
                <span className="sr-only">Cancel reply</span>
              </button>
            </div>
          </div>
        ) : null}

        {attachmentError ? (
          <div className="border-b border-rose-400/10 bg-rose-500/10 px-4 py-3 text-sm text-rose-200 sm:px-5">
            {attachmentError}
          </div>
        ) : null}

        <div className="flex items-end gap-3 px-4 py-4 sm:px-5">
          {allowAttachments ? (
            <>
              <input
                accept="image/*"
                className="sr-only"
                disabled={disabled || isSubmitting}
                onChange={handleImageChange}
                ref={fileInputRef}
                type="file"
              />
              <button
                className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04] text-slate-300 transition-all duration-200 hover:border-white/16 hover:bg-white/[0.07] hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
                disabled={disabled || isSubmitting}
                onClick={() => fileInputRef.current?.click()}
                type="button"
              >
                <ImagePlus className="h-4.5 w-4.5" />
                <span className="sr-only">Attach image</span>
              </button>
            </>
          ) : null}
          <div className="flex-1">
            <textarea
              className="min-h-[3rem] w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-slate-100 outline-none placeholder:text-slate-500 transition-all duration-200 focus:border-indigo-300/30 focus:ring-1 focus:ring-indigo-300/10 resize-none"
              disabled={disabled || isSubmitting}
              onKeyDown={handleKeyDown}
              onChange={(e) => setValue(e.target.value)}
              placeholder={placeholder}
              rows={3}
              value={value}
            />
          </div>
          <button
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-indigo-500 text-white transition-all duration-200 hover:bg-indigo-400 disabled:cursor-not-allowed disabled:opacity-50"
            disabled={(!value.trim() && !selectedImage) || disabled || isSubmitting}
            type="submit"
          >
            <SendHorizonal className="h-4 w-4" />
          </button>
        </div>
      </div>
    </form>
  );
}
