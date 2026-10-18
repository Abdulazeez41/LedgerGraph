import csv
import os
import logging
from datetime import datetime
from backend.db.falkordb_client import db_client
from backend.db.schema import init_schema, clear_database

logger = logging.getLogger(__name__)
DATA_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "data")

def seed_database(clear_first: bool = True):
    print("=" * 60)
    print("🌱 Starting FalkorDB LedgerGraph Data Ingestion...")
    print("=" * 60)

    if clear_first:
        print("Clearing existing graph data...")
        clear_database()

    init_schema()
    graph = db_client.get_graph()

    # 1. Load Suppliers
    suppliers_file = os.path.join(DATA_DIR, "suppliers.csv")
    suppliers_count = 0
    with open(suppliers_file, mode="r", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for row in reader:
            query = """
            MERGE (s:Supplier {id: $id})
            SET s.name = $name,
                s.phone = $phone,
                s.email = $email,
                s.lead_time_days = toInteger($lead_time_days)
            """
            graph.query(query, {
                "id": row["id"],
                "name": row["name"],
                "phone": row["phone"],
                "email": row["email"],
                "lead_time_days": int(row["lead_time_days"])
            })
            suppliers_count += 1
    print(f"✅ Loaded {suppliers_count} Suppliers")

    # 2. Load Products & Supplier->Product Relationships
    products_file = os.path.join(DATA_DIR, "products.csv")
    products_count = 0
    with open(products_file, mode="r", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for row in reader:
            query = """
            MERGE (p:Product {id: $id})
            SET p.name = $name,
                p.category = $category,
                p.unit_price = toFloat($unit_price),
                p.stock_quantity = toInteger($stock_quantity)
            WITH p
            MATCH (s:Supplier {id: $supplier_id})
            MERGE (s)-[:SUPPLIES]->(p)
            """
            graph.query(query, {
                "id": row["id"],
                "name": row["name"],
                "category": row["category"],
                "unit_price": float(row["unit_price"]),
                "stock_quantity": int(row["stock_quantity"]),
                "supplier_id": row["supplier_id"]
            })
            products_count += 1
    print(f"✅ Loaded {products_count} Products & SUPPLIES links")

    # 3. Load Customers
    customers_file = os.path.join(DATA_DIR, "customers.csv")
    customers_count = 0
    with open(customers_file, mode="r", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for row in reader:
            query = """
            MERGE (c:Customer {id: $id})
            SET c.name = $name,
                c.phone = $phone,
                c.email = $email,
                c.address = $address,
                c.business_type = $business_type,
                c.credit_limit = toFloat($credit_limit),
                c.risk_score = toInteger($risk_score),
                c.created_at = $created_at
            """
            graph.query(query, {
                "id": row["id"],
                "name": row["name"],
                "phone": row["phone"],
                "email": row["email"],
                "address": row["address"],
                "business_type": row["business_type"],
                "credit_limit": float(row["credit_limit"]),
                "risk_score": int(row["risk_score"]),
                "created_at": row["created_at"]
            })
            customers_count += 1
    print(f"✅ Loaded {customers_count} Customers")

    # 4. Generate SHARES_CONTACT relationships between customers sharing phone, email, or address
    contact_query = """
    MATCH (c1:Customer), (c2:Customer)
    WHERE c1.id < c2.id AND (
        c1.phone = c2.phone OR
        c1.email = c2.email OR
        c1.address = c2.address
    )
    MERGE (c1)-[r:SHARES_CONTACT]->(c2)
    SET r.shared_phone = (c1.phone = c2.phone),
        r.shared_email = (c1.email = c2.email),
        r.shared_address = (c1.address = c2.address)
    RETURN count(r) AS shares_count
    """
    res = graph.query(contact_query)
    shares_count = res.result_set[0][0] if res.result_set else 0
    print(f"✅ Created {shares_count} SHARES_CONTACT relationships (Connected-Risk graph edges)")

    # 5. Load Orders & CONTAINS links
    orders_file = os.path.join(DATA_DIR, "orders.csv")
    orders_count = 0
    with open(orders_file, mode="r", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for row in reader:
            order_query = """
            MATCH (c:Customer {id: $customer_id})
            MERGE (o:Order {id: $id})
            SET o.order_date = $order_date,
                o.total_amount = toFloat($total_amount),
                o.status = $status,
                o.due_date = $due_date
            MERGE (c)-[:PLACED]->(o)
            """
            graph.query(order_query, {
                "id": row["id"],
                "customer_id": row["customer_id"],
                "order_date": row["order_date"],
                "total_amount": float(row["total_amount"]),
                "status": row["status"],
                "due_date": row["due_date"]
            })

            # Link Products
            prod_ids = [p.strip() for p in row["product_ids"].split(";") if p.strip()]
            for pid in prod_ids:
                prod_query = """
                MATCH (o:Order {id: $order_id}), (p:Product {id: $prod_id})
                MERGE (o)-[:CONTAINS]->(p)
                WITH o, p
                MATCH (c:Customer)-[:PLACED]->(o)
                MATCH (s:Supplier)-[:SUPPLIES]->(p)
                MERGE (c)-[:BUYS_FROM]->(s)
                """
                graph.query(prod_query, {
                    "order_id": row["id"],
                    "prod_id": pid
                })

            orders_count += 1
    print(f"✅ Loaded {orders_count} Orders, CONTAINS, and BUYS_FROM links")

    # 6. Load Invoices & HAS_INVOICE, OWES links
    invoices_file = os.path.join(DATA_DIR, "invoices.csv")
    invoices_count = 0
    with open(invoices_file, mode="r", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for row in reader:
            inv_query = """
            MATCH (o:Order {id: $order_id}), (c:Customer {id: $customer_id})
            MERGE (i:Invoice {id: $id})
            SET i.invoice_number = $invoice_number,
                i.amount = toFloat($amount),
                i.issue_date = $issue_date,
                i.due_date = $due_date,
                i.status = $status,
                i.days_overdue = toInteger($days_overdue)
            MERGE (o)-[:HAS_INVOICE]->(i)
            """
            graph.query(inv_query, {
                "id": row["id"],
                "order_id": row["order_id"],
                "customer_id": row["customer_id"],
                "invoice_number": row["invoice_number"],
                "amount": float(row["amount"]),
                "issue_date": row["issue_date"],
                "due_date": row["due_date"],
                "status": row["status"],
                "days_overdue": int(row["days_overdue"])
            })

            # If invoice is OVERDUE, PENDING, or PARTIALLY_PAID, Customer OWES Invoice
            if row["status"] in ("OVERDUE", "PENDING", "PARTIALLY_PAID"):
                owes_query = """
                MATCH (c:Customer {id: $customer_id}), (i:Invoice {id: $inv_id})
                MERGE (c)-[:OWES]->(i)
                """
                graph.query(owes_query, {
                    "customer_id": row["customer_id"],
                    "inv_id": row["id"]
                })

            invoices_count += 1
    print(f"✅ Loaded {invoices_count} Invoices, HAS_INVOICE, and OWES links")

    # 7. Load Payments & PAID_BY links
    payments_file = os.path.join(DATA_DIR, "payments.csv")
    payments_count = 0
    with open(payments_file, mode="r", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for row in reader:
            pmt_query = """
            MATCH (i:Invoice {id: $invoice_id})
            MERGE (p:Payment {id: $id})
            SET p.amount = toFloat($amount),
                p.payment_date = $payment_date,
                p.method = $method,
                p.status = $status
            MERGE (i)-[:PAID_BY]->(p)
            """
            graph.query(pmt_query, {
                "id": row["id"],
                "invoice_id": row["invoice_id"],
                "amount": float(row["amount"]),
                "payment_date": row["payment_date"],
                "method": row["method"],
                "status": row["status"]
            })
            payments_count += 1
    print(f"✅ Loaded {payments_count} Payments & PAID_BY links")

    # 8. Load Disputes & HAS_DISPUTE links
    disputes_file = os.path.join(DATA_DIR, "disputes.csv")
    disputes_count = 0
    with open(disputes_file, mode="r", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for row in reader:
            disp_query = """
            MATCH (i:Invoice {id: $invoice_id})
            MERGE (d:Dispute {id: $id})
            SET d.reason = $reason,
                d.opened_date = $opened_date,
                d.status = $status,
                d.severity = $severity
            MERGE (i)-[:HAS_DISPUTE]->(d)
            """
            graph.query(disp_query, {
                "id": row["id"],
                "invoice_id": row["invoice_id"],
                "reason": row["reason"],
                "opened_date": row["opened_date"],
                "status": row["status"],
                "severity": row["severity"]
            })
            disputes_count += 1
    print(f"✅ Loaded {disputes_count} Disputes & HAS_DISPUTE links")

    # 9. Seed Initial Agent Decision, Memory, and Tasks for BrightMart
    seed_agent_memory(graph)
    print("✅ Seeded Agent Memory, Previous Decisions, and Tasks for BrightMart")

    # 10. Update initial dynamic risk scores based on graph topology
    update_risk_scores(graph)
    print("✅ Computed and Updated Customer Graph Risk Scores")

    # 11. Graph Summary
    print_summary(graph)

def seed_agent_memory(graph):
    # Memory nodes for BrightMart
    memories = [
        {
            "id": "MEM-001",
            "customer_id": "CUST-001",
            "memory_type": "PREFERENCE",
            "content": "Customer prefers direct wire transfer settlements and requests digital receipts via WhatsApp / Email.",
            "importance": 7,
            "created_at": "2026-08-10 10:15:00"
        },
        {
            "id": "MEM-002",
            "customer_id": "CUST-001",
            "memory_type": "POLICY",
            "content": "Business owner directive: 'BrightMart has a connected entity (Metro Commercial) with delinquent overdue invoices. Require at least 30% advance deposit for orders above $10,000 until INV-103 dispute is cleared.'",
            "importance": 9,
            "created_at": "2026-09-24 11:35:00"
        },
        {
            "id": "MEM-003",
            "customer_id": "CUST-002",
            "memory_type": "OUTCOME",
            "content": "Metro Commercial failed to honor payment promise made on 2026-09-15. Placed on full credit freeze.",
            "importance": 10,
            "created_at": "2026-09-20 16:00:00"
        }
    ]

    for m in memories:
        q = """
        MATCH (c:Customer {id: $customer_id})
        MERGE (mem:AgentMemory {id: $id})
        SET mem.memory_type = $memory_type,
            mem.content = $content,
            mem.importance = toInteger($importance),
            mem.created_at = $created_at
        MERGE (mem)-[:ABOUT]->(c)
        """
        graph.query(q, m)

    # Previous Agent Decision for BrightMart
    decision_query = """
    MATCH (c:Customer {id: 'CUST-001'})
    OPTIONAL MATCH (c)-[:PLACED]->(:Order)-[:HAS_INVOICE]->(i:Invoice {id: 'INV-003'})
    OPTIONAL MATCH (i)-[:HAS_DISPUTE]->(d:Dispute)
    MERGE (ad:AgentDecision {id: 'DEC-001'})
    SET ad.question = 'Should I approve a $15,000 credit order for BrightMart Hardware Ltd?',
        ad.recommendation = 'APPROVE WITH CONDITIONS',
        ad.confidence = 0.84,
        ad.rationale = 'Customer settled INV-101 and INV-102 promptly. However, INV-103 ($12,000) is 32 days overdue with an active dispute regarding storm-damaged cement bags, and BrightMart shares phone/address with delinquent Metro Commercial Ventures. Approved on condition of 30% upfront cash deposit.',
        ad.created_at = '2026-09-24 11:30:00',
        ad.outcome = 'Customer agreed to 30% advance deposit and accepted delivery of ORD-004.',
        ad.user_feedback = 'Approved by business owner'
    MERGE (ad)-[:ABOUT]->(c)
    MERGE (ad)-[:BASED_ON]->(c)
    WITH ad, i, d
    WHERE i IS NOT NULL
    MERGE (ad)-[:BASED_ON]->(i)
    WITH ad, d
    WHERE d IS NOT NULL
    MERGE (ad)-[:BASED_ON]->(d)
    """
    graph.query(decision_query)

    # Follow-up task for BrightMart
    task_query = """
    MATCH (c:Customer {id: 'CUST-001'})
    MERGE (t:AgentTask {id: 'TASK-001'})
    SET t.title = 'Resolve cement damage dispute on INV-103 with BrightMart',
        t.description = 'Dispatch site inspector to verify 40 damaged cement bags at BrightMart Sector 4 warehouse and issue credit note so remaining balance can be collected.',
        t.status = 'PENDING',
        t.due_date = '2026-10-22',
        t.created_at = '2026-10-12 09:00:00'
    MERGE (t)-[:FOR_CUSTOMER]->(c)
    """
    graph.query(task_query)

def update_risk_scores(graph):
    """
    Calculates graph-grounded risk scores for each customer based on:
    - Overdue invoice count and value
    - Open disputes
    - Outstanding debt vs credit limit
    - Connected delinquent customers
    """
    query = """
    MATCH (c:Customer)
    OPTIONAL MATCH (c)-[:PLACED]->(:Order)-[:HAS_INVOICE]->(i:Invoice)
    WITH c,
         count(CASE WHEN i.status = 'OVERDUE' THEN 1 END) AS overdue_count,
         sum(CASE WHEN i.status = 'OVERDUE' THEN i.amount ELSE 0.0 END) AS overdue_sum,
         sum(CASE WHEN i.status IN ['OVERDUE', 'PENDING', 'PARTIALLY_PAID'] THEN i.amount ELSE 0.0 END) AS total_debt
    OPTIONAL MATCH (c)-[:PLACED]->(:Order)-[:HAS_INVOICE]->(:Invoice)-[:HAS_DISPUTE]->(d:Dispute {status: 'OPEN'})
    WITH c, overdue_count, overdue_sum, total_debt, count(d) AS open_disputes
    OPTIONAL MATCH (c)-[:SHARES_CONTACT]-(rel:Customer)-[:PLACED]->(:Order)-[:HAS_INVOICE]->(ri:Invoice {status: 'OVERDUE'})
    WITH c, overdue_count, overdue_sum, total_debt, open_disputes, count(ri) AS connected_overdue
    
    // Base score 10
    // +20 per overdue invoice
    // +15 per open dispute
    // +15 if connected customer has overdue debt
    // +20 if total debt exceeds 75% of credit limit
    WITH c,
         15 + (overdue_count * 20) + (open_disputes * 15) + (CASE WHEN connected_overdue > 0 THEN 20 ELSE 0 END) +
         (CASE WHEN c.credit_limit > 0 AND (total_debt / c.credit_limit) > 0.75 THEN 20 ELSE 0 END) AS computed_score
    SET c.risk_score = CASE WHEN computed_score > 98 THEN 98 ELSE computed_score END
    RETURN c.name AS customer, c.risk_score AS risk_score
    """
    graph.query(query)

def print_summary(graph):
    print("\n" + "=" * 60)
    print("📊 FALKORDB LEDGERGRAPH SUMMARY")
    print("=" * 60)

    node_counts = graph.query("""
    MATCH (n)
    RETURN labels(n)[0] AS label, count(n) AS count
    ORDER BY count DESC
    """)
    print("Nodes:")
    for row in node_counts.result_set:
        print(f"  • {row[0]}: {row[1]}")

    rel_counts = graph.query("""
    MATCH ()-[r]->()
    RETURN type(r) AS relationship, count(r) AS count
    ORDER BY count DESC
    """)
    print("\nRelationships:")
    for row in rel_counts.result_set:
        print(f"  • {row[0]}: {row[1]}")

    print("=" * 60)
    print("🎯 Seed completed successfully!\n")

if __name__ == "__main__":
    seed_database()
