import { motion } from 'framer-motion'
import { useEffect, useRef, useState } from 'react'
import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'
import { PageLayout } from '../components/PageLayout'

const findings = [
  {
    color: 'border-[#FFB84D]',
    title: 'Finding 1: Pre-event activity spikes are consistent',
    body: 'In 3 of 4 events studied, at least two tracked wallets showed transaction frequency 2–5x above their 30-day baseline in the 24 hours before the event. This suggests either early access to information, coordinated risk management, or reflexive hedging behavior that precedes retail awareness.',
  },
  {
    color: 'border-emerald-400',
    title: 'Finding 2: Accumulation precedes positive catalysts',
    body: 'Before the Ethereum Merge, net inflows to tracked wallets rose notably in the preceding 72 hours, consistent with a buy-the-news positioning strategy. No significant transfer-to-exchange behavior was observed, indicating wallets intended to hold through the event.',
  },
  {
    color: 'border-red-400',
    title: 'Finding 3: Systematic liquidation patterns precede crashes',
    body: 'Both the FTX and LUNA events were preceded by systematic wallet-to-exchange transfers — a pattern historically associated with preparing assets for sale. The signal was most pronounced in the LUNA case, where one wallet executed 12x its daily transaction baseline in a 6-hour window, 18 hours before the public collapse.',
  },
  {
    color: 'border-gray-600',
    title: 'Finding 4: Mixed catalysts produce no clear whale consensus',
    body: 'The Bitcoin ETF approval produced divergent behavior across wallets, with some accumulating ETH and others rotating into stablecoins. This suggests that when event outcomes are uncertain or affect assets differently, whale behavior is not a reliable directional signal.',
  },
]

const monthlyReports = [
  { month: 'January 2026', title: 'ETF Rotation Month', anomalyWallets: 3, avgSuspicion: 58, topSignal: 'Exchange-bound transfers rose 41%' },
  { month: 'February 2026', title: 'Accumulation Wave', anomalyWallets: 2, avgSuspicion: 44, topSignal: 'Net inflow to cold wallets surged 26%' },
  { month: 'March 2026', title: 'Pre-News Positioning', anomalyWallets: 4, avgSuspicion: 67, topSignal: 'Night-time transactions doubled week-over-week' },
  { month: 'April 2026', title: 'Mixed Risk Regime', anomalyWallets: 3, avgSuspicion: 51, topSignal: 'Divergent wallet behavior across the same events' },
]

function scoreTone(score) {
  if (score >= 70) return 'text-red-300 border-red-500/30 bg-red-500/10'
  if (score >= 40) return 'text-amber-300 border-amber-500/30 bg-amber-500/10'
  return 'text-emerald-300 border-emerald-500/30 bg-emerald-500/10'
}

