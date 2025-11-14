export default function FormBlock({ title, subtitle, children, icon: Icon }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm space-y-4">
      {(title || Icon) && (
        <div className="flex items-start space-x-3 pb-3 border-b border-gray-100">
          {Icon && (
            <div className="flex-shrink-0 mt-1">
              <Icon className="w-5 h-5 text-gray-700" />
            </div>
          )}
          <div className="flex-1 min-w-0">
            {title && (
              <h3 className="text-base font-semibold text-gray-900">
                {title}
              </h3>
            )}
            {subtitle && (
              <p className="text-sm text-gray-600 mt-0.5">
                {subtitle}
              </p>
            )}
          </div>
        </div>
      )}
      <div className="space-y-4">
        {children}
      </div>
    </div>
  )
}

