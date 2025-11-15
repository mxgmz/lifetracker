'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  ResponsiveContainer,
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  AreaChart,
  Area,
  BarChart,
  Bar,
} from 'recharts'
import { supabase } from '@/lib/supabaseClient'
import MetricCard from '@/components/MetricCard'
import ChartCard from '@/components/ChartCard'
import {
  ArrowLeftIcon,
  FunnelIcon,
  AdjustmentsHorizontalIcon,
  ChartBarIcon,
} from '@heroicons/react/24/outline'

const rangePresets = [
  { id: '7d', label: 'Últimos 7 días', days: 7 },
  { id: '14d', label: '14 días', days: 14 },
  { id: '30d', label: '30 días', days: 30 },
  { id: '90d', label: '90 días', days: 90 },
  { id: 'custom', label: 'Personalizado', days: null },
]

const widgetCatalog = [
  {
    id: 'sleep',
    label: 'Sueño promedio',
    valueKey: 'avgSleep',
    deltaKey: 'sleepDelta',
    description: 'Horas dormidas por día',
    formatter: (v) => (v ? `${v.toFixed(1)} h` : '—'),
    color: 'blue',
  },
  {
    id: 'energy',
    label: 'Energía diaria',
    valueKey: 'avgEnergy',
    deltaKey: 'energyDelta',
    description: 'Autoevaluación 1-5',
    formatter: (v) => (v ? `${v.toFixed(1)}/5` : '—'),
    color: 'green',
  },
  {
    id: 'anxiety',
    label: 'Ansiedad',
    valueKey: 'avgAnxiety',
    deltaKey: 'anxietyDelta',
    description: 'Promedio emocional 1-5',
    formatter: (v) => (v ? `${v.toFixed(1)}/5` : '—'),
    color: 'amber',
  },
  {
    id: 'routineMorning',
    label: 'Rutina AM',
    valueKey: 'morningRoutine',
    deltaKey: 'routineMorningDelta',
    description: 'Score promedio',
    formatter: (v) => (v ? `${v.toFixed(0)}%` : '—'),
    color: 'indigo',
  },
  {
    id: 'routineNight',
    label: 'Rutina PM',
    valueKey: 'nightRoutine',
    deltaKey: 'routineNightDelta',
    description: 'Score nocturno promedio',
    formatter: (v) => (v ? `${v.toFixed(0)}%` : '—'),
    color: 'purple',
  },
  {
    id: 'hydration',
    label: 'Hidratación',
    valueKey: 'hydrationRate',
    description: 'Veces que tomaste agua',
    formatter: (v) => (v ? `${v.toFixed(0)}%` : '—'),
    color: 'blue',
  },
  {
    id: 'tentations',
    label: 'Tentaciones registradas',
    valueKey: 'tentaciones',
    description: 'Total en el rango',
    formatter: (v) => (v ?? 0),
    color: 'rose',
  },
  {
    id: 'studies',
    label: 'Estudios completados',
    valueKey: 'estudios',
    description: 'Sesiones registradas',
    formatter: (v) => (v ?? 0),
    color: 'green',
  },
  {
    id: 'practices',
    label: 'Prácticas espirituales',
    valueKey: 'practicas',
    description: 'Momentos registrados',
    formatter: (v) => (v ?? 0),
    color: 'purple',
  },
  {
    id: 'gratitude',
    label: 'Días con gratitud',
    valueKey: 'gratitudeDays',
    description: 'Jornadas agradecidas',
    formatter: (v) => (v ?? 0),
    color: 'amber',
  },
  {
    id: 'metaCompletion',
    label: 'Cumplimiento de metas',
    valueKey: 'metaCompletion',
    description: 'Metas completadas',
    formatter: (v) => (v ? `${v.toFixed(0)}%` : '—'),
    color: 'green',
  },
  {
    id: 'journal',
    label: 'Entradas de journal',
    valueKey: 'journalCount',
    description: 'Reflexiones escritas',
    formatter: (v) => (v ?? 0),
    color: 'gray',
  },
]

const initialWidgets = widgetCatalog.slice(0, 6).map((w) => w.id)

const todayISO = () => new Date().toISOString().split('T')[0]

const calcAverage = (values) => {
  const filtered = values.filter((v) => typeof v === 'number' && !Number.isNaN(v))
  if (!filtered.length) return null
  return filtered.reduce((sum, val) => sum + val, 0) / filtered.length
}

