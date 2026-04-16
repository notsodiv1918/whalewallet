import { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import axios from 'axios'
import TransactionDetail from '../components/TransactionDetail'
import { PageLayout } from '../components/PageLayout'

const FALLBACK_WALLETS = [
  { id: 'vitalik', address: '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045', name: 'Vitalik Buterin' },
  { id: 'wintermute', address: '0x28C6c06298d514Db089934071355E5743bf21d60', name: 'Wintermute Trading' },
  { id: 'jump_trading', address: '0x6555e1CC97d3cbA6eAddebBCD7Ca51d75771e0B8', name: 'Jump Trading' },
  { id: 'alameda_research', address: '0x477573f212A7bdD5F7C12889bd1ad0aA44fb82aa', name: 'Alameda Research' },
  { id: 'paradigm', address: '0x3300f198988e4C9C63F75dF86De36421f06af8c4', name: 'Paradigm' },
]

const FALLBACK_EVENTS = [
  { name: 'FTX Collapse', date: '2022-11-08' },
  { name: 'ETH Merge', date: '2022-09-15' },
  { name: 'Bitcoin ETF Approval', date: '2024-01-10' },
  { name: 'LUNA Crash', date: '2022-05-09' },
]

function prettyWalletName(id) {
  return id.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
}

function walletLabel(wallet) {
  return wallet?.name || prettyWalletName(wallet?.id || '')
}

function fallbackScoreFromWalletId(walletId) {
  const seed = walletId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)
  return 20 + (seed % 70)
}

function formatDiff(value, unit = '') {
  const sign = value > 0 ? '+' : ''
  return `${sign}${value}${unit}`
}

function getScoreTone(score) {
  if (score >= 70) return { text: 'text-red-300', bg: 'bg-red-400/20 border-red-300/40', label: 'High Risk' }
  if (score >= 40) return { text: 'text-amber-100', bg: 'bg-amber-400/20 border-amber-200/40', label: 'Amber' }
  return { text: 'text-emerald-100', bg: 'bg-emerald-400/20 border-emerald-200/40', label: 'Normal' }
}

function getGuidance(compareData) {
  if (!compareData) {
    return {
      signal: 'HOLD',
      buyerAction: 'Wait for data before opening new risk.',
      sellerAction: 'Avoid emotional exits without event-window divergence.',
      confidence: 'Low',
    }
  }

  const { diff } = compareData
  const pressure =
    (diff.txs_before_delta > 0 ? 1 : -1) +
    (diff.net_flow_before_delta_eth > 0 ? 1 : -1) +
    (diff.suspicion_score_delta < 0 ? 1 : -1)

  if (pressure >= 2) {
    return {
      signal: 'BUY BIAS',
      buyerAction: 'Buyer play: scale in gradually while the selected Wallet A behavior stays stronger pre-event and suspicion remains controlled.',
      sellerAction: 'Seller play: avoid aggressive short exposure until post-event outflow confirms a reversal.',
      confidence: 'Medium',
    }
  }

  if (pressure <= -2) {
    return {
      signal: 'SELL BIAS',
      buyerAction: 'Buyer play: stay defensive and wait for confirmation of inflow recovery before averaging in.',
      sellerAction: 'Seller play: partial de-risking is favored while divergence remains negative and suspicion expands.',
      confidence: 'Medium',
    }
  }

  return {
    signal: 'HOLD / MIXED',
    buyerAction: 'Buyer play: small size only, wait for a cleaner divergence signal.',
    sellerAction: 'Seller play: trim extremes, keep core exposure neutral until trend resolves.',
    confidence: 'Low',
  }
}

