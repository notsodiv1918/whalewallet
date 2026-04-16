import { motion } from 'framer-motion'

export function StatCard({ label, value, change, icon: Icon, index = 0 }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.1 }}
      className="rounded-2xl border border-cyan-500/40 backdrop-blur-xl bg-gradient-to-br from-cyan-950/30 via-slate-950/40 to-purple-950/20 p-6 shadow-[0_0_50px_rgba(34,211,238,0.25),inset_0_0_30px_rgba(34,211,238,0.08)] hover:shadow-[0_0_70px_rgba(34,211,238,0.35),inset_0_0_30px_rgba(34,211,238,0.12)] transition-all duration-300 relative overflow-hidden group"
    >
      <div className="absolute inset-0 pointer-events-none rounded-2xl">
        <div className="absolute inset-0 bg-gradient-to-br from-white/8 via-transparent to-transparent rounded-2xl" />
        <div className="absolute -inset-1 bg-gradient-to-br from-cyan-500/10 via-transparent to-purple-500/10 opacity-0 group-hover:opacity-50 blur-2xl transition-opacity duration-500 pointer-events-none rounded-2xl" />
      </div>

      <div className="flex items-start justify-between relative z-10">
        <div>
          <p className="text-sm font-medium text-slate-400">{label}</p>
          <p className="mt-2 text-3xl font-semibold text-slate-50">{value}</p>
          {change && (
            <p
              className={`mt-2 text-sm font-medium ${
                change > 0 ? 'text-emerald-400' : 'text-red-400'
              }`}
            >
              {change > 0 ? '+' : ''}{change}% from last period
            </p>
          )}
        </div>
        {Icon && (
          <div className="rounded-xl bg-gradient-to-br from-cyan-900/60 to-purple-900/40 p-3 border border-cyan-500/30 backdrop-blur-sm">
            <Icon className="h-6 w-6 text-cyan-300" />
          </div>
        )}
      </div>
    </motion.div>
  )
}
