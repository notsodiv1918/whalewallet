import { Routes, Route } from 'react-router-dom'
import { AnimatePresence } from 'framer-motion'
import Navbar from './components/Navbar'
import Dashboard from './pages/Dashboard'
import WalletDetail from './pages/WalletDetail'
import EventAnalysis from './pages/EventAnalysis'
import Report from './pages/Report'
import CompareMode from './pages/CompareMode'
import EarlySignalDetector from './pages/EarlySignalDetector'
import WhaleNetworkGraph from './pages/WhaleNetworkGraph'
import SuspicionScoreV2 from './pages/SuspicionScoreV2'
import InteractiveInsightsDashboard from './pages/InteractiveInsightsDashboard'
import ActionableInsights from './pages/ActionableInsights'

export default function App() {
  return (
    <div className="min-h-screen">
      <Navbar />
      <AnimatePresence mode="wait">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/wallet/:id" element={<WalletDetail />} />
          <Route path="/events" element={<EventAnalysis />} />
          <Route path="/report" element={<Report />} />
          <Route path="/compare" element={<CompareMode />} />
          <Route path="/signals" element={<EarlySignalDetector />} />
          <Route path="/network" element={<WhaleNetworkGraph />} />
          <Route path="/suspicion-v2" element={<SuspicionScoreV2 />} />
          <Route path="/insights-dashboard" element={<InteractiveInsightsDashboard />} />
          <Route path="/actionable-insights" element={<ActionableInsights />} />
        </Routes>
      </AnimatePresence>
    </div>
  )
}
