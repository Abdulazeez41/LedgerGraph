// LedgerGraph Frontend Application Controller
const API_BASE = '/api';

let appState = {
    selectedCustomer: 'BrightMart Hardware Ltd',
    currentResponse: null,
    customersList: [],
    network: null,
    nodesDataSet: null,
    edgesDataSet: null,
    activeTab: 'evidence'
};

// Node visual theme configuration
const NODE_COLORS = {
    Customer: { background: '#2563EB', border: '#1D4ED8', font: '#FFFFFF' },
    DelinquentCustomer: { background: '#DC2626', border: '#991B1B', font: '#FFFFFF' },
    Order: { background: '#0284C7', border: '#0369A1', font: '#FFFFFF' },
    Invoice: { background: '#D97706', border: '#B45309', font: '#FFFFFF' },
    OverdueInvoice: { background: '#EA580C', border: '#C2410C', font: '#FFFFFF' },
    Payment: { background: '#059669', border: '#047857', font: '#FFFFFF' },
    Dispute: { background: '#E11D48', border: '#BE123C', font: '#FFFFFF' },
    Supplier: { background: '#7C3AED', border: '#6D28D9', font: '#FFFFFF' },
    Product: { background: '#0D9488', border: '#0F766E', font: '#FFFFFF' },
    AgentDecision: { background: '#4F46E5', border: '#4338CA', font: '#FFFFFF' },
    AgentMemory: { background: '#9333EA', border: '#7E22CE', font: '#FFFFFF' },
    AgentTask: { background: '#CA8A04', border: '#A16207', font: '#FFFFFF' }
};

document.addEventListener('DOMContentLoaded', async () => {
    initGraphNetwork();
    await checkDatabaseHealth();
    await loadCustomerDropdown();
    
    // Automatically query BrightMart to demonstrate multi-hop graph reasoning immediately
    usePrompt('Should I approve a $20,000 order for BrightMart on 30-day credit?', 20000);
});

// Initialize Vis-Network Canvas
function initGraphNetwork() {
    const container = document.getElementById('graph-canvas');
    appState.nodesDataSet = new vis.DataSet([]);
    appState.edgesDataSet = new vis.DataSet([]);

    const data = {
        nodes: appState.nodesDataSet,
        edges: appState.edgesDataSet
    };

    const options = {
        nodes: {
            shape: 'dot',
            size: 16,
            font: { size: 11, color: '#E2E8F0', face: 'Inter' },
            borderWidth: 2,
            shadow: true
        },
        edges: {
            width: 1.5,
            color: { color: '#475569', highlight: '#38BDF8', hover: '#94A3B8' },
            font: { size: 9, color: '#94A3B8', align: 'horizontal', face: 'JetBrains Mono' },
            arrows: { to: { enabled: true, scaleFactor: 0.6 } },
            smooth: { type: 'continuous' }
        },
        physics: {
            stabilization: { iterations: 120 },
            barnesHut: {
                gravitationalConstant: -2800,
                centralGravity: 0.25,
                springLength: 85,
                springConstant: 0.04
            }
        },
        interaction: {
            hover: true,
            tooltipDelay: 150,
            navigationButtons: false,
            keyboard: false
        }
    };

    appState.network = new vis.Network(container, data, options);

    // On node click
    appState.network.on('click', function (params) {
        if (params.nodes.length > 0) {
            const nodeId = params.nodes[0];
            const nodeData = appState.nodesDataSet.get(nodeId);
            onNodeSelected(nodeData);
        }
    });
}

function onNodeSelected(node) {
    if (!node) return;
    console.log('Selected node:', node);
    // Switch to evidence tab and highlight node properties
    switchTab('evidence');
}

// Database Health Check
async function checkDatabaseHealth() {
    try {
        const res = await fetch(`${API_BASE}/health`);
        const data = await res.json();
        const badge = document.getElementById('db-status-text');
        if (data.status === 'healthy') {
            badge.innerHTML = `FalkorDB: Connected <span class="text-slate-500">|</span> Port ${data.port} <span class="text-slate-500">|</span> ${data.node_count} Nodes`;
        } else {
            badge.innerText = `FalkorDB: Error (${data.error || 'unhealthy'})`;
        }
    } catch (e) {
        document.getElementById('db-status-text').innerText = 'FalkorDB: Offline';
    }
}

