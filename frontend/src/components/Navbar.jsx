import { Link, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'

const links = [
  { to: '/', label: 'Dashboard' },
  { to: '/signals', label: 'Early Signals' },
  { to: '/network', label: 'Network Graph' },
  { to: '/suspicion-v2', label: 'Suspicion 2.0' },
  { to: '/insights-dashboard', label: 'Insights Dashboard' },
  { to: '/actionable-insights', label: 'Actionable Insights' },
  { to: '/compare', label: 'Compare Mode' },
  { to: '/events', label: 'Event Analysis' },
  { to: '/report', label: 'Research Report' },
]

export default function Navbar() {
  const { pathname } = useLocation()

  return (
    <nav className="border-b border-[#1a1a1a] bg-[#080808]/90 backdrop-blur-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between gap-6">
        <Link to="/" className="flex items-center gap-3 shrink-0">
          <span className="font-mono text-[#F5A623] font-bold tracking-tight">WHALE.TRACK</span>
        </Link>
        <div className="flex items-center gap-6 overflow-x-auto no-scrollbar py-2">
          {links.map(link => (
            <Link
              key={link.to}
              to={link.to}
              className={`text-sm whitespace-nowrap font-mono transition-colors relative pb-1 ${
                pathname === link.to ? 'text-[#F5A623]' : 'text-gray-500 hover:text-gray-300'
              }`}
            >
              {link.label}
              {pathname === link.to && (
                <motion.div
                  layoutId="nav-indicator"
                  className="absolute -bottom-px left-0 right-0 h-px bg-[#F5A623]"
                />
              )}
            </Link>
          ))}
        </div>
      </div>
    </nav>
  )
}
