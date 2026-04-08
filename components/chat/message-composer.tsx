"use client";

import { SendHorizonal } from "lucide-react";
import { FormEvent, useState } from "react";

type Props = {
  onSubmit: (message: string) => void;
  placeholder?: string;
  disabled?: boolean;
};

export function MessageComposer({ onSubmit, placeholder = "Write a message...", disabled = false }: Props) {
  const [value, setValue] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    
    const text = value.trim();
    if (!text || isSubmitting || disabled) return;

    setIsSubmitting(true);
    try {
      onSubmit(text);
      setValue("");
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

  return (
    <form className="flex-shrink-0 border-t border-white/8 px-6 py-5" onSubmit={handleSubmit}>
      <div className="flex gap-3">
        <div className="flex-1">
          <textarea
            className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-slate-100 outline-none placeholder:text-slate-500 focus:border-indigo-300/30 focus:ring-1 focus:ring-indigo-300/10 transition-all duration-200 resize-none"
            disabled={disabled || isSubmitting}
            onKeyDown={handleKeyDown}
            onChange={(e) => setValue(e.target.value)}
            placeholder={placeholder}
            rows={3}
            value={value}
          />
        </div>
        <button
          className="self-end flex h-12 w-12 items-center justify-center rounded-lg bg-indigo-500 text-white transition-all duration-200 hover:bg-indigo-400 disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={!value.trim() || disabled || isSubmitting}
          type="submit"
        >
          <SendHorizonal className="h-4 w-4" />
        </button>
      </div>
    </form>
  );
}
