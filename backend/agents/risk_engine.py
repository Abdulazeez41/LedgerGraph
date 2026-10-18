from typing import Any, Dict, List, Optional
from backend.config import settings

def evaluate_graph_risk(
    profile: Dict[str, Any],
    history: List[Dict[str, Any]],
    connected_risks: List[Dict[str, Any]],
    previous_decisions: Dict[str, Any],
    proposed_order_amount: float = 0.0
) -> Dict[str, Any]:
    """
    Evaluates risk rules across connected graph data and returns a structured
    risk assessment and baseline recommendation.
    """
    sym = settings.CURRENCY_SYMBOL
    risk_factors: List[str] = []
    positive_factors: List[str] = []
    recommended_conditions: List[str] = []
    proposed_actions: List[str] = []

    credit_limit = float(profile.get("credit_limit") or 0.0)
    outstanding = float(profile.get("outstanding_balance") or 0.0)
    overdue_balance = float(profile.get("overdue_balance") or 0.0)
    overdue_count = int(profile.get("overdue_invoices_count") or 0)
    open_disputes = int(profile.get("open_disputes_count") or 0)
    total_orders = int(profile.get("total_orders") or 0)
    total_paid = float(profile.get("total_paid") or 0.0)

    # 1. Connected Risk Analysis (Hidden default rings / sister company contagion)
    connected_delinquent = []
    for conn in connected_risks:
        conn_overdue = float(conn.get("overdue_amount") or 0.0)
        conn_name = conn.get("connected_customer")
        shared = []
        if conn.get("shared_phone"): shared.append("Phone")
        if conn.get("shared_email"): shared.append("Email")
        if conn.get("shared_address"): shared.append("Address / Warehouse")
        shared_str = ", ".join(shared) or "Contact details"

        if conn_overdue > 0:
            connected_delinquent.append({
                "name": conn_name,
                "shared": shared_str,
                "overdue": conn_overdue
            })
            risk_factors.append(
                f"Shares {shared_str} with delinquent entity '{conn_name}' carrying {sym}{conn_overdue:,.2f} in defaulted/overdue debt."
            )

    # 2. Invoice & Payment Timeliness
    if overdue_count > 0:
        risk_factors.append(
            f"Has {overdue_count} overdue invoice(s) totaling {sym}{overdue_balance:,.2f}."
        )
    if open_disputes > 0:
        risk_factors.append(
            f"Has {open_disputes} active, unresolved commercial dispute(s)."
        )

    # 3. Credit Utilization and Order Exposure
    new_exposure = outstanding + proposed_order_amount
    utilization_pct = (new_exposure / credit_limit * 100) if credit_limit > 0 else 100.0
    if new_exposure > credit_limit:
        risk_factors.append(
            f"Proposed order would bring total exposure to {sym}{new_exposure:,.2f}, exceeding credit limit of {sym}{credit_limit:,.2f} by {sym}{new_exposure - credit_limit:,.2f} ({utilization_pct:.1f}% utilization)."
        )
    elif utilization_pct > 80.0:
        risk_factors.append(
            f"High credit utilization: {utilization_pct:.1f}% of limit would be committed."
        )

    # 4. Positive factors
    if total_orders >= 3 and overdue_count == 0 and len(connected_delinquent) == 0:
        positive_factors.append(
            f"Strong counterparty record: {total_orders} historical orders with {sym}{total_paid:,.2f} fully settled on time."
        )
    if total_paid > (credit_limit * 0.5):
        positive_factors.append(
            f"Consistent transactional history ({sym}{total_paid:,.2f} total paid to date)."
        )

    # 5. Prior decisions and memories
    memories = previous_decisions.get("memories", [])
    for m in memories:
        if m.get("importance", 0) >= 8:
            risk_factors.append(f"Graph Memory ({m.get('memory_type')}): {m.get('content')}")

    # 6. Compute Risk Score (0-100)
    score = 15
    score += min(35, overdue_count * 15)
    score += min(20, int((overdue_balance / max(1.0, credit_limit)) * 30))
    score += min(25, open_disputes * 15)
    score += 25 if connected_delinquent else 0
    if new_exposure > credit_limit:
        score += 20
    score -= min(20, int((total_paid / max(1.0, credit_limit)) * 10))
    score = max(5, min(98, score))

    # 7. Apply Rule Engine for Recommendation
    if connected_delinquent and (overdue_count > 0 or open_disputes > 1):
        recommendation = "ESCALATE"
        confidence = 0.92
        proposed_actions.append(f"Escalate account to Credit Committee due to connected entity delinquency ({connected_delinquent[0]['name']}).")
        proposed_actions.append("Freeze automatic order dispatch pending counterparty identity and cross-entity audit.")
        recommended_conditions.append("Require 100% upfront cleared funds for any emergency fulfillment.")

    elif overdue_count >= 2 or (new_exposure > credit_limit * 1.2):
        recommendation = "HOLD"
        confidence = 0.88
        proposed_actions.append(f"Place fulfillment on hold until {sym}{overdue_balance:,.2f} in overdue receivables is settled.")
        proposed_actions.append(f"Dispatch urgent payment notice for overdue invoices.")
        recommended_conditions.append(f"Customer must settle at least {sym}{overdue_balance:,.2f} before new credit is unlocked.")

    elif overdue_count == 1 or open_disputes == 1 or connected_delinquent:
        recommendation = "APPROVE WITH CONDITIONS"
        confidence = 0.84
        recommended_conditions.append("Require 30% to 50% advance deposit via direct transfer before materials dispatch.")
        recommended_conditions.append("Shorten credit term to 14 days instead of standard 30 days.")
        recommended_conditions.append("Direct account manager to resolve open dispute/inspection.")
        proposed_actions.append("Draft conditional approval notice with 30% advance deposit terms.")
        proposed_actions.append("Create task to track settlement of the single outstanding invoice.")

    elif overdue_count > 0 and proposed_order_amount == 0.0:
        recommendation = "CHASE PAYMENT"
        confidence = 0.90
        proposed_actions.append(f"Generate and send payment reminder for {sym}{overdue_balance:,.2f} overdue balance.")
        proposed_actions.append("Schedule follow-up call with customer's accounts payable unit.")

    else:
        recommendation = "APPROVE"
        confidence = 0.94
        recommended_conditions.append("Standard 30-day payment term applies.")
        recommended_conditions.append("Deliver invoice along with signed delivery waybill upon dispatch.")
        proposed_actions.append(f"Approve order dispatch of {sym}{proposed_order_amount:,.2f} under existing credit limit.")
        proposed_actions.append("Log credit approval in FalkorDB ledger.")

    return {
        "calculated_risk_score": score,
        "recommendation": recommendation,
        "confidence": confidence,
        "risk_factors": risk_factors,
        "positive_factors": positive_factors,
        "recommended_conditions": recommended_conditions,
        "proposed_actions": proposed_actions,
        "connected_delinquent": connected_delinquent,
        "overdue_balance": overdue_balance,
        "overdue_count": overdue_count,
        "outstanding_balance": outstanding,
        "credit_limit": credit_limit,
        "utilization_pct": utilization_pct
    }
