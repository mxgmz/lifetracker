export default function FormBlock({ title, icon: Icon, children }) {
  return (
    <div className="glass-panel p-6 space-y-6">
      <div className="flex items-center space-x-3 border-b border-white/10 pb-4">
        {Icon && <Icon className="w-6 h-6 text-blue-400" />}
        <h2 className="text-lg font-display font-semibold text-white">
          {title}
        </h2>
      </div>
      <div className="space-y-6">
        {children}
      </div>
    </div>
  )
}

