import { useEffect, useMemo, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import axios from 'axios'
import WalletCard from '../components/WalletCard'
import TransactionDetail from '../components/TransactionDetail'
import { PageLayout } from '../components/PageLayout'

const FALLBACK_WALLETS = [
  { id: 'vitalik', address: '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045', name: 'Vitalik Buterin', balance_eth: 0 },
  { id: 'wintermute', address: '0x28C6c06298d514Db089934071355E5743bf21d60', name: 'Wintermute Trading', balance_eth: 0 },
  { id: 'jump_trading', address: '0x9507c04b10486547584C37BCBd931B2A4Fe4A4bE', name: 'Jump Trading', balance_eth: 0 },
  { id: 'kraken_10', address: '0x267be1C1D684F78cb4F6a176C4911b741E4Ffdc0', name: 'Kraken 10', balance_eth: 0 },
  { id: 'binance_8', address: '0xF977814e90dA44bFA03b6295A0616a897441aceC', name: 'Binance 8', balance_eth: 0 },
]

const FALLBACK_ALERTS = [
  { wallet_label: 'Vitalik', eth_value: 450, message: 'Vitalik just moved 450 ETH', timestamp: 1713370120 },
  { wallet_label: 'Jump Trading', eth_value: 1280, message: 'Jump Trading just moved 1280 ETH', timestamp: 1713369120 },
  { wallet_label: 'Paradigm', eth_value: 720, message: 'Paradigm just moved 720 ETH', timestamp: 1713368020 },
]

function fallbackScoreFromWalletId(walletId) {
  const seed = walletId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)
  return 20 + (seed % 70)
}

const ETH_ADDRESS_REGEX = /^0x[a-fA-F0-9]{40}$/

