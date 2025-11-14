export default function QuickActionCard({ title, description, icon: Icon, onClick, color = 'gray' }) {
  const colorClasses = {
    gray: 'text-gray-700 bg-gray-50 hover:bg-gray-100',
    yellow: 'text-yellow-700 bg-yellow-50 hover:bg-yellow-100',
    blue: 'text-blue-700 bg-blue-50 hover:bg-blue-100',
    indigo: 'text-indigo-700 bg-indigo-50 hover:bg-indigo-100',
    red: 'text-red-700 bg-red-50 hover:bg-red-100',
    green: 'text-green-700 bg-green-50 hover:bg-green-100',
    purple: 'text-purple-700 bg-purple-50 hover:bg-purple-100',
    amber: 'text-amber-700 bg-amber-50 hover:bg-amber-100',
  }

  return (
    <button
      onClick={onClick}
      className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm hover:shadow-md transition-all duration-200 text-left w-full group"
    >
      <div className="flex items-start space-x-3">
        {Icon && (
          <div className={`flex-shrink-0 p-2 rounded-lg transition-colors ${colorClasses[color]}`}>
            <Icon className="w-5 h-5" />
          </div>
        )}
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-semibold text-gray-900 group-hover:text-gray-700">
            {title}
          </h3>
          <p className="text-xs text-gray-500 mt-1 line-clamp-2">
            {description}
          </p>
        </div>
      </div>
    </button>
  )
}

