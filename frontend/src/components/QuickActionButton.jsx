export default function QuickActionButton({ label, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-[20px] border border-slate-200 bg-slate-900 px-4 py-3 text-sm font-semibold text-white shadow-sm transition duration-200 hover:-translate-y-0.5 hover:bg-slate-700"
    >
      <span className="flex items-center gap-2">
        <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-white/15 text-base">↗</span>
        {label}
      </span>
    </button>
  );
}
