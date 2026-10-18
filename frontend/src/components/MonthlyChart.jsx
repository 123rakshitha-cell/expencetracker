import React from 'react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'

function formatCurrency(n) {
  return '₹' + Number(n || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })
}

export default function MonthlyChart({ dashboard }) {
  const series = dashboard?.daily_series || []

  if (series.length === 0) {
    return (
      <div className="card chart-card">
        <h3>Daily Spending</h3>
        <p className="empty-hint">No expenses to chart yet for this month.</p>
      </div>
    )
  }

  const data = series.map((d) => ({
    day: d.date.slice(-2),
    amount: d.amount
  }))

  return (
    <div className="card chart-card">
      <h3>Daily Spending This Month</h3>
      <ResponsiveContainer width="100%" height={260}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
          <XAxis dataKey="day" tick={{ fontSize: 12 }} />
          <YAxis tick={{ fontSize: 12 }} />
          <Tooltip formatter={(value) => formatCurrency(value)} labelFormatter={(l) => `Day ${l}`} />
          <Bar dataKey="amount" fill="#4F46E5" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