export default function CompareMode() {
  const [wallets, setWallets] = useState([])
  const [events, setEvents] = useState(FALLBACK_EVENTS)
  const [suspicionByWallet, setSuspicionByWallet] = useState({})
  const [compareWalletA, setCompareWalletA] = useState('')
  const [compareWalletB, setCompareWalletB] = useState('')
  const [compareEvent, setCompareEvent] = useState(FALLBACK_EVENTS[0].name)
  const [compareData, setCompareData] = useState(null)
  const [compareLoading, setCompareLoading] = useState(false)
  const [compareError, setCompareError] = useState('')
  const [txWalletA, setTxWalletA] = useState([])
  const [txWalletB, setTxWalletB] = useState([])

  useEffect(() => {
    axios.get('/api/wallets?min_balance_eth=0.05&min_non_zero_wallets=100&max_wallets=100')
      .then(r => {
        const list = Array.isArray(r.data?.wallets) ? r.data.wallets : []
        setWallets(list)
        if (list.length >= 2) {
          setCompareWalletA(list[0].id)
          setCompareWalletB(list[1].id)
        }
      })
      .catch(() => {
        setWallets(FALLBACK_WALLETS)
        setCompareWalletA(FALLBACK_WALLETS[0].id)
        setCompareWalletB(FALLBACK_WALLETS[1].id)
      })
  }, [])

  useEffect(() => {
    axios.get('/api/dashboard/intel')
      .then(r => {
        const data = r.data || {}
        if (Array.isArray(data.events) && data.events.length > 0) {
          setEvents(data.events)
        }
        if (data.suspicion_by_wallet) {
          setSuspicionByWallet(data.suspicion_by_wallet)
        }
      })
      .catch(() => setEvents(FALLBACK_EVENTS))
  }, [])

  useEffect(() => {
    // Fetch transactions for both compared wallets
    if (compareWalletA) {
      axios.get(`/api/wallet/${compareWalletA}`)
        .then(r => setTxWalletA(r.data.transactions || []))
        .catch(() => setTxWalletA([]))
    }
    if (compareWalletB) {
      axios.get(`/api/wallet/${compareWalletB}`)
        .then(r => setTxWalletB(r.data.transactions || []))
        .catch(() => setTxWalletB([]))
    }
  }, [compareWalletA, compareWalletB])

  const fallbackScores = useMemo(() => {
    const map = {}
    wallets.forEach(wallet => {
      map[wallet.id] = { score: fallbackScoreFromWalletId(wallet.id), breakdown: {} }
    })
    return map
  }, [wallets])

  useEffect(() => {
    if (!wallets.length) return
    if (!compareWalletA) setCompareWalletA(wallets[0].id)
    if (!compareWalletB && wallets.length > 1) setCompareWalletB(wallets[1].id)
  }, [wallets, compareWalletA, compareWalletB])

  useEffect(() => {
    if (!events.length) return
    const firstEvent = events[0]?.name
    if (firstEvent && !events.find(event => event.name === compareEvent)) {
      setCompareEvent(firstEvent)
    }
  }, [events, compareEvent])

  useEffect(() => {
    if (!compareWalletA || !compareWalletB || !compareEvent) return
    if (compareWalletA === compareWalletB) {
      setCompareData(null)
      setCompareError('Select two different wallets to compare.')
      return
    }

    setCompareError('')
    setCompareLoading(true)
    axios.get('/api/compare', {
      params: {
        wallet_a: compareWalletA,
        wallet_b: compareWalletB,
        event_name: compareEvent,
      },
    })
      .then(r => setCompareData(r.data))
      .catch(() => {
        const scoreA = (suspicionByWallet[compareWalletA]?.score ?? fallbackScores[compareWalletA]?.score ?? 0)
        const scoreB = (suspicionByWallet[compareWalletB]?.score ?? fallbackScores[compareWalletB]?.score ?? 0)
        setCompareData({
          event: { name: compareEvent },
          wallet_a: {
            wallet_label: prettyWalletName(compareWalletA),
            suspicion: { score: scoreA },
            behavior: { txs_before_event: 12 + (scoreA % 7), txs_after_event: 9 + (scoreA % 8), net_flow_before_eth: 210 + scoreA, net_flow_after_eth: 160 + (scoreA * 0.8) },
          },
          wallet_b: {
            wallet_label: prettyWalletName(compareWalletB),
            suspicion: { score: scoreB },
            behavior: { txs_before_event: 10 + (scoreB % 6), txs_after_event: 8 + (scoreB % 7), net_flow_before_eth: 180 + scoreB, net_flow_after_eth: 150 + (scoreB * 0.75) },
          },
          diff: {
            txs_before_delta: (12 + (scoreA % 7)) - (10 + (scoreB % 6)),
            txs_after_delta: (9 + (scoreA % 8)) - (8 + (scoreB % 7)),
            net_flow_before_delta_eth: Math.round((30 + scoreA - scoreB) * 100) / 100,
            net_flow_after_delta_eth: Math.round((10 + scoreA - scoreB) * 100) / 100,
            suspicion_score_delta: scoreA - scoreB,
          },
        })
        setCompareError('Live compare is temporarily unavailable. Showing modeled comparison.')
      })
      .finally(() => setCompareLoading(false))
  }, [compareWalletA, compareWalletB, compareEvent, suspicionByWallet, fallbackScores])

  const guidance = getGuidance(compareData)

  return (
    <PageLayout
      title="Compare Mode"
      subtitle="Side-by-side wallet behavior divergence around major events with model-driven buyer and seller guidance"
    >
      <div className="rounded-3xl border border-[#355083] bg-[linear-gradient(135deg,rgba(12,19,44,0.95),rgba(18,31,56,0.9),rgba(31,18,49,0.95))] p-6 sm:p-8 shadow-[0_30px_60px_rgba(6,10,28,0.55)]">
        <p className="font-mono text-xs text-[#9cadde] mb-6">Dedicated side-by-side intelligence panel with action guidance</p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <label className="font-mono text-xs text-[#b7c3ea] space-y-2 block">
            Wallet A
            <select
              value={compareWalletA}
              onChange={event => setCompareWalletA(event.target.value)}
              className="w-full rounded-xl bg-[#121c3f] border border-[#3f548a] px-3 py-2 text-[#eef2ff]"
            >
              {wallets.map(wallet => (
                <option key={wallet.id} value={wallet.id}>{walletLabel(wallet)}</option>
              ))}
            </select>
          </label>

          <label className="font-mono text-xs text-[#b7c3ea] space-y-2 block">
            Wallet B
            <select
              value={compareWalletB}
              onChange={event => setCompareWalletB(event.target.value)}
              className="w-full rounded-xl bg-[#121c3f] border border-[#3f548a] px-3 py-2 text-[#eef2ff]"
            >
              {wallets.map(wallet => (
                <option key={wallet.id} value={wallet.id}>{walletLabel(wallet)}</option>
              ))}
            </select>
          </label>

          <label className="font-mono text-xs text-[#b7c3ea] space-y-2 block">
            Event Window
            <select
              value={compareEvent}
              onChange={event => setCompareEvent(event.target.value)}
              className="w-full rounded-xl bg-[#121c3f] border border-[#3f548a] px-3 py-2 text-[#eef2ff]"
            >
              {events.map(event => (
                <option key={event.name} value={event.name}>{event.name}</option>
              ))}
            </select>
          </label>
        </div>

        {compareError && (
          <p className="mb-4 text-xs font-mono text-amber-200 border border-amber-200/30 bg-amber-400/15 rounded-lg px-3 py-2">
            {compareError}
          </p>
        )}

        <div className="rounded-2xl border border-[#3b4f84] bg-[#0f1937]/70 p-5 mb-6">
          <p className="font-mono text-xs text-[#8ef3dc] tracking-widest uppercase mb-2">Buyer / Seller Guidance</p>
          <div className="flex items-center gap-3 mb-3">
            <span className="font-mono text-xs px-2.5 py-1 rounded-full border border-[#68d1ff]/40 text-[#b6e6ff] bg-[#68d1ff]/15">Signal: {guidance.signal}</span>
            <span className="font-mono text-xs px-2.5 py-1 rounded-full border border-[#7f8fc7]/40 text-[#d7e0ff] bg-[#7f8fc7]/15">Confidence: {guidance.confidence}</span>
          </div>
          <p className="text-sm text-[#d6def8] mb-2"><span className="font-mono text-[#90ffd7]">Buyer:</span> {guidance.buyerAction}</p>
          <p className="text-sm text-[#d6def8]"><span className="font-mono text-[#ffb4c1]">Seller:</span> {guidance.sellerAction}</p>
          <p className="font-mono text-[11px] text-[#93a6d6] mt-3">Guidance is model-derived from on-chain behavior divergence and should be treated as research support, not financial advice.</p>
        </div>

        {compareLoading && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map(item => (
              <div key={item} className="h-56 rounded-2xl border border-[#3a4f86] bg-[#131f44]/70 animate-pulse" />
            ))}
          </div>
        )}

        {!compareLoading && compareData && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {[compareData.wallet_a, compareData.wallet_b].map((walletCard, idx) => {
              const tone = getScoreTone(walletCard?.suspicion?.score ?? 0)
              return (
                <div key={walletCard.wallet_label} className={`rounded-2xl border border-[#3a4f86] bg-[#121d41]/75 p-5 ${idx === 0 ? 'lg:order-1' : 'lg:order-3'}`}>
                  <p className="font-mono text-xs text-[#8ef3dc] uppercase tracking-widest mb-2">{walletCard.wallet_label}</p>
                  <span className={`inline-flex items-center text-xs font-mono px-2.5 py-1 rounded-full border ${tone.bg} ${tone.text}`}>
                    Suspicion {walletCard?.suspicion?.score ?? 0}/100 - {tone.label}
                  </span>
                  <div className="mt-5 space-y-3 font-mono text-xs text-[#c7d4f7]">
                    <div className="flex justify-between"><span>Tx Before Event</span><span>{walletCard?.behavior?.txs_before_event}</span></div>
                    <div className="flex justify-between"><span>Tx After Event</span><span>{walletCard?.behavior?.txs_after_event}</span></div>
                    <div className="flex justify-between"><span>Net Flow Before</span><span>{walletCard?.behavior?.net_flow_before_eth} ETH</span></div>
                    <div className="flex justify-between"><span>Net Flow After</span><span>{walletCard?.behavior?.net_flow_after_eth} ETH</span></div>
                  </div>
                </div>
              )
            })}

            <div className="rounded-2xl border border-[#3a4f86] bg-[#18143b]/75 p-5 lg:order-2">
              <p className="font-mono text-xs text-[#ff8ec5] uppercase tracking-widest mb-2">Diff View</p>
              <p className="text-sm text-[#dee7ff] mb-4">{compareData?.event?.name}</p>

              <div className="space-y-3 font-mono text-xs">
                <div className="flex justify-between text-[#c7d4f7]">
                  <span>Pre-Event Tx Delta</span>
                  <span className={compareData.diff.txs_before_delta >= 0 ? 'text-emerald-200' : 'text-red-200'}>{formatDiff(compareData.diff.txs_before_delta)}</span>
                </div>
                <div className="flex justify-between text-[#c7d4f7]">
                  <span>Post-Event Tx Delta</span>
                  <span className={compareData.diff.txs_after_delta >= 0 ? 'text-emerald-200' : 'text-red-200'}>{formatDiff(compareData.diff.txs_after_delta)}</span>
                </div>
                <div className="flex justify-between text-[#c7d4f7]">
                  <span>Net Flow Before Delta</span>
                  <span className={compareData.diff.net_flow_before_delta_eth >= 0 ? 'text-emerald-200' : 'text-red-200'}>{formatDiff(compareData.diff.net_flow_before_delta_eth, ' ETH')}</span>
                </div>
                <div className="flex justify-between text-[#c7d4f7]">
                  <span>Net Flow After Delta</span>
                  <span className={compareData.diff.net_flow_after_delta_eth >= 0 ? 'text-emerald-200' : 'text-red-200'}>{formatDiff(compareData.diff.net_flow_after_delta_eth, ' ETH')}</span>
                </div>
                <div className="pt-2 border-t border-[#3e4f89] flex justify-between text-[#d8e0ff]">
                  <span>Suspicion Score Delta</span>
                  <span className={compareData.diff.suspicion_score_delta >= 0 ? 'text-[#ffc6df]' : 'text-[#7beed2]'}>{formatDiff(compareData.diff.suspicion_score_delta)}</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Transaction Details for both wallets */}
      {compareWalletA && compareWalletB && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-12">
          <TransactionDetail transactions={txWalletA} />
          <TransactionDetail transactions={txWalletB} />
        </div>
      )}
    </PageLayout>
  )
}
