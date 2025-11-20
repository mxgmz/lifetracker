export default function ChartCard({ title, subtitle, actions, children }) {
  return (
    <div className="glass-card p-6 flex flex-col gap-4">
      <div className="flex items-center justify-between flex-wrap gap-2 border-b border-white/5 pb-4">
        <div>
          <h3 className="text-lg font-display font-semibold text-white">{title}</h3>
          {subtitle && <p className="text-xs text-white/40">{subtitle}</p>}
        </div>
        {actions && <div className="flex items-center gap-2">{actions}</div>}
      </div>
      <div className="h-full min-h-[260px] w-full [&_.recharts-cartesian-grid-horizontal_line]:stroke-white/5 [&_.recharts-cartesian-grid-vertical_line]:stroke-white/5 [&_.recharts-text]:fill-white/40">
        {children}
      </div>
    </div>
  )
}
