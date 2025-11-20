export default function Slider({ label, name, register, min = 0, max = 10, step = 1, value, onChange }) {
  // Helper to get percentage for background gradient
  const getBackgroundStyle = (currentVal) => {
    const percentage = ((currentVal - min) / (max - min)) * 100
    return {
      background: `linear-gradient(to right, #38bdf8 0%, #818cf8 ${percentage}%, rgba(255,255,255,0.1) ${percentage}%, rgba(255,255,255,0.1) 100%)`
    }
  }

  // Controlled mode
  if (value !== undefined && onChange) {
    return (
      <div className="space-y-3">
        <div className="flex justify-between items-end">
          <label className="text-sm font-medium text-gray-300 tracking-wide">{label}</label>
          <span className="text-2xl font-light text-white font-display">{value}</span>
        </div>
        <div className="relative h-6 flex items-center">
          <input
            type="range"
            min={min}
            max={max}
            step={step}
            value={value}
            onChange={onChange}
            style={getBackgroundStyle(value)}
            className="w-full h-1.5 rounded-full appearance-none cursor-pointer focus:outline-none focus:ring-0 z-10"
          />
          {/* Custom Thumb Styling via CSS in globals.css is recommended, but inline styles work for track */}
          <style jsx>{`
            input[type=range]::-webkit-slider-thumb {
              -webkit-appearance: none;
              height: 20px;
              width: 20px;
              border-radius: 50%;
              background: #fff;
              box-shadow: 0 0 15px rgba(255, 255, 255, 0.5);
              cursor: pointer;
              margin-top: -8px; /* You need to specify a margin in Chrome, but in Firefox and IE it is automatic */
            }
            input[type=range]::-moz-range-thumb {
              height: 20px;
              width: 20px;
              border-radius: 50%;
              background: #fff;
              box-shadow: 0 0 15px rgba(255, 255, 255, 0.5);
              cursor: pointer;
            }
          `}</style>
        </div>
        <div className="flex justify-between text-[10px] text-gray-500 uppercase tracking-widest font-medium">
          <span>{min}</span>
          <span>{max}</span>
        </div>
      </div>
    )
  }

  // Uncontrolled mode (react-hook-form) - simplified for now as we mostly use controlled in this app
  // But for completeness, we'd need to watch the value to update the gradient. 
  // For now, let's just render a standard styled input if not controlled, or assume controlled is preferred.
  return (
    <div className="space-y-3">
      <div className="flex justify-between items-center">
        <label className="text-sm font-medium text-gray-300">{label}</label>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        {...register(name, { valueAsNumber: true })}
        className="w-full h-1.5 bg-white/10 rounded-full appearance-none cursor-pointer accent-blue-400"
      />
      <div className="flex justify-between text-[10px] text-gray-500 uppercase tracking-widest">
        <span>{min}</span>
        <span>{max}</span>
      </div>
    </div>
  )
}

