export default function SuspicionScore({ score, breakdown }) {
  if (score === undefined) return null

  const getColor = (s) => {
    if (s >= 70) return {
      text: 'text-red-400',
      bg: 'bg-red-400',
      border: 'border-red-500/60',
      gradient: 'from-red-950/40 via-red-900/10 to-slate-950/20',
      glow: 'shadow-[0_0_60px_rgba(248,113,113,0.35),inset_0_0_40px_rgba(248,113,113,0.1)]',
      pulse: 'animate-pulse'
    }
    if (s >= 40) return {
      text: 'text-amber-400',
      bg: 'bg-amber-400',
      border: 'border-amber-500/60',
      gradient: 'from-amber-950/40 via-amber-900/10 to-slate-950/20',
      glow: 'shadow-[0_0_60px_rgba(251,146,60,0.35),inset_0_0_40px_rgba(251,146,60,0.1)]',
      pulse: 'animate-pulse'
    }
    return {
      text: 'text-emerald-400',
      bg: 'bg-emerald-400',
      border: 'border-emerald-500/60',
      gradient: 'from-emerald-950/40 via-emerald-900/10 to-slate-950/20',
      glow: 'shadow-[0_0_60px_rgba(52,211,153,0.35),inset_0_0_40px_rgba(52,211,153,0.1)]',
      pulse: ''
    }
  }

  const getLabel = (s) => {
    if (s >= 70) return 'High Risk'
    if (s >= 40) return 'Suspicious'
    return 'Normal'
  }

  const c = getColor(score)

  return (
    <div className={`relative rounded-2xl p-6 border ${c.border} backdrop-blur-xl ${c.glow} bg-gradient-to-br ${c.gradient} overflow-hidden group transition-all duration-300`}>
      {/* Background gradients */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-transparent rounded-2xl" />
        <div className={`absolute -inset-1 bg-gradient-to-br ${c.gradient} opacity-0 group-hover:opacity-40 blur-2xl transition-opacity duration-500 pointer-events-none`} />
      </div>

      <div className="relative z-10">
        <p className="font-mono text-xs text-slate-400 uppercase tracking-widest mb-5 opacity-80">
          Suspicion Score
        </p>

        {/* Big score with glow */}
        <div className="flex items-end gap-3 mb-6">
          <div className="relative">
            <div className={`absolute inset-0 blur-2xl ${c.bg} opacity-30`} />
            <span className={`relative text-6xl font-mono font-bold ${c.text}`}>{score}</span>
          </div>
          <span className="text-slate-500 font-mono text-sm mb-3">/ 100</span>
          <span className={`font-mono text-xs px-4 py-2 rounded-full border ${c.text} ${c.border} mb-2 bg-gradient-to-r ${c.gradient} backdrop-blur-xl transition-all duration-300`}>
            {getLabel(score)}
          </span>
        </div>

        {/* Progress bar with glow */}
        <div className="w-full bg-slate-900/60 rounded-full h-2.5 mb-6 border border-slate-700/40 backdrop-blur-sm overflow-hidden">
          <div
            className={`h-2.5 rounded-full ${c.bg} transition-all duration-700 shadow-[0_0_20px_currentColor]`}
            style={{ width: `${score}%` }}
          />
        </div>

        {/* Breakdown */}
        {breakdown && (
          <div className="space-y-4 border-t border-slate-700/30 pt-4">
            <p className="font-mono text-xs text-slate-500 uppercase tracking-wider">Breakdown</p>
            {Object.entries(breakdown).map(([key, val]) => (
              <div key={key} className="flex items-center justify-between">
                <span className="font-mono text-xs text-slate-400 capitalize">
                  {key.replace(/_/g, ' ')}
                </span>
                <div className="flex items-center gap-3">
                  <div className="w-24 bg-slate-900/60 rounded-full h-1.5 border border-slate-700/40 overflow-hidden">
                    <div
                      className={`h-1.5 rounded-full ${c.bg} transition-all duration-500 shadow-[0_0_10px_currentColor]`}
                      style={{ width: `${(val / 30) * 100}%` }}
                    />
                  </div>
                  <span className={`font-mono text-xs ${c.text} font-semibold`}>{val}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}