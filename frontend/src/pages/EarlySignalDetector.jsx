import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import axios from 'axios'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import { PageLayout } from '../components/PageLayout'
import { DataPanel } from '../components/ui/DataPanel'

const FALLBACK_DATA = {
  metrics: { high_severity: 2, total_signals: 5, coordinated_wallets: 3 },
  timeline: [
    { wallet: 'vitalik', intensity: 13, large_transfers: 2 },
    { wallet: 'wintermute', intensity: 21, large_transfers: 4 },
    { wallet: 'jump_trading', intensity: 17, large_transfers: 3 },
    { wallet: 'alameda_research', intensity: 10, large_transfers: 1 },
    { wallet: 'paradigm', intensity: 15, large_transfers: 2 },
  ],
  signals: [
    {
      type: 'coordination',
      severity: 'high',
      title: 'Multi-wallet synchronized activity',
      description: 'Three tracked wallets became active within the same two-hour window.',
      wallets: ['vitalik', 'wintermute', 'jump_trading'],
      recommended_action: 'Shift to defensive risk sizing until directional confirmation appears.',
      timestamp: Date.now() / 1000,
    },
  ],
}

function severityClass(severity) {
  if (severity === 'high') return 'text-red-300 border-red-500/30 bg-red-500/10'
  if (severity === 'medium') return 'text-amber-300 border-amber-500/30 bg-amber-500/10'
  return 'text-emerald-300 border-emerald-500/30 bg-emerald-500/10'
}

function formatTime(ts) {
  return new Date(ts * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

export default function EarlySignalDetector() {
  const [data, setData] = useState({ metrics: { high_severity: 0, total_signals: 0, coordinated_wallets: 0 }, timeline: [], signals: [] })
  const [loading, setLoading] = useState(true)
  const [lastUpdated, setLastUpdated] = useState(null)
  const [mode, setMode] = useState('loading')

  useEffect(() => {
    const adaptFromDashboardIntel = (intel) => {
      const alerts = intel?.whale_alerts || []
      const suspicionMap = intel?.suspicion_by_wallet || {}
      const timeline = Object.entries(suspicionMap).map(([wallet, value]) => ({
        wallet,
        intensity: value?.score ?? 0,
        large_transfers: Math.round((value?.breakdown?.large_transactions ?? 0) / 4),
      }))

      return {
        metrics: {
          high_severity: alerts.slice(0, 5).filter(item => (item.eth_value || 0) >= 1000).length,
          total_signals: alerts.length,
          coordinated_wallets: Math.min(alerts.length, 5),
        },
        timeline,
        signals: alerts.map(item => ({
          type: 'accumulation',
          severity: (item.eth_value || 0) >= 1000 ? 'high' : 'medium',
          title: `Significant transfer by ${item.wallet_label}`,
          description: item.message,
          wallets: [item.wallet_id],
          recommended_action: 'Monitor follow-up flow before changing directional bias.',
          timestamp: item.timestamp,
        })),
      }
    }

    const loadData = () => {
      axios.get('/api/dashboard/intel')
        .then(r => {
          setData(adaptFromDashboardIntel(r.data))
          setMode('live')
          setLastUpdated(new Date((r.data?.generated_at || Date.now() / 1000) * 1000))
        })
        .catch(() => {
          setData({ metrics: { high_severity: 0, total_signals: 0, coordinated_wallets: 0 }, timeline: [], signals: [] })
          setMode('unavailable')
          setLastUpdated(new Date())
        })
        .finally(() => setLoading(false))
    }

    loadData()
    const id = setInterval(loadData, 30000)
    return () => clearInterval(id)
  }, [])

  return (
    <PageLayout
      title="Early Signal Detector"
      subtitle="Real-time detection of unusual accumulation, heavy outflows, and coordinated whale activity before broad market reaction"
    >
      <div className="mb-6 text-xs font-mono text-slate-500">
        Mode: <span className={mode === 'live' ? 'text-emerald-400' : mode === 'loading' ? 'text-slate-400' : 'text-blue-400'}>{mode}</span>
        {lastUpdated && <span> | Last updated {lastUpdated.toLocaleTimeString()}</span>}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {[
          { label: 'High Severity Signals', value: data.metrics?.high_severity ?? 0 },
          { label: 'Total Signals', value: data.metrics?.total_signals ?? 0 },
          { label: 'Coordinated Wallets', value: data.metrics?.coordinated_wallets ?? 0 },
        ].map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="rounded-lg border border-slate-800 bg-slate-950/40 p-6"
          >
            <p className="text-sm font-medium text-slate-400">{stat.label}</p>
            <p className="mt-2 text-3xl font-semibold text-slate-50">{stat.value}</p>
          </motion.div>
        ))}
      </div>

      <DataPanel title="Activity Intensity" subtitle="Wallet engagement levels" className="mb-8">
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data.timeline || []}>
              <XAxis dataKey="wallet" stroke="#64748b" fontSize={11} />
              <YAxis stroke="#64748b" fontSize={11} />
              <Tooltip cursor={{ fill: 'rgba(100, 116, 139, 0.1)' }} contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #475569' }} />
              <Bar dataKey="intensity" fill="#0ea5e9" radius={[6, 6, 0, 0]} />
              <Bar dataKey="large_transfers" fill="#10b981" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </DataPanel>

      <div className="space-y-4 mb-8">
        {(loading ? [] : data.signals || []).map((signal, idx) => (
          <motion.div
            key={`${signal.title}-${idx}`}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.05 }}
            className="rounded-lg border border-slate-800 bg-slate-950/40 p-6"
          >
            <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
              <p className="text-slate-50 font-semibold">{signal.title}</p>
              <span className={`font-mono text-xs px-2.5 py-1 rounded-full border ${severityClass(signal.severity)}`}>{signal.severity}</span>
            </div>
            <p className="text-slate-400 text-sm mb-2">{signal.description}</p>
            <p className="font-mono text-xs text-slate-500">Wallets: {(signal.wallets || []).join(', ') || 'N/A'} | {signal.timestamp ? formatTime(signal.timestamp) : 'N/A'}</p>
            <p className="text-sm text-slate-300 mt-3"><span className="font-mono text-cyan-400">→ Action:</span> {signal.recommended_action}</p>
          </motion.div>
        ))}
      </div>
    </PageLayout>
  )
}
