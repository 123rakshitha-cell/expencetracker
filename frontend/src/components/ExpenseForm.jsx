import React, { useState, useEffect } from 'react'

const CATEGORIES = ['Food', 'Transportation', 'Shopping', 'Bills', 'Entertainment', 'Healthcare', 'Education', 'Other']
const PAYMENT_METHODS = ['Cash', 'Credit Card', 'Debit Card', 'UPI', 'Bank Transfer', 'Other']

const emptyForm = {
  amount: '',
  category: '',
  date: new Date().toISOString().slice(0, 10),
  payment_method: '',
  description: ''
}

export default function ExpenseForm({ onSubmit, editingExpense, onCancelEdit }) {
  const [form, setForm] = useState(emptyForm)
  const [errors, setErrors] = useState({})
  const [submitting, setSubmitting] = useState(false)
  const [successMsg, setSuccessMsg] = useState('')

  useEffect(() => {
    if (editingExpense) {
      setForm({
        amount: editingExpense.amount,
        category: editingExpense.category,
        date: editingExpense.date,
        payment_method: editingExpense.payment_method,
        description: editingExpense.description || ''
      })
    } else {
      setForm(emptyForm)
    }
    setErrors({})
  }, [editingExpense])

  function validate() {
    const errs = {}
    if (!form.amount || Number(form.amount) <= 0) {
      errs.amount = 'Amount is required and must be greater than 0.'
    }
    if (!form.category) {
      errs.category = 'Category is required.'
    }
    if (!form.date) {
      errs.date = 'Date is required.'
    }
    if (!form.payment_method) {
      errs.payment_method = 'Payment method is required.'
    }
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setSuccessMsg('')
    if (!validate()) return

    setSubmitting(true)
    try {
      await onSubmit({
        ...form,
        amount: Number(form.amount)
      })
      setSuccessMsg(editingExpense ? 'Expense updated successfully.' : 'Expense added successfully.')
      if (!editingExpense) setForm(emptyForm)
      setTimeout(() => setSuccessMsg(''), 2500)
    } catch (err) {
      setErrors({ submit: err.message })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="card">
      <h3>{editingExpense ? '✏️ Edit Expense' : '➕ Add Expense'}</h3>
      <form onSubmit={handleSubmit} className="expense-form">
        <div className="form-row">
          <label>
            Amount (₹) *
            <input
              type="number"
              step="0.01"
              min="0"
              value={form.amount}
              onChange={(e) => setForm({ ...form, amount: e.target.value })}
              placeholder="0.00"
            />
            {errors.amount && <span className="field-error">{errors.amount}</span>}
          </label>

          <label>
            Category *
            <select
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
            >
              <option value="">Select category</option>
              {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
            {errors.category && <span className="field-error">{errors.category}</span>}
          </label>
        </div>

        <div className="form-row">
          <label>
            Date *
            <input
              type="date"
              value={form.date}
              onChange={(e) => setForm({ ...form, date: e.target.value })}
            />
            {errors.date && <span className="field-error">{errors.date}</span>}
          </label>

          <label>
            Payment Method *
            <select
              value={form.payment_method}
              onChange={(e) => setForm({ ...form, payment_method: e.target.value })}
            >
              <option value="">Select method</option>
              {PAYMENT_METHODS.map((p) => <option key={p} value={p}>{p}</option>)}
            </select>
            {errors.payment_method && <span className="field-error">{errors.payment_method}</span>}
          </label>
        </div>

        <label>
          Description / Notes
          <textarea
            rows="2"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            placeholder="Optional notes about this expense"
          />
        </label>

        {errors.submit && <div className="warning-banner">{errors.submit}</div>}
        {successMsg && <div className="success-banner">{successMsg}</div>}

        <div className="form-actions">
          <button type="submit" className="btn-primary" disabled={submitting}>
            {submitting ? 'Saving...' : editingExpense ? 'Update Expense' : 'Add Expense'}
          </button>
          {editingExpense && (
            <button type="button" className="btn-secondary" onClick={onCancelEdit}>
              Cancel
            </button>
          )}
        </div>
      </form>
    </div>
  )
}
