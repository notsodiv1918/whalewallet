import { useState } from 'react'
import { motion } from 'framer-motion'

export default function TransactionDetail({ transactions = [] }) {
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 20
  const totalPages = Math.ceil(transactions.length / itemsPerPage)

  const startIdx = (currentPage - 1) * itemsPerPage
  const endIdx = startIdx + itemsPerPage
  const currentTxs = transactions.slice(startIdx, endIdx)

  const formatETH = (value) => {
    const eth = parseInt(value || 0) / 1e18
    return eth.toFixed(4)
  }

  const formatDate = (timestamp) => {
    return new Date(parseInt(timestamp) * 1000).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const shortHash = (hash) => `${hash?.slice(0, 8)}...${hash?.slice(-6)}`

  const getStatusColor = (tx) => {
    if (tx.isError === '1') return 'bg-red-500/10 border-red-500/30 text-red-300'
    if (tx.input !== '0x') return 'bg-blue-500/10 border-blue-500/30 text-blue-300'
    return 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
  }

  const getStatusLabel = (tx) => {
    if (tx.isError === '1') return 'Failed'
    if (tx.input !== '0x') return 'Contract'
    return 'Transfer'
  }

  if (!transactions || transactions.length === 0) {
    return (
      <div className="rounded-2xl border border-cyan-500/40 bg-gradient-to-br from-cyan-950/30 via-slate-950/40 to-purple-950/20 p-8 backdrop-blur-xl text-center">
        <p className="text-slate-400 font-mono text-sm">No transactions found</p>
      </div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-4"
    >
      {/* Header */}
      <div className="rounded-2xl border border-cyan-500/40 bg-gradient-to-br from-cyan-950/30 via-slate-950/40 to-purple-950/20 p-6 backdrop-blur-xl shadow-[0_0_50px_rgba(34,211,238,0.25)]">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-slate-50">Transaction History</h3>
            <p className="text-sm text-slate-400 mt-1">Total: {transactions.length} transactions</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-slate-400">Page {currentPage} of {totalPages}</p>
          </div>
        </div>
      </div>

      {/* Transaction List */}
      <div className="space-y-2">
        {currentTxs.map((tx, idx) => (
          <motion.a
            key={tx.hash}
            href={`https://etherscan.io/tx/${tx.hash}`}
            target="_blank"
            rel="noreferrer"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: idx * 0.05 }}
            className="block rounded-xl border border-slate-700/30 bg-gradient-to-r from-slate-900/40 via-slate-950/30 to-slate-900/40 p-4 backdrop-blur-sm hover:border-cyan-500/50 hover:shadow-[0_0_30px_rgba(34,211,238,0.2)] transition-all duration-300 group"
          >
            <div className="flex items-center justify-between gap-4">
              {/* Left: Status & Hash */}
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border whitespace-nowrap ${getStatusColor(tx)}`}>
                  {getStatusLabel(tx)}
                </span>
                <div className="min-w-0 flex-1">
                  <a
                    href={`https://etherscan.io/tx/${tx.hash}`}
                    target="_blank"
                    rel="noreferrer"
                    className="font-mono text-sm text-cyan-400 hover:text-cyan-300 transition-colors truncate"
                  >
                    {shortHash(tx.hash)}
                  </a>
                  <p className="text-xs text-slate-500 mt-1">{formatDate(tx.timeStamp)}</p>
                </div>
              </div>

              {/* Center: From/To */}
              <div className="hidden lg:flex items-center gap-2 min-w-0 flex-1">
                <div className="text-right min-w-0">
                  <p className="text-xs text-slate-500">From</p>
                  <p className="font-mono text-xs text-slate-300 truncate">
                    {tx.from?.slice(0, 8)}...{tx.from?.slice(-6)}
                  </p>
                </div>
                <span className="text-slate-500">→</span>
                <div className="text-left min-w-0">
                  <p className="text-xs text-slate-500">To</p>
                  <p className="font-mono text-xs text-slate-300 truncate">
                    {tx.to?.slice(0, 8)}...{tx.to?.slice(-6)}
                  </p>
                </div>
              </div>

              {/* Right: Amount */}
              <div className="text-right">
                <p className="font-mono font-bold text-amber-400 text-lg">
                  {formatETH(tx.value)} ETH
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  Gas: {(parseInt(tx.gas || 0) / 1e9).toFixed(2)} Gwei
                </p>
              </div>
            </div>
          </motion.a>
        ))}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="rounded-2xl border border-cyan-500/40 bg-gradient-to-br from-cyan-950/30 via-slate-950/40 to-purple-950/20 p-4 backdrop-blur-xl">
          <div className="flex items-center justify-center gap-2">
            <button
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className="px-4 py-2 rounded-lg bg-slate-900/60 border border-slate-700/40 text-slate-300 hover:bg-slate-800/60 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              ← Prev
            </button>

            <div className="flex items-center gap-1">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum
                if (totalPages <= 5) {
                  pageNum = i + 1
                } else if (currentPage <= 3) {
                  pageNum = i + 1
                } else if (currentPage >= totalPages - 2) {
                  pageNum = totalPages - 4 + i
                } else {
                  pageNum = currentPage - 2 + i
                }
                return (
                  <button
                    key={pageNum}
                    onClick={() => setCurrentPage(pageNum)}
                    className={`w-10 h-10 rounded-lg font-mono text-sm transition-all ${
                      currentPage === pageNum
                        ? 'bg-cyan-500/40 border border-cyan-500/60 text-cyan-300'
                        : 'bg-slate-900/60 border border-slate-700/40 text-slate-400 hover:border-slate-600/60'
                    }`}
                  >
                    {pageNum}
                  </button>
                )
              })}
            </div>

            <button
              onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
              className="px-4 py-2 rounded-lg bg-slate-900/60 border border-slate-700/40 text-slate-300 hover:bg-slate-800/60 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              Next →
            </button>
          </div>
          <p className="text-xs text-slate-500 text-center mt-3">
            Showing {startIdx + 1}-{Math.min(endIdx, transactions.length)} of {transactions.length} transactions
          </p>
        </div>
      )}
    </motion.div>
  )
}
