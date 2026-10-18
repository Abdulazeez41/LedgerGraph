import uuid
from datetime import datetime
from typing import Any, Dict, List, Optional
from backend.config import settings
from backend.db.falkordb_client import db_client

class GraphEvidenceTracker:
    """Tracks Cypher queries and evidence nodes/edges used during an agent session."""
    def __init__(self):
        self.queries_executed: List[Dict[str, Any]] = []
        self.evidence_nodes: List[Dict[str, Any]] = []
        self.evidence_edges: List[Dict[str, Any]] = []

    def record_query(self, query: str, params: Optional[Dict[str, Any]] = None, description: str = ""):
        self.queries_executed.append({
            "query": query.strip(),
            "params": params or {},
            "description": description,
            "timestamp": datetime.utcnow().isoformat()
        })

    def add_evidence_node(self, node: Dict[str, Any]):
        if node and not any(n.get("id") == node.get("id") and n.get("label") == node.get("label") for n in self.evidence_nodes):
            self.evidence_nodes.append(node)

    def add_evidence_edge(self, edge: Dict[str, Any]):
        if edge and not any(e.get("source") == edge.get("source") and e.get("target") == edge.get("target") and e.get("type") == edge.get("type") for e in self.evidence_edges):
            self.evidence_edges.append(edge)

# Global tracker for tool calls
evidence_tracker = GraphEvidenceTracker()

def get_customer_profile(customer_name: str, tracker: Optional[GraphEvidenceTracker] = None) -> Dict[str, Any]:
    """
    Returns customer details, total orders, total invoiced, total paid,
    outstanding balance, open disputes, and credit limit.
    """
    tracker = tracker or evidence_tracker
    query = """
    MATCH (c:Customer)
    WHERE toLower(c.name) CONTAINS toLower($customer_name) OR toLower(c.id) = toLower($customer_name)
    OPTIONAL MATCH (c)-[:PLACED]->(o:Order)
    OPTIONAL MATCH (o)-[:HAS_INVOICE]->(i:Invoice)
    OPTIONAL MATCH (i)-[:PAID_BY]->(p:Payment)
    OPTIONAL MATCH (i)-[:HAS_DISPUTE]->(d:Dispute)
    RETURN c.id AS customer_id,
           c.name AS name,
           c.phone AS phone,
           c.email AS email,
           c.address AS address,
           c.business_type AS business_type,
           c.credit_limit AS credit_limit,
           c.risk_score AS risk_score,
           c.created_at AS created_at,
           count(DISTINCT o) AS total_orders,
           count(DISTINCT i) AS total_invoices,
           sum(DISTINCT i.amount) AS total_invoiced,
           sum(p.amount) AS total_paid,
           count(DISTINCT CASE WHEN i.status = 'OVERDUE' THEN i END) AS overdue_invoices_count,
           sum(CASE WHEN i.status = 'OVERDUE' THEN i.amount ELSE 0.0 END) AS overdue_balance,
           sum(CASE WHEN i.status IN ['OVERDUE', 'PENDING', 'PARTIALLY_PAID'] THEN i.amount ELSE 0.0 END) AS outstanding_balance,
           count(DISTINCT CASE WHEN d.status = 'OPEN' THEN d END) AS open_disputes_count
    """
    params = {"customer_name": customer_name}
    tracker.record_query(query, params, f"Fetch profile & financials for '{customer_name}'")
    headers, rows, _ = db_client.execute_query(query, params)

    if not rows or not rows[0].get("customer_id"):
        return {"error": f"Customer '{customer_name}' not found in LedgerGraph."}

    profile = rows[0]
    total_invoiced = float(profile.get("total_invoiced") or 0.0)
    total_paid = float(profile.get("total_paid") or 0.0)
    outstanding = float(profile.get("outstanding_balance") or 0.0)
    credit_limit = float(profile.get("credit_limit") or 0.0)
    available_credit = max(0.0, credit_limit - outstanding)

    profile["total_invoiced"] = total_invoiced
    profile["total_paid"] = total_paid
    profile["outstanding_balance"] = outstanding
    profile["credit_limit"] = credit_limit
    profile["available_credit"] = available_credit
    profile["credit_utilization_pct"] = round((outstanding / credit_limit * 100), 1) if credit_limit > 0 else 0.0

    tracker.add_evidence_node({
        "id": profile["customer_id"],
        "label": "Customer",
        "name": profile["name"],
        "risk_score": profile["risk_score"],
        "credit_limit": profile["credit_limit"],
        "outstanding": profile["outstanding_balance"]
    })

    return profile

