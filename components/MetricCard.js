export default function MetricCard({
  title,
  value,
  description,
  delta,
  trendLabel = 'vs inicio',
  color = 'blue',
}) {
  const colorMap = {
    blue: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
    green: 'text-green-400 bg-green-500/10 border-green-500/20',
    amber: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
    purple: 'text-purple-400 bg-purple-500/10 border-purple-500/20',
    rose: 'text-rose-400 bg-rose-500/10 border-rose-500/20',
    gray: 'text-gray-400 bg-gray-500/10 border-gray-500/20',
    indigo: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20',
  }

  const badgeColor = colorMap[color] || colorMap.blue
  const deltaValue =
    delta !== null && delta !== undefined && !Number.isNaN(delta)
      ? `${delta > 0 ? '+' : ''}${delta.toFixed(1)}%`
      : null

  return (
    <div className="glass-card p-5 flex flex-col justify-between h-full group hover:bg-white/10 transition-all">
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs font-medium text-white/50 uppercase tracking-wider group-hover:text-white/70 transition-colors">{title}</p>
        {deltaValue && (
          <span
            className={`inline-flex items-center text-[10px] font-bold px-2 py-1 rounded-full border ${badgeColor}`}
          >
            {deltaValue}
          </span>
        )}
      </div>
      <div>
        <div className="text-3xl font-display font-bold text-white mb-1">{value ?? '—'}</div>
        <p className="text-xs text-white/40">{description}</p>
      </div>
      {deltaValue && (
        <div className="mt-3 pt-3 border-t border-white/5">
          <p className="text-[10px] text-white/30">
            {trendLabel} • <span className={delta > 0 ? 'text-green-400' : delta < 0 ? 'text-red-400' : 'text-white/30'}>{delta > 0 ? 'Mejoró' : delta < 0 ? 'Descendió' : 'Sin cambio'}</span>
          </p>
        </div>
      )}
    </div>
  )
}

