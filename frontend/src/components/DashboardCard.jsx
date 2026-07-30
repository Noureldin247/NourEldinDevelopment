export default function DashboardCard({ title, subtitle, children, className = '' }) {
  return (
    <section className={`group rounded-[28px] border border-slate-200 bg-gradient-to-br from-white via-slate-50 to-white p-5 shadow-[0_10px_30px_rgba(15,23,42,0.06)] transition duration-200 hover:-translate-y-1 hover:shadow-[0_16px_40px_rgba(15,23,42,0.10)] ${className}`}>
      <div className="mb-4 rounded-2xl border border-slate-100 bg-white/70 p-3">
        {(title || subtitle) && (
          <div className="flex items-start justify-between gap-3">
            <div>
              {title ? <h2 className="text-lg font-semibold text-slate-900">{title}</h2> : null}
              {subtitle ? <p className="mt-1 text-sm text-slate-500">{subtitle}</p> : null}
            </div>
            <div className="h-2.5 w-2.5 rounded-full bg-slate-300" />
          </div>
        )}
      </div>
      <div className="space-y-3">{children}</div>
    </section>
  );
}
