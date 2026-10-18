# How We Built LedgerGraph: Underwriting Trade Credit in Frontier Economies with FalkorDB Knowledge Graphs

*Built for the "Graph Hacks: Context for AI Agents" Hackathon powered by FalkorDB.*

---

## The Invisible Problem: Missing Credit Bureaus in Developing Markets

If you run a business in North America or Western Europe, checking customer credit is routine: you query Experian, Dun & Bradstreet, or pull a FICO commercial score. The data is centralized, standardized, and easily digested by classic tabular databases.

**In underdeveloped, emerging, and frontier community trade networks, that infrastructure does not exist.**

Over **80% of commercial micro-enterprises and regional trade contractors operate with zero formal credit bureau coverage**. Yet, over **70% of B2B transactions run on trade credit** (net-30 supplier terms). Building distributors, agro-allied suppliers, and FMCG wholesalers are forced to act as uncollateralized banks. When buyers default, suppliers collapse. More than 60% of SME failures in developing markets stem directly from working capital trapped in delinquent trade debt.

Even worse is the **"Phoenix Company" plague**: chronic defaulters abandon debts under one registered name and re-emerge under a sister company or family alias. Because they share the same physical warehouse stall, telephone number, or delivery email, tabular accounting spreadsheets and vector similarity embeddings treat them as clean, brand-new applicants.

When traditional credit bureaus don't exist, **the relational network graph topology is the only ground truth.**

That is why we built **LedgerGraph**—an autonomous AI agent powered by **FalkorDB** that places graph traversals at the dead center of SME credit underwriting, working capital defense, and fraud contagion detection.

---

## Why Vector RAG & Relational Databases Fail Here

Most modern "AI Copilots" bolt a vector database (Vector RAG) beside an LLM. But vector databases search for *semantic similarity*, not *relational structure*. A vector database cannot answer:
- *"Does BrightMart share a delivery address or phone number with any entity that currently has overdue debt?"*
- *"Traverse from this customer through all fulfilled orders and invoices to find the ratio of disputed amounts to settled payments over the last 90 days."*

Traditional SQL databases can theoretically join tables, but multi-hop recursive queries across Customers, Orders, Invoices, Payments, Disputes, Suppliers, and Contact-sharing aliases result in slow, unwieldy, expensive nested joins that break real-time agentic loops.

**FalkorDB provides the exact capabilities needed:**
1. **Blazing-Fast Graph Traversal**: FalkorDB leverages Redis-protocol memory efficiency and GraphBLAS sparse-matrix linear algebra, executing multi-hop Cypher queries in single-digit milliseconds.
2. **Context for AI Agents (Track 01)**: The graph acts as the agent's verifiable cognitive memory and deterministic world model, completely eliminating LLM hallucinations.
3. **Dynamic Topology Mutation**: As orders are approved, disputes opened, or owner covenants recorded, FalkorDB updates relationships in real time.

---

## System Architecture: Placing FalkorDB at the Center of the AI Loop

LedgerGraph does not treat FalkorDB as a passive document dump. The graph is the agent's active reasoning sandbox.

```
 ┌────────────────────────────────────────────────────────────────────────┐
 │                 LEDGERGRAPH SINGLE-PAGE DASHBOARD                      │
 │   • Interactive Force-Directed Subgraph Explorer (Vis.js Network)      │
 │   • Real-Time Copilot Terminal & Cypher Query Inspector                │
 │   • Recommendation Badge, Risk Gauge, & Conditions Checklist           │
 └───────────────────────────────────┬────────────────────────────────────┘
                                     │ HTTP / REST
                                     ▼
 ┌────────────────────────────────────────────────────────────────────────┐
 │                         FASTAPI BACKEND                                │
 │   • Autonomous 10-Step Graph Agent Loop                                │
 │   • Deterministic Multi-Hop Risk Engine                                │
 │   • Evidence Tracker & Subgraph Serializer                             │
 └─────────────────┬───────────────────────────────────┬──────────────────┘
                   │                                   │
                   ▼                                   ▼
 ┌────────────────────────────────────┐ ┌─────────────────────────────────┐
 │       AGENT REASONING TOOLS        │ │         RISK SCORING            │
 │  • get_customer_profile            │ │  • Multi-Hop Overdue Ratios     │
 │  • get_payment_history             │ │  • Active Dispute Severity      │
 │  • find_connected_risk             │ │  • Contact Contagion Penalty    │
 │  • calculate_cash_flow_impact      │ │  • Memory Covenant Enforcement  │
 │  • get_previous_decisions          │ └─────────────────────────────────┘
 └─────────────────┬──────────────────┘
                   │
                   ▼ (Cypher via Redis Protocol on Port 6380)
 ┌────────────────────────────────────────────────────────────────────────┐
 │                      FALKORDB KNOWLEDGE GRAPH                          │
 │  Nodes: Customer, Order, Invoice, Payment, Dispute, Supplier, Product  │
 │         AgentDecision, AgentMemory, AgentTask                          │
 │  Edges: PLACED, HAS_INVOICE, PAID_BY, HAS_DISPUTE, SHARES_CONTACT     │
 │         BUYS_FROM, SUPPLIES, OWES, ABOUT, BASED_ON, FOR_CUSTOMER       │
 └────────────────────────────────────────────────────────────────────────┘
```

