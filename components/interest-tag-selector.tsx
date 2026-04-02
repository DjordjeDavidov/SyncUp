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
};

export function InterestTagSelector({
  label,
  name,
  helper,
  options,
  selectedIds = [],
}: SelectorProps) {
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
    </div>
  );
}