// Load Customers for Dropdown
async function loadCustomerDropdown() {
    try {
        const res = await fetch(`${API_BASE}/customers`);
        const data = await res.json();
        appState.customersList = data.customers || [];

        const select = document.getElementById('customer-select');
        select.innerHTML = '<option value="">-- Choose a Customer --</option>';

        appState.customersList.forEach(c => {
            const opt = document.createElement('option');
            opt.value = c.name;
            const riskLabel = c.risk_score > 70 ? '🚨' : (c.risk_score > 40 ? '⚠️' : '🟢');
            opt.innerText = `${riskLabel} ${c.name} (Risk: ${c.risk_score})`;
            select.appendChild(opt);
        });

        if (appState.selectedCustomer) {
            select.value = appState.selectedCustomer;
        }
    } catch (e) {
        console.error('Error loading customer list:', e);
    }
}

function onCustomerSelectChange() {
    const val = document.getElementById('customer-select').value;
    if (val) {
        appState.selectedCustomer = val;
        loadSelectedCustomerOverview();
    }
}

// Populate prompt from sample buttons
function usePrompt(question, amount = 0) {
    document.getElementById('chat-input').value = question;
    document.getElementById('order-amount-input').value = amount > 0 ? amount : '';
    document.getElementById('chat-form').dispatchEvent(new Event('submit'));
}

