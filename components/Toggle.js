export default function Toggle({ label, name, register, description }) {
  return (
    <div className="flex items-start space-x-3 group">
      <div className="relative flex items-center">
        <input
          type="checkbox"
          id={name}
          {...register(name)}
          className="peer h-5 w-5 cursor-pointer appearance-none rounded-md border border-white/10 bg-white/5 checked:border-blue-500 checked:bg-blue-500 hover:border-white/30 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
        />
        <svg
          className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white opacity-0 peer-checked:opacity-100 transition-opacity"
          viewBox="0 0 14 14"
          fill="none"
        >
          <path
            d="M11.6666 3.5L5.24992 9.91667L2.33325 7"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>
      <div className="flex-1">
        <label htmlFor={name} className="text-sm font-medium text-white/90 cursor-pointer group-hover:text-white transition-colors">
          {label}
        </label>
        {description && (
          <p className="text-xs text-white/50 mt-0.5 group-hover:text-white/70 transition-colors">{description}</p>
        )}
      </div>
    </div>
  )
}

