export type Verdict =
  | 'APPROVE'
  | 'APPROVE WITH CONDITIONS'
  | 'HOLD'
  | 'ESCALATE'
  | 'CHASE PAYMENT';

export interface HealthResponse {
  status: 'healthy' | 'unhealthy';
  host?: string;
  port: number;
  graph: string;
  connected: boolean;
  node_count?: number;
  relationship_count?: number;
  error?: string;
}

export interface CustomerSummary {
  id: string;
  name: string;
  phone: string;
  email: string;
  address: string;
  business_type: string;
  credit_limit: number;
  risk_score: number;
  overdue_count: number;
  overdue_balance: number;
  isPartOfRing?: boolean;
}

export interface CustomerProfile {
  id?: string;
  customer_id?: string;
  name: string;
  phone: string;
  email: string;
  address: string;
  business_type: string;
  credit_limit: number;
  risk_score: number;
  created_at?: string;
  total_orders: number;
  total_invoiced: number;
  total_paid: number;
  outstanding_balance: number;
  overdue_balance: number;
  available_credit?: number;
  credit_utilization_pct?: number;
  overdue_invoices_count: number;
  open_disputes_count: number;
}

export interface SubgraphNode {
  id: string;
  label: string; // 'Customer' | 'Order' | 'Invoice' | 'Payment' | 'Dispute' | 'Supplier' | 'Product'
  name: string;
  properties: Record<string, any>;
  x?: number;
  y?: number;
  z?: number;
  vx?: number;
  vy?: number;
  vz?: number;
}

export interface SubgraphLink {
  source: string | SubgraphNode;
  target: string | SubgraphNode;
  type: string;
  key?: string;
  isEvidence?: boolean;
}

export interface SubgraphResponse {
  nodes: SubgraphNode[];
  links: SubgraphLink[];
}

export interface PaymentHistoryItem {
  invoice_number: string;
  invoice_amount: number;
  due_date: string;
  invoice_status: string;
  days_overdue: number;
  paid_amount?: number;
  payment_date?: string;
  dispute_reason?: string;
  dispute_severity?: string;
  dispute_status?: string;
}

export interface ConnectedRiskItem {
  root_customer: string;
  connected_customer: string;
  connected_risk_score: number;
  shared_phone?: string;
  shared_email?: string;
  shared_address?: string;
  overdue_amount: number;
  overdue_invoices_count: number;
}

export interface DecisionItem {
  id: string;
  decision_date: string;
  question: string;
  recommendation: string;
  confidence: number;
  proposed_action?: string;
  outcome?: string;
  user_feedback?: string;
}

export interface MemoryItem {
  id: string;
  memory_type: string;
  content: string;
  importance: number;
  created_at: string;
}

export interface TaskItem {
  id: string;
  title: string;
  description: string;
  due_date?: string;
  status: string;
  created_at: string;
}

export interface CustomerDecisionsResponse {
  customer_name: string;
  decisions: DecisionItem[];
  memories: MemoryItem[];
  tasks: TaskItem[];
}

export interface CypherQueryTrace {
  description: string;
  query: string;
  params?: Record<string, any>;
  latency_ms?: number;
}

export interface ChatRequest {
  question: string;
  customer_name?: string;
  order_amount?: number;
}

export interface ChatResponse {
  customer_name: string;
  recommendation: Verdict;
  confidence: number;
  risk_score: number;
  business_explanation: string;
  recommended_conditions: string[];
  proposed_action: string;
  action_type: string;
  action_payload: {
    reminder_template?: string;
    overdue_balance?: number;
    customer_phone?: string;
  };
  evidence_nodes: Array<string | Record<string, any>>;
  evidence_edges: Array<{ source: string; target: string; type: string }>;
  cypher_queries: CypherQueryTrace[];
  cash_flow?: Record<string, any>;
  subgraph?: SubgraphResponse;
  decision_id?: string;
  latency_ms?: number;
}

export interface NetworkRing {
  id: string;
  type: 'phone' | 'email' | 'address';
  sharedValue: string;
  members: CustomerSummary[];
  totalCreditLimit: number;
  totalOverdue: number;
  maxRiskScore: number;
}