const calcDelta = (series) => {
  if (!series?.length) return null
  const first = series.find((item) => typeof item.value === 'number' && !Number.isNaN(item.value))
  const last = [...series]
    .reverse()
    .find((item) => typeof item.value === 'number' && !Number.isNaN(item.value))
  if (!first || !last || !first.value) return null
  return ((last.value - first.value) / first.value) * 100
}

const groupTimeline = (timeline = []) => {
  const map = timeline.reduce((acc, entry) => {
    const key = entry.date_key
    if (!acc[key]) {
      acc[key] = {
        date: key,
        ansiedad: [],
        enfoque: [],
        motivacion: [],
        animo: [],
      }
    }
    acc[key].ansiedad.push(entry.ansiedad)
    acc[key].enfoque.push(entry.enfoque)
    acc[key].motivacion.push(entry.motivacion)
    acc[key].animo.push(entry.animo)
    return acc
  }, {})

  return Object.values(map)
    .sort((a, b) => new Date(a.date) - new Date(b.date))
    .map((day) => ({
      date: day.date,
      ansiedad: calcAverage(day.ansiedad),
      enfoque: calcAverage(day.enfoque),
      motivacion: calcAverage(day.motivacion),
      animo: calcAverage(day.animo),
    }))
}

export default function AnalyticsPage() {
  const router = useRouter()
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [isFetching, setIsFetching] = useState(false)
  const [range, setRange] = useState('30d')
  const [customRange, setCustomRange] = useState({ from: '', to: '' })
  const [selectedWidgets, setSelectedWidgets] = useState(initialWidgets)
  const [analyticsData, setAnalyticsData] = useState({
    habits: [],
    registros: [],
    timeline: [],
    metas: [],
    gratitudes: [],
    journal: [],
  })
  const [metricSummary, setMetricSummary] = useState({})

  useEffect(() => {
    const checkUser = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession()
      if (!session) {
        router.push('/login')
      } else {
        setUser(session.user)
      }
      setLoading(false)
    }
    checkUser()
  }, [router])

  useEffect(() => {
    if (!user) return
    const { startDate, endDate } = deriveRange(range, customRange)
    fetchAnalytics(user.id, startDate, endDate)
  }, [user, range, customRange])

  const deriveRangeLabel = useMemo(() => {
    if (range !== 'custom') {
      const preset = rangePresets.find((p) => p.id === range)
      return preset?.label ?? ''
    }
    if (customRange.from && customRange.to) {
      return `${customRange.from} → ${customRange.to}`
    }
    return 'Rango personalizado'
  }, [range, customRange])

  const fetchAnalytics = async (userId, startDate, endDate) => {
    setIsFetching(true)
    try {
      const [habitsRes, registrosRes, timelineRes, metasRes, gratitudeRes, journalRes] =
        await Promise.all([
          supabase
            .from('fact_habitos_diarios')
            .select(
              'fact_id, date_key, sueno_horas, energia_diaria, ansiedad, enfoque, motivacion, claridad_mental, rutina_manana_score, rutina_noche_score, agua_tomada_manana, agua_tomada_tarde, micro_reset_realizado'
            )
            .eq('user_id', userId)
            .gte('date_key', startDate)
            .lte('date_key', endDate)
            .order('date_key', { ascending: true }),
          supabase
            .from('v_fact_registros_diarios')
            .select('date_key, num_ejercicios, num_estudios, num_tentaciones, num_practicas_espirituales')
            .eq('user_id', userId)
            .gte('date_key', startDate)
            .lte('date_key', endDate)
            .order('date_key', { ascending: true }),
          supabase
            .from('v_timeline_emocional_dia')
            .select('date_key, ansiedad, enfoque, motivacion, animo')
            .eq('user_id', userId)
            .gte('date_key', startDate)
            .lte('date_key', endDate)
            .order('date_key', { ascending: true }),
          supabase
            .from('dim_metas')
            .select('date_key, cumplida')
            .eq('user_id', userId)
            .gte('date_key', startDate)
            .lte('date_key', endDate),
          supabase
            .from('dim_gratitud')
            .select('date_key')
            .eq('user_id', userId)
            .gte('date_key', startDate)
            .lte('date_key', endDate),
          supabase
            .from('journal_entries')
            .select('id, date_key, title, categoria, emocion_predominante')
            .eq('user_id', userId)
            .gte('date_key', startDate)
            .lte('date_key', endDate)
            .order('date_key', { ascending: false }),
        ])

      const error =
        habitsRes.error ||
        registrosRes.error ||
        timelineRes.error ||
        metasRes.error ||
        gratitudeRes.error ||
        journalRes.error
      if (error) throw error

      const newData = {
        habits: habitsRes.data ?? [],
        registros: registrosRes.data ?? [],
        timeline: timelineRes.data ?? [],
        metas: metasRes.data ?? [],
        gratitudes: gratitudeRes.data ?? [],
        journal: journalRes.data ?? [],
      }

      setAnalyticsData(newData)
      setMetricSummary(buildMetricSummary(newData))
    } catch (error) {
      console.error('Failed to fetch analytics:', error)
      alert('No se pudo cargar el dashboard. Revisa tu conexión o vuelve a intentar.')
    } finally {
      setIsFetching(false)
    }
  }

  const sleepTrendData = useMemo(
    () =>
      analyticsData.habits.map((item) => ({
        date: item.date_key,
        value: item.sueno_horas ? Number(item.sueno_horas) : null,
      })),
    [analyticsData.habits]
  )

  const emotionTrendData = useMemo(
    () => groupTimeline(analyticsData.timeline),
    [analyticsData.timeline]
  )

  const habitComplianceData = useMemo(
    () =>
      analyticsData.registros.map((row) => ({
        date: row.date_key,
        ejercicios: row.num_ejercicios || 0,
        estudios: row.num_estudios || 0,
        tentaciones: row.num_tentaciones || 0,
        espirituales: row.num_practicas_espirituales || 0,
      })),
    [analyticsData.registros]
  )

  const journalEntries = analyticsData.journal ?? []

  const handleWidgetToggle = (id) => {
    setSelectedWidgets((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    )
  }

  const handleSelectAll = () => {
    setSelectedWidgets(widgetCatalog.map((w) => w.id))
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <span className="text-gray-500">Cargando...</span>
      </div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-6xl mx-auto space-y-8">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <p className="text-xs uppercase text-gray-500 tracking-wide">BI PERSONAL</p>
            <h1 className="text-3xl font-semibold text-gray-900">Dashboard de Vida</h1>
            <p className="text-sm text-gray-500">
              Analiza tus hábitos, emociones y victorias espirituales.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => router.back()}
              className="inline-flex items-center text-sm text-gray-500 hover:text-gray-900 transition"
            >
              <ArrowLeftIcon className="w-4 h-4 mr-1" />
              Volver
            </button>
          </div>
        </div>

        <section className="bg-white border border-gray-100 rounded-2xl shadow-sm p-5 space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-2 text-sm text-gray-700 font-medium">
              <FunnelIcon className="w-4 h-4" />
              <span>Filtros avanzados</span>
            </div>
            {isFetching && <span className="text-xs text-gray-400">Actualizando datos...</span>}
          </div>
          <div className="flex flex-wrap gap-2">
            {rangePresets.map((preset) => (
              <button
                key={preset.id}
                onClick={() => setRange(preset.id)}
                className={`px-3 py-2 rounded-full text-xs font-medium border transition ${
                  range === preset.id
                    ? 'bg-gray-900 text-white border-gray-900'
                    : 'border-gray-200 text-gray-600 hover:border-gray-400'
                }`}
              >
                {preset.label}
              </button>
            ))}
          </div>
          {range === 'custom' && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-gray-500 mb-1">Desde</label>
                <input
                  type="date"
                  value={customRange.from}
                  onChange={(e) => setCustomRange((prev) => ({ ...prev, from: e.target.value }))}
                  className="w-full rounded-xl border-gray-200 focus:ring-2 focus:ring-gray-800 focus:border-gray-800 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Hasta</label>
                <input
                  type="date"
                  value={customRange.to}
                  onChange={(e) => setCustomRange((prev) => ({ ...prev, to: e.target.value }))}
                  className="w-full rounded-xl border-gray-200 focus:ring-2 focus:ring-gray-800 focus:border-gray-800 text-sm"
                />
              </div>
            </div>
          )}
          <p className="text-xs text-gray-400">
            Rango activo: <span className="font-semibold text-gray-600">{deriveRangeLabel}</span>
          </p>
        </section>

        <section className="bg-white border border-gray-100 rounded-2xl shadow-sm p-5 space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-2 text-sm text-gray-700 font-medium">
              <AdjustmentsHorizontalIcon className="w-4 h-4" />
              Personaliza tu tablero
            </div>
            <button
              onClick={handleSelectAll}
              className="text-xs text-gray-500 hover:text-gray-900 transition"
            >
              Seleccionar todo
            </button>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {widgetCatalog.map((widget) => (
              <label
                key={widget.id}
                className={`flex items-center gap-2 text-xs font-medium rounded-2xl border px-3 py-2 cursor-pointer transition ${
                  selectedWidgets.includes(widget.id)
                    ? 'bg-gray-900 text-white border-gray-900'
                    : 'border-gray-200 text-gray-600 hover:border-gray-400'
                }`}
              >
                <input
                  type="checkbox"
                  className="hidden"
                  checked={selectedWidgets.includes(widget.id)}
                  onChange={() => handleWidgetToggle(widget.id)}
                />
                {widget.label}
              </label>
            ))}
          </div>
        </section>

        <section>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {widgetCatalog
              .filter((widget) => selectedWidgets.includes(widget.id))
              .map((widget) => (
                <MetricCard
                  key={widget.id}
                  title={widget.label}
                  value={widget.formatter(metricSummary[widget.valueKey])}
                  description={widget.description}
                  delta={widget.deltaKey ? metricSummary[widget.deltaKey] : null}
                  color={widget.color}
                />
              ))}
          </div>
        </section>

        <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ChartCard
            title="Tendencia de sueño"
            subtitle="Horas registradas por día"
            actions={<span className="text-xs text-gray-400">{deriveRangeLabel}</span>}
          >
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={sleepTrendData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis
                  dataKey="date"
                  stroke="#94a3b8"
                  fontSize={12}
                  tickFormatter={(value) => formatShortDate(value)}
                />
                <YAxis stroke="#94a3b8" fontSize={12} />
                <Tooltip content={<DefaultTooltip />} />
                <Line
                  type="monotone"
                  dataKey="value"
                  stroke="#2563eb"
                  strokeWidth={2}
                  dot={{ r: 3 }}
                  activeDot={{ r: 5 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard
            title="Clima emocional"
            subtitle="Ansiedad, enfoque y motivación promedio"
            actions={<span className="text-xs text-gray-400">{deriveRangeLabel}</span>}
          >
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={emotionTrendData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis
                  dataKey="date"
                  stroke="#94a3b8"
                  fontSize={12}
                  tickFormatter={(value) => formatShortDate(value)}
                />
                <YAxis stroke="#94a3b8" fontSize={12} domain={[0, 5]} />
                <Tooltip content={<DefaultTooltip />} />
                <Line
                  type="monotone"
                  dataKey="ansiedad"
                  stroke="#f97316"
                  strokeWidth={2}
                  name="Ansiedad"
                />
                <Line
                  type="monotone"
                  dataKey="enfoque"
                  stroke="#22c55e"
                  strokeWidth={2}
                  name="Enfoque"
                />
                <Line
                  type="monotone"
                  dataKey="motivacion"
                  stroke="#8b5cf6"
                  strokeWidth={2}
                  name="Motivación"
                />
              </LineChart>
            </ResponsiveContainer>
          </ChartCard>
        </section>

        <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ChartCard
            title="Hábitos registrados"
            subtitle="Ejecuciones por día"
            actions={<LegendLayout />}
          >
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={habitComplianceData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis
                  dataKey="date"
                  stroke="#94a3b8"
                  fontSize={12}
                  tickFormatter={(value) => formatShortDate(value)}
                />
                <YAxis stroke="#94a3b8" fontSize={12} />
                <Tooltip content={<DefaultTooltip />} />
                <Bar dataKey="ejercicios" stackId="a" fill="#22c55e" name="Ejercicio" />
                <Bar dataKey="estudios" stackId="a" fill="#0ea5e9" name="Estudio" />
                <Bar dataKey="espirituales" stackId="a" fill="#a855f7" name="Espiritual" />
                <Bar dataKey="tentaciones" stackId="a" fill="#f97316" name="Tentaciones" />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard
            title="Micro-resets & Agua"
            subtitle="Indicadores de disciplina física"
            actions={<span className="text-xs text-gray-400">{deriveRangeLabel}</span>}
          >
            <ResponsiveContainer width="100%" height={260}>
              <AreaChart data={buildWellnessSeries(analyticsData.habits)}>
                <defs>
                  <linearGradient id="colorWater" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.5} />
                    <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorReset" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#22c55e" stopOpacity={0.5} />
                    <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis
                  dataKey="date"
                  stroke="#94a3b8"
                  fontSize={12}
                  tickFormatter={(value) => formatShortDate(value)}
                />
                <YAxis stroke="#94a3b8" fontSize={12} />
                <Tooltip content={<DefaultTooltip />} />
                <Area
                  type="monotone"
                  dataKey="agua"
                  stroke="#0ea5e9"
                  fill="url(#colorWater)"
                  name="Veces que tomaste agua"
                />
                <Area
                  type="monotone"
                  dataKey="microReset"
                  stroke="#22c55e"
                  fill="url(#colorReset)"
                  name="Micro reset"
                />
              </AreaChart>
            </ResponsiveContainer>
          </ChartCard>
        </section>

        <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-sm font-semibold text-gray-900">Journal & Reflexiones</p>
                <p className="text-xs text-gray-500">
                  {journalEntries.length
                    ? `${journalEntries.length} entradas en este rango`
                    : 'Sin registros'}
                </p>
              </div>
              <ChartBarIcon className="w-4 h-4 text-gray-400" />
            </div>
            <div className="space-y-4 max-h-[320px] overflow-y-auto pr-2 custom-scroll">
              {journalEntries.length === 0 && (
                <p className="text-sm text-gray-500">
                  Aún no escribes journal en este rango. Ve a la sección Journal para comenzar.
                </p>
              )}
              {journalEntries.map((entry) => (
                <button
                  key={entry.id}
                  onClick={() => router.push(`/journal?date=${entry.date_key}`)}
                  className="w-full text-left border border-gray-100 rounded-2xl p-4 hover:border-gray-300 transition bg-white"
                >
                  <p className="text-xs text-gray-400">{formatLongDate(entry.date_key)}</p>
                  <p className="text-sm font-semibold text-gray-900">{entry.title || 'Sin título'}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    {entry.categoria || 'General'} • {entry.emocion_predominante || 'Sin emoción'}
                  </p>
                </button>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-gray-900">Resumen diario</p>
                <p className="text-xs text-gray-500">
                  Acceso rápido a tus registros individuales
                </p>
              </div>
              <button
                onClick={() => router.push('/dia')}
                className="text-xs text-gray-500 hover:text-gray-900 transition"
              >
                Ver historial
              </button>
            </div>
            <div className="max-h-[320px] overflow-y-auto pr-2 custom-scroll">
              <table className="min-w-full text-left text-sm">
                <thead className="text-xs uppercase text-gray-400">
                  <tr>
                    <th className="py-2">Fecha</th>
                    <th>Rutinas</th>
                    <th>Habits</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody className="text-gray-700">
                  {analyticsData.habits.map((day) => (
                    <tr key={day.fact_id} className="border-t border-gray-50">
                      <td className="py-2">{formatLongDate(day.date_key)}</td>
                      <td>
                        {day.rutina_manana_score ? `${day.rutina_manana_score}% AM` : '--'} /{' '}
                        {day.rutina_noche_score ? `${day.rutina_noche_score}% PM` : '--'}
                      </td>
                      <td>
                        {day.energia_diaria ? `${day.energia_diaria}/5 energía` : '—'}
                      </td>
                      <td>
                        <button
                          onClick={() => router.push(`/dia?date=${day.date_key}`)}
                          className="text-xs text-gray-500 hover:text-gray-900 transition"
                        >
                          Abrir
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}

function deriveRange(range, customRange) {
  const endDate = range === 'custom' && customRange.to ? customRange.to : todayISO()
  if (range === 'custom') {
    return {
      startDate: customRange.from || endDate,
      endDate,
    }
  }
  const preset = rangePresets.find((p) => p.id === range)
  const days = preset?.days ?? 30
  const start = new Date(endDate)
  start.setDate(start.getDate() - (days - 1))
  return {
    startDate: start.toISOString().split('T')[0],
    endDate,
  }
}

function buildMetricSummary(data) {
  const { habits, registros, metas, gratitudes, journal } = data
  const sleepSeries = habits.map((item) => ({
    date: item.date_key,
    value: item.sueno_horas ? Number(item.sueno_horas) : null,
  }))
  const energySeries = habits.map((item) => ({
    date: item.date_key,
    value: item.energia_diaria ? Number(item.energia_diaria) : null,
  }))
  const anxietySeries = habits.map((item) => ({
    date: item.date_key,
    value: item.ansiedad ? Number(item.ansiedad) : null,
  }))
  const morningRoutineSeries = habits.map((item) => ({
    date: item.date_key,
    value: item.rutina_manana_score ? Number(item.rutina_manana_score) : null,
  }))
  const nightRoutineSeries = habits.map((item) => ({
    date: item.date_key,
    value: item.rutina_noche_score ? Number(item.rutina_noche_score) : null,
  }))

  const hydrationEntries = habits.length * 2
  const hydrationTotal = habits.reduce(
    (sum, item) =>
      sum + (item.agua_tomada_manana ? 1 : 0) + (item.agua_tomada_tarde ? 1 : 0),
    0
  )

  const tentaciones = registros.reduce((sum, row) => sum + (row.num_tentaciones || 0), 0)
  const estudios = registros.reduce((sum, row) => sum + (row.num_estudios || 0), 0)
  const practicas = registros.reduce(
    (sum, row) => sum + (row.num_practicas_espirituales || 0),
    0
  )
  const gratitudeDays = new Set(gratitudes.map((g) => g.date_key)).size

  const metaStats = metas.reduce(
    (acc, meta) => {
      acc.total += 1
      if (meta.cumplida === true) acc.done += 1
      return acc
    },
    { total: 0, done: 0 }
  )

  return {
    avgSleep: calcAverage(sleepSeries.map((item) => item.value)),
    sleepDelta: calcDelta(sleepSeries),
    avgEnergy: calcAverage(energySeries.map((item) => item.value)),
    energyDelta: calcDelta(energySeries),
    avgAnxiety: calcAverage(anxietySeries.map((item) => item.value)),
    anxietyDelta: calcDelta(anxietySeries),
    morningRoutine: calcAverage(morningRoutineSeries.map((item) => item.value)),
    routineMorningDelta: calcDelta(morningRoutineSeries),
    nightRoutine: calcAverage(nightRoutineSeries.map((item) => item.value)),
    routineNightDelta: calcDelta(nightRoutineSeries),
    hydrationRate: hydrationEntries ? (hydrationTotal / hydrationEntries) * 100 : null,
    tentaciones,
    estudios,
    practicas,
    gratitudeDays,
    metaCompletion:
      metaStats.total > 0 ? (metaStats.done / metaStats.total) * 100 : null,
    journalCount: journal.length,
  }
}

function buildWellnessSeries(habits = []) {
  return habits.map((item) => ({
    date: item.date_key,
    agua: (item.agua_tomada_manana ? 1 : 0) + (item.agua_tomada_tarde ? 1 : 0),
    microReset: item.micro_reset_realizado ? 1 : 0,
  }))
}

function formatShortDate(dateString) {
  if (!dateString) return ''
  return new Date(dateString).toLocaleDateString('es-MX', { month: 'short', day: 'numeric' })
}

function formatLongDate(dateString) {
  if (!dateString) return ''
  return new Date(dateString).toLocaleDateString('es-MX', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  })
}

function DefaultTooltip({ active, payload, label }) {
  if (!active || !payload || !payload.length) return null
  return (
    <div className="bg-white/90 backdrop-blur border border-gray-100 rounded-xl px-3 py-2 shadow-lg">
      <p className="text-xs font-semibold text-gray-700 mb-1">{formatLongDate(label)}</p>
      <ul className="space-y-1">
        {payload.map((entry) => (
          <li key={entry.dataKey} className="text-xs text-gray-600 flex items-center gap-2">
            <span
              className="inline-block w-2 h-2 rounded-full"
              style={{ backgroundColor: entry.color }}
            />
            {entry.name || entry.dataKey}: <strong>{entry.value ?? '—'}</strong>
          </li>
        ))}
      </ul>
    </div>
  )
}

function LegendLayout() {
  return (
    <div className="flex items-center gap-2 text-xs text-gray-400">
      <span>Ejercicios</span>
      <span>• Estudios</span>
      <span>• Espiritual</span>
      <span>• Tentaciones</span>
    </div>
  )
}

