// api.js
// Centralized service for talking to the Python backend REST API.

const API_BASE = 'http://localhost:5000/api'

async function handleResponse(res) {
  let data
  try {
    data = await res.json()
  } catch (e) {
    data = null
  }
  if (!res.ok) {
    const message = (data && data.error) || `Request failed with status ${res.status}`
    throw new Error(message)
  }
  return data
}

export async function fetchMeta() {
  const res = await fetch(`${API_BASE}/meta`)
  return handleResponse(res)
}

export async function fetchDashboard(month) {
  const res = await fetch(`${API_BASE}/dashboard?month=${month}`)
  return handleResponse(res)
}

export async function fetchCategorySummary(month) {
  const res = await fetch(`${API_BASE}/expenses/category-summary?month=${month}`)
  return handleResponse(res)
}

export async function fetchExpenses({ month, category, payment_method, search, sort_by, order } = {}) {
  const params = new URLSearchParams()
  if (month) params.append('month', month)
  if (category) params.append('category', category)
  if (payment_method) params.append('payment_method', payment_method)
  if (search) params.append('search', search)
  if (sort_by) params.append('sort_by', sort_by)
  if (order) params.append('order', order)

  const res = await fetch(`${API_BASE}/expenses?${params.toString()}`)
  return handleResponse(res)
}

export async function createExpense(expense) {
  const res = await fetch(`${API_BASE}/expenses`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(expense)
  })
  return handleResponse(res)
}

export async function updateExpense(id, expense) {
  const res = await fetch(`${API_BASE}/expenses/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(expense)
  })
  return handleResponse(res)
}

export async function deleteExpense(id) {
  const res = await fetch(`${API_BASE}/expenses/${id}`, { method: 'DELETE' })
  return handleResponse(res)
}

export async function fetchBudget(month) {
  const res = await fetch(`${API_BASE}/budget?month=${month}`)
  return handleResponse(res)
}

export async function setBudget(month, amount) {
  const res = await fetch(`${API_BASE}/budget`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ month, amount })
  })
  return handleResponse(res)
}

export async function fetchInsights(month) {
  const res = await fetch(`${API_BASE}/insights?month=${month}`)
  return handleResponse(res)
}
