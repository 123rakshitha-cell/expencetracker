"""
app.py
Main Flask application for the Personal Expense Tracker backend.

Run with:  python app.py
Runs on:   http://localhost:5000
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
from datetime import date, datetime
import calendar

from database import init_db, seed_sample_data, get_connection, VALID_CATEGORIES, VALID_PAYMENT_METHODS
from services.ai_insights import generate_insights

app = Flask(__name__)
CORS(app)  # allow the React dev server (different port) to call this API


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def current_month_str():
    today = date.today()
    return f"{today.year:04d}-{today.month:02d}"


def error_response(message, status=400):
    return jsonify({"error": message}), status


def validate_expense_payload(data, partial=False):
    """Validate incoming expense data. Returns (is_valid, error_message)."""
    if not partial or "amount" in data:
        amount = data.get("amount")
        if amount is None or amount == "":
            return False, "Amount is required."
        try:
            amount = float(amount)
        except (TypeError, ValueError):
            return False, "Amount must be a number."
        if amount <= 0:
            return False, "Amount must be greater than 0."

    if not partial or "category" in data:
        category = data.get("category")
        if not category:
            return False, "Category is required."
        if category not in VALID_CATEGORIES:
            return False, f"Category must be one of: {', '.join(VALID_CATEGORIES)}."

    if not partial or "date" in data:
        exp_date = data.get("date")
        if not exp_date:
            return False, "Date is required."
        try:
            datetime.strptime(exp_date, "%Y-%m-%d")
        except ValueError:
            return False, "Date must be in YYYY-MM-DD format."

    if not partial or "payment_method" in data:
        payment_method = data.get("payment_method")
        if not payment_method:
            return False, "Payment method is required."
        if payment_method not in VALID_PAYMENT_METHODS:
            return False, f"Payment method must be one of: {', '.join(VALID_PAYMENT_METHODS)}."

    return True, None


def row_to_dict(row):
    return dict(row)


# ---------------------------------------------------------------------------
# Expense routes
# ---------------------------------------------------------------------------

@app.route("/api/expenses", methods=["GET"])
def get_expenses():
    """List expenses with optional filtering, searching and sorting."""
    month = request.args.get("month")
    category = request.args.get("category")
    payment_method = request.args.get("payment_method")
    search = request.args.get("search")
    sort_by = request.args.get("sort_by", "date")  # 'date' or 'amount'
    order = request.args.get("order", "desc")       # 'asc' or 'desc'

    if sort_by not in ("date", "amount"):
        sort_by = "date"
    if order not in ("asc", "desc"):
        order = "desc"

    query = "SELECT * FROM expenses WHERE 1=1"
    params = []

    if month:
        query += " AND date LIKE ?"
        params.append(f"{month}%")
    if category:
        query += " AND category = ?"
        params.append(category)
    if payment_method:
        query += " AND payment_method = ?"
        params.append(payment_method)
    if search:
        query += " AND (description LIKE ? OR category LIKE ?)"
        params.append(f"%{search}%")
        params.append(f"%{search}%")

    query += f" ORDER BY {sort_by} {order.upper()}, id {order.upper()}"

    conn = get_connection()
    cur = conn.cursor()
    cur.execute(query, params)
    rows = [row_to_dict(r) for r in cur.fetchall()]
    conn.close()

    return jsonify(rows), 200


@app.route("/api/expenses", methods=["POST"])
def create_expense():
    data = request.get_json(silent=True) or {}
    is_valid, msg = validate_expense_payload(data)
    if not is_valid:
        return error_response(msg, 400)

    conn = get_connection()
    cur = conn.cursor()
    cur.execute("""
        INSERT INTO expenses (amount, category, date, payment_method, description)
        VALUES (?, ?, ?, ?, ?)
    """, (
        float(data["amount"]),
        data["category"],
        data["date"],
        data["payment_method"],
        data.get("description", "")
    ))
    conn.commit()
    new_id = cur.lastrowid
    cur.execute("SELECT * FROM expenses WHERE id = ?", (new_id,))
    new_row = row_to_dict(cur.fetchone())
    conn.close()

    return jsonify(new_row), 201


@app.route("/api/expenses/<int:expense_id>", methods=["PUT"])
def update_expense(expense_id):
    data = request.get_json(silent=True) or {}

    conn = get_connection()
    cur = conn.cursor()
    cur.execute("SELECT * FROM expenses WHERE id = ?", (expense_id,))
    existing = cur.fetchone()
    if not existing:
        conn.close()
        return error_response("Expense not found.", 404)

    is_valid, msg = validate_expense_payload(data, partial=True)
    if not is_valid:
        conn.close()
        return error_response(msg, 400)

    merged = dict(existing)
    merged.update({k: v for k, v in data.items() if v is not None})

    cur.execute("""
        UPDATE expenses
        SET amount = ?, category = ?, date = ?, payment_method = ?, description = ?
        WHERE id = ?
    """, (
        float(merged["amount"]),
        merged["category"],
        merged["date"],
        merged["payment_method"],
        merged.get("description", ""),
        expense_id
    ))
    conn.commit()
    cur.execute("SELECT * FROM expenses WHERE id = ?", (expense_id,))
    updated_row = row_to_dict(cur.fetchone())
    conn.close()

    return jsonify(updated_row), 200


@app.route("/api/expenses/<int:expense_id>", methods=["DELETE"])
def delete_expense(expense_id):
    conn = get_connection()
    cur = conn.cursor()
    cur.execute("SELECT * FROM expenses WHERE id = ?", (expense_id,))
    existing = cur.fetchone()
    if not existing:
        conn.close()
        return error_response("Expense not found.", 404)

    cur.execute("DELETE FROM expenses WHERE id = ?", (expense_id,))
    conn.commit()
    conn.close()

    return jsonify({"message": "Expense deleted successfully.", "id": expense_id}), 200


# ---------------------------------------------------------------------------
# Category summary
# ---------------------------------------------------------------------------

@app.route("/api/expenses/category-summary", methods=["GET"])
def category_summary():
    month = request.args.get("month", current_month_str())

    conn = get_connection()
    cur = conn.cursor()
    cur.execute("""
        SELECT category, SUM(amount) as total, COUNT(*) as count
        FROM expenses WHERE date LIKE ?
        GROUP BY category
        ORDER BY total DESC
    """, (f"{month}%",))
    rows = [row_to_dict(r) for r in cur.fetchall()]
    conn.close()

    grand_total = sum(r["total"] for r in rows)
    for r in rows:
        r["percentage"] = round((r["total"] / grand_total) * 100, 1) if grand_total else 0

    return jsonify({"month": month, "categories": rows, "total": grand_total}), 200


# ---------------------------------------------------------------------------
# Dashboard summary
# ---------------------------------------------------------------------------

@app.route("/api/dashboard", methods=["GET"])
def dashboard():
    month = request.args.get("month", current_month_str())

    conn = get_connection()
    cur = conn.cursor()

    cur.execute("SELECT * FROM expenses WHERE date LIKE ? ORDER BY date DESC", (f"{month}%",))
    rows = [row_to_dict(r) for r in cur.fetchall()]

    total = sum(r["amount"] for r in rows)
    count = len(rows)
    average = round(total / count, 2) if count else 0

    highest = max(rows, key=lambda r: r["amount"]) if rows else None

    cur.execute("SELECT amount FROM budgets WHERE month = ?", (month,))
    budget_row = cur.fetchone()
    budget_amount = budget_row["amount"] if budget_row else 0
    remaining = round(budget_amount - total, 2)
    budget_used_pct = round((total / budget_amount) * 100, 1) if budget_amount else 0

    # Simple daily spend series for a monthly line/bar chart
    daily_totals = {}
    for r in rows:
        daily_totals[r["date"]] = daily_totals.get(r["date"], 0) + r["amount"]
    daily_series = [{"date": d, "amount": amt} for d, amt in sorted(daily_totals.items())]

    # Recent expenses (latest 5)
    cur.execute("SELECT * FROM expenses ORDER BY date DESC, id DESC LIMIT 5")
    recent = [row_to_dict(r) for r in cur.fetchall()]

    conn.close()

    return jsonify({
        "month": month,
        "monthly_total": round(total, 2),
        "transaction_count": count,
        "average_spending": average,
        "budget": budget_amount,
        "remaining_budget": remaining,
        "budget_used_percentage": budget_used_pct,
        "highest_expense": highest,
        "daily_series": daily_series,
        "recent_expenses": recent
    }), 200


# ---------------------------------------------------------------------------
# Budget routes
# ---------------------------------------------------------------------------

@app.route("/api/budget", methods=["GET"])
def get_budget():
    month = request.args.get("month", current_month_str())
    conn = get_connection()
    cur = conn.cursor()
    cur.execute("SELECT * FROM budgets WHERE month = ?", (month,))
    row = cur.fetchone()
    conn.close()

    if not row:
        return jsonify({"month": month, "amount": 0}), 200

    return jsonify(row_to_dict(row)), 200


@app.route("/api/budget", methods=["POST"])
def set_budget():
    data = request.get_json(silent=True) or {}
    month = data.get("month", current_month_str())
    amount = data.get("amount")

    if amount is None:
        return error_response("Budget amount is required.", 400)
    try:
        amount = float(amount)
    except (TypeError, ValueError):
        return error_response("Budget amount must be a number.", 400)
    if amount < 0:
        return error_response("Budget amount cannot be negative.", 400)

    conn = get_connection()
    cur = conn.cursor()
    cur.execute("SELECT id FROM budgets WHERE month = ?", (month,))
    existing = cur.fetchone()

    if existing:
        cur.execute("""
            UPDATE budgets SET amount = ?, updated_at = CURRENT_TIMESTAMP WHERE month = ?
        """, (amount, month))
    else:
        cur.execute("""
            INSERT INTO budgets (month, amount) VALUES (?, ?)
        """, (month, amount))

    conn.commit()
    cur.execute("SELECT * FROM budgets WHERE month = ?", (month,))
    row = row_to_dict(cur.fetchone())
    conn.close()

    return jsonify(row), 200


# ---------------------------------------------------------------------------
# AI Insights route
# ---------------------------------------------------------------------------

@app.route("/api/insights", methods=["GET"])
def get_insights():
    month = request.args.get("month", current_month_str())
    conn = get_connection()
    insights = generate_insights(conn, month)
    conn.close()
    return jsonify({"month": month, "insights": insights}), 200


# ---------------------------------------------------------------------------
# Meta routes
# ---------------------------------------------------------------------------

@app.route("/api/meta", methods=["GET"])
def meta():
    return jsonify({
        "categories": VALID_CATEGORIES,
        "payment_methods": VALID_PAYMENT_METHODS
    }), 200


@app.route("/api/health", methods=["GET"])
def health():
    return jsonify({"status": "ok"}), 200


# ---------------------------------------------------------------------------
# Error handlers
# ---------------------------------------------------------------------------

@app.errorhandler(404)
def not_found(e):
    return jsonify({"error": "Resource not found."}), 404


@app.errorhandler(500)
def server_error(e):
    return jsonify({"error": "Internal server error."}), 500


if __name__ == "__main__":
    init_db()
    seed_sample_data()
    app.run(debug=True, port=5000)
