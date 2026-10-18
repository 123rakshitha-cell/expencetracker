import React from 'react'
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts'

const COLORS = [
  '#4F46E5', '#06B6D4', '#F59E0B', '#EF4444',
  '#10B981', '#8B5CF6', '#EC4899', '#64748B'
]

function formatCurrency(n) {
  return '₹' + Number(n || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })
}

export default function CategoryChart({ categorySummary }) {
  const categories = categorySummary?.categories || []

  if (categories.length === 0) {
    return (
      <div className="card chart-card">
        <h3>Category-wise Spending</h3>
        <p className="empty-hint">No expenses to chart yet for this month.</p>
      </div>
    )
  }

  const data = categories.map((c) => ({
    name: c.category,
    value: c.total
  }))

  return (
    <div className="card chart-card">
      <h3>Category-wise Spending</h3>
      <ResponsiveContainer width="100%" height={260}>
        <PieChart>
          <Pie
            data={data}
            dataKey="value"
            nameKey="name"
            cx="50%"
            cy="50%"
            innerRadius={55}
            outerRadius={90}
            paddingAngle={2}
          >
            {data.map((entry, index) => (
              <Cell key={entry.name} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip formatter={(value) => formatCurrency(value)} />
          <Legend />
        </PieChart>
      </ResponsiveContainer>

      <div className="category-list">
        {categories.map((c) => (
          <div key={c.category} className="category-row">
            <span className="category-name">{c.category}</span>
            <span className="category-amount">{formatCurrency(c.total)}</span>
            <span className="category-pct">{c.percentage}%</span>
            <span className="category-count">{c.count} txns</span>
          </div>
        ))}
      </div>
    </div>
  )
}
