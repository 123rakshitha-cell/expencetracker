import React from 'react'

const ICONS = ['💡', '📊', '🎯', '📈', '📉', '💰', '⚠️']

export default function AIInsights({ insights, loading }) {
  return (
    <div className="card insights-card">
      <h3>🤖 AI Spending Insights</h3>
      {loading ? (
        <p className="empty-hint">Analyzing your spending...</p>
      ) : insights && insights.length > 0 ? (
        <div className="insights-grid">
          {insights.map((text, idx) => (
            <div key={idx} className="insight-item">
              <span className="insight-icon">{ICONS[idx % ICONS.length]}</span>
              <p>{text}</p>
            </div>
          ))}
        </div>
      ) : (
        <p className="empty-hint">No insights available yet. Add some expenses first.</p>
      )}
    </div>
  )
}
