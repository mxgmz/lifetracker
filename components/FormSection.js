export default function FormSection({ title, description, children }) {
  return (
    <div className="space-y-4">
      {title && (
        <div className="mb-4">
          <h3 className="text-lg font-medium text-gray-900 mb-1">{title}</h3>
          {description && (
            <p className="text-sm text-gray-600">{description}</p>
          )}
        </div>
      )}
      <div className="space-y-4">{children}</div>
    </div>
  )
}

