export default function StatTile({ title, value, hint, tone = 'neutral' }) {
  const toneClass = {
    neutral: 'border-slate-200 bg-slate-50 text-slate-700',
    success: 'border-emerald-200 bg-emerald-50 text-emerald-700',
    warning: 'border-amber-200 bg-amber-50 text-amber-700',
    danger: 'border-rose-200 bg-rose-50 text-rose-700',
  }[tone];

  return (
    <div className={`rounded-[22px] border p-4 shadow-sm ${toneClass}`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium">{title}</p>
          <p className="mt-2 text-2xl font-semibold">{value}</p>
          {hint ? <p className="mt-1 text-xs opacity-80">{hint}</p> : null}
        </div>
        <span className="rounded-full bg-white/70 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.2em]">
          عرض
        </span>
      </div>
    </div>
  );
}
