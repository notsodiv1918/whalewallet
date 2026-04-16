import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import axios from 'axios'
import { PageLayout } from '../components/PageLayout'
import { DataPanel } from '../components/ui/DataPanel'

const FALLBACK_INSIGHTS = [
  {
    audience: 'Buyer',
    title: 'Potential accumulation regime',
    action: 'Scale entries gradually and confirm with follow-through transfers before increasing size.',
    rationale: 'Large inflows with reduced exchange-bound movement suggest strategic accumulation.',
  },
  {
    audience: 'Seller',
    title: 'Heightened distribution risk',
    action: 'Reduce leverage and protect gains when multiple high-score wallets increase outflows.',
    rationale: 'Coordinated outflow patterns often precede short-term volatility spikes.',
  },
]

export default function ActionableInsights() {
  const [insights, setInsights] = useState(FALLBACK_INSIGHTS)
  const [signals, setSignals] = useState([
    {
      title: 'Loading live signals',
      description: 'Fetching latest wallet trend context...',
    },
  ])
  const [lastUpdated, setLastUpdated] = useState(null)
  const [mode, setMode] = useState('fallback')

  useEffect(() => {
    const buildInsightsFromIntel = (intel) => {
      const alerts = intel?.whale_alerts || []
      const suspicionMap = intel?.suspicion_by_wallet || {}
      const trend = intel?.trend_summary || {}
      const averageSuspicion = Number(intel?.average_suspicion || 0)
      const delta = Number(trend?.average_suspicion_delta ?? 0)
      const signedDelta = `${delta >= 0 ? '+' : ''}${delta}`
      const topWallet = Object.entries(suspicionMap)
        .sort((a, b) => (b[1]?.score ?? 0) - (a[1]?.score ?? 0))[0]
      const topWalletLabel = topWallet ? `${topWallet[0]} (${topWallet[1]?.score ?? 0}/100)` : 'none'

      const risingRisk = (trend.average_suspicion_delta ?? 0) > 4 || (trend.alert_count_delta ?? 0) > 0
      const coolingRisk = (trend.average_suspicion_delta ?? 0) < -3 && (trend.alert_count_delta ?? 0) <= 0
      const concentratedRisk = (topWallet?.[1]?.score ?? 0) >= 70

      const derivedInsights = []

      if (risingRisk) {
        derivedInsights.push({
          audience: 'Buyer',
          title: 'Risk is rising across the tracked set',
          action: 'Reduce new position size, wait for confirmation, and require stronger follow-through before adding exposure.',
          rationale: `Average suspicion is up ${trend.average_suspicion_delta ?? 0} and alerts are ${trend.alert_count_delta > 0 ? 'increasing' : 'stable'}.`,
        })
      } else if (coolingRisk) {
        derivedInsights.push({
          audience: 'Buyer',
          title: 'Conditions are cooling',
          action: 'Consider staged entries and look for continuation in lower-risk wallets before increasing size.',
          rationale: `Average suspicion is down ${Math.abs(trend.average_suspicion_delta ?? 0)} while alerts are not expanding.`,
        })
      } else {
        derivedInsights.push({
          audience: 'Buyer',
          title: 'Trend is mixed',
          action: 'Keep sizing modest and wait for a clearer move in average suspicion or alert volume before committing harder.',
          rationale: `Average suspicion is ${averageSuspicion.toFixed(1)} with a ${trend.trend_direction || 'flat'} trend.`,
        })
      }

      derivedInsights.push({
        audience: 'Seller',
        title: concentratedRisk ? 'Top wallet risk is elevated' : 'Watch the highest-risk wallet',
        action: concentratedRisk
          ? 'Trim leverage and hedge more aggressively while the highest-risk wallet remains above the danger threshold.'
          : 'Use the leading wallet as a confirmation signal; do not front-run it until score compression is visible.',
        rationale: topWallet ? `${topWalletLabel} is the current risk leader.` : 'No wallet is currently dominating the risk set.',
      })

      derivedInsights.push({
        audience: 'Trader',
        title: 'Execution discipline',
        action: alerts.length > 0
          ? 'Align entries with the most recent whale alerts and avoid chasing the first spike.'
          : 'Stay patient and wait for fresh alerts; the current tape does not justify aggressive action.',
        rationale: alerts[0]?.message || 'No high-value alert has cleared the threshold yet.',
      })

      const derivedSignals = alerts.map(item => ({
        title: `Signal from ${item.wallet_label}`,
        description: item.message,
      }))

      derivedSignals.unshift({
        title: 'Market risk trend snapshot',
        description: `Average suspicion is ${averageSuspicion.toFixed(1)} (${signedDelta} vs previous sample), trend ${trend.trend_direction || 'flat'}.`,
      })

      if (topWallet) {
        derivedSignals.push({
          title: 'Current highest-risk wallet',
          description: `${topWalletLabel} is currently leading the risk table.`,
        })
      }

      if (trend.top_wallet_changed) {
        derivedSignals.unshift({
          title: 'Leadership change detected',
          description: 'The wallet with the highest suspicion score has changed. Re-evaluate the risk leader before adding exposure.',
        })
      }

      if (!derivedSignals.length) {
        derivedSignals.push({
          title: 'No alert threshold reached',
          description: 'No wallet has triggered the live alert threshold yet. Use the trend direction and average suspicion as your guide.',
        })
      }

      return { derivedInsights, derivedSignals }
    }

    const loadData = () => {
      axios.get('/api/dashboard/intel')
        .then(r => {
          const { derivedInsights, derivedSignals } = buildInsightsFromIntel(r.data)
          setInsights(derivedInsights.length ? derivedInsights : FALLBACK_INSIGHTS)
          setSignals(derivedSignals)
          setMode('live')
          setLastUpdated(new Date((r.data?.generated_at || Date.now() / 1000) * 1000))
        })
        .catch(() => {
          setInsights(FALLBACK_INSIGHTS)
          setSignals([
            {
              title: 'Live signal feed unavailable',
              description: 'Could not reach dashboard intel right now. Showing fallback actions until the backend responds again.',
            },
          ])
          setMode('unavailable')
          setLastUpdated(new Date())
        })
    }

    loadData()
    const id = setInterval(loadData, 25000)
    return () => clearInterval(id)
  }, [])

  return (
    <PageLayout
      title="Actionable Insights Layer"
      subtitle="Transform whale behavior analysis into practical strategy guidance for portfolio decisions, risk management, and research"
    >
      <div className="mb-6 text-xs font-mono text-slate-500">
        Mode: <span className={mode === 'live' ? 'text-emerald-400' : mode === 'unavailable' ? 'text-amber-300' : 'text-slate-400'}>{mode}</span>
        {lastUpdated && <span> | Last updated {lastUpdated.toLocaleTimeString()}</span>}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1.3fr_1fr] gap-6">
        <div className="space-y-4">
          {insights.map((insight, idx) => (
            <motion.div
              key={`${insight.title}-${idx}`}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              className="rounded-lg border border-slate-800 bg-slate-950/40 p-6"
            >
              <div className="flex items-center justify-between gap-2 mb-2">
                <p className="text-slate-50 font-semibold">{insight.title}</p>
                <span className="font-mono text-xs px-3 py-1 rounded-full border border-slate-700 text-slate-300 bg-slate-900/60">{insight.audience}</span>
              </div>
              <p className="text-sm text-slate-300 mb-3 font-medium">{insight.action}</p>
              <p className="font-mono text-xs text-slate-400">{insight.rationale}</p>
            </motion.div>
          ))}
        </div>

        <DataPanel title="Signals" subtitle="Underlying data sources">
          <div className="space-y-3">
            {(signals || []).slice(0, 5).map((signal, idx) => (
              <motion.div
                key={`${signal.title}-${idx}`}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.05 }}
                className="rounded-lg border border-slate-800 bg-slate-800/30 p-3"
              >
                <p className="text-sm text-slate-300 mb-1 font-medium">{signal.title}</p>
                <p className="font-mono text-xs text-slate-400">{signal.description}</p>
              </motion.div>
            ))}
            {!signals?.length && (
              <p className="text-sm text-slate-400 italic">No live signals available. Showing fallback data.</p>
            )}
          </div>
        </DataPanel>
      </div>
    </PageLayout>
  )
}
