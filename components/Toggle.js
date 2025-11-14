export default function Toggle({ label, name, register, description }) {
  return (
    <div className="flex items-start space-x-3">
      <input
        type="checkbox"
        id={name}
        {...register(name)}
        className="mt-1 w-4 h-4 text-gray-900 bg-gray-100 border-gray-300 rounded focus:ring-gray-500 focus:ring-2"
      />
      <div className="flex-1">
        <label htmlFor={name} className="text-sm font-medium text-gray-700 cursor-pointer">
          {label}
        </label>
        {description && (
          <p className="text-xs text-gray-500 mt-0.5">{description}</p>
        )}
      </div>
    </div>
  )
}

