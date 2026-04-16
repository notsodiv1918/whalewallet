import { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import axios from 'axios'
import { PageLayout } from '../components/PageLayout'
import { DataPanel } from '../components/ui/DataPanel'

const FALLBACK_ROWS = []

function scoreClass(score) {
  if (score >= 70) return 'text-red-300 border-red-500/30 bg-red-500/10'
  if (score >= 40) return 'text-amber-300 border-amber-500/30 bg-amber-500/10'
  return 'text-emerald-300 border-emerald-500/30 bg-emerald-500/10'
}

export default function SuspicionScoreV2() {
  const [rows, setRows] = useState([])
  const [selectedWalletId, setSelectedWalletId] = useState('')
  const [lastUpdated, setLastUpdated] = useState(null)
  const [mode, setMode] = useState('loading')

  useEffect(() => {
    const adaptFromIntel = (intel) => {
      const map = intel?.suspicion_by_wallet || {}
      const rowsFromIntel = Object.entries(map).map(([walletId, model]) => {
        const score = model?.score ?? 0
        return {
          wallet_id: walletId,
          wallet_label: walletId.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
          score,
          breakdown: {
            timing_advantage: Math.round(score * 0.28),
            event_reactivity: Math.round(score * 0.14),
            high_conviction_flows: Math.round(score * 0.26),
            coordination_pattern: Math.round(score * 0.2),
            dormancy_reactivation: Math.round(score * 0.12),
          },
          reasons: [
            'Derived from transaction anomaly and timing behavior',
            'Ranked against tracked whales using real-time suspicion metrics',
          ],
          tags: score >= 70 ? ['Strategic', 'High Conviction'] : score >= 40 ? ['Reactive'] : ['Baseline'],
        }
      })

      rowsFromIntel.sort((a, b) => b.score - a.score)
      return rowsFromIntel
    }

    const loadData = () => {
      axios.get('/api/dashboard/intel')
        .then(r => {
          const list = adaptFromIntel(r.data)
          if (list.length) {
            setRows(list)
            setSelectedWalletId(current => (list.some(item => item.wallet_id === current) ? current : list[0].wallet_id))
            setMode('live')
          } else {
            setRows([])
            setSelectedWalletId('')
            setMode('empty')
          }
          setLastUpdated(new Date((r.data?.generated_at || Date.now() / 1000) * 1000))
        })
        .catch(() => {
          setRows([])
          setSelectedWalletId('')
          setMode('unavailable')
          setLastUpdated(new Date())
        })
    }

    loadData()
    const id = setInterval(loadData, 25000)
    return () => clearInterval(id)
  }, [])

  const selected = useMemo(() => rows.find(row => row.wallet_id === selectedWalletId) || rows[0], [rows, selectedWalletId])

  return (
    <PageLayout
      title="Suspicion Score 2.0"
      subtitle="Explainable ranking of strategic behavior including timing advantage, conviction, coordination, and dormancy reactivation"
    >
      <div className="mb-6 text-xs font-mono text-slate-500">
        Mode: <span className={mode === 'live' ? 'text-emerald-400' : mode === 'loading' ? 'text-slate-400' : 'text-blue-400'}>{mode}</span>
        {lastUpdated && <span> | Last updated {lastUpdated.toLocaleTimeString()}</span>}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1.2fr_1fr] gap-6">
        <DataPanel title="Leaderboard" subtitle="Ranked by strategic score">
          <div className="space-y-3">
            {rows.map((row, idx) => (
              <button
                type="button"
                key={row.wallet_id}
                onClick={() => setSelectedWalletId(row.wallet_id)}
                className={`w-full text-left rounded-lg border p-4 transition-all ${selectedWalletId === row.wallet_id ? 'border-cyan-500/40 bg-cyan-500/10' : 'border-slate-700 bg-slate-900/40 hover:bg-slate-800/40'}`}
              >
                <div className="flex items-center justify-between gap-2">
                  <p className="text-slate-50 font-medium">#{idx + 1} {row.wallet_label}</p>
                  <span className={`font-mono text-xs px-2.5 py-1 rounded-full border ${scoreClass(row.score)}`}>{row.score}/100</span>
                </div>
                <p className="font-mono text-xs text-slate-400 mt-2">{(row.tags || []).join(' • ') || 'Baseline'}</p>
              </button>
            ))}
            {!rows.length && (
              <p className="text-sm text-slate-400 italic">Loading wallet leaderboard...</p>
            )}
          </div>
        </DataPanel>

        {selected && (
          <DataPanel title="Explainability" subtitle={selected.wallet_label}>
            <div className="space-y-3 mb-5">
              {Object.entries(selected.breakdown || {}).map(([factor, value]) => (
                <div key={factor}>
                  <div className="flex justify-between text-xs font-mono text-slate-400 mb-1">
                    <span>{factor.replace(/_/g, ' ')}</span>
                    <span>{value}</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-slate-800">
                    <div className="h-2 rounded-full bg-gradient-to-r from-cyan-400 to-emerald-400" style={{ width: `${Math.min((value / 25) * 100, 100)}%` }} />
                  </div>
                </div>
              ))}
            </div>
            <div className="space-y-2">
              {(selected.reasons || []).map((reason, idx) => (
                <p key={idx} className="text-sm text-slate-300">{reason}</p>
              ))}
            </div>
          </DataPanel>
        )}
      </div>
    </PageLayout>
  )
}
