import React, { useState } from 'react'

function formatCurrency(n) {
  return '₹' + Number(n || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })
}

export default function BudgetCard({ dashboard, onSaveBudget, saving }) {
  const [editing, setEditing] = useState(false)
  const [value, setValue] = useState(dashboard?.budget || 0)

  const budget = dashboard?.budget || 0
  const spent = dashboard?.monthly_total || 0
  const remaining = dashboard?.remaining_budget || 0
  const pct = Math.min(dashboard?.budget_used_percentage || 0, 100)
  const rawPct = dashboard?.budget_used_percentage || 0

  let barColor = 'var(--green)'
  if (rawPct >= 100) barColor = 'var(--red)'
  else if (rawPct >= 80) barColor = 'var(--orange)'

  const handleSave = async (e) => {
    e.preventDefault()
    await onSaveBudget(Number(value))
    setEditing(false)
  }

  return (
    <div className="card budget-card">
      <div className="card-header">
        <h3>🎯 Monthly Budget</h3>
        {!editing && (
          <button className="link-btn" onClick={() => { setValue(budget); setEditing(true) }}>
            {budget ? 'Edit' : 'Set budget'}
          </button>
        )}
      </div>

      {editing ? (
        <form onSubmit={handleSave} className="budget-edit-form">
          <input
            type="number"
            min="0"
            step="0.01"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            autoFocus
          />
          <div className="budget-edit-actions">
            <button type="submit" className="btn-primary" disabled={saving}>Save</button>
            <button type="button" className="btn-secondary" onClick={() => setEditing(false)}>Cancel</button>
          </div>
        </form>
      ) : budget ? (
        <>
          <div className="budget-numbers">
            <span>Budget: <strong>{formatCurrency(budget)}</strong></span>
            <span>Spent: <strong>{formatCurrency(spent)}</strong></span>
            <span>Remaining: <strong className={remaining < 0 ? 'text-red' : ''}>{formatCurrency(remaining)}</strong></span>
          </div>
          <div className="progress-track">
            <div
              className="progress-fill"
              style={{ width: `${pct}%`, backgroundColor: barColor }}
            />
          </div>
          <div className="budget-used-label">{rawPct}% used</div>
          {rawPct >= 100 && (
            <div className="warning-banner">
              ⚠️ You have exceeded your monthly budget by {formatCurrency(Math.abs(remaining))}.
            </div>
          )}
          {rawPct >= 80 && rawPct < 100 && (
            <div className="warning-banner warning-orange">
              You're close to your monthly budget limit.
            </div>
          )}
        </>
      ) : (
        <p className="empty-hint">No budget set for this month yet.</p>
      )}
    </div>
  )
}