def get_payment_history(customer_name: str, tracker: Optional[GraphEvidenceTracker] = None) -> List[Dict[str, Any]]:
    """
    Returns recent invoices, payment status, payment dates, amount paid,
    amount outstanding, and days overdue.
    """
    tracker = tracker or evidence_tracker
    query = """
    MATCH (c:Customer)
    WHERE toLower(c.name) CONTAINS toLower($customer_name) OR toLower(c.id) = toLower($customer_name)
    MATCH (c)-[:PLACED]->(o:Order)-[:HAS_INVOICE]->(i:Invoice)
    OPTIONAL MATCH (i)-[:PAID_BY]->(p:Payment)
    OPTIONAL MATCH (i)-[:HAS_DISPUTE]->(d:Dispute)
    RETURN c.name AS customer_name,
           c.id AS customer_id,
           o.id AS order_id,
           i.id AS invoice_id,
           i.invoice_number AS invoice_number,
           i.amount AS invoice_amount,
           i.issue_date AS issue_date,
           i.due_date AS due_date,
           i.status AS invoice_status,
           i.days_overdue AS days_overdue,
           p.id AS payment_id,
           p.amount AS paid_amount,
           p.payment_date AS payment_date,
           p.method AS payment_method,
           d.id AS dispute_id,
           d.reason AS dispute_reason,
           d.severity AS dispute_severity,
           d.status AS dispute_status
    ORDER BY i.due_date DESC
    """
    params = {"customer_name": customer_name}
    tracker.record_query(query, params, f"Multi-hop invoice & payment ledger trail for '{customer_name}'")
    headers, rows, _ = db_client.execute_query(query, params)

    # Record evidence nodes and edges
    for row in rows:
        tracker.add_evidence_node({
            "id": row.get("invoice_id"),
            "label": "Invoice",
            "name": row.get("invoice_number"),
            "amount": row.get("invoice_amount"),
            "status": row.get("invoice_status"),
            "days_overdue": row.get("days_overdue")
        })
        tracker.add_evidence_edge({
            "source": row.get("customer_id"),
            "target": row.get("invoice_id"),
            "type": "OWES" if row.get("invoice_status") != "PAID" else "PLACED_FOR"
        })
        if row.get("payment_id"):
            tracker.add_evidence_node({
                "id": row.get("payment_id"),
                "label": "Payment",
                "amount": row.get("paid_amount"),
                "payment_date": row.get("payment_date")
            })
            tracker.add_evidence_edge({
                "source": row.get("invoice_id"),
                "target": row.get("payment_id"),
                "type": "PAID_BY"
            })
        if row.get("dispute_id"):
            tracker.add_evidence_node({
                "id": row.get("dispute_id"),
                "label": "Dispute",
                "reason": row.get("dispute_reason"),
                "severity": row.get("dispute_severity"),
                "status": row.get("dispute_status")
            })
            tracker.add_evidence_edge({
                "source": row.get("invoice_id"),
                "target": row.get("dispute_id"),
                "type": "HAS_DISPUTE"
            })

    return rows

def find_connected_risk(customer_name: str, tracker: Optional[GraphEvidenceTracker] = None) -> List[Dict[str, Any]]:
    """
    Finds other customers connected through shared phone, email, or address.
    Returns whether any connected customer has overdue invoices, disputes, or high risk.
    """
    tracker = tracker or evidence_tracker
    query = """
    MATCH (c:Customer)
    WHERE toLower(c.name) CONTAINS toLower($customer_name) OR toLower(c.id) = toLower($customer_name)
    MATCH (c)-[rel:SHARES_CONTACT]-(connected:Customer)
    OPTIONAL MATCH (connected)-[:PLACED]->(:Order)-[:HAS_INVOICE]->(i:Invoice)
    OPTIONAL MATCH (connected)-[:PLACED]->(:Order)-[:HAS_INVOICE]->(:Invoice)-[:HAS_DISPUTE]->(d:Dispute {status: 'OPEN'})
    RETURN c.name AS root_customer,
           c.id AS root_id,
           connected.name AS connected_customer,
           connected.id AS connected_id,
           connected.phone AS connected_phone,
           connected.email AS connected_email,
           connected.address AS connected_address,
           connected.risk_score AS connected_risk_score,
           rel.shared_phone AS shared_phone,
           rel.shared_email AS shared_email,
           rel.shared_address AS shared_address,
           count(DISTINCT CASE WHEN i.status = 'OVERDUE' THEN i END) AS overdue_invoices_count,
           sum(CASE WHEN i.status = 'OVERDUE' THEN i.amount ELSE 0.0 END) AS overdue_amount,
           count(DISTINCT d) AS open_disputes_count
    """
    params = {"customer_name": customer_name}
    tracker.record_query(query, params, f"Detect contact-sharing network risk for '{customer_name}'")
    headers, rows, _ = db_client.execute_query(query, params)

    for row in rows:
        tracker.add_evidence_node({
            "id": row.get("connected_id"),
            "label": "Customer",
            "name": row.get("connected_customer"),
            "risk_score": row.get("connected_risk_score"),
            "overdue_amount": row.get("overdue_amount"),
            "is_connected_risk": True
        })
        tracker.add_evidence_edge({
            "source": row.get("root_id"),
            "target": row.get("connected_id"),
            "type": "SHARES_CONTACT"
        })

    return rows