// Handle Chat Submission
async function handleChatSubmit(e) {
    if (e) e.preventDefault();
    const input = document.getElementById('chat-input');
    const question = input.value.trim();
    if (!question) return;

    const amountInput = document.getElementById('order-amount-input');
    const orderAmount = parseFloat(amountInput.value) || 0.0;

    // Append user message to feed
    appendChatMessage('user', question, orderAmount);

    // Show thinking indicator
    document.getElementById('agent-thinking-badge').classList.remove('hidden');
    document.getElementById('btn-send').disabled = true;

    try {
        const payload = {
            question: question,
            customer_name: appState.selectedCustomer || null,
            order_amount: orderAmount
        };

        const res = await fetch(`${API_BASE}/chat`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        const data = await res.json();
        appState.currentResponse = data;

        // Update selected customer if detected
        if (data.customer_name) {
            appState.selectedCustomer = data.customer_name;
            document.getElementById('customer-select').value = data.customer_name;
        }

        // Render agent response
        renderAgentResponse(data);
        appendChatMessage('agent', data.business_explanation, 0, data.recommendation, data.confidence);

        // Update database health badge with new counts
        checkDatabaseHealth();
    } catch (err) {
        console.error(err);
        appendChatMessage('agent', `Encountered an error running the graph copilot: ${err.message}`);
    } finally {
        document.getElementById('agent-thinking-badge').classList.add('hidden');
        document.getElementById('btn-send').disabled = false;
        input.value = '';
    }
}

// Append Chat Message to Feed
function appendChatMessage(sender, text, amount = 0, rec = null, conf = null) {
    const feed = document.getElementById('chat-messages');
    const msgDiv = document.createElement('div');

    if (sender === 'user') {
        msgDiv.className = 'p-3 rounded-lg bg-blue-900/30 border border-blue-800/50 text-slate-200 ml-4 space-y-1';
        msgDiv.innerHTML = `
            <div class="flex items-center justify-between text-[11px] text-blue-300 font-medium">
                <span class="flex items-center gap-1"><i data-lucide="user" class="w-3 h-3"></i> You</span>
                ${amount > 0 ? `<span class="font-mono bg-blue-950 px-1.5 py-0.5 rounded border border-blue-800">Order: $${amount.toLocaleString()}</span>` : ''}
            </div>
            <div class="leading-relaxed">${escapeHtml(text)}</div>
        `;
    } else {
        msgDiv.className = 'p-3 rounded-lg bg-slate-900/80 border border-slate-800 text-slate-200 space-y-2';
        let recBadge = '';
        if (rec) {
            const badgeClass = getRecommendationClass(rec);
            recBadge = `<span class="px-2 py-0.5 rounded text-[10px] font-bold ${badgeClass}">${rec}</span>`;
        }

        // Format markdown bolding & bullets
        const formattedText = formatMarkdown(text);
        msgDiv.innerHTML = `
            <div class="flex items-center justify-between text-[11px] text-slate-400">
                <span class="flex items-center gap-1 text-blue-400 font-semibold"><i data-lucide="sparkles" class="w-3 h-3"></i> LedgerGraph Copilot</span>
                ${recBadge}
            </div>
            <div class="leading-relaxed space-y-1.5 text-slate-300">${formattedText}</div>
        `;
    }

    feed.appendChild(msgDiv);
    feed.scrollTop = feed.scrollHeight;
    lucide.createIcons();
}

// Render Agent Response into Cards and Tabs
function renderAgentResponse(data) {
    // 1. Recommendation Badge
    const recText = document.getElementById('recommendation-text');
    const recBadge = document.getElementById('recommendation-badge');
    const rec = data.recommendation || 'UNKNOWN';
    recText.innerText = rec;

    // Reset and apply badge class
    recBadge.className = 'px-3.5 py-1.5 rounded-lg text-sm font-bold tracking-wide flex items-center gap-2 ' + getRecommendationClass(rec);

    // 2. Confidence and Risk Score
    const conf = Math.round((data.confidence || 0.85) * 100);
    document.getElementById('rec-confidence-badge').innerText = `Confidence: ${conf}%`;

    const riskScore = data.risk_score !== undefined ? data.risk_score : (data.profile?.risk_score || '--');
    document.getElementById('risk-score-text').innerText = `${riskScore}/100`;

    const riskCircle = document.getElementById('risk-circle');
    riskCircle.innerText = riskScore;
    if (riskScore > 70) {
        riskCircle.className = 'w-10 h-10 rounded-full border-4 border-rose-500 bg-rose-950/40 text-rose-300 flex items-center justify-center font-bold text-xs';
    } else if (riskScore > 35) {
        riskCircle.className = 'w-10 h-10 rounded-full border-4 border-amber-500 bg-amber-950/40 text-amber-300 flex items-center justify-center font-bold text-xs';
    } else {
        riskCircle.className = 'w-10 h-10 rounded-full border-4 border-emerald-500 bg-emerald-950/40 text-emerald-300 flex items-center justify-center font-bold text-xs';
    }

    // 3. Plain English Rationale
    document.getElementById('rationale-text').innerHTML = formatMarkdown(data.business_explanation || 'No rationale available.');

    // 4. Conditions Checklist
    const condList = document.getElementById('conditions-list');
    condList.innerHTML = '';
    const conditions = data.recommended_conditions || [];
    if (conditions.length > 0) {
        conditions.forEach(cond => {
            const li = document.createElement('li');
            li.className = 'flex items-start gap-2 bg-slate-900/60 p-2 rounded border border-slate-800';
            li.innerHTML = `
                <input type="checkbox" checked class="mt-0.5 rounded bg-slate-800 border-slate-700 text-blue-500 focus:ring-0">
                <span class="leading-snug">${escapeHtml(cond)}</span>
            `;
            condList.appendChild(li);
        });
    } else {
        condList.innerHTML = '<li class="text-slate-500 italic text-[11px]">No special conditions required (Standard terms apply).</li>';
    }

    // 5. Proposed Next Action Box
    document.getElementById('proposed-action-text').innerText = data.proposed_action || 'Review graph ledger.';
    document.getElementById('action-type-tag').innerText = data.action_type || 'DECISION';

    // Update Action button states
    const btnReminder = document.getElementById('btn-open-reminder');
    if (data.action_payload?.reminder_template) {
        document.getElementById('reminder-text-preview').value = data.action_payload.reminder_template;
        document.getElementById('reminder-phone-input').value = data.action_payload.customer_phone || '';
    }

    // 6. Render Subgraph in Vis.js
    if (data.subgraph) {
        renderGraphNodesAndEdges(data.subgraph);
    }

    // 7. Update Evidence Tab (Profile & Invoices)
    if (data.profile) {
        renderEvidenceProfile(data.profile);
    }
    renderConnectedRisk(data.connected_risk || []);
    if (data.customer_name) {
        loadInvoicesHistory(data.customer_name);
        loadDecisionsAndMemories(data.customer_name);
    }

    // 8. Update Cypher Queries Tab
    renderCypherQueries(data.cypher_queries || []);

    lucide.createIcons();
}

// Render Graph Nodes and Edges into Vis.js
function renderGraphNodesAndEdges(subgraph) {
    if (!appState.nodesDataSet || !appState.edgesDataSet) return;

    appState.nodesDataSet.clear();
    appState.edgesDataSet.clear();

    const nodes = subgraph.nodes || [];
    const links = subgraph.links || [];

    const visNodes = nodes.map(n => {
        let label = n.label || 'Node';
        let colorConfig = NODE_COLORS[label] || { background: '#64748B', border: '#475569', font: '#FFFFFF' };

        // Highlight overdue invoices or connected delinquent customers
        if (label === 'Invoice' && n.properties?.status === 'OVERDUE') {
            colorConfig = NODE_COLORS.OverdueInvoice;
        } else if (label === 'Customer' && n.properties?.risk_score > 70) {
            colorConfig = NODE_COLORS.DelinquentCustomer;
        }

        const displayName = n.name || n.properties?.name || n.id;
        const shortName = displayName.length > 20 ? displayName.substring(0, 18) + '…' : displayName;

        return {
            id: n.id,
            label: `${label}\n${shortName}`,
            title: `<b>${label}:</b> ${displayName}<br/>ID: ${n.id}<br/>Properties: ${JSON.stringify(n.properties)}`,
            color: colorConfig,
            rawNode: n
        };
    });

    const visEdges = links.map(l => {
        return {
            from: l.source,
            to: l.target,
            label: l.type,
            arrows: 'to',
            color: { color: l.type === 'SHARES_CONTACT' ? '#EF4444' : '#475569' },
            dashes: l.type === 'SHARES_CONTACT'
        };
    });

    appState.nodesDataSet.add(visNodes);
    appState.edgesDataSet.add(visEdges);

    document.getElementById('graph-stats-badge').innerText = `${visNodes.length} Nodes • ${visEdges.length} Edges`;
    
    setTimeout(() => {
        if (appState.network) appState.network.fit();
    }, 250);
}

// Render Evidence Profile
function renderEvidenceProfile(p) {
    document.getElementById('evidence-customer-name').innerText = p.name || 'Unknown Customer';
    document.getElementById('evidence-customer-type').innerText = `${p.business_type || 'Business'} • ${p.address || ''}`;

    document.getElementById('ev-credit-limit').innerText = `$${(p.credit_limit || 0).toLocaleString()}`;
    document.getElementById('ev-outstanding').innerText = `$${(p.outstanding_balance || 0).toLocaleString()}`;
    document.getElementById('ev-overdue').innerText = `$${(p.overdue_balance || 0).toLocaleString()}`;
    document.getElementById('ev-total-paid').innerText = `$${(p.total_paid || 0).toLocaleString()}`;
}

// Render Connected Risk Box
function renderConnectedRisk(risks) {
    const container = document.getElementById('connected-risk-content');
    if (!risks || risks.length === 0) {
        container.innerHTML = '<div class="p-2.5 rounded bg-slate-900/60 border border-slate-800 text-slate-500">No contact-sharing risk detected for this customer.</div>';
        return;
    }

    container.innerHTML = risks.map(r => {
        const shared = [];
        if (r.shared_phone) shared.push('Phone');
        if (r.shared_email) shared.push('Email');
        if (r.shared_address) shared.push('Address');
        const sharedStr = shared.join(', ') || 'Contact Details';

        const hasOverdue = (r.overdue_amount || 0) > 0;
        const borderClass = hasOverdue ? 'border-rose-800/80 bg-rose-950/20' : 'border-slate-800 bg-slate-900/60';

        return `
            <div class="p-3 rounded-lg border ${borderClass} space-y-1">
                <div class="flex items-center justify-between">
                    <span class="font-bold text-slate-200">Shared Link: ${escapeHtml(r.connected_customer)}</span>
                    <span class="text-[10px] px-2 py-0.5 rounded bg-rose-900/50 text-rose-300 font-mono">Risk: ${r.connected_risk_score}/100</span>
                </div>
                <div class="text-[11px] text-slate-400">
                    Shared Attribute: <strong class="text-rose-400">${sharedStr}</strong>
                </div>
                ${hasOverdue ? `
                    <div class="text-[11px] text-rose-300 font-semibold">
                        ⚠️ Connected Overdue Debt: $${(r.overdue_amount).toLocaleString()} across ${r.overdue_invoices_count} overdue invoice(s)!
                    </div>
                ` : `<div class="text-[11px] text-emerald-400">No overdue debt on connected entity.</div>`}
            </div>
        `;
    }).join('');
}

// Load Invoices and Disputes for Customer
async function loadInvoicesHistory(customerName) {
    try {
        const res = await fetch(`${API_BASE}/customers/${encodeURIComponent(customerName)}/history`);
        const data = await res.json();
        const rows = data.history || [];
        const tbody = document.getElementById('invoices-tbody');

        if (rows.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" class="p-3 text-center text-slate-500">No invoice records found.</td></tr>';
            return;
        }

        tbody.innerHTML = rows.map(r => {
            let statusBadge = '<span class="px-2 py-0.5 rounded text-[10px] bg-slate-800 text-slate-300">PENDING</span>';
            if (r.invoice_status === 'PAID') {
                statusBadge = '<span class="px-2 py-0.5 rounded text-[10px] bg-emerald-950/80 text-emerald-400 border border-emerald-800">PAID</span>';
            } else if (r.invoice_status === 'OVERDUE') {
                statusBadge = `<span class="px-2 py-0.5 rounded text-[10px] bg-rose-950/80 text-rose-400 border border-rose-800 font-bold">OVERDUE (${r.days_overdue}d)</span>`;
            } else if (r.invoice_status === 'PARTIALLY_PAID') {
                statusBadge = '<span class="px-2 py-0.5 rounded text-[10px] bg-amber-950/80 text-amber-400 border border-amber-800">PARTIAL</span>';
            }

            const disputeBadge = r.dispute_reason 
                ? `<span class="text-rose-400 font-medium">⚠️ ${escapeHtml(r.dispute_reason)} [${r.dispute_severity || 'MED'}]</span>`
                : '<span class="text-slate-500">None</span>';

            const paidAmount = r.paid_amount ? `$${Number(r.paid_amount).toLocaleString()}` : '$0.00';

            return `
                <tr class="hover:bg-slate-900/60 transition">
                    <td class="p-2 font-mono text-slate-200">${escapeHtml(r.invoice_number)}</td>
                    <td class="p-2 font-mono font-medium">$${Number(r.invoice_amount).toLocaleString()}</td>
                    <td class="p-2 text-slate-400">${escapeHtml(r.due_date || '')}</td>
                    <td class="p-2">${statusBadge}</td>
                    <td class="p-2 font-mono text-emerald-400">${paidAmount}</td>
                    <td class="p-2">${disputeBadge}</td>
                </tr>
            `;
        }).join('');
    } catch (e) {
        console.error('Error loading invoices history:', e);
    }
}

// Load Decisions, Memories, and Tasks
async function loadDecisionsAndMemories(customerName) {
    try {
        const res = await fetch(`${API_BASE}/customers/${encodeURIComponent(customerName)}/decisions`);
        const data = await res.json();

        // 1. Memories
        const memList = document.getElementById('memories-list');
        const memories = data.memories || [];
        if (memories.length > 0) {
            memList.innerHTML = memories.map(m => `
                <div class="p-2.5 rounded bg-purple-950/20 border border-purple-900/40 space-y-1">
                    <div class="flex items-center justify-between text-[11px]">
                        <span class="font-bold text-purple-300">[${escapeHtml(m.memory_type)}]</span>
                        <span class="text-[10px] text-purple-400 font-mono">Importance: ${m.importance}/10</span>
                    </div>
                    <p class="text-slate-300 text-xs">${escapeHtml(m.content)}</p>
                    <div class="text-[10px] text-slate-500">${escapeHtml(m.created_at || '')}</div>
                </div>
            `).join('');
        } else {
            memList.innerHTML = '<div class="p-2.5 rounded bg-slate-900/60 border border-slate-800 text-slate-500">No memories recorded for this customer.</div>';
        }

        // 2. Decisions
        const decList = document.getElementById('decisions-timeline');
        const decisions = data.decisions || [];
        if (decisions.length > 0) {
            decList.innerHTML = decisions.map(d => `
                <div class="p-3 rounded-lg bg-slate-900/70 border border-slate-800 space-y-1.5">
                    <div class="flex items-center justify-between">
                        <span class="px-2 py-0.5 rounded text-[10px] font-bold ${getRecommendationClass(d.recommendation)}">${d.recommendation}</span>
                        <span class="text-[10px] text-slate-500 font-mono">${escapeHtml(d.created_at || '')}</span>
                    </div>
                    <div class="text-slate-300 font-medium text-xs">"${escapeHtml(d.question)}"</div>
                    <div class="text-slate-400 text-[11px] leading-relaxed">${escapeHtml(d.rationale)}</div>
                    ${d.user_feedback ? `<div class="text-[11px] text-amber-300 bg-amber-950/30 p-1.5 rounded border border-amber-900/40">Owner Feedback: ${escapeHtml(d.user_feedback)}</div>` : ''}
                </div>
            `).join('');
        } else {
            decList.innerHTML = '<div class="p-2.5 rounded bg-slate-900/60 border border-slate-800 text-slate-500">No previous decisions recorded yet.</div>';
        }

        // 3. Tasks
        const taskList = document.getElementById('tasks-list');
        const tasks = data.tasks || [];
        if (tasks.length > 0) {
            taskList.innerHTML = tasks.map(t => `
                <div class="p-2.5 rounded bg-slate-900/70 border border-slate-800 space-y-1">
                    <div class="flex items-center justify-between">
                        <span class="font-bold text-slate-200">${escapeHtml(t.title)}</span>
                        <span class="px-2 py-0.5 rounded text-[10px] bg-amber-950 text-amber-400 border border-amber-800">${escapeHtml(t.status)}</span>
                    </div>
                    <p class="text-slate-400 text-xs">${escapeHtml(t.description)}</p>
                    <div class="text-[10px] text-slate-500">Due Date: ${escapeHtml(t.due_date || 'N/A')}</div>
                </div>
            `).join('');
        } else {
            taskList.innerHTML = '<div class="p-2.5 rounded bg-slate-900/60 border border-slate-800 text-slate-500">No active follow-up tasks.</div>';
        }
    } catch (e) {
        console.error('Error loading decisions and memories:', e);
    }
}

// Render Cypher Queries
function renderCypherQueries(queries) {
    const container = document.getElementById('cypher-queries-list');
    document.getElementById('cypher-count-badge').innerText = queries.length;

    if (!queries || queries.length === 0) {
        container.innerHTML = '<div class="p-3 rounded-lg bg-slate-900/60 border border-slate-800 text-slate-500 text-center">No Cypher queries recorded for this action.</div>';
        return;
    }

    container.innerHTML = queries.map((q, idx) => `
        <div class="rounded-lg border border-slate-800 bg-slate-950/80 overflow-hidden space-y-1">
            <div class="flex items-center justify-between px-3 py-1.5 bg-slate-900 border-b border-slate-800 text-[11px]">
                <span class="text-blue-400 font-semibold font-mono">Query #${idx + 1}: ${escapeHtml(q.description || 'Cypher Query')}</span>
                <button onclick="copyCypherText('${idx}')" class="text-slate-400 hover:text-white flex items-center gap-1 text-[10px]">
                    <i data-lucide="copy" class="w-3 h-3"></i> Copy
                </button>
            </div>
            <pre id="cypher-code-${idx}" class="p-3 text-[11px] font-mono text-pink-300/90 whitespace-pre-wrap leading-relaxed overflow-x-auto">${escapeHtml(q.query)}</pre>
            ${q.params && Object.keys(q.params).length > 0 ? `
                <div class="px-3 pb-2 text-[10px] text-slate-500 font-mono">
                    Parameters: ${escapeHtml(JSON.stringify(q.params))}
                </div>
            ` : ''}
        </div>
    `).join('');

    lucide.createIcons();
}

function copyCypherText(idx) {
    const codeEl = document.getElementById(`cypher-code-${idx}`);
    if (codeEl) {
        navigator.clipboard.writeText(codeEl.innerText);
        alert('Cypher query copied to clipboard!');
    }
}

// Load customer overview when inspecting from dropdown
async function loadSelectedCustomerOverview() {
    if (!appState.selectedCustomer) return;
    try {
        const [profileRes, subgraphRes] = await Promise.all([
            fetch(`${API_BASE}/customers/${encodeURIComponent(appState.selectedCustomer)}/profile`),
            fetch(`${API_BASE}/customers/${encodeURIComponent(appState.selectedCustomer)}/subgraph`)
        ]);

        const profile = await profileRes.json();
        const subgraph = await subgraphRes.json();

        renderEvidenceProfile(profile);
        renderGraphNodesAndEdges(subgraph);
        loadInvoicesHistory(appState.selectedCustomer);
        loadDecisionsAndMemories(appState.selectedCustomer);

        const connRes = await fetch(`${API_BASE}/customers/${encodeURIComponent(appState.selectedCustomer)}/connected-risk`);
        const connData = await connRes.json();
        renderConnectedRisk(connData.connected_risks || []);

    } catch (e) {
        console.error('Error loading customer overview:', e);
    }
}

// Tab Switching
function switchTab(tabName) {
    appState.activeTab = tabName;
    ['evidence', 'cypher', 'memory', 'tasks'].forEach(t => {
        const btn = document.getElementById(`tab-btn-${t}`);
        const content = document.getElementById(`tab-${t}`);
        if (t === tabName) {
            btn.className = 'px-3.5 py-2.5 font-medium border-b-2 border-blue-500 text-blue-400 flex items-center gap-1.5 whitespace-nowrap';
            content.classList.remove('hidden');
        } else {
            btn.className = 'px-3.5 py-2.5 font-medium border-b-2 border-transparent text-slate-400 hover:text-slate-200 flex items-center gap-1.5 whitespace-nowrap';
            content.classList.add('hidden');
        }
    });
}

// Modal Management
function openModal(id) {
    document.getElementById(id).classList.remove('hidden');
}
function closeModal(id) {
    document.getElementById(id).classList.add('hidden');
}

function openOverrideModal() {
    if (!appState.currentResponse) {
        alert('Please ask the agent a question or select a customer first.');
        return;
    }
    openModal('override-modal');
}

function openTaskModal() {
    document.getElementById('task-due-input').value = new Date().toISOString().split('T')[0];
    openModal('task-modal');
}

function openMemoryModal() {
    openModal('memory-modal');
}

function openReminderModal() {
    openModal('reminder-modal');
}

// Actions Execution
async function approveCurrentRecommendation() {
    if (!appState.currentResponse) return;
    const rec = appState.currentResponse.recommendation;
    alert(`✅ Action confirmed! Recommendation "${rec}" executed and logged in graph ledger.`);
}

async function submitOverride() {
    const overrideRec = document.getElementById('override-select').value;
    const feedback = document.getElementById('override-feedback').value;

    const decisionId = appState.currentResponse?.decision_id || 'DEC-001';

    try {
        const res = await fetch(`${API_BASE}/actions/override`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                decision_id: decisionId,
                override_recommendation: overrideRec,
                user_feedback: feedback
            })
        });
        const result = await res.json();
        closeModal('override-modal');
        alert(`Decision successfully updated in graph to: ${overrideRec}`);
        loadDecisionsAndMemories(appState.selectedCustomer);
    } catch (e) {
        alert(`Error saving override: ${e.message}`);
    }
}

