export default function PageHeader({ title, subtitle, scripture, reference }) {
  return (
    <div className="space-y-2 mb-8">
      <h1 className="text-4xl font-bold text-white tracking-tight font-display">
        {title}
      </h1>
      {subtitle && (
        <p className="text-lg text-gray-400 font-light leading-relaxed max-w-2xl">
          {subtitle}
        </p>
      )}
      {(scripture || reference) && (
        <div className="mt-6 p-4 glass-card border-l-4 border-blue-500/50">
          {scripture && (
            <p className="text-gray-300 italic font-light text-sm mb-2">
              "{scripture}"
            </p>
          )}
          {reference && (
            <p className="text-blue-400 text-xs font-medium uppercase tracking-wider">
              — {reference}
            </p>
          )}
        </div>
      )}
    </div>
  )
}