def get_supplier_exposure(customer_name: str, tracker: Optional[GraphEvidenceTracker] = None) -> List[Dict[str, Any]]:
    """
    Finds which suppliers and products the customer depends on.
    Returns products purchased, supplier names, stock availability, and lead times.
    """
    tracker = tracker or evidence_tracker
    query = """
    MATCH (c:Customer)
    WHERE toLower(c.name) CONTAINS toLower($customer_name) OR toLower(c.id) = toLower($customer_name)
    MATCH (c)-[:PLACED]->(o:Order)-[:CONTAINS]->(p:Product)<-[:SUPPLIES]-(s:Supplier)
    RETURN c.id AS customer_id,
           s.id AS supplier_id,
           s.name AS supplier_name,
           s.lead_time_days AS lead_time_days,
           p.id AS product_id,
           p.name AS product_name,
           p.category AS category,
           p.unit_price AS unit_price,
           p.stock_quantity AS stock_quantity,
           count(DISTINCT o) AS orders_count
    ORDER BY orders_count DESC, p.stock_quantity ASC
    """
    params = {"customer_name": customer_name}
    tracker.record_query(query, params, f"Identify supplier dependencies & stock headroom for '{customer_name}'")
    headers, rows, _ = db_client.execute_query(query, params)

    for row in rows:
        tracker.add_evidence_node({
            "id": row.get("supplier_id"),
            "label": "Supplier",
            "name": row.get("supplier_name"),
            "lead_time": row.get("lead_time_days")
        })
        tracker.add_evidence_node({
            "id": row.get("product_id"),
            "label": "Product",
            "name": row.get("product_name"),
            "stock": row.get("stock_quantity")
        })
        tracker.add_evidence_edge({
            "source": row.get("supplier_id"),
            "target": row.get("product_id"),
            "type": "SUPPLIES"
        })
        tracker.add_evidence_edge({
            "source": row.get("customer_id"),
            "target": row.get("supplier_id"),
            "type": "BUYS_FROM"
        })

    return rows

def calculate_cash_flow_impact(customer_name: str, order_amount: float = 0.0, tracker: Optional[GraphEvidenceTracker] = None) -> Dict[str, Any]:
    """
    Calculates outstanding receivables, overdue amount, proposed order amount,
    and cash flow impact of potential non-payment.
    """
    tracker = tracker or evidence_tracker
    profile = get_customer_profile(customer_name, tracker=tracker)
    if "error" in profile:
        return profile

    credit_limit = profile["credit_limit"]
    outstanding = profile["outstanding_balance"]
    overdue = profile["overdue_balance"]
    new_total_exposure = outstanding + order_amount
    excess_exposure = max(0.0, new_total_exposure - credit_limit)
    new_utilization_pct = round((new_total_exposure / credit_limit * 100), 1) if credit_limit > 0 else 0.0

    impact_assessment = {
        "customer_name": profile["name"],
        "credit_limit": credit_limit,
        "current_outstanding": outstanding,
        "current_overdue": overdue,
        "proposed_order_amount": order_amount,
        "projected_total_exposure": new_total_exposure,
        "excess_above_limit": excess_exposure,
        "projected_utilization_pct": new_utilization_pct,
        "cash_flow_risk_level": "CRITICAL" if (overdue > credit_limit * 0.25 and overdue > 0) or excess_exposure > 0 else ("MODERATE" if overdue > 0 else "LOW"),
        "working_capital_locked": outstanding + order_amount,
        "summary": (
            f"If order of {settings.CURRENCY_SYMBOL}{order_amount:,.2f} is fulfilled on credit, total exposure will reach {settings.CURRENCY_SYMBOL}{new_total_exposure:,.2f} "
            f"({new_utilization_pct}% of credit limit {settings.CURRENCY_SYMBOL}{credit_limit:,.2f}). "
            f"Existing overdue balance is {settings.CURRENCY_SYMBOL}{overdue:,.2f}."
        )
    }
    return impact_assessment

