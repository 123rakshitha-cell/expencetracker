"""
ai_insights.py
Generates rule-based spending insights from real expense data.

No external AI API is required for this to work (keeps the project simple
and free to run). If you want to plug in a real LLM later, add your call
inside `generate_llm_insight()` and read the API key from an environment
variable (never hardcode it) - see the commented example at the bottom.
"""

import calendar
from datetime import date


def _prev_month(month_str):
    """Given 'YYYY-MM', return the previous month as 'YYYY-MM'."""
    y, m = map(int, month_str.split("-"))
    if m == 1:
        return f"{y - 1:04d}-12"
    return f"{y:04d}-{m - 1:02d}"


def generate_insights(conn, month):
    """
    Build a list of insight strings based on actual data in the database
    for the given month (format 'YYYY-MM').
    """
    insights = []
    cur = conn.cursor()

    # ---- Current month expenses ----
    cur.execute("""
        SELECT amount, category, date, description, payment_method
        FROM expenses WHERE date LIKE ?
    """, (f"{month}%",))
    rows = [dict(r) for r in cur.fetchall()]

    if not rows:
        insights.append("No expenses recorded yet for this month. Add some expenses to see insights.")
        return insights

    total_spent = sum(r["amount"] for r in rows)

    # ---- Category totals ----
    cat_totals = {}
    for r in rows:
        cat_totals[r["category"]] = cat_totals.get(r["category"], 0) + r["amount"]

    top_category = max(cat_totals, key=cat_totals.get)
    top_category_amount = cat_totals[top_category]
    top_category_pct = round((top_category_amount / total_spent) * 100, 1) if total_spent else 0

    insights.append(
        f"{top_category} is your highest spending category this month "
        f"(₹{top_category_amount:,.2f}, {top_category_pct}% of total spending)."
    )

    # ---- Highest single expense ----
    highest = max(rows, key=lambda r: r["amount"])
    insights.append(
        f"Your highest single expense this month was ₹{highest['amount']:,.2f} "
        f"on {highest['category']} ({highest['date']})."
    )

    # ---- Budget comparison ----
    cur.execute("SELECT amount FROM budgets WHERE month = ?", (month,))
    budget_row = cur.fetchone()
    if budget_row and budget_row["amount"] > 0:
        budget_amount = budget_row["amount"]
        pct_used = round((total_spent / budget_amount) * 100, 1)
        if pct_used >= 100:
            over = total_spent - budget_amount
            insights.append(
                f"You have exceeded your monthly budget by ₹{over:,.2f} "
                f"({pct_used}% of budget used)."
            )
        elif pct_used >= 80:
            insights.append(
                f"You have spent {pct_used}% of your monthly budget. "
                f"Consider slowing down spending for the rest of the month."
            )
        else:
            insights.append(
                f"You have spent {pct_used}% of your monthly budget - you're on track."
            )

    # ---- Month-over-month category comparison ----
    prev_month = _prev_month(month)
    cur.execute("""
        SELECT category, SUM(amount) as total
        FROM expenses WHERE date LIKE ?
        GROUP BY category
    """, (f"{prev_month}%",))
    prev_cat_totals = {r["category"]: r["total"] for r in cur.fetchall()}

    for cat, amt in cat_totals.items():
        prev_amt = prev_cat_totals.get(cat)
        if prev_amt and prev_amt > 0:
            change_pct = round(((amt - prev_amt) / prev_amt) * 100, 1)
            if change_pct >= 15:
                insights.append(
                    f"Your {cat.lower()} expenses increased by {change_pct}% compared with last month."
                )
            elif change_pct <= -15:
                insights.append(
                    f"Your {cat.lower()} expenses decreased by {abs(change_pct)}% compared with last month."
                )

    # ---- Simple reduction suggestion for discretionary categories ----
    discretionary = ["Entertainment", "Shopping"]
    for cat in discretionary:
        if cat in cat_totals and cat_totals[cat] / total_spent > 0.2:
            insights.append(
                f"You could reduce overall spending by controlling your {cat.lower()} expenses, "
                f"which make up {round((cat_totals[cat] / total_spent) * 100, 1)}% of this month's total."
            )

    # ---- Average per transaction ----
    avg = total_spent / len(rows)
    insights.append(f"Your average expense this month is ₹{avg:,.2f} across {len(rows)} transactions.")

    return insights


# ---------------------------------------------------------------------------
# Optional: plug in a real LLM for richer natural-language insights.
# Uncomment and set ANTHROPIC_API_KEY as an environment variable to use it.
# NEVER hardcode the API key in source code.
# ---------------------------------------------------------------------------
#
# import os
# import anthropic
#
# def generate_llm_insight(summary_text):
#     client = anthropic.Anthropic(api_key=os.environ.get("ANTHROPIC_API_KEY"))
#     message = client.messages.create(
#         model="claude-sonnet-4-6",
#         max_tokens=300,
#         messages=[{
#             "role": "user",
#             "content": f"Given this spending summary, give 2 short, friendly financial tips:\n{summary_text}"
#         }]
#     )
#     return message.content[0].text
