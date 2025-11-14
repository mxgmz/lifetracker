export default function ScriptureHeader({ scripture, reference }) {
  return (
    <div className="bg-gradient-to-r from-gray-50 to-white rounded-xl border border-gray-200 p-6 shadow-sm">
      <div className="flex items-start space-x-3">
        <div className="flex-shrink-0 mt-1">
          <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
          </svg>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm italic text-gray-700 leading-relaxed">
            "{scripture || 'Esfuérzate y sé valiente; no temas ni desmayes.'}"
          </p>
          <p className="text-xs text-gray-500 mt-2">
            — {reference || 'Josué 1:9'}
          </p>
        </div>
      </div>
    </div>
  )
}

