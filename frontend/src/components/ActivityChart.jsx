import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'

const HOURS = Array.from({ length: 24 }, (_, i) => `${i}h`)
const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

export default function ActivityChart({ data, type = 'hourly' }) {
  const labels = type === 'hourly' ? HOURS : DAYS
  const chartData = (data || []).map((val, i) => ({ label: labels[i], count: val }))

  return (
    <ResponsiveContainer width="100%" height={160}>
      <BarChart data={chartData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
        <XAxis
          dataKey="label"
          tick={{ fill: '#555', fontSize: 10, fontFamily: 'JetBrains Mono' }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          tick={{ fill: '#555', fontSize: 10 }}
          axisLine={false}
          tickLine={false}
        />
        <Tooltip
          contentStyle={{ background: '#111', border: '1px solid #222', borderRadius: 8 }}
          labelStyle={{ color: '#F5A623', fontFamily: 'JetBrains Mono', fontSize: 12 }}
          itemStyle={{ color: '#e5e5e5', fontSize: 12 }}
        />
        <Bar dataKey="count" fill="#F5A623" radius={[2, 2, 0, 0]} opacity={0.8} />
      </BarChart>
    </ResponsiveContainer>
  )
}
