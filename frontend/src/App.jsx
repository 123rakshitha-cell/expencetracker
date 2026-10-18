import React, { useState, useEffect, useCallback } from 'react'
import Dashboard from './components/Dashboard.jsx'
import ExpenseForm from './components/ExpenseForm.jsx'
import ExpenseList from './components/ExpenseList.jsx'
import BudgetCard from './components/BudgetCard.jsx'
import CategoryChart from './components/CategoryChart.jsx'
import MonthlyChart from './components/MonthlyChart.jsx'
import AIInsights from './components/AIInsights.jsx'

import {
  fetchDashboard, fetchCategorySummary, fetchExpenses,
  createExpense, updateExpense, deleteExpense,
  setBudget, fetchInsights
} from './services/api.js'

function currentMonth() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

function monthLabel(monthStr) {
  const [y, m] = monthStr.split('-').map(Number)
  const d = new Date(y, m - 1, 1)
  return d.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })
}

export default function App() {
  const [month, setMonth] = useState(currentMonth())
  const [dashboard, setDashboard] = useState(null)
  const [categorySummary, setCategorySummary] = useState(null)
  const [expenses, setExpenses] = useState([])
  const [insights, setInsights] = useState([])

  const [loadingDashboard, setLoadingDashboard] = useState(true)
  const [loadingExpenses, setLoadingExpenses] = useState(true)
  const [loadingInsights, setLoadingInsights] = useState(true)
  const [savingBudget, setSavingBudget] = useState(false)

  const [editingExpense, setEditingExpense] = useState(null)
  const [filters, setFilters] = useState({ search: '', category: '', payment_method: '', sort_by: 'date', order: 'desc' })
  const [globalError, setGlobalError] = useState('')

  const loadDashboardData = useCallback(async () => {
    setLoadingDashboard(true)
    try {
      const [dash, catSummary] = await Promise.all([
        fetchDashboard(month),
        fetchCategorySummary(month)
      ])
      setDashboard(dash)
      setCategorySummary(catSummary)
    } catch (err) {
      setGlobalError(err.message)
    } finally {
      setLoadingDashboard(false)
    }
  }, [month])

  const loadExpenses = useCallback(async () => {
    setLoadingExpenses(true)
    try {
      const data = await fetchExpenses({ month, ...filters })
      setExpenses(data)
    } catch (err) {
      setGlobalError(err.message)
    } finally {
      setLoadingExpenses(false)
    }
  }, [month, filters])

  const loadInsights = useCallback(async () => {
    setLoadingInsights(true)
    try {
      const data = await fetchInsights(month)
      setInsights(data.insights || [])
    } catch (err) {
      setGlobalError(err.message)
    } finally {
      setLoadingInsights(false)
    }
  }, [month])

  useEffect(() => { loadDashboardData() }, [loadDashboardData])
  useEffect(() => { loadExpenses() }, [loadExpenses])
  useEffect(() => { loadInsights() }, [loadInsights])

  async function refreshAll() {
    await Promise.all([loadDashboardData(), loadExpenses(), loadInsights()])
  }

  async function handleAddOrUpdateExpense(payload) {
    if (editingExpense) {
      await updateExpense(editingExpense.id, payload)
      setEditingExpense(null)
    } else {
      await createExpense(payload)
    }
    await refreshAll()
  }

  async function handleDeleteExpense(id) {
    try {
      await deleteExpense(id)
      await refreshAll()
    } catch (err) {
      setGlobalError(err.message)
    }
  }

  async function handleSaveBudget(amount) {
    setSavingBudget(true)
    try {
      await setBudget(month, amount)
      await loadDashboardData()
    } catch (err) {
      setGlobalError(err.message)
    } finally {
      setSavingBudget(false)
    }
  }

  return (
    <div className="app">
      <header className="app-header">
        <div>
          <h1>💸 Expense Tracker</h1>
          <p className="app-subtitle">AI-powered spending insights, budgets, and history</p>
        </div>
        <div className="month-selector">
          <label htmlFor="month-input">Month</label>
          <input
            id="month-input"
            type="month"
            value={month}
            onChange={(e) => setMonth(e.target.value)}
          />
          <span className="month-display">{monthLabel(month)}</span>
        </div>
      </header>

      {globalError && (
        <div className="warning-banner global-error" onClick={() => setGlobalError('')}>
          {globalError} <span className="dismiss">(click to dismiss)</span>
        </div>
      )}

      <main className="app-main">
        <Dashboard dashboard={dashboard} loading={loadingDashboard} />

        <div className="two-col-grid">
          <CategoryChart categorySummary={categorySummary} />
          <MonthlyChart dashboard={dashboard} />
        </div>

        <div className="two-col-grid">
          <BudgetCard dashboard={dashboard} onSaveBudget={handleSaveBudget} saving={savingBudget} />
          <AIInsights insights={insights} loading={loadingInsights} />
        </div>

        <ExpenseForm
          onSubmit={handleAddOrUpdateExpense}
          editingExpense={editingExpense}
          onCancelEdit={() => setEditingExpense(null)}
        />

        <ExpenseList
          expenses={expenses}
          loading={loadingExpenses}
          filters={filters}
          onFilterChange={setFilters}
          onEdit={setEditingExpense}
          onDelete={handleDeleteExpense}
        />
      </main>

      <footer className="app-footer">
        <p>Personal Expense Tracker — built with React &amp; Python Flask</p>
      </footer>
    </div>
  )
}
