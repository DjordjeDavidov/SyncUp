"use client";

import { useMemo, useState } from "react";

type Option = {
  id: string;
  name: string;
  slug?: string;
};

type SelectorProps = {
  label: string;
  name: string;
  helper?: string;
  options: Option[];
  selectedIds?: string[];
  allowCustom?: boolean;
  customPlaceholder?: string;
  customFieldName?: string;
};

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export function InterestTagSelector({
  label,
  name,
  helper,
  options,
  selectedIds = [],
  allowCustom = false,
  customFieldName,
  customPlaceholder,
}: SelectorProps) {
  const [customValue, setCustomValue] = useState("");
  const [customOptions, setCustomOptions] = useState<Option[]>([]);
  const fieldName = customFieldName ?? `${name}_custom`;

  const customInputPlaceholder = useMemo(
    () => customPlaceholder || `Add your own ${label.toLowerCase()}`,
    [customPlaceholder, label],
  );

  function addCustomOption() {
    const trimmed = customValue.trim();
    if (!trimmed) {
      return;
    }
    const slug = slugify(trimmed);
    setCustomOptions((current) => {
      if (current.some((item) => item.name.toLowerCase() === trimmed.toLowerCase())) {
        return current;
      }
      return [...current, { id: `custom-${slug}-${Date.now()}`, name: trimmed }];
    });
    setCustomValue("");
  }

  function removeCustomOption(id: string) {
    setCustomOptions((current) => current.filter((item) => item.id !== id));
  }

  return (
    <div>
      <div className="mb-3">
        <p className="text-sm font-medium text-slate-100">{label}</p>
        {helper ? <p className="mt-1 text-xs leading-5 text-slate-400">{helper}</p> : null}
      </div>
      <div className="flex flex-wrap gap-2">
        {options.length > 0 ? (
          options.map((option) => (
            <label
              className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-white/8 bg-white/4 px-3 py-2 text-sm text-slate-200 transition hover:border-indigo-400 hover:bg-indigo-500/10"
              key={option.id}
            >
              <input
                className="h-4 w-4 accent-[var(--primary)]"
                defaultChecked={selectedIds.includes(option.id)}
                name={name}
                type="checkbox"
                value={option.id}
              />
              <span>{option.name}</span>
            </label>
          ))
        ) : (
          <p className="rounded-2xl border border-dashed border-white/8 px-4 py-3 text-sm text-slate-400">
            Nothing here yet. Add options in the database and they will show up here.
          </p>
        )}
      </div>
      {allowCustom ? (
        <div className="mt-4 space-y-3">
          <div className="flex gap-2">
            <input
              className="min-w-0 flex-1 rounded-2xl border border-[var(--border)] bg-[#0d1528] px-4 py-3 text-sm text-slate-50 outline-none transition placeholder:text-slate-500 focus:border-indigo-400"
              placeholder={customInputPlaceholder}
              value={customValue}
              onChange={(event) => setCustomValue(event.target.value)}
              type="text"
            />
            <button
              type="button"
              onClick={addCustomOption}
              className="rounded-2xl bg-[var(--primary)] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[var(--primary-hover)]"
            >
              Add
            </button>
          </div>
          {customOptions.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {customOptions.map((option) => (
                <span
                  key={option.id}
                  className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-slate-900/80 px-3 py-2 text-sm text-slate-100"
                >
                  {option.name}
                  <button
                    type="button"
                    onClick={() => removeCustomOption(option.id)}
                    className="text-slate-400 transition hover:text-white"
                  >
                    ✕
                  </button>
                  <input type="hidden" name={fieldName} value={option.name} />
                </span>
              ))}
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
