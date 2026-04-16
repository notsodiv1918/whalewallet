import { motion } from 'framer-motion'
import { PageLayout } from '../components/PageLayout'

const EVENTS = [
  {
    name: "FTX Collapse",
    date: "Nov 8, 2022",
    summary: "Multiple whale wallets showed massive outflows in the 48h preceding the collapse, with net ETH withdrawals spiking 340% above the 30-day baseline. Wintermute and Jump Trading both showed systematic transfer-to-exchange patterns consistent with preparing assets for liquidation.",
    signal: "SELL",
    confidence: "High",
    txSpike: "+340%",
  },
  {
    name: "ETH Merge",
    date: "Sep 15, 2022",
    summary: "Accumulation patterns detected 72h before the Merge. Tracked wallets increased ETH holdings significantly, with net inflows suggesting buy-the-news positioning. No exchange-bound transfers detected, consistent with long-term hold strategy.",
    signal: "BUY",
    confidence: "Medium",
    txSpike: "+180%",
  },
  {
    name: "Bitcoin ETF Approval",
    date: "Jan 10, 2024",
    summary: "Mixed signals across wallets. Some wallets accumulated ETH while others rotated into BTC-adjacent tokens and stablecoins. No clear consensus direction, suggesting wallets may have had different exposure strategies heading into the event.",
    signal: "MIXED",
    confidence: "Low",
    txSpike: "+90%",
  },
  {
    name: "LUNA Crash",
    date: "May 9, 2022",
    summary: "The clearest pre-event signal in this study. Abnormally high transaction frequency detected 18–24h before the collapse. Several wallets showed systematic liquidation of positions, with one wallet executing 47 transactions in a 6-hour window — 12x its daily baseline.",
    signal: "SELL",
    confidence: "High",
    txSpike: "+520%",
  },
]

const signalStyle = {
  BUY: { text: 'text-emerald-400', bg: 'bg-emerald-400/10', border: 'border-emerald-400/30', bar: 'bg-emerald-400' },
  SELL: { text: 'text-red-400', bg: 'bg-red-400/10', border: 'border-red-400/30', bar: 'bg-red-400' },
  MIXED: { text: 'text-[#FFB84D]', bg: 'bg-[#FFB84D]/10', border: 'border-[#FFB84D]/30', bar: 'bg-[#FFB84D]' },
}

const confidenceWidth = { High: 'w-full', Medium: 'w-2/3', Low: 'w-1/3' }

export default function EventAnalysis() {
  return (
    <PageLayout
      title="Major Event Analysis"
      subtitle="Behavioral analysis of five tracked whale wallets around significant market events"
    >
      <div className="space-y-5">
        {EVENTS.map((event, i) => {
          const s = signalStyle[event.signal]
          return (
            <motion.div
              key={event.name}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.1 }}
              className="rounded-2xl border border-cyan-500/40 bg-gradient-to-br from-cyan-950/30 via-slate-950/40 to-purple-950/20 p-6 grid grid-cols-1 lg:grid-cols-[180px_1fr_140px] gap-6 backdrop-blur-xl shadow-[0_0_50px_rgba(34,211,238,0.25),inset_0_0_30px_rgba(34,211,238,0.08)] hover:shadow-[0_0_70px_rgba(34,211,238,0.35),inset_0_0_30px_rgba(34,211,238,0.12)] transition-all duration-300 relative overflow-hidden group"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-white/8 via-transparent to-transparent pointer-events-none rounded-2xl" />
              <div className="absolute -inset-1 bg-gradient-to-br from-cyan-500/10 via-transparent to-purple-500/10 opacity-0 group-hover:opacity-50 blur-2xl transition-opacity duration-500 pointer-events-none rounded-2xl" />

              <div className="relative z-10">
                <p className="font-mono text-amber-400 font-bold mb-1 text-lg">{event.name}</p>
                <p className="font-mono text-xs text-slate-400">{event.date}</p>
                <p className="font-mono text-xs text-slate-500 mt-4">Tx spike</p>
                <p className="font-mono text-lg text-slate-50 font-semibold">{event.txSpike}</p>
              </div>

              <p className="text-slate-300 text-sm leading-relaxed relative z-10">{event.summary}</p>

              <div className="flex flex-col gap-4 relative z-10">
                <span className={`font-mono text-xs font-bold px-4 py-2 rounded-full border w-fit backdrop-blur-xl ${s.text} ${s.bg} ${s.border}`}>
                  {event.signal}
                </span>
                <div>
                  <p className="font-mono text-xs text-slate-400 mb-2.5 font-semibold">Confidence</p>
                  <div className="w-full bg-slate-900/60 rounded-full h-2 backdrop-blur-sm border border-slate-700/40 overflow-hidden">
                    <div className={`h-2 rounded-full ${s.bar} ${confidenceWidth[event.confidence]} shadow-[0_0_15px_currentColor] transition-all duration-500`} />
                  </div>
                  <p className="font-mono text-xs text-slate-500 mt-2">{event.confidence}</p>
                </div>
              </div>
            </motion.div>
          )
        })}
      </div>

      <p className="mt-10 text-xs font-mono text-slate-500">
        * Signals are derived from on-chain transaction pattern analysis. Correlation does not imply causation. Not financial advice.
      </p>
    </PageLayout>
  )
}
