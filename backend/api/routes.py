import os
import shutil
from typing import Any, Dict, List
from fastapi import APIRouter, HTTPException, UploadFile, File
from backend.config import settings
from backend.agents.agent import agent_instance
from backend.agents.tools import (
    get_customer_profile,
    get_payment_history,
    find_connected_risk,
    get_supplier_exposure,
    get_previous_decisions,
    get_customer_subgraph,
    create_follow_up_task,
    save_agent_memory
)
from backend.db.falkordb_client import db_client
from backend.db.seed_data import seed_database
from backend.api.schemas import (
    ChatRequest,
    DecisionOverrideRequest,
    CreateTaskRequest,
    CreateMemoryRequest,
    PaymentReminderRequest
)

router = APIRouter(prefix="/api")
DATA_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "data")

@router.get("/health")
def health_check():
    """Returns FalkorDB connectivity and graph health status."""
    return db_client.check_health()

@router.get("/customers")
def list_customers():
    """Lists all customers with current risk score and credit limit."""
    query = """
    MATCH (c:Customer)
    OPTIONAL MATCH (c)-[:PLACED]->(:Order)-[:HAS_INVOICE]->(i:Invoice)
    RETURN c.id AS id,
           c.name AS name,
           c.phone AS phone,
           c.email AS email,
           c.address AS address,
           c.business_type AS business_type,
           c.credit_limit AS credit_limit,
           c.risk_score AS risk_score,
           count(DISTINCT CASE WHEN i.status = 'OVERDUE' THEN i END) AS overdue_count,
           sum(CASE WHEN i.status = 'OVERDUE' THEN i.amount ELSE 0.0 END) AS overdue_balance
    ORDER BY c.risk_score DESC, c.name ASC
    """
    _, rows, _ = db_client.execute_query(query)
    return {"customers": rows}

@router.post("/chat")
def ask_agent(req: ChatRequest):
    """Processes natural language question through graph-grounded agent loop."""
    try:
        response = agent_instance.run(
            question=req.question,
            customer_name=req.customer_name,
            order_amount=req.order_amount
        )
        return response
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Agent workflow error: {str(e)}")

@router.get("/customers/{customer_name}/profile")
def customer_profile(customer_name: str):
    """Retrieves full graph profile and financials for customer."""
    profile = get_customer_profile(customer_name)
    if "error" in profile:
        raise HTTPException(status_code=404, detail=profile["error"])
    return profile

@router.get("/customers/{customer_name}/subgraph")
def customer_subgraph(customer_name: str):
    """Retrieves nodes and edges for interactive visualization."""
    return get_customer_subgraph(customer_name)

@router.get("/customers/{customer_name}/history")
def customer_history(customer_name: str):
    """Retrieves multi-hop invoice, payment, and dispute records."""
    history = get_payment_history(customer_name)
    return {"customer_name": customer_name, "history": history}

@router.get("/customers/{customer_name}/connected-risk")
def customer_connected_risk(customer_name: str):
    """Retrieves connected contact-sharing entities."""
    risks = find_connected_risk(customer_name)
    return {"customer_name": customer_name, "connected_risks": risks}

@router.get("/customers/{customer_name}/decisions")
def customer_decisions(customer_name: str):
    """Retrieves previous agent decisions, memories, and follow-up tasks."""
    return get_previous_decisions(customer_name)

@router.post("/actions/override")
def override_decision(req: DecisionOverrideRequest):
    """Allows business owner to override or confirm an agent recommendation."""
    query = """
    MATCH (ad:AgentDecision {id: $decision_id})
    SET ad.recommendation = $override_recommendation,
        ad.user_feedback = $user_feedback,
        ad.outcome = 'Owner overridden / finalized'
    RETURN ad.id AS id, ad.recommendation AS recommendation, ad.user_feedback AS user_feedback
    """
    params = {
        "decision_id": req.decision_id,
        "override_recommendation": req.override_recommendation,
        "user_feedback": req.user_feedback
    }
    _, rows, _ = db_client.execute_query(query, params)
    if not rows:
        raise HTTPException(status_code=404, detail=f"Decision '{req.decision_id}' not found.")
    return {"status": "success", "decision": rows[0]}

@router.post("/actions/task")
def create_task(req: CreateTaskRequest):
    """Creates an actionable follow-up task in FalkorDB."""
    return create_follow_up_task(
        customer_name=req.customer_name,
        title=req.title,
        description=req.description,
        due_date=req.due_date or ""
    )

@router.post("/actions/memory")
def create_memory(req: CreateMemoryRequest):
    """Saves an agent memory in FalkorDB."""
    return save_agent_memory(
        customer_name=req.customer_name,
        memory_type=req.memory_type,
        content=req.content,
        importance=req.importance
    )

@router.post("/actions/reminder")
def generate_payment_reminder(req: PaymentReminderRequest):
    """Generates personalized WhatsApp/SMS/Email payment reminder message."""
    profile = get_customer_profile(req.customer_name)
    if "error" in profile:
        raise HTTPException(status_code=404, detail=profile["error"])

    overdue = profile.get("overdue_balance", 0.0)
    phone = profile.get("phone", "")
    cust_name = profile.get("name", req.customer_name)
    inv_str = f" regarding invoice {req.invoice_number}" if req.invoice_number else ""

    sym = settings.CURRENCY_SYMBOL
    message = (
        f"Hello {cust_name},\n\n"
        f"This is Apex Regional Distribution Hub reaching out{inv_str}. "
        f"Our accounts ledger indicates an outstanding overdue balance of {sym}{overdue:,.2f}.\n\n"
        f"{req.custom_note or 'Kindly arrange wire settlement or forward your payment advice to our commercial credit desk.'}\n\n"
        f"Settlement Desk: Commercial Accounts Division\n"
        f"Reference Account: 409-2810-771 (Apex Regional Hub)\n\n"
        f"Thank you for your ongoing partnership."
    )

    # Automatically save as memory and follow-up task
    save_agent_memory(
        customer_name=cust_name,
        memory_type="OUTCOME",
        content=f"Payment reminder drafted for {sym}{overdue:,.2f} on {inv_str or 'account balance'}.",
        importance=6
    )

    return {
        "status": "success",
        "customer_name": cust_name,
        "phone": phone,
        "overdue_balance": overdue,
        "message": message,
        "reminder_text": message
    }

@router.post("/seed")
def trigger_seed():
    """Reseeds FalkorDB from CSV files."""
    try:
        seed_database(clear_first=True)
        return {"status": "success", "message": "FalkorDB graph successfully seeded from CSV demo data."}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Seed error: {str(e)}")

@router.post("/upload-csv")
async def upload_csv(file: UploadFile = File(...)):
    """Uploads a CSV demo dataset and triggers re-seeding."""
    valid_names = ["customers.csv", "orders.csv", "invoices.csv", "payments.csv", "disputes.csv", "suppliers.csv", "products.csv"]
    filename = file.filename.lower()
    if filename not in valid_names:
        raise HTTPException(status_code=400, detail=f"Filename must be one of {valid_names}")

    target_path = os.path.join(DATA_DIR, filename)
    with open(target_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    # Re-seed
    try:
        seed_database(clear_first=True)
        return {
            "status": "success",
            "message": f"Uploaded {filename} and re-ingested graph data into FalkorDB successfully!"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error re-ingesting uploaded data: {str(e)}")