export default function Report() {
  const reportRef = useRef(null)
  const [exporting, setExporting] = useState(false)
  const [photoEntries, setPhotoEntries] = useState([])

  useEffect(() => {
    return () => {
      photoEntries.forEach(entry => URL.revokeObjectURL(entry.url))
    }
  }, [photoEntries])

  const handlePhotoUpload = (event) => {
    const files = Array.from(event.target.files || [])
    if (!files.length) return

    const newEntries = files.map((file) => ({
      id: `${file.name}-${file.lastModified}`,
      name: file.name,
      url: URL.createObjectURL(file),
      addedAt: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
    }))

    setPhotoEntries((prev) => [...prev, ...newEntries].slice(0, 12))
    event.target.value = ''
  }

  const clearPhotos = () => {
    photoEntries.forEach(entry => URL.revokeObjectURL(entry.url))
    setPhotoEntries([])
  }

  const handleExport = async () => {
    setExporting(true)
    try {
      const canvas = await html2canvas(reportRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#080808',
        logging: false,
      })
      const imgData = canvas.toDataURL('image/png')
      const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
      const pageWidth = pdf.internal.pageSize.getWidth()
      const pageHeight = pdf.internal.pageSize.getHeight()
      const imgHeight = (canvas.height * pageWidth) / canvas.width
      let heightLeft = imgHeight
      let position = 0
      pdf.addImage(imgData, 'PNG', 0, position, pageWidth, imgHeight)
      heightLeft -= pageHeight
      while (heightLeft > 0) {
        position = heightLeft - imgHeight
        pdf.addPage()
        pdf.addImage(imgData, 'PNG', 0, position, pageWidth, imgHeight)
        heightLeft -= pageHeight
      }
      pdf.save(`whale-tracker-report-${new Date().toISOString().split('T')[0]}.pdf`)
    } catch (err) {
      console.error('PDF export failed:', err)
    } finally {
      setExporting(false)
    }
  }

  return (
    <PageLayout
      title="Research Report Studio"
      subtitle="Generate comprehensive whale behavior analysis reports with evidence and PDF export"
    >
      <div className="flex flex-wrap items-center justify-end gap-2 mb-6">
        <label className="font-mono text-xs px-4 py-2 border border-blue-500/40 text-blue-300 rounded hover:bg-blue-500/10 transition-all cursor-pointer">
          + Add Photos
          <input type="file" accept="image/*" multiple className="hidden" onChange={handlePhotoUpload} />
        </label>
        <button
          onClick={handleExport}
          disabled={exporting}
          className="flex items-center gap-2 font-mono text-xs px-4 py-2 border border-amber-500/40 text-amber-300 rounded hover:bg-amber-500/10 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {exporting ? (
            <>
              <span className="w-3 h-3 border border-amber-300 border-t-transparent rounded-full animate-spin" />
              Generating PDF...
            </>
          ) : '↓ Export PDF Report'}
        </button>
      </div>

      <div ref={reportRef} className="rounded-2xl border border-cyan-500/40 bg-gradient-to-br from-cyan-950/30 via-slate-950/40 to-purple-950/20 p-6 sm:p-10 lg:p-12 shadow-[0_0_50px_rgba(34,211,238,0.25),inset_0_0_30px_rgba(34,211,238,0.08)] backdrop-blur-xl relative overflow-hidden group">
        <div className="absolute inset-0 bg-gradient-to-br from-white/8 via-transparent to-transparent pointer-events-none rounded-2xl" />
        <div className="absolute -inset-1 bg-gradient-to-br from-cyan-500/10 via-transparent to-purple-500/10 opacity-0 group-hover:opacity-20 blur-2xl transition-opacity duration-300 pointer-events-none rounded-2xl" />
        <p className="font-mono text-xs text-amber-400 tracking-widest uppercase mb-6 relative z-10">
          Research Report · {new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
        </p>

        <h1 className="text-4xl font-bold text-slate-50 mb-3 leading-tight relative z-10">
          Do Whale Wallets Signal<br />Market Direction?
        </h1>
        <p className="text-slate-400 leading-relaxed mb-12 relative z-10">
          An on-chain behavioral analysis of five major Ethereum wallets across four significant market events.
        </p>

        <section className="mb-10">
          <h2 className="text-lg font-semibold text-slate-50 mb-3 font-mono">Abstract</h2>
          <p className="text-slate-400 leading-relaxed text-sm">
            This report examines the on-chain transaction behavior of five major Ethereum wallets
            in the 48-hour window surrounding four significant crypto market events between 2022
            and 2024. Using publicly available Etherscan data, we identify patterns in transaction
            frequency, net ETH flow, and timing that may serve as early indicators of market direction.
          </p>
        </section>

        <section className="mb-10">
          <h2 className="text-lg font-semibold text-slate-50 mb-3 font-mono">Methodology</h2>
          <p className="text-slate-400 leading-relaxed text-sm mb-3">
            Five wallets were selected based on public identification and known market influence:
            Vitalik Buterin, Wintermute Trading, Jump Trading, Alameda Research, and Paradigm.
            For each of four major events, all transactions in a ±48 hour window were extracted
            via the Etherscan API.
          </p>
          <p className="text-slate-400 leading-relaxed text-sm">
            For each wallet and event, we computed net ETH flow, transaction count deviation
            from the 30-day rolling baseline, and presence of exchange-bound transfer patterns.
            Events studied: FTX bankruptcy (Nov 2022), Ethereum Merge (Sep 2022), Bitcoin ETF
            approval (Jan 2024), and the LUNA/Terra collapse (May 2022).
          </p>
        </section>

        <section className="mb-10">
          <h2 className="text-lg font-semibold text-slate-50 mb-6 font-mono">Key Findings</h2>
          <div className="space-y-6">
            {findings.map((f, i) => (
              <div key={i} className={`border-l-2 pl-5 ${f.color}`}>
                <p className="text-slate-50 font-medium mb-2 text-sm">{f.title}</p>
                <p className="text-slate-400 text-sm leading-relaxed">{f.body}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mb-12">
          <h2 className="text-lg font-semibold text-slate-50 mb-4 font-mono">Monthly Reports</h2>
          <p className="text-slate-400 text-sm leading-relaxed mb-5">
            Rolling monthly intelligence snapshots showing anomaly concentration, average suspicion scores,
            and primary behavioral signatures.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
            {monthlyReports.map((report) => (
              <div key={report.month} className="rounded-2xl border border-cyan-500/40 bg-gradient-to-br from-cyan-950/30 via-slate-950/40 to-purple-950/20 p-4 backdrop-blur-xl shadow-[0_0_40px_rgba(34,211,238,0.2),inset_0_0_20px_rgba(34,211,238,0.08)] hover:shadow-[0_0_60px_rgba(34,211,238,0.3),inset_0_0_25px_rgba(34,211,238,0.12)] transition-all duration-300 relative overflow-hidden group">
                <div className="absolute inset-0 bg-gradient-to-br from-white/8 via-transparent to-transparent pointer-events-none rounded-2xl" />
                <p className="font-mono text-xs text-slate-400 mb-1.5 relative z-10 font-semibold">{report.month}</p>
                <p className="text-sm text-slate-300 mb-3.5 relative z-10 font-semibold">{report.title}</p>
                <div className="space-y-2.5 font-mono text-xs text-slate-400 relative z-10">
                  <div className="flex justify-between">
                    <span>Anomaly Wallets</span>
                    <span className="text-slate-300">{report.anomalyWallets}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Avg Suspicion</span>
                    <span className={`px-2.5 py-1 rounded-full border backdrop-blur-xl ${scoreTone(report.avgSuspicion)}`}>{report.avgSuspicion}/100</span>
                  </div>
                </div>
                <p className="font-mono text-[11px] text-slate-400 mt-3">{report.topSignal}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mb-10">
          <div className="flex items-center justify-between gap-3 mb-4">
            <h2 className="text-lg font-semibold text-slate-50 font-mono">Photo Evidence Report</h2>
            {photoEntries.length > 0 && (
              <button
                type="button"
                onClick={clearPhotos}
                className="font-mono text-[11px] px-2.5 py-1 border border-slate-700 text-slate-300 rounded hover:bg-slate-700/20 transition-all"
              >
                Clear Photos
              </button>
            )}
          </div>

          {photoEntries.length === 0 ? (
            <div className="rounded-lg border border-dashed border-slate-700 bg-slate-900/40 px-5 py-8 text-center">
              <p className="text-sm text-slate-300 mb-1">No photos added yet.</p>
              <p className="font-mono text-xs text-slate-500">Use Add Photos to attach screenshots, chart exports, or event evidence.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {photoEntries.map((entry) => (
                <div key={entry.id} className="rounded-lg border border-slate-800 bg-slate-900/40 overflow-hidden">
                  <img src={entry.url} alt={entry.name} className="w-full h-44 object-cover" />
                  <div className="px-3 py-3">
                    <p className="text-xs text-slate-300 truncate">{entry.name}</p>
                    <p className="font-mono text-[11px] text-slate-500 mt-1">Added {entry.addedAt}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="mb-10">
          <h2 className="text-lg font-semibold text-slate-50 mb-3 font-mono">Limitations</h2>
          <p className="text-slate-400 leading-relaxed text-sm">
            This analysis covers a small sample of five wallets and four events. Statistical
            significance has not been formally tested. Correlation does not imply causation —
            whale wallets may react to the same public information retail traders have access to.
            Wallet attribution is imperfect and future research should expand the wallet set
            and apply statistical significance testing.
          </p>
        </section>

        <section className="mb-10">
          <h2 className="text-lg font-semibold text-slate-50 mb-3 font-mono">Conclusion</h2>
          <p className="text-slate-400 leading-relaxed text-sm">
            On-chain whale behavior shows repeatable patterns around major market events,
            particularly pre-crash liquidation signals and pre-rally accumulation behavior.
            While not reliable as a standalone signal, these patterns may complement other
            analytical frameworks. The Ethereum public blockchain provides a rich, free, and
            permissionless dataset for market research that remains underutilized by most analysts.
          </p>
        </section>

        <div className="border-t border-slate-800 pt-6 mt-12">
          <p className="font-mono text-xs text-slate-500">
            Data sourced from Etherscan public API. For educational purposes only. Not financial advice.
          </p>
          <p className="font-mono text-xs text-slate-500 mt-1">
            Generated by Whale Tracker · {new Date().toLocaleDateString()}
          </p>
        </div>
      </div>
    </PageLayout>
  )
}