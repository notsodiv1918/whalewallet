import { motion } from 'framer-motion'
import { DottedSurface } from './DottedSurface'

export function PageLayout({ children, title, subtitle }) {
  return (
    <DottedSurface>
      <div className="min-h-screen w-full">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-8">
          {title && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="mb-12"
            >
              <h1 className="text-4xl font-semibold tracking-tight text-slate-50">
                {title}
              </h1>
              {subtitle && (
                <p className="mt-3 text-base text-slate-400">{subtitle}</p>
              )}
            </motion.div>
          )}

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            {children}
          </motion.div>
        </div>
      </div>
    </DottedSurface>
  )
}
