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
      <div className="min-h-screen flex items-center justify-center bg-[#050507]">
        <span className="text-white/50 animate-pulse font-light tracking-widest">CARGANDO DATOS...</span>
      </div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <div className="min-h-screen bg-[#050507] text-white py-8 px-4">
      <div className="max-w-6xl mx-auto space-y-8">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <p className="text-xs uppercase text-blue-400 tracking-widest font-medium mb-1">BI PERSONAL</p>
            <h1 className="text-3xl font-display font-bold text-white tracking-tight">Dashboard de Vida</h1>
            <p className="text-sm text-white/50 mt-1">
              Analiza tus hábitos, emociones y victorias espirituales.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => router.back()}
              className="inline-flex items-center text-sm text-white/50 hover:text-white transition-colors"
            >
              <ArrowLeftIcon className="w-4 h-4 mr-1" />
              Volver
            </button>
          </div>
        </div>

        <section className="glass-card p-6 space-y-6">
          <div className="flex items-center justify-between flex-wrap gap-3 border-b border-white/5 pb-4">
            <div className="flex items-center gap-2 text-sm text-white/80 font-medium">
              <FunnelIcon className="w-4 h-4 text-blue-400" />
              <span>Filtros avanzados</span>
            </div>
            {isFetching && <span className="text-xs text-blue-400 animate-pulse">Actualizando datos...</span>}
          </div>
          <div className="flex flex-wrap gap-2">
            {rangePresets.map((preset) => (
              <button
                key={preset.id}
                onClick={() => setRange(preset.id)}
                className={`px-4 py-2 rounded-xl text-xs font-medium transition-all ${range === preset.id
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/20'
                  : 'bg-white/5 text-white/60 hover:bg-white/10 hover:text-white'
                  }`}
              >
                {preset.label}
              </button>
            ))}
          </div>
          {range === 'custom' && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-white/50 mb-2 ml-1">Desde</label>
                <input
                  type="date"
                  value={customRange.from}
                  onChange={(e) => setCustomRange((prev) => ({ ...prev, from: e.target.value }))}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent transition-all hover:bg-white/10 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs text-white/50 mb-2 ml-1">Hasta</label>
                <input
                  type="date"
                  value={customRange.to}
                  onChange={(e) => setCustomRange((prev) => ({ ...prev, to: e.target.value }))}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent transition-all hover:bg-white/10 text-sm"
                />
              </div>
            </div>
          )}
          <p className="text-xs text-white/40">
            Rango activo: <span className="font-semibold text-blue-400">{deriveRangeLabel}</span>
          </p>
        </section>

        <section className="glass-card p-6 space-y-6">
          <div className="flex items-center justify-between flex-wrap gap-3 border-b border-white/5 pb-4">
            <div className="flex items-center gap-2 text-sm text-white/80 font-medium">
              <AdjustmentsHorizontalIcon className="w-4 h-4 text-purple-400" />
              Personaliza tu tablero
            </div>
            <button
              onClick={handleSelectAll}
              className="text-xs text-white/50 hover:text-white transition-colors"
            >
              Seleccionar todo
            </button>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {widgetCatalog.map((widget) => (
              <label
                key={widget.id}
                className={`flex items-center gap-2 text-xs font-medium rounded-xl px-3 py-2 cursor-pointer transition-all border ${selectedWidgets.includes(widget.id)
                  ? 'bg-white/10 text-white border-white/20'
                  : 'bg-transparent border-white/5 text-white/40 hover:border-white/10 hover:text-white/60'
                  }`}
              >
                <input
                  type="checkbox"
                  className="hidden"
                  checked={selectedWidgets.includes(widget.id)}
                  onChange={() => handleWidgetToggle(widget.id)}
                />
                <div className={`w-2 h-2 rounded-full ${selectedWidgets.includes(widget.id) ? 'bg-blue-400 shadow-[0_0_8px_rgba(96,165,250,0.5)]' : 'bg-white/10'}`} />
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
            actions={<span className="text-xs text-white/40">{deriveRangeLabel}</span>}
          >
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={sleepTrendData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis
                  dataKey="date"
                  stroke="rgba(255,255,255,0.3)"
                  fontSize={10}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(value) => formatShortDate(value)}
                  dy={10}
                />
                <YAxis
                  stroke="rgba(255,255,255,0.3)"
                  fontSize={10}
                  tickLine={false}
                  axisLine={false}
                  dx={-10}
                />
                <Tooltip content={<DefaultTooltip />} cursor={{ stroke: 'rgba(255,255,255,0.1)', strokeWidth: 2 }} />
                <Line
                  type="monotone"
                  dataKey="value"
                  stroke="#3b82f6"
                  strokeWidth={3}
                  dot={{ r: 4, fill: '#1e1e24', stroke: '#3b82f6', strokeWidth: 2 }}
                  activeDot={{ r: 6, fill: '#3b82f6', stroke: '#fff', strokeWidth: 2 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard
            title="Clima emocional"
            subtitle="Ansiedad, enfoque y motivación promedio"
            actions={<span className="text-xs text-white/40">{deriveRangeLabel}</span>}
          >
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={emotionTrendData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis
                  dataKey="date"
                  stroke="rgba(255,255,255,0.3)"
                  fontSize={10}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(value) => formatShortDate(value)}
                  dy={10}
                />
                <YAxis
                  stroke="rgba(255,255,255,0.3)"
                  fontSize={10}
                  tickLine={false}
                  axisLine={false}
                  domain={[0, 5]}
                  dx={-10}
                />
                <Tooltip content={<DefaultTooltip />} cursor={{ stroke: 'rgba(255,255,255,0.1)', strokeWidth: 2 }} />
                <Line
                  type="monotone"
                  dataKey="ansiedad"
                  stroke="#f97316"
                  strokeWidth={2}
                  dot={false}
                  name="Ansiedad"
                />
                <Line
                  type="monotone"
                  dataKey="enfoque"
                  stroke="#22c55e"
                  strokeWidth={2}
                  dot={false}
                  name="Enfoque"
                />
                <Line
                  type="monotone"
                  dataKey="motivacion"
                  stroke="#8b5cf6"
                  strokeWidth={2}
                  dot={false}
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
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis
                  dataKey="date"
                  stroke="rgba(255,255,255,0.3)"
                  fontSize={10}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(value) => formatShortDate(value)}
                  dy={10}
                />
                <YAxis
                  stroke="rgba(255,255,255,0.3)"
                  fontSize={10}
                  tickLine={false}
                  axisLine={false}
                  dx={-10}
                />
                <Tooltip content={<DefaultTooltip />} cursor={{ fill: 'rgba(255,255,255,0.05)' }} />
                <Bar dataKey="ejercicios" stackId="a" fill="#22c55e" name="Ejercicio" radius={[0, 0, 0, 0]} />
                <Bar dataKey="estudios" stackId="a" fill="#0ea5e9" name="Estudio" radius={[0, 0, 0, 0]} />
                <Bar dataKey="espirituales" stackId="a" fill="#a855f7" name="Espiritual" radius={[0, 0, 0, 0]} />
                <Bar dataKey="tentaciones" stackId="a" fill="#f97316" name="Tentaciones" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard
            title="Micro-resets & Agua"
            subtitle="Indicadores de disciplina física"
            actions={<span className="text-xs text-white/40">{deriveRangeLabel}</span>}
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
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis
                  dataKey="date"
                  stroke="rgba(255,255,255,0.3)"
                  fontSize={10}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(value) => formatShortDate(value)}
                  dy={10}
                />
                <YAxis
                  stroke="rgba(255,255,255,0.3)"
                  fontSize={10}
                  tickLine={false}
                  axisLine={false}
                  dx={-10}
                />
                <Tooltip content={<DefaultTooltip />} cursor={{ stroke: 'rgba(255,255,255,0.1)', strokeWidth: 2 }} />
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
          <div className="glass-card p-6">
            <div className="flex items-center justify-between mb-6 border-b border-white/5 pb-4">
              <div>
                <p className="text-sm font-semibold text-white">Journal & Reflexiones</p>
                <p className="text-xs text-white/40">
                  {journalEntries.length
                    ? `${journalEntries.length} entradas en este rango`
                    : 'Sin registros'}
                </p>
              </div>
              <ChartBarIcon className="w-4 h-4 text-white/30" />
            </div>
            <div className="space-y-3 max-h-[320px] overflow-y-auto pr-2 custom-scroll">
              {journalEntries.length === 0 && (
                <p className="text-sm text-white/30 italic text-center py-8">
                  Aún no escribes journal en este rango.
                </p>
              )}
              {journalEntries.map((entry) => (
                <button
                  key={entry.id}
                  onClick={() => router.push(`/journal?date=${entry.date_key}`)}
                  className="w-full text-left border border-white/5 rounded-xl p-4 hover:bg-white/5 transition-all group"
                >
                  <div className="flex justify-between items-start mb-1">
                    <p className="text-xs text-blue-400 font-medium">{formatLongDate(entry.date_key)}</p>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/5 text-white/40 border border-white/5 group-hover:border-white/10 transition-colors">
                      {entry.categoria || 'General'}
                    </span>
                  </div>
                  <p className="text-sm font-medium text-white group-hover:text-blue-200 transition-colors">{entry.title || 'Sin título'}</p>
                  <p className="text-xs text-white/40 mt-1">
                    {entry.emocion_predominante || 'Sin emoción registrada'}
                  </p>
                </button>
              ))}
            </div>
          </div>

          <div className="glass-card p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-white/5 pb-4">
              <div>
                <p className="text-sm font-semibold text-white">Resumen diario</p>
                <p className="text-xs text-white/40">
                  Acceso rápido a tus registros individuales
                </p>
              </div>
              <button
                onClick={() => router.push('/dia')}
                className="text-xs text-blue-400 hover:text-blue-300 transition-colors"
              >
                Ver historial completo
              </button>
            </div>
            <div className="max-h-[320px] overflow-y-auto pr-2 custom-scroll">
              <table className="min-w-full text-left text-sm">
                <thead className="text-xs uppercase text-white/30 font-medium sticky top-0 bg-[#0A0A0F] z-10">
                  <tr>
                    <th className="py-2 font-medium">Fecha</th>
                    <th className="font-medium">Rutinas</th>
                    <th className="font-medium">Energía</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody className="text-white/70 divide-y divide-white/5">
                  {analyticsData.habits.map((day) => (
                    <tr key={day.fact_id} className="hover:bg-white/5 transition-colors group">
                      <td className="py-3 text-white/50 group-hover:text-white transition-colors">{formatLongDate(day.date_key)}</td>
                      <td>
                        <div className="flex flex-col gap-0.5">
                          <span className="text-xs"><span className="text-indigo-400">AM:</span> {day.rutina_manana_score ? `${day.rutina_manana_score}%` : '--'}</span>
                          <span className="text-xs"><span className="text-purple-400">PM:</span> {day.rutina_noche_score ? `${day.rutina_noche_score}%` : '--'}</span>
                        </div>
                      </td>
                      <td>
                        {day.energia_diaria ? (
                          <div className="flex items-center gap-1">
                            <span className={`w-2 h-2 rounded-full ${day.energia_diaria >= 4 ? 'bg-green-500' : day.energia_diaria >= 3 ? 'bg-yellow-500' : 'bg-red-500'}`} />
                            {day.energia_diaria}/5
                          </div>
                        ) : '—'}
                      </td>
                      <td className="text-right">
                        <button
                          onClick={() => router.push(`/dia?date=${day.date_key}`)}
                          className="text-xs text-white/30 hover:text-white transition-colors px-2 py-1 rounded hover:bg-white/10"
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
    <div className="bg-[#1a1a20]/90 backdrop-blur-md border border-white/10 rounded-xl px-4 py-3 shadow-xl">
      <p className="text-xs font-semibold text-white mb-2 border-b border-white/10 pb-1">{formatLongDate(label)}</p>
      <ul className="space-y-1.5">
        {payload.map((entry) => (
          <li key={entry.dataKey} className="text-xs text-white/70 flex items-center gap-2">
            <span
              className="inline-block w-2 h-2 rounded-full shadow-[0_0_4px_currentColor]"
              style={{ backgroundColor: entry.color, color: entry.color }}
            />
            {entry.name || entry.dataKey}: <strong className="text-white">{entry.value ?? '—'}</strong>
          </li>
        ))}
      </ul>
    </div>
  )
}

function LegendLayout() {
  return (
    <div className="flex items-center gap-3 text-[10px] text-white/40 uppercase tracking-wider font-medium">
      <div className="flex items-center gap-1"><div className="w-1.5 h-1.5 rounded-full bg-[#22c55e]" />Ejercicios</div>
      <div className="flex items-center gap-1"><div className="w-1.5 h-1.5 rounded-full bg-[#0ea5e9]" />Estudios</div>
      <div className="flex items-center gap-1"><div className="w-1.5 h-1.5 rounded-full bg-[#a855f7]" />Espiritual</div>
      <div className="flex items-center gap-1"><div className="w-1.5 h-1.5 rounded-full bg-[#f97316]" />Tentaciones</div>
    </div>
  )
}

