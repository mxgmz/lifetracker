export default function PageTitle({ title, subtitle }) {
  return (
    <div className="mb-8">
      <h1 className="text-3xl font-semibold text-gray-900 mb-2">{title}</h1>
      {subtitle && <p className="text-gray-600">{subtitle}</p>}
    </div>
  )
}

