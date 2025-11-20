export default function TextInput({ label, name, register, type = 'text', placeholder, required, rows, step }) {
  if (rows) {
    return (
      <div className="space-y-2">
        <label className="text-sm font-medium text-white/80 ml-1">{label}</label>
        <textarea
          {...register(name, { required })}
          rows={rows}
          placeholder={placeholder}
          className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent resize-none transition-all hover:bg-white/10"
        />
      </div>
    )
  }

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-white/80 ml-1">{label}</label>
      <input
        type={type}
        step={step}
        {...register(name, { required })}
        placeholder={placeholder}
        className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent transition-all hover:bg-white/10"
      />
    </div>
  )
}

