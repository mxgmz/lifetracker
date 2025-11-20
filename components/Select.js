export default function Select({ label, name, register, options, placeholder, required }) {
  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-white/80 ml-1">{label}</label>
      <div className="relative">
        <select
          {...register(name, { required })}
          className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent appearance-none transition-all hover:bg-white/10"
        >
          {placeholder && <option value="" className="bg-[#0A0A0F] text-gray-400">{placeholder}</option>}
          {options.map((option) => (
            <option key={option.value} value={option.value} className="bg-[#0A0A0F] text-white">
              {option.label}
            </option>
          ))}
        </select>
        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-white/50">
          <svg className="h-4 w-4 fill-current" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
            <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
          </svg>
        </div>
      </div>
    </div>
  )
}

