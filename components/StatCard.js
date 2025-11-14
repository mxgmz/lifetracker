export default function StatCard({ label, value, icon: Icon, color = 'gray' }) {
  const colorClasses = {
    gray: 'text-gray-700 bg-gray-50',
    blue: 'text-blue-700 bg-blue-50',
    green: 'text-green-700 bg-green-50',
    amber: 'text-amber-700 bg-amber-50',
    red: 'text-red-700 bg-red-50',
    purple: 'text-purple-700 bg-purple-50',
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
            {label}
          </p>
          <p className="text-lg font-semibold text-gray-900 mt-1">
            {value || '—'}
          </p>
        </div>
        {Icon && (
          <div className={`flex-shrink-0 p-2 rounded-lg ${colorClasses[color]}`}>
            <Icon className="w-5 h-5" />
          </div>
        )}
      </div>
    </div>
  )
}