def get_previous_decisions(customer_name: str, tracker: Optional[GraphEvidenceTracker] = None) -> Dict[str, Any]:
    """
    Retrieves prior agent decisions, memories, and pending tasks for that customer.
    The agent must call this before making a new recommendation.
    """
    tracker = tracker or evidence_tracker
    query_decisions = """
    MATCH (c:Customer)
    WHERE toLower(c.name) CONTAINS toLower($customer_name) OR toLower(c.id) = toLower($customer_name)
    MATCH (ad:AgentDecision)-[:ABOUT]->(c)
    RETURN ad.id AS decision_id,
           ad.question AS question,
           ad.recommendation AS recommendation,
           ad.confidence AS confidence,
           ad.rationale AS rationale,
           ad.created_at AS created_at,
           ad.outcome AS outcome,
           ad.user_feedback AS user_feedback
    ORDER BY ad.created_at DESC
    """
    params = {"customer_name": customer_name}
    tracker.record_query(query_decisions, params, f"Retrieve prior historical decisions for '{customer_name}'")
    _, decisions, _ = db_client.execute_query(query_decisions, params)

    query_memories = """
    MATCH (c:Customer)
    WHERE toLower(c.name) CONTAINS toLower($customer_name) OR toLower(c.id) = toLower($customer_name)
    MATCH (mem:AgentMemory)-[:ABOUT]->(c)
    RETURN mem.id AS memory_id,
           mem.memory_type AS memory_type,
           mem.content AS content,
           mem.importance AS importance,
           mem.created_at AS created_at
    ORDER BY mem.importance DESC, mem.created_at DESC
    """
    tracker.record_query(query_memories, params, f"Retrieve agent memories for '{customer_name}'")
    _, memories, _ = db_client.execute_query(query_memories, params)

    query_tasks = """
    MATCH (c:Customer)
    WHERE toLower(c.name) CONTAINS toLower($customer_name) OR toLower(c.id) = toLower($customer_name)
    MATCH (t:AgentTask)-[:FOR_CUSTOMER]->(c)
    RETURN t.id AS task_id,
           t.title AS title,
           t.description AS description,
           t.status AS status,
           t.due_date AS due_date,
           t.created_at AS created_at
    ORDER BY t.created_at DESC
    """
    tracker.record_query(query_tasks, params, f"Retrieve actionable tasks for '{customer_name}'")
    _, tasks, _ = db_client.execute_query(query_tasks, params)

    # Record evidence
    for dec in decisions:
        tracker.add_evidence_node({
            "id": dec.get("decision_id"),
            "label": "AgentDecision",
            "recommendation": dec.get("recommendation"),
            "confidence": dec.get("confidence"),
            "created_at": dec.get("created_at")
        })
    for m in memories:
        tracker.add_evidence_node({
            "id": m.get("memory_id"),
            "label": "AgentMemory",
            "type": m.get("memory_type"),
            "content": m.get("content")
        })

    return {
        "customer_name": customer_name,
        "decisions": decisions,
        "memories": memories,
        "tasks": tasks
    }

