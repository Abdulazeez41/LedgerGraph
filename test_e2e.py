import json
import sys
from fastapi.testclient import TestClient
from backend.main import app
from backend.config import settings

client = TestClient(app)

def test_ledgergraph_e2e():
    print("=" * 60)
    print("🚀 LEDGERGRAPH END-TO-END VERIFICATION SUITE")
    print("=" * 60)

    # 1. Health check
    print("\n[1/6] Testing Health Endpoint (/api/health)...")
    res = client.get("/api/health")
    assert res.status_code == 200, f"Health check failed: {res.text}"
    health_data = res.json()
    print(f"  ✓ Status: {health_data.get('status')}")
    print(f"  ✓ FalkorDB: {health_data.get('graph')} on port {health_data.get('port')}")
    print(f"  ✓ Nodes: {health_data.get('node_count')}, Relationships: {health_data.get('relationship_count')}")
    assert health_data.get("connected") is True
    assert health_data.get("node_count", 0) >= 200

    # 2. Customers List
    print("\n[2/6] Testing Customers Endpoint (/api/customers)...")
    res = client.get("/api/customers")
    assert res.status_code == 200
    customers = res.json().get("customers", [])
    print(f"  ✓ Found {len(customers)} commercial customers in graph")
    assert len(customers) >= 20

    # 3. Customer Profile & Subgraph
    print("\n[3/6] Testing Customer Profile & Subgraph for 'BrightMart Hardware Ltd'...")
    res = client.get("/api/customers/BrightMart%20Hardware%20Ltd/profile")
    assert res.status_code == 200
    prof = res.json()
    print(f"  ✓ Credit Limit: ${prof.get('credit_limit', 0.0):,.2f}")
    print(f"  ✓ Overdue Balance: ${prof.get('overdue_balance', 0.0):,.2f} ({prof.get('overdue_invoices_count', 0)} invoices)")
    print(f"  ✓ Total Settled: ${prof.get('total_paid', 0.0):,.2f}")
    assert prof.get("name") == "BrightMart Hardware Ltd"

    res_sub = client.get("/api/customers/BrightMart%20Hardware%20Ltd/subgraph")
    assert res_sub.status_code == 200
    subgraph = res_sub.json()
    print(f"  ✓ Subgraph: {len(subgraph.get('nodes', []))} nodes, {len(subgraph.get('links', []))} edges")
    assert len(subgraph.get("nodes", [])) > 0

    # 4. Agent Multi-Hop Credit Evaluation
    print("\n[4/6] Testing Agent Credit Evaluation ($20,000 order for BrightMart)...")
    chat_payload = {
        "question": "Should I approve a $20,000 order for BrightMart on 30-day credit?",
        "customer_name": "BrightMart Hardware Ltd",
        "order_amount": 20000.0
    }
    res_chat = client.post("/api/chat", json=chat_payload)
    assert res_chat.status_code == 200
    chat_data = res_chat.json()
    rec = chat_data.get("recommendation")
    conf = chat_data.get("confidence")
    queries = chat_data.get("cypher_queries", [])
    print(f"  ✓ Recommendation: {rec} (Confidence: {int(conf * 100)}%)")
    print(f"  ✓ Cypher Queries Executed: {len(queries)}")
    print(f"  ✓ Proposed Action: {chat_data.get('proposed_action')}")
    assert rec in ["ESCALATE", "HOLD", "APPROVE WITH CONDITIONS"]
    assert len(queries) >= 5

    decision_id = chat_data.get("decision_id")

    # 5. Agent Cross-Session Memory Recall
    print("\n[5/6] Testing Agent Cross-Session Memory Recall...")
    mem_payload = {
        "question": "What did we decide about BrightMart last time?",
        "customer_name": "BrightMart Hardware Ltd"
    }
    res_mem = client.post("/api/chat", json=mem_payload)
    assert res_mem.status_code == 200
    mem_data = res_mem.json()
    print(f"  ✓ Recall Recommendation: {mem_data.get('recommendation')}")
    print(f"  ✓ Explanation contains history: {'Historical Records' in mem_data.get('business_explanation', '')}")
    assert "BrightMart" in mem_data.get("business_explanation", "")

    # 6. Operational Actions (Tasks, Memory, Reminders, Override)
    print("\n[6/6] Testing Operational Action Endpoints...")
    
    # 6a. Payment Reminder
    res_rem = client.post("/api/actions/reminder", json={"customer_name": "BrightMart Hardware Ltd"})
    assert res_rem.status_code == 200
    rem_text = res_rem.json().get("reminder_text", "")
    print(f"  ✓ Payment Reminder Generated ({len(rem_text)} chars)")
    assert "$" in rem_text or settings.CURRENCY_SYMBOL in rem_text

    # 6b. Create Task
    task_payload = {
        "customer_name": "BrightMart Hardware Ltd",
        "title": "Verify collateral documents for BrightMart",
        "description": "Inspect warehouse title deeds for credit line expansion",
        "due_date": "2026-10-30"
    }
    res_task = client.post("/api/actions/task", json=task_payload)
    assert res_task.status_code == 200
    print(f"  ✓ Follow-Up Task Created: {res_task.json().get('task_id')}")

    # 6c. Create Memory
    mem_save_payload = {
        "customer_name": "BrightMart Hardware Ltd",
        "memory_type": "POLICY",
        "content": "Owner agreed to allow emergency orders under $5k with wire transfer.",
        "importance": 9
    }
    res_save_mem = client.post("/api/actions/memory", json=mem_save_payload)
    assert res_save_mem.status_code == 200
    print(f"  ✓ Agent Memory Saved: {res_save_mem.json().get('memory_id')}")

    # 6d. Decision Override (if decision_id was returned)
    if decision_id:
        ovr_payload = {
            "decision_id": decision_id,
            "override_recommendation": "APPROVE WITH CONDITIONS",
            "user_feedback": "Approved with personal guarantee from commercial director."
        }
        res_ovr = client.post("/api/actions/override", json=ovr_payload)
        assert res_ovr.status_code == 200
        print(f"  ✓ Decision Override Persisted in FalkorDB")

    print("\n" + "=" * 60)
    print("✅ ALL END-TO-END VERIFICATION CHECKS PASSED PERFECTLY!")
    print("=" * 60)

if __name__ == "__main__":
    test_ledgergraph_e2e()
