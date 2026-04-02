"use client";

import { useState } from "react";
import { Edit3 } from "lucide-react";
import { initialInteractionState, InteractionState } from "@/lib/interaction-state";
import { useActionState } from "react";
import { useFormStatus } from "react-dom";

type Props = {
  postId: string;
  canEditPlan: boolean;
  title?: string;
  content: string;
  locationText?: string | null;
  startsAt?: Date | null;
  deleteAction: (state: InteractionState, formData: FormData) => Promise<InteractionState>;
  cancelAction?: (state: InteractionState, formData: FormData) => Promise<InteractionState>;
  updateAction?: (state: InteractionState, formData: FormData) => Promise<InteractionState>;
};

function InlineSubmit({ label, pendingLabel, className }: { label: string; pendingLabel: string; className: string }) {
  const { pending } = useFormStatus();

  return (
    <button className={className} type="submit">
      {pending ? pendingLabel : label}
    </button>
  );
}

function toDateTimeLocal(date: Date | null | undefined) {
  if (!date) {
    return "";
  }

  const offset = date.getTimezoneOffset();
  const local = new Date(date.getTime() - offset * 60000);
  return local.toISOString().slice(0, 16);
}

export function PostOwnerActions({
  postId,
  canEditPlan,
  title,
  content,
  locationText,
  startsAt,
  deleteAction,
  cancelAction,
  updateAction,
}: Props) {
  const [isEditing, setIsEditing] = useState(false);
  const [deleteState, deleteFormAction] = useActionState(deleteAction, initialInteractionState);
  const [cancelState, cancelFormAction] = useActionState(cancelAction ?? (async () => initialInteractionState), initialInteractionState);
  const [updateState, updateFormAction] = useActionState(updateAction ?? (async () => initialInteractionState), initialInteractionState);

  return (
    <div className="mt-4 space-y-3 border-t border-white/6 pt-4">
      <div className="flex flex-wrap gap-2">
        {canEditPlan && updateAction ? (
          <button
            className="inline-flex items-center gap-2 rounded-xl border border-white/8 bg-white/[0.03] px-3 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-slate-200 transition-all duration-200 hover:border-indigo-300/20 hover:bg-indigo-400/10"
            onClick={() => setIsEditing((value) => !value)}
            type="button"
          >
            <Edit3 className="h-3.5 w-3.5" />
            {isEditing ? "Close edit" : "Edit"}
          </button>
        ) : null}

        {cancelAction ? (
          <form action={cancelFormAction}>
            <input name="postId" type="hidden" value={postId} />
            <InlineSubmit
              className="inline-flex items-center gap-2 rounded-xl border border-amber-300/14 bg-amber-400/10 px-3 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-amber-200 transition-all duration-200 hover:border-amber-300/20"
              label="Cancel"
              pendingLabel="Cancelling..."
            />
          </form>
        ) : null}

        <form action={deleteFormAction}>
          <input name="postId" type="hidden" value={postId} />
          <InlineSubmit
            className="inline-flex items-center gap-2 rounded-xl border border-rose-300/14 bg-rose-400/10 px-3 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-rose-200 transition-all duration-200 hover:border-rose-300/20"
            label="Delete"
            pendingLabel="Deleting..."
          />
        </form>
      </div>

      {cancelState.message ? <p className="text-xs text-emerald-300">{cancelState.message}</p> : null}
      {deleteState.message ? <p className="text-xs text-emerald-300">{deleteState.message}</p> : null}

      {isEditing && canEditPlan && updateAction ? (
        <form action={updateFormAction} className="space-y-3 rounded-2xl border border-white/8 bg-white/[0.03] p-4">
          <input name="postId" type="hidden" value={postId} />
          <input
            className="w-full rounded-xl border border-white/8 bg-white/[0.03] px-4 py-3 text-sm text-slate-100 outline-none placeholder:text-slate-500"
            defaultValue={title}
            name="title"
            placeholder="Plan title"
          />
          <textarea
            className="min-h-[120px] w-full rounded-xl border border-white/8 bg-white/[0.03] px-4 py-3 text-sm text-slate-100 outline-none placeholder:text-slate-500"
            defaultValue={content}
            name="content"
            placeholder="Describe the plan"
          />
          <div className="grid gap-3 sm:grid-cols-2">
            <input
              className="w-full rounded-xl border border-white/8 bg-white/[0.03] px-4 py-3 text-sm text-slate-100 outline-none"
              defaultValue={toDateTimeLocal(startsAt)}
              name="startsAt"
              type="datetime-local"
            />
            <input
              className="w-full rounded-xl border border-white/8 bg-white/[0.03] px-4 py-3 text-sm text-slate-100 outline-none placeholder:text-slate-500"
              defaultValue={locationText ?? ""}
              name="locationText"
              placeholder="Location"
            />
          </div>
          <div className="flex justify-end">
            <InlineSubmit
              className="inline-flex items-center gap-2 rounded-xl bg-[linear-gradient(135deg,#6366f1,#8b5cf6)] px-4 py-2.5 text-sm font-semibold text-white shadow-[0_12px_30px_rgba(99,102,241,0.28)]"
              label="Save changes"
              pendingLabel="Saving..."
            />
          </div>
          {updateState.message ? (
            <p className={`text-xs ${updateState.status === "error" ? "text-rose-300" : "text-emerald-300"}`}>
              {updateState.message}
            </p>
          ) : null}
        </form>
      ) : null}
    </div>
  );
}
