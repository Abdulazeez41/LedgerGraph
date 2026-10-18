import json
import logging
import re
from datetime import datetime
from typing import Any, Dict, List, Optional

from backend.agents.prompts import LEDGERGRAPH_SYSTEM_PROMPT, USER_ANALYSIS_PROMPT
from backend.agents.risk_engine import evaluate_graph_risk
from backend.agents.tools import (
    GraphEvidenceTracker,
    calculate_cash_flow_impact,
    create_follow_up_task,
    find_connected_risk,
    get_customer_profile,
    get_customer_subgraph,
    get_payment_history,
    get_previous_decisions,
    get_supplier_exposure,
    save_agent_decision,
    save_agent_memory,
)
from backend.config import settings
from backend.db.falkordb_client import db_client

logger = logging.getLogger(__name__)


class LedgerGraphAgent:
    def __init__(self):
        self._openai_client = None
        if settings.OPENAI_API_KEY:
            try:
                from openai import OpenAI

                self._openai_client = OpenAI(
                    api_key=settings.OPENAI_API_KEY, base_url=settings.OPENAI_BASE_URL
                )
            except Exception as e:
                logger.warning(f"Could not initialize OpenAI client: {e}")

    def get_all_customers(self) -> List[Dict[str, str]]:
        query = "MATCH (c:Customer) RETURN c.id AS id, c.name AS name, c.risk_score AS risk_score ORDER BY c.name ASC"
        _, rows, _ = db_client.execute_query(query)
        return rows

    def detect_customer_and_amount(self, text: str) -> (Optional[str], float):
        """Extracts customer name and order amount from natural language question."""
        customers = self.get_all_customers()
        detected_customer = None

        # Check full name and significant keywords
        text_lower = text.lower()
        for c in customers:
            name = c["name"].lower()
            first_word = name.split()[0]
            if name in text_lower or (len(first_word) > 3 and first_word in text_lower):
                detected_customer = c["name"]
                break

        # Extract amount with currency symbols ($, ₦, €, £) or plain numbers
        amount = 0.0
        m_curr = re.search(r"[\$₦€£]\s*([0-9,]+(?:\.[0-9]+)?)", text)
        if m_curr:
            try:
                amount = float(m_curr.group(1).replace(",", ""))
            except ValueError:
                pass
        else:
            m_k = re.search(
                r"([0-9]+(?:\.[0-9]+)?)\s*(?:thousand|k)\b", text, re.IGNORECASE
            )
            if m_k:
                try:
                    amount = float(m_k.group(1)) * 1_000
                except ValueError:
                    pass
            else:
                m_mill = re.search(
                    r"([0-9]+(?:\.[0-9]+)?)\s*(?:million|m)\b", text, re.IGNORECASE
                )
                if m_mill:
                    try:
                        amount = float(m_mill.group(1)) * 1_000_000
                    except ValueError:
                        pass
                else:
                    m_num = re.search(
                        r"\b([1-9][0-9]{3,}(?:,[0-9]{3})*(?:\.[0-9]+)?)\b", text
                    )
                    if m_num:
                        try:
                            amount = float(m_num.group(1).replace(",", ""))
                        except ValueError:
                            pass

        return detected_customer, amount

    def handle_aggregate_query(
        self, question: str, tracker: GraphEvidenceTracker
    ) -> Dict[str, Any]:
        """Handles portfolio-level questions not tied to a single customer."""
        sym = settings.CURRENCY_SYMBOL
        q_lower = question.lower()

        # 1. Highest credit risk
        if "highest" in q_lower and ("risk" in q_lower or "delinquent" in q_lower):
            cypher = """
            MATCH (c:Customer)
            OPTIONAL MATCH (c)-[:PLACED]->(:Order)-[:HAS_INVOICE]->(i:Invoice)
            RETURN c.id AS id,
                   c.name AS customer,
                   c.risk_score AS risk_score,
                   c.credit_limit AS credit_limit,
                   count(CASE WHEN i.status = 'OVERDUE' THEN i END) AS overdue_count,
                   sum(CASE WHEN i.status = 'OVERDUE' THEN i.amount ELSE 0.0 END) AS overdue_balance
            ORDER BY c.risk_score DESC, overdue_balance DESC
            LIMIT 5
            """
            tracker.record_query(
                cypher, {}, "Find top high-risk customers across the graph"
            )
            _, rows, _ = db_client.execute_query(cypher)

            explanation = (
                "Based on connected graph analysis in FalkorDB, here are the highest credit risk accounts this week:\n\n"
                + "\n".join(
                    [
                        f"• **{r['customer']}** (Risk Score: {r['risk_score']}/100) - "
                        f"{r['overdue_count']} overdue invoices totaling **{sym}{r['overdue_balance']:,.2f}** "
                        f"(Credit Limit: {sym}{r['credit_limit']:,.2f})"
                        for r in rows
                    ]
                )
            )
            top_name = rows[0]["customer"] if rows else "Top Risk Entity"
            return {
                "recommendation": "HOLD",
                "confidence": 0.95,
                "business_explanation": explanation,
                "recommended_conditions": [
                    "Institute immediate credit freeze on accounts with risk scores > 70",
                    "Dispatch recovery notices before shipping any new orders",
                ],
                "proposed_action": f"Review credit freeze for {top_name}",
                "action_type": "FREEZE_CREDIT",
                "evidence_path": rows,
                "cypher_queries": tracker.queries_executed,
                "subgraph": get_customer_subgraph(top_name)
                if rows
                else {"nodes": [], "links": []},
            }

        # 2. Invoices to chase today
        if "chase" in q_lower or ("overdue" in q_lower and "invoice" in q_lower):
            cypher = """
            MATCH (c:Customer)-[:PLACED]->(:Order)-[:HAS_INVOICE]->(i:Invoice)
            WHERE i.status = 'OVERDUE'
            OPTIONAL MATCH (i)-[:HAS_DISPUTE]->(d:Dispute)
            RETURN c.name AS customer,
                   c.phone AS phone,
                   i.invoice_number AS invoice_number,
                   i.amount AS amount,
                   i.due_date AS due_date,
                   i.days_overdue AS days_overdue,
                   d.reason AS dispute_reason
            ORDER BY i.days_overdue DESC, i.amount DESC
            LIMIT 8
            """
            tracker.record_query(
                cypher, {}, "Find overdue invoices requiring recovery chasing"
            )
            _, rows, _ = db_client.execute_query(cypher)

            total_overdue = sum(r["amount"] for r in rows)
            explanation = (
                f"You have **{len(rows)} priority overdue invoices** totaling **{sym}{total_overdue:,.2f}** requiring immediate chase:\n\n"
                + "\n".join(
                    [
                        f"• **{r['customer']}** - Invoice `{r['invoice_number']}` for **{sym}{r['amount']:,.2f}** "
                        f"({r['days_overdue']} days overdue since {r['due_date']})"
                        + (
                            f" [⚠️ Dispute: {r['dispute_reason']}]"
                            if r.get("dispute_reason")
                            else ""
                        )
                        for r in rows
                    ]
                )
            )
            first_inv = rows[0] if rows else {}
            return {
                "recommendation": "CHASE PAYMENT",
                "confidence": 0.95,
                "business_explanation": explanation,
                "recommended_conditions": [
                    "Prioritize invoices exceeding 30 days overdue",
                    "Offer immediate 2% settlement discount for balances cleared within 48 hours",
                ],
                "proposed_action": f"Draft payment reminder for {first_inv.get('customer')} ({first_inv.get('invoice_number')})",
                "action_type": "PAYMENT_REMINDER",
                "action_payload": {
                    "customer": first_inv.get("customer"),
                    "invoice": first_inv.get("invoice_number"),
                    "amount": first_inv.get("amount"),
                    "phone": first_inv.get("phone"),
                },
                "evidence_path": rows,
                "cypher_queries": tracker.queries_executed,
                "subgraph": get_customer_subgraph(first_inv.get("customer"))
                if first_inv
                else {"nodes": [], "links": []},
            }

        # 3. Connected delinquent customers (Default rings / Phoenix companies)
        if "connected" in q_lower or "shares" in q_lower or "network" in q_lower:
            cypher = """
            MATCH (c1:Customer)-[r:SHARES_CONTACT]-(c2:Customer)
            WHERE c1.id < c2.id
            OPTIONAL MATCH (c2)-[:PLACED]->(:Order)-[:HAS_INVOICE]->(i2:Invoice {status: 'OVERDUE'})
            RETURN c1.name AS customer_1,
                   c2.name AS customer_2,
                   r.shared_phone AS shared_phone,
                   r.shared_email AS shared_email,
                   r.shared_address AS shared_address,
                   c1.phone AS phone,
                   c1.address AS address,
                   count(i2) AS connected_overdue_count,
                   sum(i2.amount) AS connected_overdue_amount
            ORDER BY connected_overdue_amount DESC
            """
            tracker.record_query(
                cypher,
                {},
                "Multi-hop query for contact-sharing networks and debt contagion",
            )
            _, rows, _ = db_client.execute_query(cypher)

            explanation = (
                "**Graph Contact-Sharing & Credit Contagion Network:**\n\n"
                + "\n".join(
                    [
                        f"• **{r['customer_1']}** ↔ **{r['customer_2']}**: "
                        f"Share {'Phone, ' if r['shared_phone'] else ''}{'Email, ' if r['shared_email'] else ''}{'Warehouse/Address' if r['shared_address'] else ''} "
                        f"({r['address'] or r['phone']}). "
                        f"**Connected Overdue Exposure:** {sym}{r['connected_overdue_amount']:,.2f} ({r['connected_overdue_count']} overdue invoices)."
                        for r in rows
                    ]
                )
            )
            return {
                "recommendation": "ESCALATE",
                "confidence": 0.94,
                "business_explanation": explanation,
                "recommended_conditions": [
                    "Flag connected entities under unified group credit ceiling",
                    "Do not disburse new credit to sister entity when linked debtor is in default",
                ],
                "proposed_action": "Consolidate credit limits for connected customer clusters",
                "action_type": "ESCALATE_GROUP",
                "evidence_path": rows,
                "cypher_queries": tracker.queries_executed,
                "subgraph": get_customer_subgraph(rows[0]["customer_1"])
                if rows
                else {"nodes": [], "links": []},
            }

        return None

    def run(
        self,
        question: str,
        customer_name: Optional[str] = None,
        order_amount: Optional[float] = None,
    ) -> Dict[str, Any]:
        """
        Executes the 10-step LedgerGraph agent workflow.
        """
        tracker = GraphEvidenceTracker()

        # Step 1: Identify customer and order amount if not passed
        detected_cust, detected_amt = self.detect_customer_and_amount(question)
        target_customer = customer_name or detected_cust
        target_amount = (
            order_amount
            if order_amount is not None and order_amount > 0
            else detected_amt
        )

        # Handle portfolio/aggregate questions if no specific customer detected
        if not target_customer:
            aggregate_res = self.handle_aggregate_query(question, tracker)
            if aggregate_res:
                return aggregate_res
            customers = self.get_all_customers()
            sample_names = [c["name"] for c in customers[:5]]
            return {
                "recommendation": "HOLD",
                "confidence": 0.5,
                "business_explanation": (
                    f'I couldn\'t identify a specific customer in your question: *"{question}"*.\n\n'
                    f"Try asking about a specific customer like **{sample_names[0]}**, **{sample_names[1]}**, or ask:\n"
                    f"- *'Should I approve a {settings.CURRENCY_SYMBOL}20,000 order for BrightMart on 30-day credit?'*\n"
                    f"- *'Which customers are highest credit risk this week?'*\n"
                    f"- *'Which invoices should I chase today?'*\n"
                    f"- *'What did we decide about BrightMart last time?'*"
                ),
                "recommended_conditions": [],
                "proposed_action": "Select a customer to evaluate",
                "evidence_path": [],
                "cypher_queries": tracker.queries_executed,
                "subgraph": {"nodes": [], "links": []},
            }

        # Step 2: Query Prior Decisions and Memories
        prev_decisions = get_previous_decisions(target_customer, tracker=tracker)

        # Check if user specifically asked about prior decisions / memory
        q_lower = question.lower()
        if (
            "what did we decide" in q_lower
            or "last time" in q_lower
            or "previous decision" in q_lower
            or "remember" in q_lower
        ):
            dec_list = prev_decisions.get("decisions", [])
            mem_list = prev_decisions.get("memories", [])
            tsk_list = prev_decisions.get("tasks", [])

            if dec_list or mem_list or tsk_list:
                explanation_parts = [f"**Historical Records for {target_customer}:**\n"]
                if dec_list:
                    d = dec_list[0]
                    explanation_parts.append(
                        f"**Last Decision ({d.get('created_at')}):**\n"
                        f"• Question: *\"{d.get('question')}\"*\n"
                        f"• Recommendation: **{d.get('recommendation')}** (Confidence: {int(float(d.get('confidence') or 0.8)*100)}%)\n"
                        f"• Rationale: {d.get('rationale')}\n"
                        f"• Outcome: {d.get('outcome') or 'In progress'}\n"
                    )
                if mem_list:
                    explanation_parts.append("**Saved Graph Memories:**")
                    for m in mem_list:
                        explanation_parts.append(
                            f"• [{m.get('memory_type')}] {m.get('content')} *(Importance: {m.get('importance')}/10)*"
                        )
                if tsk_list:
                    explanation_parts.append("\n**Open Follow-up Tasks:**")
                    for t in tsk_list:
                        explanation_parts.append(
                            f"• **{t.get('title')}** (Status: `{t.get('status')}`, Due: {t.get('due_date')}) - {t.get('description')}"
                        )

                subgraph = get_customer_subgraph(target_customer)
                return {
                    "recommendation": dec_list[0].get("recommendation")
                    if dec_list
                    else "APPROVE WITH CONDITIONS",
                    "confidence": float(dec_list[0].get("confidence") or 0.85)
                    if dec_list
                    else 0.85,
                    "business_explanation": "\n".join(explanation_parts),
                    "recommended_conditions": [
                        "Adhere to prior agreed terms recorded in graph memory",
                        "Review open follow-up inspection tasks before altering credit ceiling",
                    ],
                    "proposed_action": tsk_list[0].get("title")
                    if tsk_list
                    else f"Review credit file for {target_customer}",
                    "action_type": "VIEW_MEMORY",
                    "evidence_path": dec_list + mem_list,
                    "cypher_queries": tracker.queries_executed,
                    "subgraph": subgraph,
                    "previous_decisions": prev_decisions,
                }

        # Step 3: Run Graph Data Tools
        profile = get_customer_profile(target_customer, tracker=tracker)
        if "error" in profile:
            return {
                "recommendation": "HOLD",
                "confidence": 0.5,
                "business_explanation": profile["error"],
                "recommended_conditions": [],
                "proposed_action": "Verify customer business name",
                "evidence_path": [],
                "cypher_queries": tracker.queries_executed,
                "subgraph": {"nodes": [], "links": []},
            }

        history = get_payment_history(target_customer, tracker=tracker)
        connected_risk = find_connected_risk(target_customer, tracker=tracker)
        supplier_exp = get_supplier_exposure(target_customer, tracker=tracker)
        cash_flow = calculate_cash_flow_impact(
            target_customer, target_amount, tracker=tracker
        )

        # Step 4: Evaluate Risk with Rule Engine
        risk_eval = evaluate_graph_risk(
            profile=profile,
            history=history,
            connected_risks=connected_risk,
            previous_decisions=prev_decisions,
            proposed_order_amount=target_amount,
        )

        recommendation = risk_eval["recommendation"]
        confidence = risk_eval["confidence"]

        # Step 5: Synthesize Business Explanation with LLM or Deterministic Graph Engine
        explanation = self.generate_explanation(
            question=question,
            customer_name=profile["name"],
            order_amount=target_amount,
            profile=profile,
            history=history,
            connected_risk=connected_risk,
            supplier_exposure=supplier_exp,
            cash_flow=cash_flow,
            previous_decisions=prev_decisions,
            risk_eval=risk_eval,
        )

        # Step 6: Formulate Next Action & Action Payload
        proposed_action = (
            risk_eval["proposed_actions"][0]
            if risk_eval["proposed_actions"]
            else "Monitor payment settlements"
        )
        action_type = "CONDITIONAL_APPROVAL"
        if recommendation == "APPROVE":
            action_type = "APPROVE_ORDER"
        elif recommendation == "HOLD":
            action_type = "PAYMENT_REMINDER"
        elif recommendation == "ESCALATE":
            action_type = "ESCALATE_COMMITTEE"
        elif recommendation == "CHASE PAYMENT":
            action_type = "PAYMENT_REMINDER"

        # Step 7: Save Agent Decision into FalkorDB
        evidence_ids = [n.get("id") for n in tracker.evidence_nodes if n.get("id")]
        save_agent_decision(
            customer_name=profile["name"],
            question=question,
            recommendation=recommendation,
            confidence=confidence,
            rationale=explanation,
            evidence_node_ids=evidence_ids,
            outcome="Recommendation surfaced to business owner in dashboard.",
            user_feedback="Awaiting user action",
            tracker=tracker,
        )

        # Retrieve visual subgraph
        subgraph = get_customer_subgraph(profile["name"])

        # Format WhatsApp / Email reminder message template if relevant
        sym = settings.CURRENCY_SYMBOL
        reminder_template = (
            f"Dear {profile['name']} Accounts Department,\n\n"
            f"This is a commercial reminder from Regional Supply Hub regarding outstanding invoices on your trade account. "
            f"Our records show an overdue balance of {sym}{profile['overdue_balance']:,.2f}.\n\n"
            f"Please share proof of settlement or reach out to resolve any pending reconciliation items. "
            f"Thank you for your ongoing partnership.\n\n"
            f"Finance & Working Capital Control Department"
        )

        return {
            "customer_name": profile["name"],
            "recommendation": recommendation,
            "confidence": confidence,
            "risk_score": risk_eval["calculated_risk_score"],
            "business_explanation": explanation,
            "recommended_conditions": risk_eval["recommended_conditions"],
            "proposed_action": proposed_action,
            "action_type": action_type,
            "action_payload": {
                "reminder_template": reminder_template,
                "overdue_balance": profile["overdue_balance"],
                "customer_phone": profile["phone"],
                "credit_limit": profile["credit_limit"],
                "order_amount": target_amount,
            },
            "profile": profile,
            "connected_risk": connected_risk,
            "supplier_exposure": supplier_exp[:4],
            "cash_flow": cash_flow,
            "previous_decisions": prev_decisions,
            "evidence_nodes": tracker.evidence_nodes,
            "evidence_edges": tracker.evidence_edges,
            "cypher_queries": tracker.queries_executed,
            "subgraph": subgraph,
        }

    def generate_explanation(
        self,
        question: str,
        customer_name: str,
        order_amount: float,
        profile: Dict[str, Any],
        history: List[Dict[str, Any]],
        connected_risk: List[Dict[str, Any]],
        supplier_exposure: List[Dict[str, Any]],
        cash_flow: Dict[str, Any],
        previous_decisions: Dict[str, Any],
        risk_eval: Dict[str, Any],
    ) -> str:
        """Generates clear business reasoning via LLM if API key is provided, or via graph synthesizer."""
        # Try OpenAI API first if client is configured
        if self._openai_client:
            try:
                user_content = USER_ANALYSIS_PROMPT.format(
                    question=question,
                    customer_name=customer_name,
                    order_amount=order_amount,
                    profile_json=json.dumps(profile, default=str),
                    history_json=json.dumps(history[:6], default=str),
                    connected_risk_json=json.dumps(connected_risk, default=str),
                    supplier_exposure_json=json.dumps(
                        supplier_exposure[:4], default=str
                    ),
                    cash_flow_json=json.dumps(cash_flow, default=str),
                    previous_decisions_json=json.dumps(previous_decisions, default=str),
                    risk_assessment_json=json.dumps(risk_eval, default=str),
                )

                response = self._openai_client.chat.completions.create(
                    model=settings.OPENAI_MODEL,
                    messages=[
                        {"role": "system", "content": LEDGERGRAPH_SYSTEM_PROMPT},
                        {"role": "user", "content": user_content},
                    ],
                    temperature=0.2,
                    max_tokens=650,
                )
                content = response.choices[0].message.content
                if content and len(content.strip()) > 30:
                    return content.strip()
            except Exception as e:
                logger.warning(
                    f"OpenAI completion failed (falling back to native graph reasoner): {e}"
                )

        # Native Graph Reasoner (offline/standalone)
        sym = settings.CURRENCY_SYMBOL
        rec = risk_eval["recommendation"]
        lines = []

        if rec == "APPROVE":
            lines.append(
                f"**Recommendation: APPROVE** (Risk Score: {risk_eval['calculated_risk_score']}/100)"
            )
            lines.append(
                f"**{customer_name}** maintains an exemplary graph payment record. "
                f"They have completed **{profile['total_orders']} orders** with **{sym}{profile['total_paid']:,.2f}** fully settled on time. "
                f"There are **0 overdue invoices**, 0 open disputes, and no connected debtor linkages in the graph."
            )
            if order_amount > 0:
                lines.append(
                    f"Fulfilling the proposed order of **{sym}{order_amount:,.2f}** will bring credit utilization to "
                    f"**{cash_flow['projected_utilization_pct']}%** of their {sym}{profile['credit_limit']:,.2f} ceiling, which is well within safe operating margins."
                )

        elif rec == "APPROVE WITH CONDITIONS":
            lines.append(
                f"**Recommendation: APPROVE WITH CONDITIONS** (Risk Score: {risk_eval['calculated_risk_score']}/100)"
            )
            lines.append(
                f"**{customer_name}** has a viable trading relationship with cumulative settlements of **{sym}{profile['total_paid']:,.2f}**, "
                f"but graph traversal revealed specific credit vulnerabilities:"
            )
            for rf in risk_eval["risk_factors"]:
                lines.append(f"• {rf}")

            if order_amount > 0:
                lines.append(
                    f"\nIf the requested credit of **{sym}{order_amount:,.2f}** is granted without conditions, total exposure reaches "
                    f"**{sym}{cash_flow['projected_total_exposure']:,.2f}** ({cash_flow['projected_utilization_pct']}% of limit)."
                )
            lines.append(
                "**Conditions for Approval:** Require a **30% advance deposit** before loading trucks, shorten credit terms to 14 days, "
                "and resolve outstanding inspection/dispute items."
            )

        elif rec == "HOLD":
            lines.append(
                f"**Recommendation: HOLD ORDER / CREDIT FREEZE** (Risk Score: {risk_eval['calculated_risk_score']}/100)"
            )
            lines.append(
                f"Fulfillment for **{customer_name}** must be put on hold immediately. "
                f"The business currently has **{profile['overdue_invoices_count']} overdue invoices** totaling **{sym}{profile['overdue_balance']:,.2f}**."
            )
            for rf in risk_eval["risk_factors"]:
                lines.append(f"• {rf}")
            lines.append(
                f"\nExtending further credit of {sym}{order_amount:,.2f} creates critical cash flow strain, locking **{sym}{cash_flow['working_capital_locked']:,.2f}** "
                f"of distributor working capital. Require cleared settlement of overdue balances prior to dispatch."
            )

        elif rec == "ESCALATE":
            lines.append(
                f"**Recommendation: ESCALATE TO CREDIT COMMITTEE** (Risk Score: {risk_eval['calculated_risk_score']}/100)"
            )
            lines.append(
                f"High-priority alert on **{customer_name}**. Graph network analysis uncovered direct contact sharing with known delinquent entities:"
            )
            for rf in risk_eval["risk_factors"]:
                lines.append(f"• {rf}")
            lines.append(
                "\nThis topological pattern indicates potential phoenix entity restructuring or collective insolvency across affiliated entities in the commercial trade corridor. "
                "Do not fulfill on open credit without personal corporate director guarantees."
            )

        else:  # CHASE PAYMENT
            lines.append(
                f"**Recommendation: CHASE PAYMENT** (Risk Score: {risk_eval['calculated_risk_score']}/100)"
            )
            lines.append(
                f"**{customer_name}** owes **{sym}{profile['overdue_balance']:,.2f}** across {profile['overdue_invoices_count']} overdue invoices. "
                f"Immediate structured recovery communications are recommended before considering new order requests."
            )

        return "\n".join(lines)


agent_instance = LedgerGraphAgent()