def save_agent_decision(
    customer_name: str,
    question: str,
    recommendation: str,
    confidence: float,
    rationale: str,
    evidence_node_ids: Optional[List[str]] = None,
    cypher_queries: Optional[List[str]] = None,
    outcome: str = "",
    user_feedback: str = "",
    tracker: Optional[GraphEvidenceTracker] = None
) -> Dict[str, Any]:
    """
    Saves the final recommendation, rationale, confidence, evidence node IDs,
    and Cypher queries into FalkorDB. Links decision to customer and evidence nodes.
    """
    decision_id = f"DEC-{uuid.uuid4().hex[:8].upper()}"
    now_str = datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S")

    query = """
    MATCH (c:Customer)
    WHERE toLower(c.name) CONTAINS toLower($customer_name) OR toLower(c.id) = toLower($customer_name)
    MERGE (ad:AgentDecision {id: $decision_id})
    SET ad.question = $question,
        ad.recommendation = $recommendation,
        ad.confidence = toFloat($confidence),
        ad.rationale = $rationale,
        ad.created_at = $created_at,
        ad.outcome = $outcome,
        ad.user_feedback = $user_feedback
    MERGE (ad)-[:ABOUT]->(c)
    MERGE (ad)-[:BASED_ON]->(c)
    RETURN ad.id AS id, c.name AS customer_name
    """
    params = {
        "customer_name": customer_name,
        "decision_id": decision_id,
        "question": question,
        "recommendation": recommendation,
        "confidence": confidence,
        "rationale": rationale,
        "created_at": now_str,
        "outcome": outcome,
        "user_feedback": user_feedback
    }
    _, rows, _ = db_client.execute_query(query, params)

    # Link evidence nodes
    if evidence_node_ids:
        for nid in evidence_node_ids:
            link_q = """
            MATCH (ad:AgentDecision {id: $decision_id})
            MATCH (n) WHERE n.id = $nid
            MERGE (ad)-[:BASED_ON]->(n)
            """
            try:
                db_client.execute_query(link_q, {"decision_id": decision_id, "nid": nid})
            except Exception:
                pass

    return {
        "status": "success",
        "decision_id": decision_id,
        "customer_name": customer_name,
        "recommendation": recommendation,
        "confidence": confidence,
        "created_at": now_str
    }

def save_agent_memory(
    customer_name: str,
    memory_type: str,
    content: str,
    importance: int = 5,
    tracker: Optional[GraphEvidenceTracker] = None
) -> Dict[str, Any]:
    """
    Saves important facts, user feedback, and prior outcomes as AgentMemory nodes.
    Links memory to the relevant customer.
    """
    memory_id = f"MEM-{uuid.uuid4().hex[:8].upper()}"
    now_str = datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S")

    query = """
    MATCH (c:Customer)
    WHERE toLower(c.name) CONTAINS toLower($customer_name) OR toLower(c.id) = toLower($customer_name)
    MERGE (mem:AgentMemory {id: $memory_id})
    SET mem.memory_type = $memory_type,
        mem.content = $content,
        mem.importance = toInteger($importance),
        mem.created_at = $created_at
    MERGE (mem)-[:ABOUT]->(c)
    RETURN mem.id AS id, c.name AS customer_name
    """
    params = {
        "customer_name": customer_name,
        "memory_id": memory_id,
        "memory_type": memory_type,
        "content": content,
        "importance": importance,
        "created_at": now_str
    }
    _, rows, _ = db_client.execute_query(query, params)

    return {
        "status": "success",
        "memory_id": memory_id,
        "customer_name": customer_name,
        "memory_type": memory_type,
        "content": content,
        "importance": importance,
        "created_at": now_str
    }

def create_follow_up_task(
    customer_name: str,
    title: str,
    description: str,
    due_date: str = "",
    tracker: Optional[GraphEvidenceTracker] = None
) -> Dict[str, Any]:
    """
    Creates an AgentTask such as 'Call BrightMart about overdue invoice INV-103'.
    Links the task to the customer.
    """
    task_id = f"TASK-{uuid.uuid4().hex[:8].upper()}"
    now_str = datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S")
    due = due_date or datetime.utcnow().strftime("%Y-%m-%d")

    query = """
    MATCH (c:Customer)
    WHERE toLower(c.name) CONTAINS toLower($customer_name) OR toLower(c.id) = toLower($customer_name)
    MERGE (t:AgentTask {id: $task_id})
    SET t.title = $title,
        t.description = $description,
        t.status = 'PENDING',
        t.due_date = $due_date,
        t.created_at = $created_at
    MERGE (t)-[:FOR_CUSTOMER]->(c)
    RETURN t.id AS id, c.name AS customer_name
    """
    params = {
        "customer_name": customer_name,
        "task_id": task_id,
        "title": title,
        "description": description,
        "due_date": due,
        "created_at": now_str
    }
    _, rows, _ = db_client.execute_query(query, params)

    return {
        "status": "success",
        "task_id": task_id,
        "customer_name": customer_name,
        "title": title,
        "description": description,
        "status": "PENDING",
        "due_date": due,
        "created_at": now_str
    }

