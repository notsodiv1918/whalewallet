import { motion } from 'framer-motion'

export function DataPanel({
  title,
  subtitle,
  children,
  index = 0,
  className = '',
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.1 }}
      className={`rounded-2xl border border-cyan-500/40 backdrop-blur-xl bg-gradient-to-br from-cyan-950/30 via-slate-950/40 to-purple-950/20 p-6 shadow-[0_0_50px_rgba(34,211,238,0.25),inset_0_0_30px_rgba(34,211,238,0.08)] hover:shadow-[0_0_70px_rgba(34,211,238,0.35),inset_0_0_30px_rgba(34,211,238,0.12)] transition-all duration-300 relative overflow-hidden group ${className}`}
    >
      <div className="absolute inset-0 pointer-events-none rounded-2xl">
        <div className="absolute inset-0 bg-gradient-to-br from-white/8 via-transparent to-transparent rounded-2xl" />
        <div className="absolute -inset-1 bg-gradient-to-br from-cyan-500/10 via-transparent to-purple-500/10 opacity-0 group-hover:opacity-50 blur-2xl transition-opacity duration-500 pointer-events-none rounded-2xl" />
      </div>

      {title && (
        <div className="mb-6 flex items-center justify-between relative z-10">
          <div>
            <h3 className="text-lg font-semibold text-slate-50">{title}</h3>
            {subtitle && (
              <p className="mt-1 text-sm text-slate-400">{subtitle}</p>
            )}
          </div>
        </div>
      )}
      <div className="relative z-10">{children}</div>
    </motion.div>
  )
}
