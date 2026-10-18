# LedgerGraph - Hackathon Submission Description

## Project Title

**LedgerGraph - SME Credit & Working Capital Copilot**

## Primary Track

**Track 01: Context for AI Agents**  
_(with secondary alignment to Track 02: Cross-Domain Graph RAG & Track 03: Real-Time Knowledge Graph)_

---

## 🎯 Executive Summary & The Problem We Solve

In developed markets (US, Europe), small business credit underwriting is solved by centralized tabular credit bureaus (Experian, Equifax, Dun & Bradstreet, FICO).

However, in **underdeveloped, emerging, and frontier community trade networks**:

- **Over 80% of SMEs operate with zero formal credit bureau coverage.**
- **B2B trade credit is the real banking system**: 70%+ of goods are bought on supplier net-30 terms. Distributors and suppliers act as informal, uncollateralized banks.
- **The "Phoenix Company" Contagion Ring**: Chronic defaulters regularly abandon debts under one legal name and re-register under a sister company or family alias, operating from the same warehouse stall, phone number, or delivery yard. Tabular databases and vector embeddings treat them as clean, brand-new applicants.
- **Amnesic Credit Decisions**: SME owners repeatedly fall victim to repeat defaults because informal covenants (e.g., _"require 30% advance deposit due to prior damaged cement dispute"_) are forgotten across sessions.

**LedgerGraph** solves this by putting **FalkorDB at the dead center of an autonomous AI agent's reasoning loop**. When centralized credit bureaus do not exist, **the relational graph topology is the only reliable ground truth**.

---

## 🧠 Why LedgerGraph Perfectly Fits Track 01 ("Context for AI Agents")

In most AI applications, the LLM operates as an isolated entity with a vector store bolted to its side. This approach collapses when evaluating commercial trade risk: vectors cannot trace multi-hop relationship paths, detect contact-sharing fraud rings, or compute counterparty exposure across interconnected subsidiaries.

LedgerGraph demonstrates how knowledge graphs transform AI agents from probabilistic text generators into deterministic, verifiable decision makers:

### 1. Multi-Hop Graph Traversal as Cognitive Reasoning

The agent does not guess or hallucinate. It executes structured, parameterized Cypher queries to navigate 5-to-7 hop relational chains:
`(:Customer)-[:PLACED]->(:Order)-[:HAS_INVOICE]->(:Invoice)-[:PAID_BY]->(:Payment)` and `(:Invoice)-[:HAS_DISPUTE]->(:Dispute)`.
It examines payment velocity, overdue days, unresolved disputes, and supplier dependencies in a single traversal.

### 2. Contact-Sharing Contagion Detection (Topological Fraud Shield)

Through `(:Customer)-[:SHARES_CONTACT]-(delinquent:Customer)` edges, the agent instantly detects when an applicant shares a phone number, email, or physical warehouse stall with an entity carrying defaulted receivables. This topological insight is impossible with tabular SQL or vector search.

### 3. Persistent Agent Memory Across Sessions

AI agents typically suffer from session amnesia. LedgerGraph writes the agent's decisions, rationales, owner overrides, and operational policies back into FalkorDB as `(:AgentDecision)` and `(:AgentMemory)` nodes linked directly to `(:Customer)`. When the owner asks, _"What did we decide about BrightMart last time?"_, the agent queries its graph memory to maintain strict policy continuity.

### 4. Deterministic Evidence & Anti-Hallucination

Every claim made in the agent's business explanation is bound to real node IDs and verifiable Cypher queries displayed live on the dashboard. Judges can inspect the exact Cypher query and graph path behind every recommendation.

### 5. Actionable Operational Follow-Up

Rather than merely returning text, the agent formulates concrete operational actions:

- Auto-generating personalized WhatsApp / SMS debt recovery messages with invoice balances and bank account details.
- Saving actionable follow-up tasks (`:AgentTask`) linked to the customer.
- Enabling human-in-the-loop owner overrides that immediately update the graph.

---

## 🏗️ Technical Architecture & Implementation

- **Database**: FalkorDB running locally in Docker, queried via the official `falkordb` Python client and native Redis protocol.
- **Backend**: FastAPI with async route handlers, robust connection management supporting automated port fallback (6380 / 6379), and deterministic graph evidence tracking.
- **Graph Schema**: 10 node types (`Customer`, `Order`, `Invoice`, `Payment`, `Dispute`, `Supplier`, `Product`, `AgentDecision`, `AgentMemory`, `AgentTask`) and 12 relationship types.
- **Agent Loop**: 10-step autonomous workflow supporting both state-of-the-art LLMs (OpenAI-compatible) and an intelligent native graph reasoning engine that runs **100% offline without requiring an API key**.
- **Frontend Dashboard**: Single-page dark mode glassmorphism UI built with HTML5, Tailwind CSS, and **Vis.js Network** for interactive, force-directed graph exploration.

---

## 📊 Live Demo Metrics

The seeded commercial trade network contains:

- **20 Commercial Customers** ($10,000 to $150,000 credit limits)
- **78 Orders** and **78 Invoices** with real-world overdue calculations
- **72 Payments** and **9 Delivery Disputes**
- **6 Upstream Suppliers** and **16 Products**
- **5 Contact-Sharing Pairs** demonstrating phoenix entity contagion
- **284 Total Nodes** and **518 Total Edges** live in FalkorDB