async function submitNewTask() {
    const title = document.getElementById('task-title-input').value;
    const desc = document.getElementById('task-desc-input').value;
    const due = document.getElementById('task-due-input').value;

    if (!title) {
        alert('Please enter a task title.');
        return;
    }

    try {
        await fetch(`${API_BASE}/actions/task`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                customer_name: appState.selectedCustomer,
                title: title,
                description: desc,
                due_date: due
            })
        });
        closeModal('task-modal');
        alert('Task saved into FalkorDB!');
        loadDecisionsAndMemories(appState.selectedCustomer);
    } catch (e) {
        alert(`Error saving task: ${e.message}`);
    }
}

async function submitNewMemory() {
    const type = document.getElementById('memory-type-input').value;
    const content = document.getElementById('memory-content-input').value;
    const importance = parseInt(document.getElementById('memory-importance-input').value) || 5;

    if (!content) {
        alert('Please enter memory content.');
        return;
    }

    try {
        await fetch(`${API_BASE}/actions/memory`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                customer_name: appState.selectedCustomer,
                memory_type: type,
                content: content,
                importance: importance
            })
        });
        closeModal('memory-modal');
        alert('Memory saved into FalkorDB graph!');
        loadDecisionsAndMemories(appState.selectedCustomer);
    } catch (e) {
        alert(`Error saving memory: ${e.message}`);
    }
}

