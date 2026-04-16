import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import axios from 'axios'
import StatCard from '../components/StatCard'
import TransactionDetail from '../components/TransactionDetail'
import ActivityChart from '../components/ActivityChart'
import { PageLayout } from '../components/PageLayout'

export default function WalletDetail() {
  const { id } = useParams()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const analysis = data?.analysis || {}
  const transactions = data?.transactions || []
  const latestTx = transactions[0] || null

  const formatEthValue = (rawValue) => {
    const numeric = Number(rawValue || 0) / 1e18
    if (!Number.isFinite(numeric)) return '0.0000'
    return numeric.toFixed(4)
  }

  const formatTxDate = (timestamp) => {
    if (!timestamp) return 'N/A'
    return new Date(Number(timestamp) * 1000).toLocaleString()
  }

  useEffect(() => {
    axios.get(`${import.meta.env.VITE_API_URL}/api/wallet/${id}`)
      .then(r => setData(r.data))
      .catch(() => setError('Could not fetch wallet data. Make sure the backend is running and your ETHERSCAN_API_KEY is set in backend/.env'))
      .finally(() => setLoading(false))
  }, [id])

  if (loading) return (
    <PageLayout title="Wallet Intelligence" subtitle="Loading wallet data and behavioral profile">
      <div className="space-y-6">
        <div className="h-6 w-32 bg-slate-900 rounded animate-pulse" />
        <div className="h-8 w-64 bg-slate-900 rounded animate-pulse" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => <div key={i} className="h-24 bg-slate-900 rounded-lg animate-pulse" />)}
        </div>
      </div>
    </PageLayout>
  )

  if (error) return (
    <PageLayout title="Wallet Intelligence" subtitle="Unable to load wallet data">
      <div>
        <Link to="/" className="text-slate-400 font-mono text-xs hover:text-cyan-400 transition-colors mb-6 inline-block">
          ← Back
        </Link>
        <div className="bg-red-900/10 border border-red-900/30 rounded-lg p-6 mt-4">
          <p className="text-red-400 font-mono text-sm">{error}</p>
        </div>
      </div>
    </PageLayout>
  )

  return (
    <PageLayout
      title="Wallet Intelligence"
      subtitle="Detailed balance, behavior analytics, and comprehensive transaction history"
    >
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      <Link to="/" className="text-slate-400 font-mono text-xs hover:text-cyan-400 transition-colors mb-8 inline-block">
        ← Back to Dashboard
      </Link>

      <div className="mb-10">
        <p className="font-mono text-xs text-amber-400 tracking-widest uppercase mb-2">
          {(data?.name || id).replace(/_/g, ' ')}
        </p>
        <p className="font-mono text-slate-400 text-sm break-all">{data?.address}</p>
        <a
          href={`https://etherscan.io/address/${data?.address}`}
          target="_blank"
          rel="noreferrer"
          className="font-mono text-xs text-slate-500 hover:text-cyan-400 transition-colors mt-1 inline-block"
        >
          View on Etherscan ↗
        </a>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
        <StatCard label="ETH Balance" value={(data?.balance_eth ?? 0).toFixed(4)} unit="ETH" color="amber" />
        <StatCard label="Transactions" value={analysis.total_transactions ?? transactions.length ?? 0} color="green" />
        <StatCard label="ETH Moved" value={analysis.total_eth_moved ?? 0} unit="ETH" color="gray" />
        <StatCard label="Avg Tx Value" value={analysis.avg_tx_value_eth ?? 0} unit="ETH" color="gray" />
      </div>

      <div className="mb-10 rounded-2xl border border-cyan-500/40 bg-gradient-to-br from-cyan-950/30 via-slate-950/40 to-purple-950/20 p-6 backdrop-blur-xl shadow-[0_0_50px_rgba(34,211,238,0.25)]">
        <p className="font-mono text-xs text-slate-400 uppercase tracking-widest mb-2 font-semibold">Latest Transaction</p>
        {latestTx ? (
          <div className="space-y-2">
            <p className="font-mono text-sm text-slate-200 break-all">{latestTx.hash}</p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
              <p className="text-slate-400">Value: <span className="text-amber-300 font-mono">{formatEthValue(latestTx.value)} ETH</span></p>
              <p className="text-slate-400">Time: <span className="text-slate-200">{formatTxDate(latestTx.timeStamp)}</span></p>
              <p className="text-slate-400">Status: <span className={latestTx.isError === '1' ? 'text-red-300' : 'text-emerald-300'}>{latestTx.isError === '1' ? 'Failed' : 'Success'}</span></p>
            </div>
            <a
              href={`https://etherscan.io/tx/${latestTx.hash}`}
              target="_blank"
              rel="noreferrer"
              className="font-mono text-xs text-cyan-300 hover:text-cyan-200 transition-colors inline-block"
            >
              Open latest tx on Etherscan ↗
            </a>
          </div>
        ) : (
          <p className="text-sm text-slate-300">No recent transaction available.</p>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-10">
        <div className="rounded-2xl border border-cyan-500/40 bg-gradient-to-br from-cyan-950/30 via-slate-950/40 to-purple-950/20 p-6 backdrop-blur-xl shadow-[0_0_50px_rgba(34,211,238,0.25)]">
          <p className="font-mono text-xs text-slate-400 uppercase tracking-widest mb-2 font-semibold">Hourly Activity</p>
          <p className="text-xs text-slate-500 mb-4">Peak hour: {analysis.peak_hour_utc ?? 0}:00 UTC</p>
          <ActivityChart data={analysis.hourly_activity || Array(24).fill(0)} type="hourly" />
        </div>
        <div className="rounded-2xl border border-cyan-500/40 bg-gradient-to-br from-cyan-950/30 via-slate-950/40 to-purple-950/20 p-6 backdrop-blur-xl shadow-[0_0_50px_rgba(34,211,238,0.25)]">
          <p className="font-mono text-xs text-slate-400 uppercase tracking-widest mb-2 font-semibold">Day of Week Activity</p>
          <p className="text-xs text-slate-500 mb-4">Most active: {analysis.peak_day || 'N/A'}</p>
          <ActivityChart data={analysis.daily_activity || Array(7).fill(0)} type="daily" />
        </div>
      </div>

      {transactions.length === 0 && (
        <div className="mb-6 rounded-xl border border-slate-700/40 bg-slate-950/60 p-4">
          <p className="text-sm text-slate-300">No recent transactions were returned by Etherscan for this wallet.</p>
        </div>
      )}

      <TransactionDetail transactions={transactions} />
      </motion.div>
    </PageLayout>
  )
}

