import React, { useState } from 'react'

const CATEGORIES = ['Food', 'Transportation', 'Shopping', 'Bills', 'Entertainment', 'Healthcare', 'Education', 'Other']
const PAYMENT_METHODS = ['Cash', 'Credit Card', 'Debit Card', 'UPI', 'Bank Transfer', 'Other']

function formatCurrency(n) {
  return '₹' + Number(n || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })
}

export default function ExpenseList({
  expenses,
  loading,
  filters,
  onFilterChange,
  onEdit,
  onDelete
}) {
  const [confirmingId, setConfirmingId] = useState(null)

  const handleDeleteClick = (id) => {
    if (confirmingId === id) {
      onDelete(id)
      setConfirmingId(null)
    } else {
      setConfirmingId(id)
      setTimeout(() => setConfirmingId((cur) => (cur === id ? null : cur)), 4000)
    }
  }

  const toggleSort = (field) => {
    if (filters.sort_by === field) {
      onFilterChange({ ...filters, order: filters.order === 'asc' ? 'desc' : 'asc' })
    } else {
      onFilterChange({ ...filters, sort_by: field, order: 'desc' })
    }
  }

  return (
    <div className="card">
      <div className="card-header">
        <h3>📜 Expense History</h3>
      </div>

      <div className="filters-bar">
        <input
          type="text"
          placeholder="Search description or category..."
          value={filters.search || ''}
          onChange={(e) => onFilterChange({ ...filters, search: e.target.value })}
        />
        <select
          value={filters.category || ''}
          onChange={(e) => onFilterChange({ ...filters, category: e.target.value })}
        >
          <option value="">All Categories</option>
          {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
        <select
          value={filters.payment_method || ''}
          onChange={(e) => onFilterChange({ ...filters, payment_method: e.target.value })}
        >
          <option value="">All Payment Methods</option>
          {PAYMENT_METHODS.map((p) => <option key={p} value={p}>{p}</option>)}
        </select>
      </div>

      {loading ? (
        <p className="empty-hint">Loading expenses...</p>
      ) : expenses.length === 0 ? (
        <p className="empty-hint">No expenses found. Try adjusting your filters or add a new expense.</p>
      ) : (
        <div className="table-wrapper">
          <table className="expense-table">
            <thead>
              <tr>
                <th onClick={() => toggleSort('date')} className="sortable">
                  Date {filters.sort_by === 'date' ? (filters.order === 'asc' ? '↑' : '↓') : ''}
                </th>
                <th>Category</th>
                <th>Description</th>
                <th>Payment Method</th>
                <th onClick={() => toggleSort('amount')} className="sortable">
                  Amount {filters.sort_by === 'amount' ? (filters.order === 'asc' ? '↑' : '↓') : ''}
                </th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {expenses.map((exp) => (
                <tr key={exp.id}>
                  <td>{exp.date}</td>
                  <td><span className="category-badge">{exp.category}</span></td>
                  <td>{exp.description || <span className="muted">—</span>}</td>
                  <td>{exp.payment_method}</td>
                  <td className="amount-cell">{formatCurrency(exp.amount)}</td>
                  <td className="actions-cell">
                    <button className="icon-btn" onClick={() => onEdit(exp)} title="Edit">✏️</button>
                    <button
                      className={`icon-btn ${confirmingId === exp.id ? 'confirm-delete' : ''}`}
                      onClick={() => handleDeleteClick(exp.id)}
                      title="Delete"
                    >
                      {confirmingId === exp.id ? 'Confirm?' : '🗑️'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
