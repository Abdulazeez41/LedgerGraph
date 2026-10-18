from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field

class ChatRequest(BaseModel):
    question: str = Field(..., description="Natural language question or command for the agent")
    customer_name: Optional[str] = Field(None, description="Optional target customer name")
    order_amount: Optional[float] = Field(0.0, description="Optional proposed order amount in default currency (e.g. USD)")

class DecisionOverrideRequest(BaseModel):
    decision_id: str = Field(..., description="ID of the AgentDecision to update")
    override_recommendation: str = Field(..., description="APPROVE, HOLD, ESCALATE, etc.")
    user_feedback: str = Field(..., description="Owner feedback or override rationale")

class CreateTaskRequest(BaseModel):
    customer_name: str
    title: str
    description: str
    due_date: Optional[str] = None

class CreateMemoryRequest(BaseModel):
    customer_name: str
    memory_type: str = "POLICY" # POLICY, PREFERENCE, FACT, OUTCOME
    content: str
    importance: int = 5

class PaymentReminderRequest(BaseModel):
    customer_name: str
    invoice_number: Optional[str] = None
    custom_note: Optional[str] = None
