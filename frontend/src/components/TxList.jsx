export default function TxList({ transactions }) {
  if (!transactions || transactions.length === 0) {
    return <p className="text-gray-600 font-mono text-sm">No transactions found.</p>
  }

  return (
    <div className="space-y-1">
      {transactions.slice(0, 20).map((tx, i) => {
        const ethValue = (parseInt(tx.value || 0) / 1e18).toFixed(4)
        const date = new Date(parseInt(tx.timeStamp) * 1000).toLocaleDateString()
        const isError = tx.isError === '1'
        const shortHash = `${tx.hash?.slice(0, 10)}...`

        return (
          <div
            key={tx.hash || i}
            className="flex items-center justify-between py-2 border-b border-[#1a1a1a] text-sm"
          >
            <div className="flex items-center gap-4">
              <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${isError ? 'bg-red-500' : 'bg-emerald-400'}`} />
              <a
                href={`https://etherscan.io/tx/${tx.hash}`}
                target="_blank"
                rel="noreferrer"
                className="font-mono text-slate-400 hover:text-cyan-400 transition-colors"
              >
                {shortHash}
              </a>
              <span className="text-slate-500 text-xs">{date}</span>
            </div>
            <span className="font-mono text-[#FFB84D] text-sm">{ethValue} ETH</span>
          </div>
        )
      })}
    </div>
  )
}
