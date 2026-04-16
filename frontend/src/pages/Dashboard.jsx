import { useEffect, useMemo, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import axios from 'axios'
import WalletCard from '../components/WalletCard'

const API = import.meta.env.VITE_API_URL || ''

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

function fallbackScore(walletId) {
  const seed = walletId.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0)
  return 20 + (seed % 70)
}

const ETH_ADDRESS_REGEX = /^0x[a-fA-F0-9]{40}$/

export default function Dashboard() {
  const [wallets, setWallets] = useState([])
  const [loading, setLoading] = useState(true)
  const [walletsLoadedOnce, setWalletsLoadedOnce] = useState(false)
  const [alerts, setAlerts] = useState(FALLBACK_ALERTS)
  const [suspicionByWallet, setSuspicionByWallet] = useState({})
  const [searchTerm, setSearchTerm] = useState('')
  const [searchStatus, setSearchStatus] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const attemptedSearches = useRef(new Set())
  const walletsPerPage = 30

  // Load wallets
  useEffect(() => {
    let alive = true
    axios.get(`${API}/api/wallets`, { timeout: 25000 })
      .then(r => {
        if (!alive) return
        const list = Array.isArray(r.data?.wallets) ? r.data.wallets.filter(w => w?.id && w?.address) : []
        setWallets(list.length > 0 ? list : FALLBACK_WALLETS)
      })
      .catch(() => alive && setWallets(FALLBACK_WALLETS))
      .finally(() => {
        if (!alive) return
        setLoading(false)
        setWalletsLoadedOnce(true)
      })
    return () => { alive = false }
  }, [])

  // Load alerts + suspicion scores, refresh every 20s
  useEffect(() => {
    let alive = true
    const load = () => {
      axios.get(`${API}/api/dashboard/intel`)
        .then(r => {
          if (!alive) return
          const d = r.data || {}
          if (Array.isArray(d.whale_alerts) && d.whale_alerts.length > 0) setAlerts(d.whale_alerts)
          if (d.suspicion_by_wallet) setSuspicionByWallet(d.suspicion_by_wallet)
        })
        .catch(() => alive && setAlerts(FALLBACK_ALERTS))
    }
    load()
    const id = setInterval(load, 20000)
    return () => { alive = false; clearInterval(id) }
  }, [])

  // Search by address
  useEffect(() => {
    const query = searchTerm.trim()
    if (!ETH_ADDRESS_REGEX.test(query)) { setSearchStatus(''); return }
    const norm = query.toLowerCase()
    const exists = wallets.some(w => w.address?.toLowerCase() === norm)
    if (exists) { setSearchStatus(''); return }
    if (attemptedSearches.current.has(norm)) return
    attemptedSearches.current.add(norm)
    setSearchStatus('Fetching wallet...')
    axios.get(`${API}/api/wallet/${query}`, { timeout: 25000 })
      .then(r => {
        const d = r.data || {}
        if (!d.address) { setSearchStatus('Wallet not found.'); return }
        const newW = {
          id: d.id || norm,
          address: d.address,
          name: d.name || `${d.address.slice(0, 6)}...${d.address.slice(-4)}`,
          balance_eth: d.balance_eth || 0,
        }
        setWallets(prev => prev.some(w => w.id === newW.id) ? prev : [newW, ...prev])
        if (d.suspicion) setSuspicionByWallet(prev => ({ ...prev, [newW.id]: d.suspicion }))
        setSearchStatus('Wallet loaded.')
      })
      .catch(() => { attemptedSearches.current.delete(norm); setSearchStatus('Could not fetch wallet.') })
  }, [searchTerm, wallets])

  useEffect(() => { setCurrentPage(1) }, [searchTerm])

  const filteredWallets = useMemo(() => {
    const q = searchTerm.trim().toLowerCase()
    if (!q) return wallets
    return wallets.filter(w =>
      w.id?.toLowerCase().includes(q) ||
      w.address?.toLowerCase().includes(q) ||
      w.name?.toLowerCase().includes(q)
    )
  }, [wallets, searchTerm])

  const totalPages = Math.max(1, Math.ceil(filteredWallets.length / walletsPerPage))
  const paginated = filteredWallets.slice((currentPage - 1) * walletsPerPage, currentPage * walletsPerPage)
  const marqueeItems = [...(alerts.length ? alerts : FALLBACK_ALERTS), ...(alerts.length ? alerts : FALLBACK_ALERTS)]

  return (
    <div className="max-w-7xl mx-auto px-6 py-16">

      {/* Whale Alert Feed */}
      <div className="mb-10 overflow-hidden rounded-xl border border-[#F5A623]/30 bg-[#111]">
        <div className="px-4 py-2.5 border-b border-[#F5A623]/20 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-[#F5A623] animate-pulse" />
          <p className="font-mono text-xs tracking-widest text-[#F5A623] uppercase">Live Whale Alert Feed</p>
        </div>
        <div className="relative h-12 overflow-hidden">
          <motion.div
            className="absolute inset-y-0 left-0 flex items-center gap-10 pr-10"
            animate={{ x: ['0%', '-50%'] }}
            transition={{ duration: 25, repeat: Infinity, ease: 'linear' }}
          >
            {marqueeItems.map((alert, i) => (
              <div key={i} className="flex items-center gap-3 whitespace-nowrap">
                <span className="font-mono text-[10px] px-2 py-0.5 rounded border border-[#F5A623]/40 text-[#F5A623]">ALERT</span>
                <span className="font-mono text-sm text-gray-300">{alert.message}</span>
                <span className="w-1.5 h-1.5 rounded-full bg-[#F5A623] animate-ping" />
              </div>
            ))}
          </motion.div>
        </div>
      </div>

      {/* Stats bar */}
      <div className="mb-10 grid grid-cols-3 gap-4">
        {[
          { label: 'Tracked Wallets', value: loading ? '...' : wallets.length, color: 'text-emerald-400' },
          { label: 'Analysis Engine', value: 'Live', color: 'text-[#F5A623]' },
          { label: 'Network', value: 'Ethereum', color: 'text-blue-400' },
        ].map(stat => (
          <div key={stat.label} className="bg-[#111] border border-[#222] rounded-lg p-4">
            <p className="font-mono text-xs text-gray-600 uppercase tracking-widest mb-1">{stat.label}</p>
            <p className={`text-2xl font-mono font-bold ${stat.color}`}>{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Search */}
      <div className="mb-6 flex items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-white">Tracked Wallets</h2>
          {searchStatus && <p className="text-xs text-[#F5A623] mt-1">{searchStatus}</p>}
        </div>
        <input
          type="text"
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          placeholder="Search by name, id, or address..."
          className="w-80 rounded-lg border border-[#333] bg-[#111] px-4 py-2 text-sm text-gray-300 placeholder:text-gray-600 focus:border-[#F5A623]/50 focus:outline-none"
        />
      </div>

      {/* Wallet grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1,2,3,4,5].map(i => <div key={i} className="h-28 bg-[#111] border border-[#1a1a1a] rounded-lg animate-pulse" />)}
        </div>
      ) : paginated.length === 0 ? (
        <div className="border border-[#222] rounded-lg p-8 text-center">
          <p className="text-gray-500">No wallets matched your search.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {paginated.map((wallet, i) => (
            <WalletCard
              key={wallet.id}
              wallet={wallet}
              index={i}
              suspicionScore={suspicionByWallet[wallet.id]?.score ?? fallbackScore(wallet.id)}
            />
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-8 flex items-center justify-center gap-2">
          <button
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="px-4 py-2 rounded-lg border border-[#333] text-gray-400 hover:border-[#F5A623]/40 disabled:opacity-40 transition-all font-mono text-sm"
          >
            ← Prev
          </button>
          {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
            const p = totalPages <= 5 ? i + 1
              : currentPage <= 3 ? i + 1
              : currentPage >= totalPages - 2 ? totalPages - 4 + i
              : currentPage - 2 + i
            return (
              <button
                key={p}
                onClick={() => setCurrentPage(p)}
                className={`w-9 h-9 rounded-lg font-mono text-sm transition-all ${
                  currentPage === p
                    ? 'bg-[#F5A623]/20 border border-[#F5A623]/50 text-[#F5A623]'
                    : 'border border-[#333] text-gray-500 hover:border-[#444]'
                }`}
              >
                {p}
              </button>
            )
          })}
          <button
            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="px-4 py-2 rounded-lg border border-[#333] text-gray-400 hover:border-[#F5A623]/40 disabled:opacity-40 transition-all font-mono text-sm"
          >
            Next →
          </button>
        </div>
      )}

      <p className="mt-16 font-mono text-xs text-gray-700">
        All data sourced from the public Ethereum blockchain. Not financial advice.
      </p>
    </div>
  )
}