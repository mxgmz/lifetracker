export default function QuickActionCard({ title, description, icon: Icon, onClick, color = 'gray', compact = false }) {
  const colorClasses = {
    gray: 'text-gray-400 group-hover:text-white',
    yellow: 'text-yellow-400 group-hover:text-yellow-300',
    blue: 'text-blue-400 group-hover:text-blue-300',
    indigo: 'text-indigo-400 group-hover:text-indigo-300',
    red: 'text-rose-400 group-hover:text-rose-300',
    green: 'text-emerald-400 group-hover:text-emerald-300',
    purple: 'text-purple-400 group-hover:text-purple-300',
    amber: 'text-amber-400 group-hover:text-amber-300',
  }

  return (
    <button
      onClick={onClick}
      className={`glass-card text-left w-full group relative overflow-hidden transition-all duration-300 hover:bg-white/[0.08] hover:border-white/20 ${compact ? 'p-4' : 'p-5'}`}
    >
      <div className="flex items-start space-x-4 relative z-10">
        {Icon && (
          <div className={`flex-shrink-0 transition-colors duration-300 ${colorClasses[color]}`}>
            <Icon className={`${compact ? 'w-5 h-5' : 'w-6 h-6'}`} />
          </div>
        )}
        <div className="flex-1 min-w-0">
          <h3 className={`font-display font-medium text-white group-hover:text-white transition-colors ${compact ? 'text-sm' : 'text-base'}`}>
            {title}
          </h3>
          {!compact && (
            <p className="text-xs text-gray-400 mt-1 line-clamp-2 font-light group-hover:text-gray-300 transition-colors">
              {description}
            </p>
          )}
        </div>
      </div>

      {/* Hover Glow Effect */}
      <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/[0.03] to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000 pointer-events-none" />
    </button>
  )
}