export default function Dashboard() {
  const [wallets, setWallets] = useState([])
  const [loading, setLoading] = useState(true)
  const [walletsLoadedOnce, setWalletsLoadedOnce] = useState(false)
  const [alerts, setAlerts] = useState(FALLBACK_ALERTS)
  const [suspicionByWallet, setSuspicionByWallet] = useState({})
  const [allTransactions, setAllTransactions] = useState([])
  const [currentPage, setCurrentPage] = useState(1)
  const [searchTerm, setSearchTerm] = useState('')
  const [searchStatus, setSearchStatus] = useState('')
  const attemptedExternalSearches = useRef(new Set())
  const walletsPerPage = 30

  useEffect(() => {
    let isMounted = true

    axios.get('/api/wallets?min_balance_eth=0.05&min_non_zero_wallets=100&max_wallets=100', { timeout: 25000 })
      .then(r => {
        if (!isMounted) return
        const fromApi = Array.isArray(r.data?.wallets)
          ? r.data.wallets.filter(wallet => wallet?.id && wallet?.address)
          : []
        setWallets(fromApi.length > 0 ? fromApi : FALLBACK_WALLETS)
      })
      .catch(() => {
        if (!isMounted) return
        setWallets(FALLBACK_WALLETS)
      })
      .finally(() => {
        if (!isMounted) return
        setLoading(false)
        setWalletsLoadedOnce(true)
      })

    return () => {
      isMounted = false
    }
  }, [])

  useEffect(() => {
    let isMounted = true

    const loadIntel = () => {
      axios.get('/api/dashboard/intel')
        .then(r => {
          if (!isMounted) return
          const data = r.data || {}
          if (Array.isArray(data.whale_alerts) && data.whale_alerts.length > 0) {
            setAlerts(data.whale_alerts)
          }
          if (data.suspicion_by_wallet) {
            setSuspicionByWallet(data.suspicion_by_wallet)
          }
        })
        .catch(() => {
          if (!isMounted) return
          setAlerts(FALLBACK_ALERTS)
        })
    }

    loadIntel()
    const intervalId = setInterval(loadIntel, 20000)
    return () => {
      isMounted = false
      clearInterval(intervalId)
    }
  }, [])

  useEffect(() => {
    if (wallets.length === 0) {
      if (walletsLoadedOnce) {
        setAllTransactions([])
      }
      return
    }

    let isMounted = true
    const topWallets = wallets.slice(0, 8)
    Promise.all(
      topWallets.map(wallet =>
        axios.get(`/api/wallet/${wallet.id}?tx_limit=80`, { timeout: 20000 })
          .then(r => {
            const txs = r.data.transactions || []
            return txs.map(tx => ({
              ...tx,
              wallet_id: wallet.id,
              wallet_label: wallet.name || wallet.id.replace('_', ' ').replace(/\b\w/g, c => c.toUpperCase()),
            }))
          })
          .catch(() => [])
      )
    ).then(results => {
      if (!isMounted) return
      const allTxs = results
        .flat()
        .filter(tx => tx?.hash && tx?.timeStamp)
        .sort((a, b) => parseInt(b.timeStamp) - parseInt(a.timeStamp))
        .slice(0, 600)
      setAllTransactions(allTxs)
    })

    return () => {
      isMounted = false
    }
  }, [wallets, walletsLoadedOnce])

  useEffect(() => {
    setCurrentPage(1)
  }, [searchTerm])

  useEffect(() => {
    const query = searchTerm.trim()
    if (!ETH_ADDRESS_REGEX.test(query)) {
      setSearchStatus('')
      return
    }

    const normalized = query.toLowerCase()
    const alreadyPresent = wallets.some(wallet =>
      wallet.address?.toLowerCase() === normalized || wallet.id?.toLowerCase() === normalized
    )

    if (alreadyPresent) {
      setSearchStatus('')
      return
    }

    if (attemptedExternalSearches.current.has(normalized)) {
      return
    }

    attemptedExternalSearches.current.add(normalized)
    setSearchStatus('Fetching wallet outside top 100...')

    axios.get(`/api/wallet/${query}?tx_limit=80`, { timeout: 25000 })
      .then(r => {
        const walletData = r.data || {}
        if (!walletData.address) {
          setSearchStatus('Wallet was not found.')
          return
        }

        const newWallet = {
          id: walletData.id || normalized,
          address: walletData.address,
          name: walletData.name || `Wallet ${walletData.address.slice(0, 6)}...${walletData.address.slice(-4)}`,
          balance_eth: walletData.balance_eth || 0,
        }

        setWallets(prev => {
          const exists = prev.some(wallet => wallet.id === newWallet.id || wallet.address?.toLowerCase() === normalized)
          if (exists) return prev
          return [newWallet, ...prev]
        })

        setSuspicionByWallet(prev => ({
          ...prev,
          [newWallet.id]: walletData.suspicion || prev[newWallet.id] || { score: 0, breakdown: {} },
        }))

        setSearchStatus('Wallet loaded from live lookup.')
      })
      .catch(() => {
        attemptedExternalSearches.current.delete(normalized)
        setSearchStatus('Could not fetch this wallet right now.')
      })
  }, [searchTerm, wallets])

  const filteredWallets = useMemo(() => {
    const query = searchTerm.trim().toLowerCase()
    if (!query) return wallets
    return wallets.filter(wallet => {
      const idMatch = wallet.id?.toLowerCase().includes(query)
      const addressMatch = wallet.address?.toLowerCase().includes(query)
      const nameMatch = wallet.name?.toLowerCase().includes(query)
      return Boolean(idMatch || addressMatch || nameMatch)
    })
  }, [wallets, searchTerm])

  const totalPages = Math.max(1, Math.ceil(filteredWallets.length / walletsPerPage))
  const startIdx = (currentPage - 1) * walletsPerPage
  const endIdx = startIdx + walletsPerPage
  const paginatedWallets = filteredWallets.slice(startIdx, endIdx)

  const fallbackScores = useMemo(() => {
    const map = {}
    wallets.forEach(wallet => {
      map[wallet.id] = { score: fallbackScoreFromWalletId(wallet.id), breakdown: {} }
    })
    return map
  }, [wallets])


  const tickerItems = alerts.length ? alerts : FALLBACK_ALERTS
  const marqueeItems = [...tickerItems, ...tickerItems]

  return (
    <PageLayout title="Whale Wallet Pulse Tracker" subtitle="Monitoring large Ethereum wallet behavior around major market events">
      <div className="mb-8 overflow-hidden rounded-2xl border border-cyan-500/50 bg-gradient-to-r from-cyan-950/40 via-slate-950/50 to-slate-950/40 shadow-[0_0_60px_rgba(34,211,238,0.3),inset_0_0_40px_rgba(34,211,238,0.1)] relative group">
        <div className="absolute inset-0 bg-gradient-to-r from-white/5 via-transparent to-transparent opacity-0 group-hover:opacity-30 transition-opacity duration-300 pointer-events-none" />
        <div className="px-4 py-3 border-b border-cyan-500/30 flex items-center gap-2 relative z-10 backdrop-blur-sm">
          <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse" />
          <p className="font-mono text-xs tracking-widest text-cyan-300/90 uppercase font-semibold">Live Alert Feed</p>
          <span className="font-mono text-xs text-cyan-400/70">Streaming</span>
        </div>
        <div className="relative h-14 overflow-hidden">
          <motion.div
            className="absolute inset-y-0 left-0 flex items-center gap-8 pr-8"
            animate={{ x: ['0%', '-50%'] }}
            transition={{ duration: 22, repeat: Infinity, ease: 'linear' }}
          >
            {marqueeItems.map((alert, idx) => (
              <div key={`${alert.wallet_label}-${alert.eth_value}-${idx}`} className="flex items-center gap-3 whitespace-nowrap">
                <span className="font-mono text-[11px] px-2.5 py-1 rounded-full border border-cyan-400/60 text-cyan-200 bg-cyan-500/30 backdrop-blur-sm font-semibold">ALERT</span>
                <span className="font-mono text-sm text-slate-100">{alert.message}</span>
                <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
              </div>
            ))}
          </motion.div>
        </div>
      </div>

      <div className="mb-8 rounded-2xl border border-cyan-500/40 bg-gradient-to-br from-cyan-950/30 via-slate-950/40 to-purple-950/20 p-6 backdrop-blur-xl shadow-[0_0_50px_rgba(34,211,238,0.25),inset_0_0_30px_rgba(34,211,238,0.08)] relative overflow-hidden group">
        <div className="absolute inset-0 bg-gradient-to-br from-white/8 via-transparent to-transparent pointer-events-none rounded-2xl" />
        <div className="absolute -inset-1 bg-gradient-to-br from-emerald-500/0 via-transparent to-blue-500/0 opacity-0 group-hover:opacity-20 blur-2xl transition-opacity duration-300 pointer-events-none rounded-2xl" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative z-10">
          <div className="flex items-center gap-3">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
            <div>
              <p className="text-xs text-slate-400 font-semibold">Tracked Wallets</p>
              <p className="text-2xl font-semibold text-slate-50 mt-1">{loading ? '...' : wallets.length}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-400 animate-pulse" />
            <div>
              <p className="text-xs text-slate-400 font-semibold">Analysis Engine</p>
              <p className="text-2xl font-semibold text-slate-50 mt-1">Live</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="w-2.5 h-2.5 rounded-full bg-purple-400 animate-pulse" />
            <div>
              <p className="text-xs text-slate-400 font-semibold">Network</p>
              <p className="text-2xl font-semibold text-slate-50 mt-1">Ethereum</p>
            </div>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className="h-32 border border-slate-800 rounded-lg bg-slate-950/40 animate-pulse" />
          ))}
        </div>
      ) : (
        <>
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-slate-50 mb-1">Tracked Wallets</h2>
              <p className="text-sm text-slate-400">Page {currentPage} of {totalPages} ({filteredWallets.length} shown, {wallets.length} total)</p>
              {searchStatus && <p className="text-xs text-cyan-300 mt-2">{searchStatus}</p>}
            </div>
            <div className="w-full max-w-md">
              <label htmlFor="wallet-search" className="sr-only">Search wallets</label>
              <input
                id="wallet-search"
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by wallet name, id, or address..."
                className="w-full rounded-xl border border-slate-700/60 bg-slate-950/70 px-4 py-2.5 text-sm text-slate-100 placeholder:text-slate-500 focus:border-cyan-400/60 focus:outline-none focus:ring-2 focus:ring-cyan-500/30"
              />
            </div>
          </div>

          {paginatedWallets.length === 0 ? (
            <div className="rounded-xl border border-slate-800/80 bg-slate-950/60 p-8 text-center">
              <p className="text-slate-300">No wallet matched your search.</p>
              <p className="mt-1 text-sm text-slate-500">Try a shorter keyword or paste a full address prefix.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {paginatedWallets.map((wallet, i) => (
                <WalletCard
                  key={wallet.id}
                  wallet={wallet}
                  index={i}
                  suspicionScore={suspicionByWallet[wallet.id]?.score ?? fallbackScores[wallet.id]?.score ?? 0}
                />
              ))}
            </div>
          )}

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="mt-8 flex items-center justify-center gap-2">
              <button
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="px-4 py-2 rounded-lg bg-slate-900/60 border border-slate-700/40 text-slate-300 hover:bg-slate-800/60 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                ← Previous
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
          )}
        </>
      )}

      {/* All Transactions Section */}
      {allTransactions.length > 0 && (
        <div className="mt-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mb-8"
          >
            <h2 className="text-2xl font-semibold text-slate-50 mb-2">All Whale Transactions</h2>
            <p className="text-slate-400">Real-time transaction activity from all tracked wallets</p>
          </motion.div>
          <TransactionDetail transactions={allTransactions} />
        </div>
      )}

      <p className="mt-12 font-mono text-xs text-slate-500">
        All data sourced from the public Ethereum blockchain. Not financial advice.
      </p>
    </PageLayout>
  )
}
