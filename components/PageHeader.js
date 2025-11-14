export default function PageHeader({ title, subtitle, scripture, reference }) {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">
          {title}
        </h1>
        {subtitle && (
          <p className="text-base text-gray-600 mt-2 leading-relaxed">
            {subtitle}
          </p>
        )}
      </div>
      {scripture && (
        <div className="bg-gradient-to-r from-gray-50 to-white rounded-lg border border-gray-200 p-4">
          <p className="text-sm italic text-gray-700">
            "{scripture}"
          </p>
          {reference && (
            <p className="text-xs text-gray-500 mt-1">
              — {reference}
            </p>
          )}
        </div>
      )}
    </div>
  )
}