def get_customer_subgraph(customer_name: str) -> Dict[str, Any]:
    """
    Extracts an interactive graph visualization payload (nodes and links)
    for the customer's graph neighborhood.
    """
    query = """
    MATCH (c:Customer)
    WHERE toLower(c.name) CONTAINS toLower($customer_name) OR toLower(c.id) = toLower($customer_name)
    OPTIONAL MATCH (c)-[r_ord:PLACED]->(o:Order)-[r_inv:HAS_INVOICE]->(i:Invoice)
    OPTIONAL MATCH (i)-[r_pmt:PAID_BY]->(p:Payment)
    OPTIONAL MATCH (i)-[r_dsp:HAS_DISPUTE]->(d:Dispute)
    OPTIONAL MATCH (c)-[r_cnt:SHARES_CONTACT]-(rel:Customer)
    OPTIONAL MATCH (c)-[r_sup:BUYS_FROM]->(s:Supplier)
    OPTIONAL MATCH (o)-[r_prd:CONTAINS]->(pr:Product)
    OPTIONAL MATCH (s)-[r_spl:SUPPLIES]->(pr)
    OPTIONAL MATCH (ad:AgentDecision)-[r_dec:ABOUT]->(c)
    OPTIONAL MATCH (mem:AgentMemory)-[r_mem:ABOUT]->(c)
    OPTIONAL MATCH (tsk:AgentTask)-[r_tsk:FOR_CUSTOMER]->(c)
    RETURN c, o, i, p, d, rel, s, pr, ad, mem, tsk
    LIMIT 100
    """
    params = {"customer_name": customer_name}
    headers, rows, _ = db_client.execute_query(query, params)

    nodes_map = {}
    links = []

    def add_node(item, label):
        if not item or not isinstance(item, dict):
            return
        props = item.get("properties", {})
        nid = props.get("id") or str(item.get("id"))
        if nid not in nodes_map:
            name = props.get("name") or props.get("invoice_number") or props.get("title") or props.get("reason") or nid
            nodes_map[nid] = {
                "id": nid,
                "label": label,
                "name": name,
                "properties": props
            }

    def add_link(source_id, target_id, rel_type):
        if source_id and target_id and source_id in nodes_map and target_id in nodes_map:
            link_key = f"{source_id}->{target_id}:{rel_type}"
            if not any(l.get("key") == link_key for l in links):
                links.append({
                    "key": link_key,
                    "source": source_id,
                    "target": target_id,
                    "type": rel_type
                })

    for r in rows:
        c = r.get("c")
        o = r.get("o")
        i = r.get("i")
        p = r.get("p")
        d = r.get("d")
        rel = r.get("rel")
        s = r.get("s")
        pr = r.get("pr")
        ad = r.get("ad")
        mem = r.get("mem")
        tsk = r.get("tsk")

        add_node(c, "Customer")
        add_node(o, "Order")
        add_node(i, "Invoice")
        add_node(p, "Payment")
        add_node(d, "Dispute")
        add_node(rel, "Customer")
        add_node(s, "Supplier")
        add_node(pr, "Product")
        add_node(ad, "AgentDecision")
        add_node(mem, "AgentMemory")
        add_node(tsk, "AgentTask")

        cid = c.get("properties", {}).get("id") if c else None
        oid = o.get("properties", {}).get("id") if o else None
        iid = i.get("properties", {}).get("id") if i else None
        pid = p.get("properties", {}).get("id") if p else None
        did = d.get("properties", {}).get("id") if d else None
        relid = rel.get("properties", {}).get("id") if rel else None
        sid = s.get("properties", {}).get("id") if s else None
        prid = pr.get("properties", {}).get("id") if pr else None
        adid = ad.get("properties", {}).get("id") if ad else None
        memid = mem.get("properties", {}).get("id") if mem else None
        tskid = tsk.get("properties", {}).get("id") if tsk else None

        if cid and oid: add_link(cid, oid, "PLACED")
        if oid and iid: add_link(oid, iid, "HAS_INVOICE")
        if iid and pid: add_link(iid, pid, "PAID_BY")
        if iid and did: add_link(iid, did, "HAS_DISPUTE")
        if cid and relid: add_link(cid, relid, "SHARES_CONTACT")
        if cid and sid: add_link(cid, sid, "BUYS_FROM")
        if oid and prid: add_link(oid, prid, "CONTAINS")
        if sid and prid: add_link(sid, prid, "SUPPLIES")
        if adid and cid: add_link(adid, cid, "ABOUT")
        if memid and cid: add_link(memid, cid, "ABOUT")
        if tskid and cid: add_link(tskid, cid, "FOR_CUSTOMER")

    return {
        "nodes": list(nodes_map.values()),
        "links": links
    }