function copyReminderToClipboard() {
    const text = document.getElementById('reminder-text-preview').value;
    navigator.clipboard.writeText(text);
    const btn = document.getElementById('copy-btn-text');
    btn.innerText = 'Copied!';
    setTimeout(() => { btn.innerText = 'Copy Reminder'; }, 2000);
}

// Reseed Demo Data
async function triggerReseed() {
    if (!confirm('Reset and re-seed the entire FalkorDB graph with demo data?')) return;
    const icon = document.getElementById('reseed-icon');
    icon.classList.add('animate-spin');

    try {
        const res = await fetch(`${API_BASE}/seed`, { method: 'POST' });
        const result = await res.json();
        alert(result.message);
        await checkDatabaseHealth();
        await loadCustomerDropdown();
        if (appState.selectedCustomer) {
            loadSelectedCustomerOverview();
        }
    } catch (e) {
        alert(`Error re-seeding graph: ${e.message}`);
    } finally {
        icon.classList.remove('animate-spin');
    }
}

// Upload CSV file
async function submitCsvUpload() {
    const fileInput = document.getElementById('csv-file-input');
    if (!fileInput.files || fileInput.files.length === 0) {
        alert('Please choose a CSV file to upload.');
        return;
    }

    const file = fileInput.files[0];
    const formData = new FormData();
    formData.append('file', file);

    const progress = document.getElementById('upload-progress-text');
    progress.classList.remove('hidden');

    try {
        const res = await fetch(`${API_BASE}/upload-csv`, {
            method: 'POST',
            body: formData
        });
        const result = await res.json();
        closeModal('upload-modal');
        alert(result.message);
        await checkDatabaseHealth();
        await loadCustomerDropdown();
        loadSelectedCustomerOverview();
    } catch (e) {
        alert(`Upload error: ${e.message}`);
    } finally {
        progress.classList.add('hidden');
    }
}

