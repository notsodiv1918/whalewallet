import { motion } from 'framer-motion'

const colors = {
  amber: 'text-amber-400',
  green: 'text-emerald-400',
  red: 'text-red-400',
  gray: 'text-gray-400',
}

const colorGradients = {
  amber: 'from-amber-950/40 via-amber-900/10 to-slate-950/20',
  green: 'from-emerald-950/40 via-emerald-900/10 to-slate-950/20',
  red: 'from-red-950/40 via-red-900/10 to-slate-950/20',
  gray: 'from-slate-950/40 via-slate-900/10 to-slate-950/20',
}

const colorGlows = {
  amber: 'shadow-[0_0_60px_rgba(251,146,60,0.3),inset_0_0_30px_rgba(251,146,60,0.1)]',
  green: 'shadow-[0_0_60px_rgba(52,211,153,0.3),inset_0_0_30px_rgba(52,211,153,0.1)]',
  red: 'shadow-[0_0_60px_rgba(248,113,113,0.3),inset_0_0_30px_rgba(248,113,113,0.1)]',
  gray: 'shadow-[0_0_60px_rgba(107,114,128,0.2),inset_0_0_30px_rgba(107,114,128,0.08)]',
}

const colorBorders = {
  amber: 'border-amber-500/50',
  green: 'border-emerald-500/50',
  red: 'border-red-500/50',
  gray: 'border-slate-500/40',
}

export default function StatCard({ label, value, unit, color = 'amber' }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className={`relative border ${colorBorders[color]} rounded-2xl p-5 backdrop-blur-xl bg-gradient-to-br ${colorGradients[color]} ${colorGlows[color]} hover:shadow-[0_0_80px_rgba(34,211,238,0.4),inset_0_0_40px_rgba(34,211,238,0.15)] transition-all duration-300 overflow-hidden group`}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-white/8 via-transparent to-transparent pointer-events-none rounded-2xl" />
      <div className="absolute -inset-1 bg-gradient-to-br from-cyan-500/10 via-transparent to-purple-500/10 opacity-0 group-hover:opacity-40 blur-2xl transition-opacity duration-300 pointer-events-none rounded-2xl" />

      <p className="text-xs font-mono text-slate-400 uppercase tracking-widest mb-3 relative z-10 font-semibold">{label}</p>
      <p className={`text-3xl font-mono font-bold ${colors[color]} relative z-10`}>
        {value ?? '—'}
        {unit && <span className="text-sm text-slate-400 ml-2">{unit}</span>}
      </p>
    </motion.div>
  )
}