---

## The Graph Data Model

We modeled 10 distinct node labels and 12 relationship types to represent a commercial trade corridor:

- `(:Customer)` — SME trade buyers, contractors, and regional stores
- `(:Order)` — Purchase orders
- `(:Invoice)` — Commercial billings with calculated delinquency days
- `(:Payment)` — Historical settlements (wire transfers, mobile payments)
- `(:Dispute)` — Delivery, quality, and damaged goods disputes
- `(:Supplier)` & `(:Product)` — Upstream supply chain and inventory dependencies
- `(:AgentDecision)` — Persisted historical decisions, rationales, and confidence scores
- `(:AgentMemory)` — Semantic and episodic business owner directives (`POLICY`, `PREFERENCE`, `FACT`, `OUTCOME`)
- `(:AgentTask)` — Concrete operational tasks generated by the agent

### Key Cypher Traversal #1: Multi-Hop Invoice & Settlement Audit
```cypher
MATCH (c:Customer {name: $customer})-[:PLACED]->(:Order)-[:HAS_INVOICE]->(i:Invoice)
OPTIONAL MATCH (i)-[:PAID_BY]->(p:Payment)
OPTIONAL MATCH (i)-[:HAS_DISPUTE]->(d:Dispute)
RETURN c.name AS customer,
       i.invoice_number AS invoice,
       i.amount AS invoice_amount,
       i.due_date AS due_date,
       i.status AS invoice_status,
       i.days_overdue AS days_overdue,
       p.amount AS paid_amount,
       d.reason AS dispute_reason
ORDER BY i.due_date ASC
```

### Key Cypher Traversal #2: Contact-Sharing Entity Contagion Ring
This query uncovers the phoenix entity fraud pattern:
```cypher
MATCH (c:Customer {name: $customer})-[:SHARES_CONTACT]-(related:Customer)
OPTIONAL MATCH (related)-[:PLACED]->(:Order)-[:HAS_INVOICE]->(i:Invoice)
WHERE i.status = 'OVERDUE'
RETURN related.name AS connected_customer,
       c.phone AS shared_phone,
       c.email AS shared_email,
       c.address AS shared_address,
       count(i) AS overdue_count,
       sum(i.amount) AS overdue_amount
```

---

## Tackling Agent Amnesia with FalkorDB Cross-Session Memory

A critical flaw with LLM agents is session amnesia: when an SME owner closes the browser, the agent forgets every risk covenant discussed.

LedgerGraph solves this by persisting agent cognition directly into the graph:
- When a decision is generated, it creates an `(:AgentDecision)` node linked via `[:ABOUT]` to the customer and `[:BASED_ON]` to the specific evidence invoices and disputes.
- When an owner sets a rule (e.g., *"Owner directive: BrightMart shares an address with delinquent entity Metro Commercial. Require at least 30% advance deposit for orders above $10,000 until INV-103 dispute is cleared"*), the agent writes an `(:AgentMemory {memory_type: 'POLICY'})` node.
- Next time the owner asks: *"What did we decide about BrightMart last time?"*, the agent executes a Cypher memory query and summarizes the prior decision, confidence, active policies, and pending tasks.

---

## Key Learnings & Experience with FalkorDB

Working with FalkorDB during this hackathon delivered several key takeaways:

1. **Sub-Millisecond Graph Queries**: FalkorDB’s C-based GraphBLAS backend provided virtually instantaneous traversal execution times (<2ms), keeping the agent loop fast and responsive.
2. **Cypher Expressiveness**: Cypher’s pattern-matching syntax makes multi-hop credit risk chains and contact-sharing links intuitive to read, parameterize, and debug.
3. **Docker Port Flexibility**: On systems where default Redis (6379) is running, mapping FalkorDB to 6380 was seamless using the official Python client.
4. **100% Traceability & Anti-Hallucination**: By grounding every LLM synthesis in discrete FalkorDB node IDs and queries, business owners get a "glass-box" decision process they can actually trust with their capital.

---

## Conclusion

By pairing **FalkorDB's knowledge graph topology** with an autonomous AI reasoning loop, **LedgerGraph** empowers underbanked SME suppliers to underwrite credit safely, unmask fraud rings, and protect liquidity in developing economies without traditional credit bureaus.

Check out the project repository on GitHub and experience the graph-grounded future of agentic finance!
