export default function AlertTile({ title, description, tone = 'warning', actionLabel, onAction }) {
  const toneClass = {
    warning: 'border-amber-200 bg-amber-50 text-amber-800',
    danger: 'border-rose-200 bg-rose-50 text-rose-800',
  }[tone];

  const icon = tone === 'danger' ? '⚠' : '•';

  return (
    <div className={`rounded-[22px] border p-4 shadow-sm ${toneClass}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="mt-0.5 flex h-9 w-9 items-center justify-center rounded-full bg-white/70 text-lg">
            {icon}
          </div>
          <div>
            <p className="font-semibold">{title}</p>
            <p className="mt-1 text-sm opacity-90">{description}</p>
          </div>
        </div>
        {actionLabel ? (
          <button type="button" className="rounded-full bg-white/70 px-3 py-1 text-sm font-medium" onClick={onAction}>
            {actionLabel}
          </button>
        ) : null}
      </div>
    </div>
  );
}
