import React from 'react'

function formatCurrency(n) {
  return '₹' + Number(n || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })
}

function formatDisplayDate(dateStr) {
  if (!dateStr) return ''
  const d = new Date(dateStr + 'T00:00:00')
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })
}

export default function Dashboard({ dashboard, loading }) {
  if (loading || !dashboard) {
    return (
      <div className="summary-grid">
        <div className="card summary-card"><p className="empty-hint">Loading...</p></div>
      </div>
    )
  }

  const {
    monthly_total, transaction_count, average_spending,
    budget, remaining_budget, highest_expense
  } = dashboard

  return (
    <>
      <div className="summary-grid">
        <div className="card summary-card">
          <span className="summary-icon">💰</span>
          <div>
            <p className="summary-label">Monthly Total</p>
            <p className="summary-value">{formatCurrency(monthly_total)}</p>
            <p className="summary-sub">{transaction_count} transactions · avg {formatCurrency(average_spending)}</p>
          </div>
        </div>

        <div className="card summary-card">
          <span className="summary-icon">🎯</span>
          <div>
            <p className="summary-label">Monthly Budget</p>
            <p className="summary-value">{formatCurrency(budget)}</p>
          </div>
        </div>

        <div className="card summary-card">
          <span className="summary-icon">💵</span>
          <div>
            <p className="summary-label">Remaining Budget</p>
            <p className={`summary-value ${remaining_budget < 0 ? 'text-red' : ''}`}>
              {formatCurrency(remaining_budget)}
            </p>
          </div>
        </div>

        <div className="card summary-card">
          <span className="summary-icon">🔥</span>
          <div>
            <p className="summary-label">Highest Expense</p>
            <p className="summary-value">
              {highest_expense ? formatCurrency(highest_expense.amount) : '₹0'}
            </p>
            {highest_expense && (
              <p className="summary-sub">
                {highest_expense.category} · {formatDisplayDate(highest_expense.date)}
              </p>
            )}
          </div>
        </div>
      </div>

      {highest_expense && (
        <div className="card highest-expense-card">
          <h3>🔥 Highest Expense This Month</h3>
          <div className="highest-expense-details">
            <div><span>Amount</span><strong>{formatCurrency(highest_expense.amount)}</strong></div>
            <div><span>Category</span><strong>{highest_expense.category}</strong></div>
            <div><span>Date</span><strong>{formatDisplayDate(highest_expense.date)}</strong></div>
            <div><span>Payment Method</span><strong>{highest_expense.payment_method}</strong></div>
            <div className="highest-desc"><span>Description</span><strong>{highest_expense.description || '—'}</strong></div>
          </div>
        </div>
      )}
    </>
  )
}
