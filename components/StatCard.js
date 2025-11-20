export default function StatCard({ label, value, icon: Icon, color = 'gray' }) {
  const colorClasses = {
    gray: 'text-gray-400 border-gray-500/30',
    blue: 'text-blue-400 border-blue-500/30 shadow-[0_0_15px_rgba(56,189,248,0.15)]',
    green: 'text-emerald-400 border-emerald-500/30 shadow-[0_0_15px_rgba(52,211,153,0.15)]',
    amber: 'text-amber-400 border-amber-500/30 shadow-[0_0_15px_rgba(251,191,36,0.15)]',
    red: 'text-rose-400 border-rose-500/30 shadow-[0_0_15px_rgba(251,113,133,0.15)]',
    purple: 'text-purple-400 border-purple-500/30 shadow-[0_0_15px_rgba(192,132,252,0.15)]',
    indigo: 'text-indigo-400 border-indigo-500/30 shadow-[0_0_15px_rgba(129,140,248,0.15)]',
  }

  const baseClasses = "glass-card p-4 border transition-all duration-300 hover:bg-white/[0.08]"
  const activeClasses = colorClasses[color] || colorClasses.gray

  return (
    <div className={`${baseClasses} ${activeClasses}`}>
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-1">
            {label}
          </p>
          <p className="text-2xl font-light text-white font-display tracking-tight">
            {value || '—'}
          </p>
        </div>
        {Icon && (
          <div className="opacity-50">
            <Icon className="w-5 h-5" />
          </div>
        )}
      </div>
    </div>
  )
}

