import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'

function getSuspicionStyle(score) {
  if (score >= 70) {
    return {
      pill: 'text-red-200 border-red-300/50 bg-red-500/20',
      dot: 'bg-red-300',
      label: 'High',
    }
  }
  if (score >= 40) {
    return {
      pill: 'text-amber-100 border-amber-200/50 bg-amber-400/20',
      dot: 'bg-amber-200',
      label: 'Amber',
    }
  }
  return {
    pill: 'text-emerald-100 border-emerald-200/50 bg-emerald-400/20',
    dot: 'bg-emerald-200',
    label: 'Low',
  }
}

export default function WalletCard({ wallet, index, suspicionScore = 0 }) {
  const shortAddress = `${wallet.address.slice(0, 6)}...${wallet.address.slice(-4)}`
  const walletLabel = wallet.name || wallet.id.replace(/_/g, ' ')
  const balanceEth = Number(wallet.balance_eth || 0)
  const cardThemes = [
    'from-[#1f284f] via-[#1d173a] to-[#311d49] border-[#3a4b89] hover:border-[#7f8fff]',
    'from-[#213a4f] via-[#1f2745] to-[#33284a] border-[#3f6281] hover:border-[#59d4ff]',
    'from-[#3b2243] via-[#20274f] to-[#22213b] border-[#6a4d85] hover:border-[#ff9adf]',
  ]
  const theme = cardThemes[index % cardThemes.length]
  const suspicionStyle = getSuspicionStyle(suspicionScore)

  const formattedBalance = balanceEth >= 1000
    ? `${Math.round(balanceEth).toLocaleString()} ETH`
    : `${balanceEth.toFixed(3)} ETH`

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
    >
      <Link
        to={`/wallet/${wallet.id}`}
        className={`block p-5 rounded-2xl border bg-gradient-to-br ${theme} hover:-translate-y-1 transition-all duration-300 group shadow-[0_18px_30px_rgba(0,0,0,0.25)]`}
      >
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-mono text-[#ced7ff] uppercase tracking-widest">{walletLabel}</span>
          <span className="text-xs text-[#8df6d8] opacity-0 group-hover:opacity-100 transition-opacity">View →</span>
        </div>

        <div className="mb-3">
          <span className={`inline-flex items-center gap-2 text-[11px] font-mono px-2.5 py-1 rounded-full border ${suspicionStyle.pill}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${suspicionStyle.dot}`} />
            Suspicion {suspicionScore}/100 ({suspicionStyle.label})
          </span>
        </div>

        <p className="font-mono text-sm text-[#8df6d8] mb-1">Balance {formattedBalance}</p>

        <p className="font-mono text-sm text-[#f6f8ff]">{shortAddress}</p>
        <div className="mt-3 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-[#59f3be] animate-pulse" />
          <span className="text-xs text-[#b7c1f3]">Active on Ethereum</span>
        </div>
      </Link>
    </motion.div>
  )
}
