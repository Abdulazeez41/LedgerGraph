# LedgerGraph — SME Credit & Working Capital Copilot

> **Graph-grounded AI agent underwriting trade credit, uncovering contact-sharing fraud contagion, and protecting working capital in developing & frontier markets powered by FalkorDB.**

[![FalkorDB](https://img.shields.io/badge/Graph_Database-FalkorDB-EC4899?style=for-the-badge&logo=redis&logoColor=white)](https://falkordb.com/)
[![FastAPI](https://img.shields.io/badge/Backend-FastAPI-009688?style=for-the-badge&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
[![Python 3.10+](https://img.shields.io/badge/Python-3.10+-3776AB?style=for-the-badge&logo=python&logoColor=white)](https://python.org/)
[![Track: Context for AI Agents](https://img.shields.io/badge/Hackathon-Track_01:_Context_for_AI_Agents-8B5CF6?style=for-the-badge)](https://falkordb.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg?style=for-the-badge)](LICENSE)

---

## 📌 One-Line Pitch

**LedgerGraph** is an autonomous AI agent for suppliers and SMEs in developing and frontier markets that traverses multi-hop trade credit topologies in **FalkorDB** to approve customer credit, detect hidden contact-sharing delinquent networks, protect working capital, and remember decisions across sessions with 100% Cypher traceability.

---

## 🌍 The Problem: Missing Credit Bureaus in Developing & Frontier Markets

In developed economies, trade credit is underwritten through centralized credit bureaus (FICO, Experian, Dun & Bradstreet). But in **underdeveloped, emerging, and frontier community trade networks**:

1. **The "Zero Bureau" Void**: Over 80% of commercial micro-enterprises, regional distributors, and contractors operate with **zero formal credit bureau coverage**. Centralized credit scores simply do not exist.
2. **Informal Trade Credit is the Real Banking System**: More than 70% of B2B commerce occurs on supplier net-30 terms. Distributors and building suppliers are forced to act as uncollateralized banks. Over 60% of SME failures stem directly from unpaid trade debt locking up working capital.
3. **The "Phoenix Company" Contagion Ring**: Serial defaulters regularly abandon debts under one business registration and quietly reopen under a new name or sibling alias—while sharing the exact same warehouse yard, delivery phone, or commercial email. Tabular accounting tools and vector similarity databases treat them as brand-new, clean applicants.
4. **Session Amnesia & Lost Covenants**: Supplier credit decisions are scattered across informal conversations. Business owners forget prior dispute settlements (e.g., *"Require 30% advance deposit on orders above $10k due to prior damaged goods dispute"*), repeatedly exposing themselves to repeat defaults.

---

## 🧠 Why FalkorDB Solves This Problem

When credit bureaus don't exist, **the network graph topology is the only reliable ground truth**. 

Traditional relational SQL databases struggle with expensive multi-table recursive joins, and vector databases hallucinate text matches without structural guarantees. **LedgerGraph puts FalkorDB at the dead center of the agent's cognition**:

```
                              ┌─────────────────────────────────────────────────────────┐
                              │               FALKORDB KNOWLEDGE GRAPH                  │
                              │                                                         │
   (:Customer {name}) ───────►│  (:Customer)-[:PLACED]->(:Order)-[:HAS_INVOICE]->(:Inv) │
          │                   │    │                       │             │              │
          ▼                   │    ▼ (buys_from)           ▼ (contains)  ▼ (has_dispute)│
   [Agent Intent]             │  (:Supplier)             (:Product)    (:Dispute)       │
          │                   │                                          │              │
          ▼                   │  (:Customer)-[:SHARES_CONTACT]->(:Customer [DELINQUENT])│
  Multi-Hop Cypher            │                                                         │
  Traversal Across            │  (:AgentDecision)-[:ABOUT]->(:Customer)                 │
  Topology & Contagion        │  (:AgentMemory)-[:ABOUT]->(:Customer)                   │
          │                   └────────────────────────────┬────────────────────────────┘
          │                                                │
          ▼                                                ▼
  [Risk Engine + LLM] ──────────────────────────► [100% Traceable Decision,
                                                   Graph Visualizer & Memory Write-back]
```

1. **Deterministic Multi-Hop Traversal**:
   Instead of guessing, the agent navigates live Cypher paths:
   `(:Customer)-[:PLACED]->(:Order)-[:HAS_INVOICE]->(:Invoice)-[:PAID_BY]->(:Payment)` and `(:Invoice)-[:HAS_DISPUTE]->(:Dispute)` to assess true payment velocity, disputed balances, and liquidity exposure.
2. **Phoenix Entity Contagion Detection**:
   A single-hop Cypher traversal `(:Customer)-[:SHARES_CONTACT]-(delinquent:Customer)` immediately flags when an applicant shares a phone, email, or physical warehouse stall with an entity carrying defaulted receivables.
3. **Cross-Session Agent Memory**:
   The agent writes its decisions, rationales, owner feedback, and credit policies back into FalkorDB as `(:AgentDecision)` and `(:AgentMemory)` nodes. When the owner asks days later, *"What did we decide about BrightMart?"*, the agent queries its graph memory to maintain strict policy continuity.
4. **Zero-Hallucination Evidence Trail**:
   Every recommendation is backed by real FalkorDB node IDs, relationship paths, and raw Cypher queries executed live and displayed directly on the dashboard.

---

## 🏛️ System Architecture

```
 ┌────────────────────────────────────────────────────────────────────────┐
 │                 LEDGERGRAPH SINGLE-PAGE DASHBOARD                      │
 │   • Interactive Force-Directed Subgraph Explorer (Vis.js Network)      │
 │   • Copilot Terminal with Real-Time Reasoning Stream & Sample Prompts  │
 │   • Recommendation Badge, Risk Gauge, & Conditions Checklist           │
 │   • Tabbed Evidence Center: Profile, Live Cypher, Memory, Tasks        │
 └───────────────────────────────────┬────────────────────────────────────┘
                                     │ HTTP / REST / JSON
                                     ▼
 ┌────────────────────────────────────────────────────────────────────────┐
 │                         FASTAPI BACKEND                                │
 │   • /api/chat                       • /api/customers                   │
 │   • /api/customers/{id}/profile     • /api/customers/{id}/subgraph     │
 │   • /api/actions/override           • /api/actions/task                │
 │   • /api/actions/memory             • /api/actions/reminder            │
 └─────────────────┬───────────────────────────────────┬──────────────────┘
                   │                                   │
                   ▼                                   ▼
 ┌────────────────────────────────────┐ ┌─────────────────────────────────┐
 │       AGENT REASONING LOOP         │ │         RISK ENGINE             │
 │  1. Entity & Intent Identification │ │  • Graph Topology Scoring       │
 │  2. Memory Retrieval (:AgentMemory)│ │  • Overdue & Dispute Weighting  │
 │  3. Multi-Hop Graph Traversal      │ │  • Working Capital Exposure     │
 │  4. Rule & LLM Explanation         │ │  • Connected Contagion Penalty  │
 │  5. Graph Memory Write-Back        │ └─────────────────────────────────┘
 └─────────────────┬──────────────────┘
                   │
                   ▼ (Cypher via Redis Protocol on Port 6380 / 6379)
 ┌────────────────────────────────────────────────────────────────────────┐
 │                      FALKORDB GRAPH DATABASE                           │
 │  Nodes: Customer, Order, Invoice, Payment, Dispute, Supplier, Product  │
 │         AgentDecision, AgentMemory, AgentTask                          │
 │  Edges: PLACED, HAS_INVOICE, PAID_BY, HAS_DISPUTE, SHARES_CONTACT     │
 │         BUYS_FROM, SUPPLIES, OWES, ABOUT, BASED_ON, FOR_CUSTOMER       │
 └────────────────────────────────────────────────────────────────────────┘
```

---

## 📊 Graph Data Model

### Node Types

| Node Label | Key Properties | Description |
|:---|:---|:---|
| `(:Customer)` | `id, name, phone, email, address, business_type, credit_limit, risk_score, created_at` | SME trade buyers, contractors, and regional stores |
| `(:Order)` | `id, order_date, total_amount, status, due_date` | Commercial purchase orders |
| `(:Invoice)` | `id, invoice_number, amount, issue_date, due_date, status, days_overdue` | Commercial trade invoices with computed delinquency |
| `(:Payment)` | `id, amount, payment_date, method, status` | Settlement transactions (wire, transfer, mobile) |
| `(:Dispute)` | `id, reason, opened_date, status, severity` | Delivery and quality disputes (damaged goods, mismatch) |
| `(:Supplier)` | `id, name, phone, email, lead_time_days` | Upstream manufacturers and bulk suppliers |
| `(:Product)` | `id, name, category, unit_price, stock_quantity` | Inventory catalog items |
| `(:AgentDecision)` | `id, question, recommendation, confidence, rationale, outcome, user_feedback` | Persistent agent recommendations stored in graph |
| `(:AgentMemory)` | `id, memory_type, content, importance, created_at` | Long-term episodic and semantic memory |
| `(:AgentTask)` | `id, title, description, status, due_date, created_at` | Concrete operational follow-up tasks |

### Relationships

- `(:Customer)-[:PLACED]->(:Order)`
- `(:Order)-[:CONTAINS]->(:Product)`
- `(:Order)-[:HAS_INVOICE]->(:Invoice)`
- `(:Customer)-[:OWES]->(:Invoice)`
- `(:Invoice)-[:PAID_BY]->(:Payment)`
- `(:Invoice)-[:HAS_DISPUTE]->(:Dispute)`
- `(:Customer)-[:SHARES_CONTACT]->(:Customer)` *(Shared phone, email, or physical warehouse stall)*
- `(:Customer)-[:BUYS_FROM]->(:Supplier)`
- `(:Supplier)-[:SUPPLIES]->(:Product)`
- `(:AgentDecision)-[:ABOUT]->(:Customer)`
- `(:AgentDecision)-[:BASED_ON]->(:Invoice|:Payment|:Dispute|:Customer)`
- `(:AgentMemory)-[:ABOUT]->(:Customer)`
- `(:AgentTask)-[:FOR_CUSTOMER]->(:Customer)`

---

## 🛠️ Required Agent Tools

All 9 agent tools execute real Cypher queries against FalkorDB and return structured JSON:

| Tool Name | Cypher Purpose | Return Payload |
|:---|:---|:---|
| `get_customer_profile(name)` | Aggregates orders, invoice balances, total paid, overdue amounts, and active disputes | Customer financial metrics & credit limit |
| `get_payment_history(name)` | Traverses multi-hop invoices, settlements, and payment timeliness | List of all invoices with status, days overdue, and payments |
| `find_connected_risk(name)` | Multi-hop search over `[:SHARES_CONTACT]` to identify delinquent sister entities | Connected customers, shared contact type, overdue totals |
| `get_supplier_exposure(name)` | Traverses `[:BUYS_FROM]` and `[:SUPPLIES]` to inspect product dependencies | Products, supplier names, stock levels, lead times |
| `calculate_cash_flow_impact(name, amount)` | Computes projected credit utilization and working capital locked | Overdue balance, projected exposure, risk level |
| `save_agent_decision(...)` | Creates `(:AgentDecision)` and links `[:ABOUT]` customer and `[:BASED_ON]` evidence | Saved decision ID and relationship confirmation |
| `save_agent_memory(...)` | Persists `(:AgentMemory)` (POLICY, FACT, PREFERENCE, OUTCOME) linked to customer | Saved memory ID |
| `create_follow_up_task(...)` | Creates actionable `(:AgentTask)` linked via `[:FOR_CUSTOMER]` | Created task ID, due date, status |
| `get_previous_decisions(name)` | Queries prior decisions, graph memories, and tasks for cross-session continuity | Complete historical context & prior covenants |

---

## 💬 Live Demonstration Scenarios

### 1. Credit Approval with Contact-Sharing Contagion Detection

**User Prompt:**
> *“Should I approve a $20,000 order for BrightMart on 30-day credit?”*

**Agent Recommendation:** `ESCALATE` (Confidence: 92% • Risk Score: 69/100)
**Business Explanation:**
> **Recommendation: ESCALATE TO CREDIT COMMITTEE** (Risk Score: 69/100)  
> High-priority alert on **BrightMart Hardware Ltd**. Graph network analysis uncovered direct contact sharing with known delinquent entities:
> • Shares Phone (`+1-555-019-2831`) and Address (`Plot 442, Industrial Area, Trade Hub Zone 1`) with delinquent entity **Metro Commercial Ventures** carrying **$50,000.00** in defaulted/overdue debt across 2 invoices.  
> • BrightMart currently has 1 overdue invoice `INV-2026-0003` ($12,000.00, 33 days overdue) under an open dispute regarding damaged packaging.  
> • Extending an additional $20,000.00 would bring total exposure to $47,000.00 (78% of their $60,000.00 credit ceiling).  
> • **Graph Memory (POLICY)**: Owner directive states: *"BrightMart has a connected entity (Metro Commercial) with delinquent overdue invoices. Require at least 30% advance deposit for orders above $10,000 until INV-103 dispute is cleared."*  
> 
> This topological pattern indicates potential phoenix entity restructuring across affiliated entities in the commercial trade corridor. Do not fulfill on open credit without personal corporate director guarantees.  
> 
> **Proposed Next Action**: Escalate account to Credit Committee due to connected entity delinquency (Metro Commercial Ventures).

---

### 2. Cross-Session Graph Memory Recall

**User Prompt:**
> *“What did we decide about BrightMart last time?”*

**Agent Response:**
> **Historical Records for BrightMart Hardware Ltd:**  
> **Last Decision:**
> • Question: *"Should I approve a $20,000 order for BrightMart on 30-day credit?"*  
> • Recommendation: **ESCALATE** (Confidence: 92%)  
> • Rationale: Identified contact sharing with delinquent entity Metro Commercial Ventures ($50k overdue), plus active dispute on INV-2026-0003.  
> 
> **Saved Graph Memories:**  
> • `[POLICY]` Business owner directive: *"BrightMart has a connected entity (Metro Commercial) with delinquent overdue invoices. Require at least 30% advance deposit for orders above $10,000 until INV-103 dispute is cleared."* *(Importance: 9/10)*  
> • `[PREFERENCE]` Customer prefers direct wire transfer settlements and requests digital receipts via WhatsApp / Email. *(Importance: 7/10)*  
> 
> **Open Follow-up Tasks:**  
> • **Resolve cement damage dispute on INV-103 with BrightMart** (Status: `PENDING`, Due: 2026-10-22) — Dispatch site inspector to verify 40 damaged cement bags at BrightMart Sector 4 warehouse and issue credit note so remaining balance can be collected.

---

### 3. Portfolio-Level Debt Chasing & Working Capital Recovery

**User Prompt:**
> *“Which invoices should I chase today?”*

**Agent Response:**
> You have **8 priority overdue invoices** totaling **$187,000.00** requiring immediate chase:  
> • **Horizon Aggregate Supplies** — Invoice `INV-2026-0013` for **$21,000.00** (78 days overdue)  
> • **Metro Commercial Ventures** — Invoice `INV-2026-0007` for **$28,000.00** (38 days overdue)  
> • **FastTrack Construction Ltd** — Invoice `INV-2026-0036` for **$25,000.00** (29 days overdue)  
> ...  
> **Proposed Action**: Draft payment reminder for Horizon Aggregate Supplies (INV-2026-0013).

---

## ⚡ Quick Start Guide

### Prerequisites
- Python 3.10+
- Docker

### 1. Clone & Set Up Environment

```bash
git clone https://github.com/your-username/LedgerGraph.git
cd LedgerGraph

# Create virtual environment
python3 -m venv .venv
source .venv/bin/activate

# Install dependencies
pip install -r requirements.txt
```

### 2. Run FalkorDB via Docker

LedgerGraph automatically connects to FalkorDB on port `6380` (or `6379`):

```bash
docker pull falkordb/falkordb:latest
docker run -d --name ledgergraph-falkordb -p 6380:6379 falkordb/falkordb:latest
```

*(Alternatively, use `docker compose up -d`)*

### 3. Seed Demo Dataset

Generate and ingest the 20-customer commercial trade network (284 nodes, 518 edges):

```bash
python -m backend.db.seed_data
```

### 4. Configure Environment Variables (Optional for LLM)

```bash
cp .env.example .env
```

> **Note on Zero-API-Key Operation**: LedgerGraph includes an intelligent, deterministic graph reasoning engine that operates **100% offline without any API key**. If you configure `OPENAI_API_KEY` in `.env`, the agent seamlessly utilizes OpenAI models while maintaining the exact same Cypher evidence grounding.

### 5. Launch LedgerGraph

```bash
python -m uvicorn backend.main:app --host 0.0.0.0 --port 8000 --reload
```

Open your browser at:  
👉 **`http://localhost:8000`**

---

## 🎬 3-Minute Demo Walkthrough for Judges

1. **Dashboard Overview (`http://localhost:8000`)**:
   - Check the top bar: FalkorDB is connected and reports **280+ nodes and 500+ edges**.
   - Notice the Vis.js interactive graph canvas on the right side.
2. **Execute Multi-Hop Credit Evaluation**:
   - Click the prompt chip: **`$20k Credit for BrightMart?`**
   - Watch the copilot stream the graph traversal.
   - The recommendation badge turns purple for **`ESCALATE`** (Risk score 69/100).
   - In the graph canvas, drag nodes to explore the multi-hop relationship between BrightMart, its invoices, and its sister entity **Metro Commercial Ventures**.
3. **Inspect the Cypher Queries**:
   - Click the **"Cypher Queries Executed"** tab.
   - Review the live queries: profile lookup, multi-hop payment traversal, connected risk query, and cash-flow impact calculation.
4. **Verify Cross-Session Agent Memory**:
   - Click the prompt chip: **`Memory: BrightMart History`**.
   - Notice how the agent instantly pulls the prior decision, saved policy covenants (`[:AgentMemory]`), and pending inspection tasks (`[:AgentTask]`).
5. **Take Operational Actions**:
   - Click **"Payment Reminder"**: View the auto-formatted WhatsApp / SMS reminder with the customer's phone number, overdue amount, and reference details.
   - Click **"Override Decision"**: Enter owner feedback (e.g., *"Approved because customer provided collateral"*) and submit. FalkorDB updates the decision node live.
   - Click **"Create Task"**: Add an action item to the graph.
6. **Portfolio-Level Intelligence**:
   - Click **`Highest Risk Accounts`** to see top delinquent entities ranked by graph risk.
   - Click **`Invoices to Chase`** to identify trapped working capital.
   - Click **`Connected Risk Pairs`** to reveal all contact-sharing entity clusters across the network.

---

## 🏆 Hackathon Track Alignment: Track 01

### Primary Track: **Track 01 — Context for AI Agents**

- **Graph as the Agent's Cognitive Fabric**: The graph is not an auxiliary retrieval index; it is where the agent reasons. The agent dynamically dispatches Cypher queries, analyzes network topology, detects fraud contagion, and saves its conclusions back into the graph.
- **Traceable Graph Paths**: Every single recommendation is accompanied by the exact multi-hop graph path and raw Cypher queries executed.
- **Persistent Agent Memory Across Sessions**: Solves agent amnesia by persisting underwriting decisions and owner covenants into `(:AgentDecision)` and `(:AgentMemory)` nodes.

### Supplementary Alignment:
- **Track 02 (Cross-Domain Graph RAG)**: Connects operational supply chain data (suppliers, lead times, stock availability) with accounts receivables and commercial dispute tracking.
- **Track 03 (Real-Time Knowledge Graph)**: Features real-time state mutation, CSV data ingestion, and interactive force-directed graph exploration.

---

## 📄 License

This project is open-source under the [MIT License](LICENSE).
