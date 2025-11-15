export default function MetricCard({
  title,
  value,
  description,
  delta,
  trendLabel = 'vs inicio',
  color = 'blue',
}) {
  const colorMap = {
    blue: 'text-blue-600 bg-blue-50',
    green: 'text-green-600 bg-green-50',
    amber: 'text-amber-600 bg-amber-50',
    purple: 'text-purple-600 bg-purple-50',
    rose: 'text-rose-600 bg-rose-50',
    gray: 'text-gray-600 bg-gray-100',
    indigo: 'text-indigo-600 bg-indigo-50',
  }

  const badgeColor = colorMap[color] || colorMap.blue
  const deltaValue =
    delta !== null && delta !== undefined && !Number.isNaN(delta)
      ? `${delta > 0 ? '+' : ''}${delta.toFixed(1)}%`
      : null

  return (
    <div className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm">
      <div className="flex items-center justify-between mb-2">
        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">{title}</p>
        {deltaValue && (
          <span
            className={`inline-flex items-center text-xs font-semibold px-2 py-0.5 rounded-full ${badgeColor}`}
          >
            {deltaValue}
          </span>
        )}
      </div>
      <div className="text-3xl font-semibold text-gray-900">{value ?? '—'}</div>
      <p className="text-xs text-gray-500 mt-1">{description}</p>
      {deltaValue && (
        <p className="text-[11px] text-gray-400 mt-1">
          {trendLabel} • {delta > 0 ? 'Mejoró' : delta < 0 ? 'Descendió' : 'Sin cambio'}
        </p>
      )}
    </div>
  )
}

