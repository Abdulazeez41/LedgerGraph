# LedgerGraph — Autonomous Trade Credit & Cash-Flow Agent

> **Graph-grounded autonomous agent underwriting trade credit, uncovering contact-sharing delinquent syndicates, and protecting working capital in developing & frontier markets powered by FalkorDB.**

[![FalkorDB](https://img.shields.io/badge/Graph_Database-FalkorDB-EC4899?style=for-the-badge&logo=redis&logoColor=white)](https://falkordb.com/)
[![FastAPI](https://img.shields.io/badge/Backend-FastAPI-009688?style=for-the-badge&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
[![React 18](https://img.shields.io/badge/Frontend-React_18_--_Three.js-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.2+-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg?style=for-the-badge)](LICENSE)

---

## The Problem: The Zero-Bureau Void in Frontier Markets

In developed economies, commercial credit is underwritten through centralized credit bureaus (Dun & Bradstreet, Experian, FICO). In **developing and frontier economy trade hubs**:

1. **Zero Formal Bureau Coverage**: Over 80% of commercial micro-enterprises, regional distributors, and contractors operate completely off-bureau. Centralized credit scoring does not exist.
2. **Informal Trade Credit is the Real Banking System**: More than 70% of B2B commerce runs on supplier net-30 terms. Building-material distributors, FMCG wholesalers, and hardware merchants are forced to act as uncollateralized lenders. Over 60% of SME insolvencies stem directly from overdue receivables locking up working capital.
3. **The "Phoenix Company" Contagion Ring**: Serial defaulters regularly abandon debts under one registered entity and quietly reopen under a new name or sibling alias—while sharing the exact same warehouse yard, delivery phone number, or commercial email. Relational SQL databases struggle with recursive multi-hop joins, and vector databases hallucinate text matches without structural guarantees.
4. **Session Amnesia & Lost Covenants**: Trade credit agreements and dispute resolutions are negotiated verbally or across chat apps. Business owners forget prior dispute settlements (e.g., _"Require 30% advance deposit on orders above ₦1,000,000 due to past damaged goods dispute"_), repeatedly falling into the same traps.

---

## Why FalkorDB Solves This

When credit bureaus don't exist, **the network graph topology is the only reliable ground truth**.

**LedgerGraph puts FalkorDB at the center of the agent's cognition**:

```
                              ┌─────────────────────────────────────────────────────────┐
                              │               FALKORDB KNOWLEDGE GRAPH                  │
                              │                                                         │
   (:Customer {name}) ───────►│  (:Customer)-[:PLACED]->(:Order)-[:HAS_INVOICE]->(:Inv) │
          │                   │    │                       │             │              │
          ▼                   │    ▼ (buys_from)           ▼ (contains)  ▼ (has_dispute)│
   [Agent Inquiry]            │  (:Supplier)             (:Product)    (:Dispute)       │
          │                   │                                          │              │
          ▼                   │  (:Customer)-[:SHARES_CONTACT]->(:Customer [DELINQUENT])│
  Multi-Hop Cypher            │                                                         │
  Traversal Across            │  (:AgentDecision)-[:ABOUT]->(:Customer)                 │
  Topology & Contagion        │  (:AgentMemory)-[:ABOUT]->(:Customer)                   │
          │                   └────────────────────────────┬────────────────────────────┘
          │                                                │
          ▼                                                ▼
  [Risk Engine + LLM] ──────────────────────────► [100% Traceable Decision,
                                                   3D Visualizer & Memory Write-back]
```

1. **Deterministic Multi-Hop Traversal**:
   Instead of guessing, the agent navigates live Cypher paths:
   `(:Customer)-[:PLACED]->(:Order)-[:HAS_INVOICE]->(:Invoice)-[:PAID_BY]->(:Payment)` and `(:Invoice)-[:HAS_DISPUTE]->(:Dispute)` to assess true payment velocity, disputed balances, and liquidity exposure.
2. **Phoenix Entity Contagion Detection**:
   A single-hop Cypher traversal `(:Customer)-[:SHARES_CONTACT]-(delinquent:Customer)` immediately flags when an applicant shares a phone, email, or physical warehouse stall with an entity carrying defaulted receivables.
3. **Cross-Session Agent Memory**:
   The agent writes its decisions, rationales, owner feedback, and credit policies back into FalkorDB as `(:AgentDecision)` and `(:AgentMemory)` nodes. When the owner asks days later, _"What did we decide about BrightMart?"_, the agent queries its graph memory to maintain strict policy continuity.
4. **Zero-Hallucination Evidence Trail**:
   Every recommendation is backed by real FalkorDB node IDs, relationship paths, and raw Cypher queries executed live and displayed directly on the dashboard.

---

## Visual Concept: "The Ledger Room, in Glass"

The workspace is designed as a physical working desk for a business owner reading accounts daily:

- **Dark Stage**: Ink green-black (`#0B1210`) with faint SVG film grain texture (4–6% opacity).
- **Physical 3D Constellation**: Nodes float in space with distinct 3D geometry silhouettes:
  - `Customer`: **Octahedron** (color-coded by risk: Naira green `≤35`, Brass `36–65`, Vermilion `>65`)
  - `Invoice`: **Cube** (Vermilion overdue, Green paid, Brass pending)
  - `Order`: **Hexagonal Cylinder**
  - `Payment`: **Torus / Ring** (Emerald)
  - `Dispute`: **Tetrahedron** (Sharp Vermilion / Amber)
  - `Supplier`: **Sphere**
- **Sequential Evidence Illumination**: When the agent explains a recommendation, the exact graph path it traversed lights up in brass edge-by-edge while the rest of the constellation dims.
- **Solid Bone Paper Surfaces**: Dense financial dossiers, audit trails, and trade history sit on warm bone paper (`#EEE8DA`) with crisp ink typography (`#1A2420`).
- **Stamped Fraunces Verdicts**: Stamped physical typography for `APPROVE`, `APPROVE WITH CONDITIONS`, `HOLD`, `ESCALATE`, and `CHASE PAYMENT`.
- **Pure React Cypher Inspection**: Interactive query inspector tokenizes Cypher queries without `dangerouslySetInnerHTML`.
- **Single Locale Config**: Currency, locale, and date formatting are centralized in one config file ([`frontend/src/config/locale.ts`](file:///home/abdulazeez/github/LedgerGraph/frontend/src/config/locale.ts), default `NGN`, `en-NG`, formatted via `Intl.NumberFormat` and `Intl.DateTimeFormat`).

---

## System Architecture

```
 ┌────────────────────────────────────────────────────────────────────────┐
 │                    THE LEDGER ROOM (REACT 18 + TS)                     │
 │   • 3D Constellation: Three.js (@react-three/fiber, drei, d3-force-3d) │
 │   • Floating Glass Instruments: LedgerStrip, TheBook Rail, QuestionBar │
 │   • Slide-In Dossier: Fraunces Verdicts, Evidence Markers [e1], Cypher │
 │   • 2D SVG Fallback: Automatic graceful degradation for low-power GPUs │
 └───────────────────────────────────┬────────────────────────────────────┘
                                     │ HTTP / REST / JSON (Vite Proxy in Dev)
                                     ▼
 ┌────────────────────────────────────────────────────────────────────────┐
 │                         FASTAPI BACKEND                                │
 │   • /api/health                     • /api/customers                   │
 │   • /api/customers/{name}/profile   • /api/customers/{name}/subgraph   │
 │   • /api/customers/{name}/history   • /api/customers/{name}/connected  │
 │   • /api/customers/{name}/decisions • /api/chat                        │
 │   • /api/actions/override           • /api/actions/reminder            │
 │   • /api/actions/task               • /api/actions/memory              │
 │   • /api/upload-csv                 • /api/seed                        │
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
 │         AgentDecision, AgentMemory, FollowUpTask                       │
 │  Edges: PLACED, HAS_INVOICE, RECORDED_PAYMENT, FILED_DISPUTE           │
 │         SUPPLIES, BUYS_FROM, CONNECTED_TO, PREVIOUS_DECISION           │
 └────────────────────────────────────────────────────────────────────────┘
```

---

## Graph Data Model

### Node Types

| Node Label         | Key Properties                                                                         | Description                                             |
| :----------------- | :------------------------------------------------------------------------------------- | :------------------------------------------------------ |
| `(:Customer)`      | `id, name, phone, email, address, business_type, credit_limit, risk_score, created_at` | SME trade buyers, contractors, and regional stores      |
| `(:Order)`         | `id, order_date, total_amount, status, due_date`                                       | Commercial purchase orders                              |
| `(:Invoice)`       | `id, invoice_number, amount, issue_date, due_date, status, days_overdue`               | Commercial trade invoices with computed delinquency     |
| `(:Payment)`       | `id, amount, payment_date, method, status`                                             | Settlement transactions (wire, transfer, mobile)        |
| `(:Dispute)`       | `id, reason, opened_date, status, severity`                                            | Delivery and quality disputes (damaged goods, mismatch) |
| `(:Supplier)`      | `id, name, phone, email, lead_time_days`                                               | Upstream manufacturers and bulk suppliers               |
| `(:Product)`       | `id, name, category, unit_price, stock_quantity`                                       | Inventory catalog items                                 |
| `(:AgentDecision)` | `id, question, recommendation, confidence, rationale, outcome, user_feedback`          | Persistent agent recommendations stored in graph        |
| `(:AgentMemory)`   | `id, memory_type, content, importance, created_at`                                     | Long-term episodic and semantic memory                  |
| `(:FollowUpTask)`  | `id, title, description, status, due_date, created_at`                                 | Concrete operational follow-up tasks                    |

### Relationships

- `(:Customer)-[:PLACED]->(:Order)`
- `(:Order)-[:CONTAINS]->(:Product)`
- `(:Order)-[:HAS_INVOICE]->(:Invoice)`
- `(:Invoice)-[:RECORDED_PAYMENT]->(:Payment)`
- `(:Invoice)-[:FILED_DISPUTE]->(:Dispute)`
- `(:Customer)-[:CONNECTED_TO]->(:Customer)` _(Shared phone, email, or physical address)_
- `(:Customer)-[:BUYS_FROM]->(:Supplier)`
- `(:Supplier)-[:SUPPLIES]->(:Product)`
- `(:AgentDecision)-[:ABOUT]->(:Customer)`
- `(:AgentDecision)-[:BASED_ON]->(:Invoice|:Payment|:Dispute|:Customer)`
- `(:AgentMemory)-[:HAS_MEMORY]->(:Customer)`
- `(:FollowUpTask)-[:TASK_FOR]->(:Customer)`

---

## Agent Tooling (Cypher-Grounded)

All 9 agent tools execute real Cypher queries against FalkorDB and return structured JSON:

| Tool Name                                  | Cypher Purpose                                                                           | Return Payload                                               |
| :----------------------------------------- | :--------------------------------------------------------------------------------------- | :----------------------------------------------------------- |
| `get_customer_profile(name)`               | Aggregates orders, invoice balances, total paid, overdue amounts, and active disputes    | Customer financial metrics & credit limit                    |
| `get_payment_history(name)`                | Traverses multi-hop invoices, settlements, and payment timeliness                        | List of all invoices with status, days overdue, and payments |
| `find_connected_risk(name)`                | Multi-hop search over `[:CONNECTED_TO]` to identify delinquent sister entities           | Connected customers, shared contact type, overdue totals     |
| `get_supplier_exposure(name)`              | Traverses `[:BUYS_FROM]` and `[:SUPPLIES]` to inspect product dependencies               | Products, supplier names, stock levels, lead times           |
| `calculate_cash_flow_impact(name, amount)` | Computes projected credit utilization and working capital locked                         | Overdue balance, projected exposure, risk level              |
| `save_agent_decision(...)`                 | Creates `(:AgentDecision)` and links `[:ABOUT]` customer and `[:BASED_ON]` evidence      | Saved decision ID and relationship confirmation              |
| `save_agent_memory(...)`                   | Persists `(:AgentMemory)` (`POLICY`, `FACT`, `PREFERENCE`, `OUTCOME`) linked to customer | Saved memory ID                                              |
| `create_follow_up_task(...)`               | Creates actionable `(:FollowUpTask)` linked via `[:TASK_FOR]`                            | Created task ID, due date, status                            |
| `get_previous_decisions(name)`             | Queries prior decisions, graph memories, and tasks for cross-session continuity          | Complete historical context & prior covenants                |

---

## Live Demonstration Scenarios

### 1. Credit Approval with Contact-Sharing Contagion Detection

**Owner Inquiry:**

> _“Should I approve a ₦20,000 order for BrightMart on 30-day credit?”_

**The Agent Recommendation:** `ESCALATE` (Confidence: 92% • Risk Score: 69/100)  
**Business Explanation:**

> **Recommendation: ESCALATE TO CREDIT COMMITTEE** (Risk Score: 69/100)  
> High-priority alert on **BrightMart Hardware Ltd**. Graph network analysis uncovered direct contact sharing with known delinquent entities:  
> • Shares Phone (`+1-555-019-2831`) and Address (`Plot 442, Industrial Area, Trade Hub Zone 1`) with delinquent sister entity **Metro Commercial Ventures** carrying **₦50,000.00** in defaulted debt across 2 invoices.  
> • BrightMart currently has 1 overdue invoice `INV-2026-0003` (₦12,000.00, 33 days overdue) under an open dispute regarding damaged packaging.  
> • Extending an additional ₦20,000.00 would bring total exposure to ₦47,000.00 (78% of their credit limit).  
> • **Graph Memory (POLICY)**: Owner directive states: _"BrightMart has a connected entity (Metro Commercial) with delinquent overdue invoices. Require at least 30% advance deposit for orders above ₦10,000 until INV-103 dispute is cleared."_
>
> This topological pattern indicates potential phoenix entity restructuring across affiliated entities in the commercial trade corridor. Do not fulfill on open credit without personal corporate director guarantees.
>
> **Proposed Next Action**: Escalate account to Credit Committee due to connected entity delinquency (Metro Commercial Ventures).

---

### 2. Cross-Session Graph Memory Recall

**Owner Inquiry:**

> _“What did we decide about BrightMart last time?”_

**The Agent Response:**

> **Historical Records for BrightMart Hardware Ltd:**  
> **Last Decision:**  
> • Inquiry: _"Should I approve a ₦20,000 order for BrightMart on 30-day credit?"_  
> • Recommendation: **ESCALATE** (Confidence: 92%)  
> • Rationale: Identified contact sharing with delinquent entity Metro Commercial Ventures (₦50,000 overdue), plus active dispute on INV-2026-0003.
>
> **Saved Graph Memories:**  
> • `[POLICY]` Business owner directive: _"BrightMart has a connected entity (Metro Commercial) with delinquent overdue invoices. Require at least 30% advance deposit for orders above ₦10,000 until INV-103 dispute is cleared."_ _(Importance: 9/10)_  
> • `[PREFERENCE]` Customer prefers direct wire transfer settlements and requests digital receipts via WhatsApp / Email. _(Importance: 7/10)_
>
> **Open Follow-up Tasks:**  
> • **Resolve cement damage dispute on INV-103 with BrightMart** (Status: `PENDING`) — Dispatch site inspector to verify 40 damaged cement bags at BrightMart Sector 4 warehouse and issue credit note so remaining balance can be collected.

---

### 3. Portfolio-Level Debt Chasing & Working Capital Recovery

**Owner Inquiry:**

> _“Which invoices should I chase today?”_

**The Agent Response:**

> You have **8 priority overdue invoices** totaling **₦187,000.00** requiring immediate chase:  
> • **Horizon Aggregate Supplies** — Invoice `INV-2026-0013` for **₦21,000.00** (78 days overdue)  
> • **Metro Commercial Ventures** — Invoice `INV-2026-0007` for **₦28,000.00** (38 days overdue)  
> • **FastTrack Construction Ltd** — Invoice `INV-2026-0036` for **₦25,000.00** (29 days overdue)
>
> **Proposed Action**: Draft payment reminder for Horizon Aggregate Supplies (INV-2026-0013).

---

## Quick Start Guide

### Prerequisites

- Python 3.10+
- Node.js 18+ & npm
- Docker

### 1. Run FalkorDB via Docker

LedgerGraph connects to FalkorDB on port `6380` (or `6379`):

```bash
docker pull falkordb/falkordb:latest
docker run -d --name ledgergraph-falkordb -p 6380:6379 falkordb/falkordb:latest
```

### 2. Set Up Python Backend

```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt

# Seed the commercial trade graph (300+ nodes, 800+ edges)
python -m backend.db.seed_data
```

### 3. Build & Run Frontend

The frontend is built with Vite + React 18 + TypeScript:

```bash
cd frontend
npm install
npm run build
```

The production assets compile directly into `frontend/dist`. FastAPI is configured to serve them statically at the root URL.

#### Running in Development:

```bash
# Terminal 1: Backend
python -m uvicorn backend.main:app --host 0.0.0.0 --port 8000 --reload

# Terminal 2: Frontend with Hot Module Replacement & Proxy
cd frontend
npm run dev
# Accessible at http://localhost:5173
```

#### Running in Production / Standalone:

```bash
python -m uvicorn backend.main:app --host 0.0.0.0 --port 8000
```

Open your browser at:  
👉 **`http://localhost:8000`**

---

## License

This project is open-source under the [MIT License](LICENSE).
