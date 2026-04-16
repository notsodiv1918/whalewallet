import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import axios from 'axios'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import { PageLayout } from '../components/PageLayout'
import { DataPanel } from '../components/ui/DataPanel'

const FALLBACK_ALERTS = [
  { message: 'Wintermute outflow pressure increased in the last 12 hours', timestamp: 1713380000 },
  { message: 'Multi-wallet activity overlap detected near event window', timestamp: 1713376400 },
]

const FALLBACK_TRENDS = [
  { name: 'Mon', tx: 52, suspicion: 45 },
  { name: 'Tue', tx: 63, suspicion: 50 },
  { name: 'Wed', tx: 48, suspicion: 42 },
  { name: 'Thu', tx: 70, suspicion: 59 },
  { name: 'Fri', tx: 81, suspicion: 65 },
]

export default function InteractiveInsightsDashboard() {
  const [alerts, setAlerts] = useState([])
  const [leaderboard, setLeaderboard] = useState([])
  const [trendPoints, setTrendPoints] = useState([])
  const [lastUpdated, setLastUpdated] = useState(null)
  const [mode, setMode] = useState('loading')

  useEffect(() => {
    const adaptLeaderboardFromIntel = (intel) => {
      const map = intel?.suspicion_by_wallet || {}
      return Object.entries(map)
        .map(([walletId, model]) => ({
          wallet_id: walletId,
          wallet_label: walletId.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
          score: model?.score ?? 0,
        }))
        .sort((a, b) => b.score - a.score)
    }

    const loadLive = () => {
      axios.get('/api/dashboard/intel')
        .then(r => {
          const intel = r.data || {}
          const alertRows = (intel.whale_alerts || []).map(item => ({ message: item.message, timestamp: item.timestamp }))
          setAlerts(alertRows)

          const suspicionScores = Object.values(intel.suspicion_by_wallet || {}).map(entry => entry?.score ?? 0)
          const avgSuspicion = suspicionScores.length
            ? Math.round(suspicionScores.reduce((acc, score) => acc + score, 0) / suspicionScores.length)
            : 0

          setTrendPoints(prev => {
            const point = {
              name: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              tx: alertRows.length,
              suspicion: avgSuspicion,
            }
            const base = prev.length ? prev : FALLBACK_TRENDS
            return [...base.slice(-11), point]
          })

          setLastUpdated(new Date((intel.generated_at || Date.now() / 1000) * 1000))
          setLeaderboard(adaptLeaderboardFromIntel(intel))
          setMode('live')
        })
        .catch(() => {
          setAlerts([])
          setLeaderboard([])
          setTrendPoints([])
          setMode('unavailable')
          setLastUpdated(new Date())
        })
    }

    loadLive()
    const id = setInterval(loadLive, 20000)
    return () => clearInterval(id)
  }, [])

  return (
    <PageLayout
      title="Interactive Insights Dashboard"
      subtitle="Unified console combining real-time alerts, trend monitoring, behavioral analysis, and wallet rankings"
    >
      <div className="mb-6 text-xs font-mono text-slate-500">
        Mode: <span className={mode === 'live' ? 'text-emerald-400' : mode === 'loading' ? 'text-slate-400' : 'text-blue-400'}>{mode}</span>
        {lastUpdated && <span> | Last updated {lastUpdated.toLocaleTimeString()}</span>}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1.3fr_1fr] gap-6 mb-6">
        <DataPanel title="Trend Analysis" subtitle="Transaction activity and suspicion levels over time">
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trendPoints.length ? trendPoints : []}>
                <XAxis dataKey="name" stroke="#64748b" fontSize={11} />
                <YAxis stroke="#64748b" fontSize={11} />
                <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #475569' }} />
                <Line type="monotone" dataKey="tx" stroke="#0ea5e9" strokeWidth={2.5} dot={false} />
                <Line type="monotone" dataKey="suspicion" stroke="#f59e0b" strokeWidth={2.5} dot={false} />
              </LineChart>
            </ResponsiveContainer>
            {!trendPoints.length && (
              <p className="mt-3 text-sm text-slate-400 italic">Loading wallet trends...</p>
            )}
          </div>
        </DataPanel>

        <DataPanel title="Behavioral Tags" subtitle="Classification patterns">
          <div className="flex flex-wrap gap-2">
            {['Strategic', 'Coordinated', 'High Conviction', 'Dormancy Reactivation', 'Event Reactive'].map((tag, i) => (
              <motion.span
                key={tag}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.05 }}
                className="font-mono text-xs px-3 py-1.5 rounded-full border border-slate-700 text-slate-300 bg-slate-900/60"
              >
                {tag}
              </motion.span>
            ))}
          </div>
        </DataPanel>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <DataPanel title="Real-Time Alerts" subtitle={`${alerts.length} recent events`}>
          <div className="space-y-3">
            {(alerts.length ? alerts : []).slice(0, 6).map((alert, idx) => (
              <motion.div
                key={`${alert.message}-${idx}`}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.05 }}
                className="rounded-lg border border-slate-800 bg-slate-800/30 p-3"
              >
                <p className="text-sm text-slate-300">{alert.message}</p>
              </motion.div>
            ))}
          </div>
        </DataPanel>

        <DataPanel title="Wallet Leaderboard" subtitle={`Top ${Math.min(leaderboard.length, 6)} wallets`}>
          <div className="space-y-2">
            {(leaderboard || []).slice(0, 6).map((row, idx) => (
              <motion.div
                key={row.wallet_id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.05 }}
                className="flex items-center justify-between rounded-lg border border-slate-800 bg-slate-800/30 p-3"
              >
                <p className="text-sm text-slate-300">#{idx + 1} {row.wallet_label}</p>
                <p className="font-mono text-xs text-cyan-400 font-semibold">{row.score}/100</p>
              </motion.div>
            ))}
            {!leaderboard.length && (
              <p className="text-sm text-slate-400 italic">Loading wallet leaderboard...</p>
            )}
          </div>
        </DataPanel>
      </div>
    </PageLayout>
  )
}
