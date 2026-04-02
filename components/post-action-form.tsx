"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { initialInteractionState, InteractionState } from "@/lib/interaction-state";

type Props = {
  action: (state: InteractionState, formData: FormData) => Promise<InteractionState>;
  children?: React.ReactNode;
  hiddenFields: Record<string, string>;
  idleLabel: string;
  pendingLabel: string;
  disabled?: boolean;
  className: string;
};

function SubmitButton({
  children,
  idleLabel,
  pendingLabel,
  disabled,
  className,
}: {
  children?: React.ReactNode;
  idleLabel: string;
  pendingLabel: string;
  disabled?: boolean;
  className: string;
}) {
  const { pending } = useFormStatus();

  return (
    <button className={className} disabled={disabled || pending} type="submit">
      {children ?? (pending ? pendingLabel : idleLabel)}
    </button>
  );
}

export function PostActionForm({
  action,
  children,
  hiddenFields,
  idleLabel,
  pendingLabel,
  disabled,
  className,
}: Props) {
  const [state, formAction] = useActionState(action, initialInteractionState);

  return (
    <form action={formAction} className="space-y-2">
      {Object.entries(hiddenFields).map(([name, value]) => (
        <input key={name} name={name} type="hidden" value={value} />
      ))}
      <SubmitButton className={className} disabled={disabled} idleLabel={idleLabel} pendingLabel={pendingLabel}>
        {children}
      </SubmitButton>
      {state.message ? (
        <p className={`text-xs ${state.status === "error" ? "text-rose-300" : "text-emerald-300"}`}>
          {state.message}
        </p>
      ) : null}
    </form>
  );
}