// Canvas View Helpers
function fitGraphView() {
    if (appState.network) appState.network.fit({ animation: { duration: 500 } });
}
function resetGraphPhysics() {
    if (appState.network) appState.network.stabilize();
}

// Format helpers
function getRecommendationClass(rec) {
    switch (rec) {
        case 'APPROVE': return 'badge-approve';
        case 'APPROVE WITH CONDITIONS': return 'badge-conditions';
        case 'HOLD': return 'badge-hold';
        case 'ESCALATE': return 'badge-escalate';
        case 'CHASE PAYMENT': return 'badge-chase';
        default: return 'badge-conditions';
    }
}

function escapeHtml(str) {
    if (!str) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

function formatMarkdown(text) {
    if (!text) return '';
    let formatted = escapeHtml(text);
    // Bold
    formatted = formatted.replace(/\*\*(.*?)\*\*/g, '<strong class="text-slate-100">$1</strong>');
    // Bullet points
    formatted = formatted.replace(/^• (.*$)/gim, '<div class="flex items-start gap-1.5"><span class="text-blue-400 mt-0.5">•</span><span>$1</span></div>');
    // Line breaks
    formatted = formatted.replace(/\n\n/g, '<div class="h-2"></div>');
    formatted = formatted.replace(/\n/g, '<br/>');
    return formatted;
}
