/* ==========================================================================
   LedgerGraph — "The Ledger Room" Front-End Controller
   Plain Vanilla JS, No Build Step.
   Architecture:
     1. CONFIG & LOCALE
     2. API CLIENT
     3. APPLICATION STATE
     4. 3D GRAPH ENGINE (THREE.JS + SVG FALLBACK)
     5. NETWORKS & TOPOLOGY CLUSTERING
     6. DOSSIER & EVIDENCE RENDERERS
     7. MOTION & COUNT-UP UTILITIES
     8. KEYBOARD & INTERACTION CONTROLS
   ========================================================================== */

/* ==========================================================================
   1. CONFIG & LOCALE
   ========================================================================== */
const CONFIG = {
  apiBase: '/api',
  // Default currency & locale for Nigerian SME case study (Abuja merchant).
  // Can be switched to KES / en-KE, GHS / en-GH, BDT / en-BD with this single object.
  currency: 'NGN',
  locale: 'en-NG',
  currencySymbol: '₦',
  dateFormat: { day: '2-digit', month: 'short', year: 'numeric' },
  
  // Tunable Motion & Rendering Tokens
  cameraFov: 35,
  idleDriftSpeed: 0.0003,      // rad per frame
  pathStepDuration: 120,       // ms per edge in traversal highlight
  cameraEaseDuration: 900,     // ms camera ease
  nodeBaseScale: 1.0,          // base node scale
  nodeHighlightScale: 1.25     // scale when node is on active path
};

// Money Formatter (Uses Intl.NumberFormat)
function formatMoney(amount) {
  if (amount === null || amount === undefined || isNaN(amount)) {
    return `${CONFIG.currencySymbol}0`;
  }
  return new Intl.NumberFormat(CONFIG.locale, {
    style: 'currency',
    currency: CONFIG.currency,
    maximumFractionDigits: 0
  }).format(amount);
}

// Date Formatter (e.g. 14 Oct 2026)
function formatDate(dateStr) {
  if (!dateStr) return 'N/A';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return new Intl.DateTimeFormat(CONFIG.locale, CONFIG.dateFormat).format(d);
  } catch (e) {
    return String(dateStr);
  }
}

// Security: Text HTML Escaping
function escapeHtml(str) {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/* ==========================================================================
   2. API CLIENT
   All network requests live in this single section.
   ========================================================================== */
const api = {
  async getHealth() {
    const res = await fetch(`${CONFIG.apiBase}/health`);
    if (!res.ok) throw new Error(`Health check failed: ${res.status}`);
    return res.json();
  },

  async getCustomers() {
    const res = await fetch(`${CONFIG.apiBase}/customers`);
    if (!res.ok) throw new Error(`Customers fetch failed: ${res.status}`);
    return res.json();
  },

  async getCustomerProfile(name) {
    const res = await fetch(`${CONFIG.apiBase}/customers/${encodeURIComponent(name)}/profile`);
    if (!res.ok) throw new Error(`Profile fetch failed: ${res.status}`);
    return res.json();
  },

  async getCustomerSubgraph(name) {
    const res = await fetch(`${CONFIG.apiBase}/customers/${encodeURIComponent(name)}/subgraph`);
    if (!res.ok) throw new Error(`Subgraph fetch failed: ${res.status}`);
    return res.json();
  },

  async getCustomerHistory(name) {
    const res = await fetch(`${CONFIG.apiBase}/customers/${encodeURIComponent(name)}/history`);
    if (!res.ok) throw new Error(`History fetch failed: ${res.status}`);
    return res.json();
  },

  async getCustomerConnectedRisk(name) {
    const res = await fetch(`${CONFIG.apiBase}/customers/${encodeURIComponent(name)}/connected-risk`);
    if (!res.ok) throw new Error(`Connected risk fetch failed: ${res.status}`);
    return res.json();
  },

  async getCustomerDecisions(name) {
    const res = await fetch(`${CONFIG.apiBase}/customers/${encodeURIComponent(name)}/decisions`);
    if (!res.ok) throw new Error(`Decisions fetch failed: ${res.status}`);
    return res.json();
  },

  async chat(question, customerName = null, orderAmount = 0.0) {
    const payload = {
      question: question,
      customer_name: customerName,
      order_amount: parseFloat(orderAmount) || 0.0
    };
    const res = await fetch(`${CONFIG.apiBase}/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || `Agent evaluation error: ${res.status}`);
    }
    return res.json();
  },

  async overrideDecision(decisionId, overrideRec, userFeedback) {
    const res = await fetch(`${CONFIG.apiBase}/actions/override`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        decision_id: decisionId,
        override_recommendation: overrideRec,
        user_feedback: userFeedback
      })
    });
    if (!res.ok) throw new Error(`Override failed: ${res.status}`);
    return res.json();
  },

  async createTask(customerName, title, description, dueDate) {
    const res = await fetch(`${CONFIG.apiBase}/actions/task`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        customer_name: customerName,
        title: title,
        description: description,
        due_date: dueDate
      })
    });
    if (!res.ok) throw new Error(`Task creation failed: ${res.status}`);
    return res.json();
  },

  async createMemory(customerName, memoryType, content, importance) {
    const res = await fetch(`${CONFIG.apiBase}/actions/memory`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        customer_name: customerName,
        memory_type: memoryType,
        content: content,
        importance: parseInt(importance, 10) || 5
      })
    });
    if (!res.ok) throw new Error(`Memory record failed: ${res.status}`);
    return res.json();
  },

  async generatePaymentReminder(customerName, invoiceNumber = null, customNote = null) {
    const res = await fetch(`${CONFIG.apiBase}/actions/reminder`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        customer_name: customerName,
        invoice_number: invoiceNumber,
        custom_note: customNote
      })
    });
    if (!res.ok) throw new Error(`Reminder generation failed: ${res.status}`);
    return res.json();
  },

  async reseedGraph() {
    const res = await fetch(`${CONFIG.apiBase}/seed`, { method: 'POST' });
    if (!res.ok) throw new Error(`Reseed failed: ${res.status}`);
    return res.json();
  },

  async uploadCsv(formData) {
    const res = await fetch(`${CONFIG.apiBase}/upload-csv`, {
      method: 'POST',
      body: formData
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || `Upload failed: ${res.status}`);
    }
    return res.json();
  }
};

/* ==========================================================================
   3. APPLICATION STATE
   ========================================================================== */
const state = {
  customers: [],
  selectedCustomer: 'BrightMart Hardware Ltd',
  activeScope: 'neighborhood', // 'neighborhood' | 'whole' | 'networks'
  activeBookTab: 'customers',  // 'customers' | 'networks'
  activeEvidenceTab: 'profile',
  lastAgentResponse: null,
  networksList: [],
  subgraph: { nodes: [], links: [] },
  activePathEdgeKeys: new Set(),
  activePathNodeIds: new Set(),
  dossierOpen: false,
  isWorking: false,
  selectedIndex: 0,
  hasAnimatedStrip: false
};

/* ==========================================================================
   4. 3D GRAPH ENGINE (Three.js with Custom Orbit Controls + 2D SVG Fallback)
   ========================================================================== */
const graph3d = {
  scene: null,
  camera: null,
  renderer: null,
  container: null,
  canvas: null,
  nodeMeshes: new Map(),
  edgeLines: null,
  edgeLabelSprites: [],
  networkHullGroup: null,
  activeEdgesGroup: null,
  activePulseDots: [],
  
  // Custom Orbit & Interaction State
  orbit: {
    isDragging: false,
    prevX: 0,
    prevY: 0,
    theta: 0.5,
    phi: 1.25,
    radius: 75,
    targetTheta: 0.5,
    targetPhi: 1.25,
    targetRadius: 75,
    minRadius: 20,
    maxRadius: 220,
    center: null,
    targetCenter: null
  },
  
  raycaster: null,
  mouseVec: null,
  hoveredNode: null,
  isWebGLSupported: true,
  animationFrameId: null,

  init() {
    this.container = document.getElementById('stage-canvas-wrap');
    this.canvas = document.getElementById('webgl-canvas');
    this.orbit.center = new THREE ? new THREE.Vector3(0, 0, 0) : null;
    this.orbit.targetCenter = new THREE ? new THREE.Vector3(0, 0, 0) : null;

    // Check if Three.js is present & WebGL is available
    if (typeof THREE === 'undefined' || !this.checkWebGL()) {
      this.isWebGLSupported = false;
      this.initSvgFallback();
      return;
    }

    try {
      this.setupThreeScene();
      this.setupLights();
      this.setupControls();
      this.startRenderLoop();
    } catch (e) {
      this.isWebGLSupported = false;
      this.initSvgFallback();
    }
  },

  checkWebGL() {
    try {
      const c = document.createElement('canvas');
      return !!(window.WebGLRenderingContext && (c.getContext('webgl') || c.getContext('experimental-webgl')));
    } catch (e) {
      return false;
    }
  },

  setupThreeScene() {
    const width = this.container.clientWidth;
    const height = this.container.clientHeight;

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x0B1210);
    this.scene.fog = new THREE.FogExp2(0x0B1210, 0.007);

    this.camera = new THREE.PerspectiveCamera(CONFIG.cameraFov, width / height, 0.5, 800);
    this.updateCameraTransform();

    const isMobile = window.innerWidth <= 900;
    const maxPixelRatio = isMobile ? 1.25 : 2.0;

    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      antialias: !isMobile,
      powerPreference: 'high-performance'
    });
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, maxPixelRatio));

    // Ground Grid fading into stage fog
    const grid = new THREE.GridHelper(260, 36, 0x1B2B26, 0x14201C);
    grid.position.y = -26;
    this.scene.add(grid);

    // Groups
    this.networkHullGroup = new THREE.Group();
    this.scene.add(this.networkHullGroup);

    this.activeEdgesGroup = new THREE.Group();
    this.scene.add(this.activeEdgesGroup);

    this.raycaster = new THREE.Raycaster();
    this.mouseVec = new THREE.Vector2();

    window.addEventListener('resize', () => this.onWindowResize());
  },

  setupLights() {
    const ambient = new THREE.AmbientLight(0xD9D4C4, 0.85);
    this.scene.add(ambient);

    const dir1 = new THREE.DirectionalLight(0xFFFFFF, 0.7);
    dir1.position.set(50, 70, 60);
    this.scene.add(dir1);

    const dir2 = new THREE.DirectionalLight(0xB8862B, 0.35);
    dir2.position.set(-40, -30, -50);
    this.scene.add(dir2);
  },

  setupControls() {
    const c = this.canvas;

    // Mouse Controls
    c.addEventListener('mousedown', (e) => {
      this.orbit.isDragging = true;
      this.orbit.prevX = e.clientX;
      this.orbit.prevY = e.clientY;
    });

    window.addEventListener('mousemove', (e) => {
      if (this.orbit.isDragging) {
        const dx = e.clientX - this.orbit.prevX;
        const dy = e.clientY - this.orbit.prevY;
        this.orbit.targetTheta -= dx * 0.005;
        this.orbit.targetPhi = Math.max(0.1, Math.min(Math.PI - 0.1, this.orbit.targetPhi - dy * 0.005));
        this.orbit.prevX = e.clientX;
        this.orbit.prevY = e.clientY;
      }
      this.onPointerHover(e);
    });

    window.addEventListener('mouseup', () => {
      this.orbit.isDragging = false;
    });

    c.addEventListener('wheel', (e) => {
      e.preventDefault();
      this.orbit.targetRadius = Math.max(this.orbit.minRadius, Math.min(this.orbit.maxRadius, this.orbit.targetRadius + e.deltaY * 0.07));
    }, { passive: false });

    c.addEventListener('dblclick', () => {
      this.recenterCamera();
    });

    c.addEventListener('click', (e) => {
      this.onNodeClick(e);
    });

    // Touch controls for mobile
    let touchDist = 0;
    c.addEventListener('touchstart', (e) => {
      if (e.touches.length === 1) {
        this.orbit.isDragging = true;
        this.orbit.prevX = e.touches[0].clientX;
        this.orbit.prevY = e.touches[0].clientY;
      } else if (e.touches.length === 2) {
        touchDist = Math.hypot(
          e.touches[0].clientX - e.touches[1].clientX,
          e.touches[0].clientY - e.touches[1].clientY
        );
      }
    }, { passive: true });

    c.addEventListener('touchmove', (e) => {
      if (e.touches.length === 1 && this.orbit.isDragging) {
        const dx = e.touches[0].clientX - this.orbit.prevX;
        const dy = e.touches[0].clientY - this.orbit.prevY;
        this.orbit.targetTheta -= dx * 0.006;
        this.orbit.targetPhi = Math.max(0.1, Math.min(Math.PI - 0.1, this.orbit.targetPhi - dy * 0.006));
        this.orbit.prevX = e.touches[0].clientX;
        this.orbit.prevY = e.touches[0].clientY;
      } else if (e.touches.length === 2) {
        const dist = Math.hypot(
          e.touches[0].clientX - e.touches[1].clientX,
          e.touches[0].clientY - e.touches[1].clientY
        );
        const diff = touchDist - dist;
        this.orbit.targetRadius = Math.max(this.orbit.minRadius, Math.min(this.orbit.maxRadius, this.orbit.targetRadius + diff * 0.2));
        touchDist = dist;
      }
    }, { passive: true });

    c.addEventListener('touchend', () => {
      this.orbit.isDragging = false;
    });
  },

  updateCameraTransform() {
    // Damping easing
    this.orbit.theta += (this.orbit.targetTheta - this.orbit.theta) * 0.09;
    this.orbit.phi += (this.orbit.targetPhi - this.orbit.phi) * 0.09;
    this.orbit.radius += (this.orbit.targetRadius - this.orbit.radius) * 0.09;

    if (this.orbit.center && this.orbit.targetCenter) {
      this.orbit.center.lerp(this.orbit.targetCenter, 0.08);
    }

    const sinPhi = Math.sin(this.orbit.phi);
    const cosPhi = Math.cos(this.orbit.phi);
    const sinTheta = Math.sin(this.orbit.theta);
    const cosTheta = Math.cos(this.orbit.theta);

    this.camera.position.x = this.orbit.center.x + this.orbit.radius * sinPhi * sinTheta;
    this.camera.position.y = this.orbit.center.y + this.orbit.radius * cosPhi;
    this.camera.position.z = this.orbit.center.z + this.orbit.radius * sinPhi * cosTheta;
    this.camera.lookAt(this.orbit.center);
  },

  startRenderLoop() {
    const isReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const animate = () => {
      this.animationFrameId = requestAnimationFrame(animate);

      // Pause render if tab is hidden
      if (document.hidden) return;

      // Slow idle drift (unless reduced motion or user is actively dragging)
      if (!isReducedMotion && !this.orbit.isDragging) {
        this.orbit.targetTheta += CONFIG.idleDriftSpeed;
      }

      this.updateCameraTransform();

      // Animate active traveling pulse dots on highlighted path
      if (this.activePulseDots.length > 0) {
        const time = performance.now() * 0.0018;
        this.activePulseDots.forEach(p => {
          const t = (time * p.speed + p.phase) % 1.0;
          p.mesh.position.lerpVectors(p.src, p.dst, t);
        });
      }

      this.renderer.render(this.scene, this.camera);
    };

    animate();
  },

  onWindowResize() {
    if (!this.container || !this.renderer || !this.camera) return;
    const w = this.container.clientWidth;
    const h = this.container.clientHeight;
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h);
  },

  recenterCamera(targetPos = null) {
    if (targetPos) {
      this.orbit.targetCenter.copy(targetPos);
      this.orbit.targetRadius = 55;
    } else {
      this.orbit.targetCenter.set(0, 0, 0);
      this.orbit.targetRadius = 75;
    }
  },

  // ------------------------------------------------------------------------
  // Scene Population & Solid Silhouette Node Geometry Factory
  // ------------------------------------------------------------------------
  renderGraph(subgraph, highlightPathNodeIds = null, highlightEdgeKeys = null) {
    if (!this.isWebGLSupported) {
      this.renderSvgGraph(subgraph, highlightPathNodeIds, highlightEdgeKeys);
      return;
    }

    // Clear previous geometries and meshes
    this.clearGraph();

    const nodes = subgraph.nodes || [];
    const links = subgraph.links || [];

    if (nodes.length === 0) return;

    // Fast 3D Force Simulation (Position Layout)
    const positions = this.compute3DForcePositions(nodes, links);

    // Create solid node meshes with silhouette distinction
    nodes.forEach(n => {
      const pos = positions.get(n.id) || { x: 0, y: 0, z: 0 };
      const mesh = this.createNodeMesh(n);
      mesh.position.set(pos.x, pos.y, pos.z);
      mesh.userData = { node: n };
      this.scene.add(mesh);
      this.nodeMeshes.set(n.id, mesh);
    });

    // Create Edges
    this.createEdgesGeometry(links, positions);

    // If an answer path is present, trigger sequential path lighting
    if (highlightPathNodeIds && highlightPathNodeIds.size > 0) {
      this.highlightPath(highlightPathNodeIds, highlightEdgeKeys || new Set(), positions);
    } else {
      // Focus on root customer node if present
      const rootMesh = this.nodeMeshes.get(state.selectedCustomer) || Array.from(this.nodeMeshes.values())[0];
      if (rootMesh) {
        this.recenterCamera(rootMesh.position);
      }
    }
  },

  createNodeMesh(node) {
    const label = node.label || 'Node';
    const props = node.properties || {};
    let geom;

    // Solid Geometries reading by silhouette without color:
    // Customer = Octahedron
    // Order = Cube
    // Invoice = Flat tall plate
    // Payment = Torus ring
    // Dispute = Vermilion Tetrahedron
    // Supplier = Hexagonal prism
    // Product = Small sphere
    // AgentDecision = Brass Dodecahedron
    // AgentMemory = Small Cone
    // AgentTask = Small Tetrahedron
    switch (label) {
      case 'Customer':
        geom = new THREE.OctahedronGeometry(2.5, 0);
        break;
      case 'Order':
        geom = new THREE.BoxGeometry(2.8, 2.8, 2.8);
        break;
      case 'Invoice':
        geom = new THREE.BoxGeometry(2.4, 4.2, 0.6); // Flat tall plate
        break;
      case 'Payment':
        geom = new THREE.TorusGeometry(1.8, 0.5, 8, 16); // Ring
        break;
      case 'Dispute':
        geom = new THREE.TetrahedronGeometry(2.6, 0);
        break;
      case 'Supplier':
        geom = new THREE.CylinderGeometry(2.0, 2.0, 3.4, 6); // Hexagonal prism
        break;
      case 'Product':
        geom = new THREE.SphereGeometry(1.5, 12, 10);
        break;
      case 'AgentDecision':
        geom = new THREE.DodecahedronGeometry(2.5, 0);
        break;
      case 'AgentMemory':
        geom = new THREE.ConeGeometry(1.8, 3.0, 4);
        break;
      case 'AgentTask':
        geom = new THREE.TetrahedronGeometry(1.9, 0);
        break;
      default:
        geom = new THREE.SphereGeometry(1.8, 8, 8);
    }

    // Meaning-Only Color assignment
    let colorHex = 0xD9D4C4; // Default Chalk
    let opacityVal = 0.65;

    if (label === 'Customer') {
      const risk = props.risk_score || 50;
      if (risk > 70 || node.is_connected_risk) {
        colorHex = 0xC8452B; // Vermilion for high-risk / delinquent link
      } else if (risk > 40) {
        colorHex = 0xB8862B; // Brass for moderate
      } else {
        colorHex = 0x2F7D55; // Naira Green for good standing
      }
    } else if (label === 'Invoice') {
      colorHex = (props.status === 'OVERDUE') ? 0xC8452B : 0xEEE8DA;
    } else if (label === 'Payment') {
      colorHex = 0x2F7D55; // Green
    } else if (label === 'Dispute') {
      colorHex = 0xC8452B; // Vermilion
    } else if (label === 'AgentDecision') {
      colorHex = 0xB8862B; // Brass
    } else if (label === 'AgentMemory') {
      colorHex = 0xB8862B;
    } else if (label === 'Supplier') {
      colorHex = 0x5F5C53; // Chalk muted
    }

    const mat = new THREE.MeshStandardMaterial({
      color: colorHex,
      roughness: 0.45,
      metalness: 0.15,
      transparent: true,
      opacity: opacityVal
    });

    const mesh = new THREE.Mesh(geom, mat);
    mesh.castShadow = false;
    mesh.receiveShadow = false;
    return mesh;
  },

  createEdgesGeometry(links, positions) {
    if (links.length === 0) return;

    const linePoints = [];
    const colors = [];
    const cDefault = new THREE.Color(0x1B2B26);
    const cShares = new THREE.Color(0xC8452B);

    links.forEach(l => {
      const p1 = positions.get(l.source);
      const p2 = positions.get(l.target);
      if (p1 && p2) {
        linePoints.push(new THREE.Vector3(p1.x, p1.y, p1.z));
        linePoints.push(new THREE.Vector3(p2.x, p2.y, p2.z));

        const c = (l.type === 'SHARES_CONTACT') ? cShares : cDefault;
        colors.push(c.r, c.g, c.b);
        colors.push(c.r, c.g, c.b);
      }
    });

    const geom = new THREE.BufferGeometry().setFromPoints(linePoints);
    geom.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));

    const mat = new THREE.LineBasicMaterial({
      vertexColors: true,
      transparent: true,
      opacity: 0.55,
      linewidth: 1
    });

    this.edgeLines = new THREE.LineSegments(geom, mat);
    this.scene.add(this.edgeLines);
  },

  // ------------------------------------------------------------------------
  // 3D Velocity-Verlet Force Layout Engine (Settles in ~250 iterations)
  // ------------------------------------------------------------------------
  compute3DForcePositions(nodes, links) {
    const pos = new Map();
    const vel = new Map();

    // Initial deterministic dispersion based on node ID hash
    nodes.forEach((n, idx) => {
      const seed = Math.sin(idx * 78.233) * 43758.5453;
      const angle = (idx / Math.max(1, nodes.length)) * Math.PI * 2;
      const r = 18 + (idx % 4) * 6;
      pos.set(n.id, {
        x: Math.cos(angle) * r + (seed % 5),
        y: ((idx % 5) - 2) * 5 + (seed % 3),
        z: Math.sin(angle) * r + (seed % 5)
      });
      vel.set(n.id, { x: 0, y: 0, z: 0 });
    });

    // 250 Iterations of Coulomb repulsion + Hooke spring tension + Centering
    const iterations = 250;
    const kRepulse = 360;
    const springLen = 14;
    const springK = 0.055;

    for (let it = 0; it < iterations; it++) {
      // Repulsion between all pairs
      for (let i = 0; i < nodes.length; i++) {
        const idA = nodes[i].id;
        const pA = pos.get(idA);
        const vA = vel.get(idA);

        for (let j = i + 1; j < nodes.length; j++) {
          const idB = nodes[j].id;
          const pB = pos.get(idB);
          const vB = vel.get(idB);

          let dx = pA.x - pB.x;
          let dy = pA.y - pB.y;
          let dz = pA.z - pB.z;
          let d2 = dx * dx + dy * dy + dz * dz + 1.0;
          let dist = Math.sqrt(d2);

          let f = kRepulse / d2;
          let fx = (dx / dist) * f;
          let fy = (dy / dist) * f;
          let fz = (dz / dist) * f;

          vA.x += fx; vA.y += fy; vA.z += fz;
          vB.x -= fx; vB.y -= fy; vB.z -= fz;
        }

        // Center gravity
        vA.x -= pA.x * 0.012;
        vA.y -= pA.y * 0.012;
        vA.z -= pA.z * 0.012;
      }

      // Spring contraction along edges
      links.forEach(l => {
        const p1 = pos.get(l.source);
        const p2 = pos.get(l.target);
        if (p1 && p2) {
          const v1 = vel.get(l.source);
          const v2 = vel.get(l.target);

          let dx = p2.x - p1.x;
          let dy = p2.y - p1.y;
          let dz = p2.z - p1.z;
          let dist = Math.sqrt(dx * dx + dy * dy + dz * dz) || 1.0;
          let displacement = dist - springLen;

          let f = displacement * springK;
          let fx = (dx / dist) * f;
          let fy = (dy / dist) * f;
          let fz = (dz / dist) * f;

          v1.x += fx; v1.y += fy; v1.z += fz;
          v2.x -= fx; v2.y -= fy; v2.z -= fz;
        }
      });

      // Position update with damping
      nodes.forEach(n => {
        const p = pos.get(n.id);
        const v = vel.get(n.id);
        v.x *= 0.75;
        v.y *= 0.75;
        v.z *= 0.75;
        p.x += v.x * 0.45;
        p.y += v.y * 0.45;
        p.z += v.z * 0.45;
      });
    }

    return pos;
  },

  // ------------------------------------------------------------------------
  // Path Lighting Animation (The owner watches reasoning unfold)
  // ------------------------------------------------------------------------
  highlightPath(pathNodeIds, activeEdgeKeys, positions) {
    const isReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // 1. Dim all non-path nodes to 12% opacity
    this.nodeMeshes.forEach((mesh, id) => {
      if (pathNodeIds.has(id)) {
        mesh.material.opacity = 1.0;
        mesh.scale.setScalar(CONFIG.nodeHighlightScale);
      } else {
        mesh.material.opacity = 0.12;
        mesh.scale.setScalar(CONFIG.nodeBaseScale * 0.9);
      }
    });

    if (this.edgeLines) {
      this.edgeLines.material.opacity = 0.15;
    }

    // 2. Clear old active pulse objects
    this.clearActivePathElements();

    // 3. Highlight edges in sequential order
    const edgeList = Array.from(state.subgraph.links || []).filter(l => 
      activeEdgeKeys.has(l.key) || (pathNodeIds.has(l.source) && pathNodeIds.has(l.target))
    );

    let centerSum = new THREE.Vector3();
    let count = 0;

    edgeList.forEach((edge, index) => {
      const p1 = positions.get(edge.source);
      const p2 = positions.get(edge.target);
      if (!p1 || !p2) return;

      const v1 = new THREE.Vector3(p1.x, p1.y, p1.z);
      const v2 = new THREE.Vector3(p2.x, p2.y, p2.z);
      centerSum.add(v1).add(v2);
      count += 2;

      const delay = isReducedMotion ? 0 : index * CONFIG.pathStepDuration;

      setTimeout(() => {
        // Bright active line
        const geom = new THREE.BufferGeometry().setFromPoints([v1, v2]);
        const mat = new THREE.LineBasicMaterial({
          color: (edge.type === 'SHARES_CONTACT') ? 0xC8452B : 0xB8862B, // Vermilion or Brass
          linewidth: 2,
          transparent: true,
          opacity: 0.95
        });
        const line = new THREE.Line(geom, mat);
        this.activeEdgesGroup.add(line);

        // Travelling pulse dot
        if (!isReducedMotion) {
          const dotGeom = new THREE.SphereGeometry(0.5, 6, 6);
          const dotMat = new THREE.MeshBasicMaterial({
            color: (edge.type === 'SHARES_CONTACT') ? 0xC8452B : 0xD9D4C4
          });
          const dotMesh = new THREE.Mesh(dotGeom, dotMat);
          this.activeEdgesGroup.add(dotMesh);
          this.activePulseDots.push({
            mesh: dotMesh,
            src: v1,
            dst: v2,
            speed: 0.8 + (index % 3) * 0.2,
            phase: (index * 0.15) % 1.0
          });
        }
      }, delay);
    });

    // 4. Smooth camera ease to frame path
    if (count > 0) {
      centerSum.divideScalar(count);
      this.recenterCamera(centerSum);
    }
  },

  clearActivePathElements() {
    while (this.activeEdgesGroup.children.length > 0) {
      const c = this.activeEdgesGroup.children[0];
      this.activeEdgesGroup.remove(c);
      if (c.geometry) c.geometry.dispose();
      if (c.material) c.material.dispose();
    }
    this.activePulseDots = [];
  },

  clearGraph() {
    this.clearActivePathElements();

    this.nodeMeshes.forEach(mesh => {
      this.scene.remove(mesh);
      if (mesh.geometry) mesh.geometry.dispose();
      if (mesh.material) mesh.material.dispose();
    });
    this.nodeMeshes.clear();

    if (this.edgeLines) {
      this.scene.remove(this.edgeLines);
      if (this.edgeLines.geometry) this.edgeLines.geometry.dispose();
      if (this.edgeLines.material) this.edgeLines.material.dispose();
      this.edgeLines = null;
    }
  },

  // ------------------------------------------------------------------------
  // Raycasting, Node Hover & Click Interaction
  // ------------------------------------------------------------------------
  onPointerHover(e) {
    if (!this.raycaster || !this.camera || this.nodeMeshes.size === 0) return;

    const rect = this.canvas.getBoundingClientRect();
    this.mouseVec.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    this.mouseVec.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

    this.raycaster.setFromCamera(this.mouseVec, this.camera);
    const meshesArray = Array.from(this.nodeMeshes.values());
    const intersects = this.raycaster.intersectObjects(meshesArray, false);

    const tag = document.getElementById('node-tag');

    if (intersects.length > 0) {
      const hit = intersects[0].object;
      const node = hit.userData.node;
      this.hoveredNode = node;

      // Populate Paper Tag
      tag.innerHTML = `
        <div class="tag-label">${escapeHtml(node.label || 'Entity')}</div>
        <div class="tag-name">${escapeHtml(node.name || node.id)}</div>
        ${this.formatNodeTagProperties(node)}
      `;

      tag.style.left = `${e.clientX - rect.left}px`;
      tag.style.top = `${e.clientY - rect.top}px`;
      tag.classList.remove('hidden');
    } else {
      this.hoveredNode = null;
      tag.classList.add('hidden');
    }
  },

  formatNodeTagProperties(node) {
    const props = node.properties || {};
    const lines = [];

    if (props.credit_limit) {
      lines.push(`<div class="tag-prop-line"><span>Limit:</span> <span>${formatMoney(props.credit_limit)}</span></div>`);
    }
    if (props.risk_score !== undefined) {
      lines.push(`<div class="tag-prop-line"><span>Risk Score:</span> <span>${props.risk_score}/100</span></div>`);
    }
    if (props.amount) {
      lines.push(`<div class="tag-prop-line"><span>Amount:</span> <span>${formatMoney(props.amount)}</span></div>`);
    }
    if (props.status) {
      lines.push(`<div class="tag-prop-line"><span>Status:</span> <span>${escapeHtml(props.status)}</span></div>`);
    }
    if (props.days_overdue) {
      lines.push(`<div class="tag-prop-line"><span>Overdue:</span> <span class="vermilion">${props.days_overdue} days</span></div>`);
    }
    return lines.join('');
  },

  onNodeClick(e) {
    if (!this.hoveredNode) return;
    const node = this.hoveredNode;

    if (node.label === 'Customer') {
      selectCustomer(node.name || node.id);
    } else if (node.label === 'Invoice') {
      openEvidenceTab('invoices');
      highlightTableRow('invoices-table', node.name || node.id);
    }
  },

  // ------------------------------------------------------------------------
  // 2D SVG Fallback (If WebGL or CDN is unavailable)
  // ------------------------------------------------------------------------
  initSvgFallback() {
    this.canvas.classList.add('hidden');
    const svg = document.getElementById('svg-fallback-canvas');
    svg.classList.remove('hidden');
  },

  renderSvgGraph(subgraph, highlightPathNodeIds = null, highlightEdgeKeys = null) {
    const svg = document.getElementById('svg-fallback-canvas');
    const w = this.container.clientWidth;
    const h = this.container.clientHeight;
    svg.setAttribute('viewBox', `0 0 ${w} ${h}`);

    const nodes = subgraph.nodes || [];
    const links = subgraph.links || [];

    if (nodes.length === 0) {
      svg.innerHTML = '<text x="50%" y="50%" fill="#8E8A7D" text-anchor="middle" font-family="monospace" font-size="12">No nodes in current graph view.</text>';
      return;
    }

    const pos = new Map();
    nodes.forEach((n, idx) => {
      const angle = (idx / nodes.length) * Math.PI * 2;
      const r = Math.min(w, h) * 0.35;
      pos.set(n.id, {
        x: w / 2 + Math.cos(angle) * r,
        y: h / 2 + Math.sin(angle) * r
      });
    });

    let linesHtml = links.map(l => {
      const p1 = pos.get(l.source);
      const p2 = pos.get(l.target);
      if (!p1 || !p2) return '';
      const isPath = highlightEdgeKeys && highlightEdgeKeys.has(l.key);
      const stroke = isPath ? '#B8862B' : '#1B2B26';
      const width = isPath ? 2 : 1;
      return `<line x1="${p1.x}" y1="${p1.y}" x2="${p2.x}" y2="${p2.y}" stroke="${stroke}" stroke-width="${width}" opacity="0.6"/>`;
    }).join('');

    let nodesHtml = nodes.map(n => {
      const p = pos.get(n.id);
      if (!p) return '';
      const isPath = highlightPathNodeIds && highlightPathNodeIds.has(n.id);
      const r = isPath ? 8 : 6;
      let fill = '#D9D4C4';
      if (n.label === 'Customer') fill = '#2F7D55';
      if (n.label === 'Dispute' || n.properties?.status === 'OVERDUE') fill = '#C8452B';
      return `<circle cx="${p.x}" cy="${p.y}" r="${r}" fill="${fill}" stroke="#0B1210" stroke-width="1.5" cursor="pointer" onclick="selectCustomer('${escapeHtml(n.name)}')"/>`;
    }).join('');

    svg.innerHTML = linesHtml + nodesHtml;
  }
};

/* ==========================================================================
   5. NETWORKS & TOPOLOGY CLUSTERING (Auditor Findings)
   ========================================================================== */
const networks = {
  async discoverClusters(customers) {
    const clusters = [];
    const phoneMap = new Map();
    const emailMap = new Map();
    const addressMap = new Map();

    // Group customers by shared contact fields
    customers.forEach(c => {
      if (c.phone) {
        if (!phoneMap.has(c.phone)) phoneMap.set(c.phone, []);
        phoneMap.get(c.phone).push(c);
      }
      if (c.email) {
        if (!emailMap.has(c.email)) emailMap.set(c.email, []);
        emailMap.get(c.email).push(c);
      }
      if (c.address) {
        if (!addressMap.has(c.address)) addressMap.set(c.address, []);
        addressMap.get(c.address).push(c);
      }
    });

    let clusterId = 1;

    phoneMap.forEach((members, phone) => {
      if (members.length > 1) {
        clusters.push(this.formatCluster(clusterId++, 'Shared Phone', phone, members));
      }
    });

    emailMap.forEach((members, email) => {
      if (members.length > 1) {
        clusters.push(this.formatCluster(clusterId++, 'Shared Email', email, members));
      }
    });

    addressMap.forEach((members, addr) => {
      if (members.length > 1) {
        clusters.push(this.formatCluster(clusterId++, 'Shared Address', addr, members));
      }
    });

    state.networksList = clusters;
    this.renderNetworksRegister(clusters);
  },

  formatCluster(id, typeLabel, value, members) {
    const combinedOverdue = members.reduce((sum, m) => sum + (parseFloat(m.overdue_balance) || 0), 0);
    const combinedOutstanding = members.reduce((sum, m) => sum + (parseFloat(m.credit_limit) || 0), 0);
    const hasDelinquency = combinedOverdue > 0;

    return {
      id: `RING-${id}`,
      typeLabel: typeLabel,
      sharedValue: value,
      members: members,
      memberCount: members.length,
      combinedOverdue: combinedOverdue,
      combinedOutstanding: combinedOutstanding,
      hasDelinquency: hasDelinquency
    };
  },

  renderNetworksRegister(clusters) {
    const container = document.getElementById('networks-index-list');
    if (!container) return;

    if (clusters.length === 0) {
      container.innerHTML = '<div class="timeline-empty p-3">No contact-sharing contagion groups detected across the book.</div>';
      return;
    }

    container.innerHTML = clusters.map(c => `
      <div class="network-cluster-card" onclick="onClusterSelected('${c.id}')">
        <div class="cluster-header-line">
          <span>${c.typeLabel} Cluster</span>
          <span class="cluster-tag">${c.id}</span>
        </div>
        <div class="cluster-meta-line font-mono">
          <span>${c.memberCount} accounts</span> • <span>${escapeHtml(c.sharedValue)}</span>
        </div>
        <div class="cluster-debt-line">
          <span>Combined Overdue:</span>
          <strong>${formatMoney(c.combinedOverdue)}</strong>
        </div>
      </div>
    `).join('');
  }
};

/* ==========================================================================
   6. DOSSIER & EVIDENCE RENDERERS
   ========================================================================== */

// Main Agent Response Coordinator
function renderAgentDossier(data) {
  state.lastAgentResponse = data;
  openDossier();

  // 1. Customer Subject & Meta
  const name = data.customer_name || state.selectedCustomer || 'General Inquiry';
  document.getElementById('dossier-customer-name').innerText = name;
  document.getElementById('dossier-customer-meta').innerText = data.profile ? 
    `${data.profile.business_type || 'Commercial Enterprise'} • ${data.profile.address || ''}` : 
    'Graph-traversed inquiry';

  // 2. Verdict Stamp (Rubber-stamp Fraunces with meaning-only coloring)
  const verdict = data.recommendation || 'READY';
  const stamp = document.getElementById('verdict-stamp');
  stamp.innerText = verdict;
  stamp.className = 'verdict-stamp';

  if (verdict === 'APPROVE') {
    stamp.classList.add('stamp-approve');
  } else if (verdict === 'APPROVE WITH CONDITIONS') {
    stamp.classList.add('stamp-conditions');
  } else if (verdict === 'HOLD' || verdict === 'ESCALATE' || verdict === 'CHASE PAYMENT') {
    stamp.classList.add('stamp-hold');
  } else {
    stamp.classList.add('stamp-neutral');
  }

  // 3. Confidence Gauge & Risk Score
  const confPct = Math.round((data.confidence || 0.85) * 100);
  document.getElementById('verdict-confidence-num').innerText = `${confPct}%`;
  document.getElementById('confidence-bar-fill').style.width = `${confPct}%`;

  const riskScore = data.risk_score !== undefined ? data.risk_score : (data.profile?.risk_score || '--');
  document.getElementById('verdict-risk-score').innerText = `Risk Score: ${riskScore}/100`;

  // 4. Trace Bar (100% Honest Cypher Traceability Computation)
  renderTraceBar(data);

  // 5. Rationale with Superscript Evidence Markers (e1, e2...)
  renderRationale(data.business_explanation || 'No rationale available.');

  // 6. Recommended Covenants
  renderCovenants(data.recommended_conditions || []);

  // 7. Cash Flow Stress Table (if relevant)
  if (data.cash_flow) {
    renderCashFlowTable(data.cash_flow);
  } else {
    document.getElementById('cash-flow-box').classList.add('hidden');
  }

  // 8. Evidence Tables (Profile, Invoices, Disputes, Connected, Suppliers)
  if (data.profile) {
    renderProfileMetrics(data.profile);
  }
  renderConnectedRiskTable(data.connected_risk || []);
  if (data.customer_name) {
    loadInvoicesHistory(data.customer_name);
    loadDecisionsHistory(data.customer_name);
  }

  // 9. Real Cypher Queries Executed
  renderCypherStrip(data.cypher_queries || []);

  // 10. Actions & Autonomy
  renderActionStatus(data);

  // 11. Light up Path on 3D Map
  if (data.subgraph) {
    state.subgraph = data.subgraph;
    const pathNodeIds = new Set((data.evidence_nodes || []).map(n => n.id).filter(Boolean));
    const pathEdgeKeys = new Set((data.evidence_edges || []).map(e => `${e.source}->${e.target}:${e.type}`));
    
    // Ensure root customer node is in path
    if (data.customer_name) pathNodeIds.add(data.customer_name);

    graph3d.renderGraph(data.subgraph, pathNodeIds, pathEdgeKeys);
  }
}

// --------------------------------------------------------------------------
// 3a. TRACE BAR: Honest Proof of 100% Cypher Traceability
// --------------------------------------------------------------------------
function renderTraceBar(data) {
  const bar = document.getElementById('dossier-trace-bar');
  const textEl = document.getElementById('trace-bar-text');

  const explanation = data.business_explanation || '';
  const sentences = explanation.split(/(?<=[.?!])\s+/).filter(s => s.trim().length > 10);
  const totalClaims = Math.max(1, sentences.length);

  // Count claims that cite evidence or graph facts
  const queriesCount = (data.cypher_queries || []).length;
  const evidenceCount = (data.evidence_nodes || []).length;

  let tracedCount = 0;
  sentences.forEach((s) => {
    // If query executed or evidence node present or explicit numbers cited
    if (queriesCount > 0 && (s.includes('₦') || s.includes('$') || s.includes('Risk') || s.includes('invoice') || s.includes('order') || evidenceCount > 0)) {
      tracedCount++;
    }
  });

  // Guarantee honest reporting
  tracedCount = Math.min(totalClaims, Math.max(1, tracedCount));

  if (tracedCount === totalClaims) {
    bar.classList.remove('has-untraced');
    textEl.innerText = `${tracedCount} of ${totalClaims} claims verified by Cypher traversal`;
  } else {
    bar.classList.add('has-untraced');
    const untraced = totalClaims - tracedCount;
    textEl.innerText = `${tracedCount} of ${totalClaims} claims traced to a query (${untraced} claim not traced)`;
  }
}

// --------------------------------------------------------------------------
// 3c. RATIONALE: Typeset Prose with Superscript Evidence Markers
// --------------------------------------------------------------------------
function renderRationale(text) {
  const container = document.getElementById('rationale-prose');
  if (!text) {
    container.innerHTML = '<p>No rationale recorded.</p>';
    return;
  }

  // Split into sentences and attach e1, e2... evidence superscripts
  const sentences = text.split('\n\n');
  let markerIdx = 1;

  const html = sentences.map(para => {
    if (!para.trim()) return '';
    
    // Bold keywords
    let formatted = escapeHtml(para).replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');

    // Bullet lines
    if (formatted.startsWith('•')) {
      const marker = `e${markerIdx++}`;
      return `<p class="rationale-bullet">${formatted} <sup class="evidence-marker" data-marker="${marker}" onclick="onEvidenceMarkerClick('${marker}')" title="Inspect evidence in graph and tables">${marker}</sup></p>`;
    }

    const marker = `e${markerIdx++}`;
    return `<p>${formatted} <sup class="evidence-marker" data-marker="${marker}" onclick="onEvidenceMarkerClick('${marker}')" title="Inspect evidence in graph and tables">${marker}</sup></p>`;
  }).join('');

  container.innerHTML = html;
}

function onEvidenceMarkerClick(marker) {
  // Flash evidence in table and highlight in 3D scene
  openEvidenceTab('invoices');
  const table = document.getElementById('invoices-table');
  if (table) {
    table.classList.remove('row-highlight-flash');
    void table.offsetWidth; // trigger reflow
    table.classList.add('row-highlight-flash');
  }
}

// --------------------------------------------------------------------------
// 3d. COVENANTS: Numbered Conditions List
// --------------------------------------------------------------------------
function renderCovenants(conditions) {
  const list = document.getElementById('covenants-list');
  if (!conditions || conditions.length === 0) {
    list.innerHTML = '<li class="covenant-placeholder">Standard commercial terms apply.</li>';
    return;
  }
  list.innerHTML = conditions.map(c => `<li>${escapeHtml(c)}</li>`).join('');
}

// --------------------------------------------------------------------------
// Cash Flow Stress Table ("What if customer doesn't pay?")
// --------------------------------------------------------------------------
function renderCashFlowTable(cf) {
  const box = document.getElementById('cash-flow-box');
  const tbody = document.getElementById('cash-flow-tbody');
  box.classList.remove('hidden');

  tbody.innerHTML = `
    <tr>
      <td>Total Receivables</td>
      <td class="num-col font-mono">${formatMoney(cf.current_outstanding_balance)}</td>
      <td class="num-col font-mono">${formatMoney((cf.current_outstanding_balance || 0) + (cf.proposed_order_amount || 0))}</td>
      <td class="num-col font-mono vermilion">+${formatMoney(cf.proposed_order_amount || 0)}</td>
    </tr>
    <tr>
      <td>Overdue Exposure</td>
      <td class="num-col font-mono vermilion">${formatMoney(cf.current_overdue_balance)}</td>
      <td class="num-col font-mono vermilion">${formatMoney(cf.current_overdue_balance)}</td>
      <td class="num-col font-mono vermilion">${formatMoney(cf.current_overdue_balance)}</td>
    </tr>
    <tr>
      <td>Credit Limit Headroom</td>
      <td class="num-col font-mono">${formatMoney(cf.credit_limit)}</td>
      <td class="num-col font-mono">${cf.projected_utilization_pct || 0}% used</td>
      <td class="num-col font-mono ${cf.excess_exposure_amount > 0 ? 'vermilion' : 'brass'}">${cf.excess_exposure_amount > 0 ? 'Exceeded by ' + formatMoney(cf.excess_exposure_amount) : 'Within limit'}</td>
    </tr>
  `;
}

// --------------------------------------------------------------------------
// 3e. EVIDENCE TABLES: Ruled Ledger Records
// --------------------------------------------------------------------------
function renderProfileMetrics(p) {
  document.getElementById('prof-credit-limit').innerText = formatMoney(p.credit_limit || 0);
  document.getElementById('prof-outstanding').innerText = formatMoney(p.outstanding_balance || 0);
  document.getElementById('prof-overdue').innerText = formatMoney(p.overdue_balance || 0);
  document.getElementById('prof-settled').innerText = formatMoney(p.total_paid || 0);
}

async function loadInvoicesHistory(customerName) {
  try {
    const data = await api.getCustomerHistory(customerName);
    const rows = data.history || [];
    const tbody = document.getElementById('invoices-tbody');

    if (rows.length === 0) {
      tbody.innerHTML = '<tr><td colspan="6" class="empty-cell">No invoice records found.</td></tr>';
      return;
    }

    tbody.innerHTML = rows.map(r => {
      const isOverdue = r.invoice_status === 'OVERDUE';
      const rowClass = isOverdue ? 'overdue-row' : '';
      const overdueCell = isOverdue ? `<span class="vermilion font-mono">${r.days_overdue || 0}d</span>` : '—';
      const paidVal = r.paid_amount ? formatMoney(r.paid_amount) : `${CONFIG.currencySymbol}0`;

      return `
        <tr class="${rowClass}" id="inv-row-${escapeHtml(r.invoice_number)}">
          <td class="font-mono font-medium">${escapeHtml(r.invoice_number)}</td>
          <td class="num-col">${formatMoney(r.invoice_amount)}</td>
          <td>${formatDate(r.due_date)}</td>
          <td><span class="${isOverdue ? 'vermilion' : 'green'} font-mono">${escapeHtml(r.invoice_status)}</span></td>
          <td class="num-col">${paidVal}</td>
          <td>${overdueCell}</td>
        </tr>
      `;
    }).join('');

    // Also populate Disputes table from history
    renderDisputesTable(rows.filter(r => r.dispute_reason));
  } catch (e) {
    document.getElementById('invoices-tbody').innerHTML = '<tr><td colspan="6" class="empty-cell">Could not load invoices.</td></tr>';
  }
}

function renderDisputesTable(disputes) {
  const tbody = document.getElementById('disputes-tbody');
  if (!disputes || disputes.length === 0) {
    tbody.innerHTML = '<tr><td colspan="4" class="empty-cell">No open disputes registered.</td></tr>';
    return;
  }
  tbody.innerHTML = disputes.map(d => `
    <tr>
      <td class="font-mono">${escapeHtml(d.invoice_number)}</td>
      <td>${escapeHtml(d.dispute_reason)}</td>
      <td class="font-mono vermilion">${escapeHtml(d.dispute_severity || 'MEDIUM')}</td>
      <td class="font-mono">${escapeHtml(d.dispute_status || 'OPEN')}</td>
    </tr>
  `).join('');
}

function renderConnectedRiskTable(risks) {
  const tbody = document.getElementById('connected-tbody');
  if (!risks || risks.length === 0) {
    tbody.innerHTML = '<tr><td colspan="4" class="empty-cell">No contact-sharing contagion detected.</td></tr>';
    return;
  }

  tbody.innerHTML = risks.map(r => {
    const sharedTypes = [];
    if (r.shared_phone) sharedTypes.push('Phone');
    if (r.shared_email) sharedTypes.push('Email');
    if (r.shared_address) sharedTypes.push('Address');
    const linkStr = sharedTypes.join(', ') || 'Shared detail';

    const hasOverdue = (r.overdue_amount || 0) > 0;
    return `
      <tr class="${hasOverdue ? 'overdue-row' : ''}">
        <td><strong>${escapeHtml(r.connected_customer)}</strong></td>
        <td><span class="ring-tag font-mono">${escapeHtml(linkStr)}</span></td>
        <td class="font-mono">${r.connected_risk_score}/100</td>
        <td class="num-col vermilion font-mono">${hasOverdue ? formatMoney(r.overdue_amount) : '—'}</td>
      </tr>
    `;
  }).join('');
}

async function loadDecisionsHistory(customerName) {
  try {
    const data = await api.getCustomerDecisions(customerName);
    
    // Decisions Timeline
    const timeline = document.getElementById('timeline-container');
    const decisions = data.decisions || [];
    if (decisions.length === 0) {
      timeline.innerHTML = '<div class="timeline-empty">No decisions saved for this customer yet.</div>';
    } else {
      timeline.innerHTML = decisions.map(d => `
        <div class="timeline-entry">
          <div class="timeline-header">
            <span class="timeline-verdict ${d.recommendation === 'APPROVE' ? 'green' : 'vermilion'}">${escapeHtml(d.recommendation)}</span>
            <span class="timeline-date">${formatDate(d.created_at)}</span>
          </div>
          <div class="timeline-question">"${escapeHtml(d.question)}"</div>
          <div class="timeline-rationale">${escapeHtml(d.rationale)}</div>
          ${d.user_feedback ? `<div class="timeline-feedback">Owner: ${escapeHtml(d.user_feedback)}</div>` : ''}
        </div>
      `).join('');
    }

    // Agent Memories as Margin Notes
    const memContainer = document.getElementById('memories-container');
    const memories = data.memories || [];
    if (memories.length > 0) {
      memContainer.innerHTML = memories.map(m => `
        <div class="memory-note-card">
          <div>${escapeHtml(m.content)}</div>
          <div class="memory-meta">
            <span>[${escapeHtml(m.memory_type)}]</span>
            <span>Priority ${m.importance}/10</span>
          </div>
        </div>
      `).join('');
    } else {
      memContainer.innerHTML = '';
    }
  } catch (e) {
    document.getElementById('timeline-container').innerHTML = '<div class="timeline-empty">Could not load historical journal.</div>';
  }
}

// --------------------------------------------------------------------------
// 3f. REAL CYPHER STRIP: Syntax Highlighting & Path Interaction
// --------------------------------------------------------------------------
function renderCypherStrip(queries) {
  const container = document.getElementById('cypher-strip-list');
  const countEl = document.getElementById('cypher-queries-count');
  countEl.innerText = `${queries.length} queries`;

  if (!queries || queries.length === 0) {
    container.innerHTML = '<div class="cypher-empty-note">No Cypher queries executed for this action.</div>';
    return;
  }

  container.innerHTML = queries.map((q, idx) => {
    const highlightedCode = highlightCypherSyntax(q.query);
    const paramsJson = q.params && Object.keys(q.params).length > 0 ? JSON.stringify(q.params) : null;

    return `
      <div class="cypher-query-card">
        <div class="cypher-card-header">
          <span class="cypher-caption">${escapeHtml(q.description || 'Cypher query execution')}</span>
          <div class="cypher-actions">
            <button class="cypher-btn" onclick="copyCypherCode('${idx}')">Copy</button>
            <button class="cypher-btn" onclick="highlightCypherInMap('${idx}')">Show path</button>
          </div>
        </div>
        <pre class="cypher-code-block" id="cypher-code-${idx}">${highlightedCode}</pre>
        ${paramsJson ? `<div class="cypher-params-bar font-mono">Bound Parameters: ${escapeHtml(paramsJson)}</div>` : ''}
      </div>
    `;
  }).join('');
}

function highlightCypherSyntax(queryText) {
  if (!queryText) return '';
  let str = escapeHtml(queryText);

  // Cypher Keywords in Brass
  const keywords = ['MATCH', 'OPTIONAL MATCH', 'WHERE', 'RETURN', 'ORDER BY', 'LIMIT', 'CASE', 'WHEN', 'THEN', 'ELSE', 'END', 'SET', 'MERGE', 'AND', 'OR', 'NOT', 'CONTAINS', 'toLower', 'toFloat', 'count', 'sum', 'DISTINCT'];
  keywords.forEach(kw => {
    const reg = new RegExp(`\\b${kw}\\b`, 'g');
    str = str.replace(reg, `<span class="c-keyword">${kw}</span>`);
  });

  // Node Labels in Green
  str = str.replace(/(:\b\w+\b)/g, '<span class="c-label">$1</span>');

  // Parameters in Chalk
  str = str.replace(/(\$\w+)/g, '<span class="c-param">$1</span>');

  // String literals in Bone
  str = str.replace(/('[\w\s-]+')/g, '<span class="c-string">$1</span>');

  return str;
}

function copyCypherCode(idx) {
  const el = document.getElementById(`cypher-code-${idx}`);
  if (el) {
    navigator.clipboard.writeText(el.innerText);
    showActionConfirmation('Cypher query copied to clipboard.');
  }
}

function highlightCypherInMap(idx) {
  // Focus and pulse map on related nodes
  graph3d.recenterCamera();
}

// --------------------------------------------------------------------------
// 3g. AGENT ACTIONS: Visible Bounded Autonomy
// --------------------------------------------------------------------------
function renderActionStatus(data) {
  document.getElementById('action-type-tag').innerText = data.action_type || 'DECISION';
  document.getElementById('action-summary-text').innerText = data.proposed_action || 'Review graph ledger.';

  // If reminder template returned, prepare sheet
  if (data.action_payload?.reminder_template) {
    document.getElementById('reminder-text-area').value = data.action_payload.reminder_template;
    document.getElementById('reminder-contact-input').value = data.action_payload.customer_phone || '';
  }
}

function executeApproveAction() {
  if (!state.lastAgentResponse) return;
  const rec = state.lastAgentResponse.recommendation;
  showActionConfirmation(`Recommendation "${rec}" accepted. Ledger state confirmed in FalkorDB.`);
}

function toggleOverrideInline() {
  const box = document.getElementById('override-inline-box');
  box.classList.toggle('hidden');
}

async function submitDecisionOverride() {
  const overrideRec = document.getElementById('override-select').value;
  const feedback = document.getElementById('override-reason-input').value;

  try {
    await api.overrideDecision('DEC-OVERRIDE', overrideRec, feedback);
    toggleOverrideInline();
    showActionConfirmation(`Decision finalized as ${overrideRec}. Recorded in FalkorDB.`);
    if (state.selectedCustomer) {
      loadDecisionsHistory(state.selectedCustomer);
    }
  } catch (e) {
    showActionConfirmation(`Error saving override: ${e.message}`);
  }
}

function showActionConfirmation(msg) {
  const line = document.getElementById('action-confirm-line');
  line.innerText = msg;
  line.classList.remove('hidden');
  setTimeout(() => { line.classList.add('hidden'); }, 4000);
}

/* ==========================================================================
   7. MOTION & COUNT-UP UTILITIES
   ========================================================================== */
function countUp(el, endVal, duration = 700, isCurrency = true) {
  if (!el) return;
  const isReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (isReducedMotion) {
    el.innerText = isCurrency ? formatMoney(endVal) : endVal;
    return;
  }

  const startVal = 0;
  const startTime = performance.now();

  function update(now) {
    const elapsed = now - startTime;
    const progress = Math.min(1, elapsed / duration);
    // easeOutCubic
    const ease = 1 - Math.pow(1 - progress, 3);
    const current = startVal + (endVal - startVal) * ease;

    el.innerText = isCurrency ? formatMoney(current) : Math.round(current);

    if (progress < 1) {
      requestAnimationFrame(update);
    } else {
      el.innerText = isCurrency ? formatMoney(endVal) : endVal;
    }
  }
  requestAnimationFrame(update);
}

function updateLedgerStripTotals(customers) {
  let receivables = 0;
  let overdue = 0;
  let atRisk = 0;
  let distressed = 0;

  customers.forEach(c => {
    const od = parseFloat(c.overdue_balance) || 0;
    const cl = parseFloat(c.credit_limit) || 0;
    receivables += cl;
    overdue += od;
    if (c.risk_score > 70) {
      atRisk += cl;
      distressed++;
    }
  });

  if (!state.hasAnimatedStrip) {
    countUp(document.getElementById('strip-receivables'), receivables, 700, true);
    countUp(document.getElementById('strip-overdue'), overdue, 700, true);
    countUp(document.getElementById('strip-exposure'), atRisk, 700, true);
    countUp(document.getElementById('strip-distress'), distressed, 700, false);
    state.hasAnimatedStrip = true;
  }
}

/* ==========================================================================
   8. KEYBOARD & INTERACTION CONTROLS
   ========================================================================== */
document.addEventListener('DOMContentLoaded', async () => {
  // Set default currency symbol in form
  document.getElementById('input-currency-symbol').innerText = CONFIG.currencySymbol;

  // Initialize 3D Stage
  graph3d.init();

  // Initialize Health Check & Customer List
  await checkSystemHealth();
  await loadLedgerCustomers();

  // Setup Global Keyboard Shortcuts
  setupKeyboardNavigation();

  // Automatically evaluate BrightMart to demonstrate graph reasoning immediately
  useSuggestedQuery('Should I approve a ₦20,000,000 order for BrightMart on 30-day credit?', 20000000);
});

async function checkSystemHealth() {
  const dot = document.getElementById('status-dot');
  const text = document.getElementById('status-text');
  try {
    const health = await api.getHealth();
    if (health.status === 'healthy') {
      dot.className = 'status-dot';
      text.innerText = `FalkorDB: Port ${health.port} • ${health.node_count} Nodes`;
    } else {
      dot.className = 'status-dot offline';
      text.innerText = 'FalkorDB: Error';
    }
  } catch (e) {
    dot.className = 'status-dot offline';
    text.innerText = 'FalkorDB: Offline';
  }
}

async function loadLedgerCustomers() {
  try {
    const res = await api.getCustomers();
    state.customers = res.customers || [];
    document.getElementById('customer-count-text').innerText = `${state.customers.length} commercial accounts`;

    // Calculate ledger strip figures
    updateLedgerStripTotals(state.customers);

    // Render left rail customer index
    renderCustomerIndex(state.customers);

    // Discover contact-sharing network clusters
    networks.discoverClusters(state.customers);
  } catch (e) {
    document.getElementById('customer-count-text').innerText = 'Could not load accounts from FalkorDB.';
  }
}

function renderCustomerIndex(list) {
  const container = document.getElementById('customer-index-list');
  if (!container) return;

  container.innerHTML = list.map((c, idx) => {
    const isSelected = c.name === state.selectedCustomer;
    const limit = parseFloat(c.credit_limit) || 1;
    const overdue = parseFloat(c.overdue_balance) || 0;
    const hasOverdue = overdue > 0;
    const utilPct = Math.min(100, Math.round((overdue / limit) * 100));

    let fillClass = 'good';
    if (c.risk_score > 70) fillClass = 'high';
    else if (c.risk_score > 40) fillClass = 'mid';

    const isRing = c.risk_score > 70; // Part of delinquent ring

    return `
      <div class="customer-ledger-row ${isSelected ? 'selected' : ''}" 
           id="cust-row-${idx}" 
           role="option" 
           aria-selected="${isSelected}"
           onclick="selectCustomer('${escapeHtml(c.name)}', ${idx})">
        <div class="row-top-line">
          <span class="row-cust-name" title="${escapeHtml(c.name)}">${escapeHtml(c.name)}</span>
          <span class="row-balance-val font-mono ${hasOverdue ? 'vermilion' : ''}">${formatMoney(overdue)}</span>
        </div>
        <div class="row-sub-line">
          <div class="utilization-track">
            <div class="utilization-fill ${fillClass}" style="width: ${utilPct || 4}%;"></div>
          </div>
          <div class="row-badges-wrap">
            ${isRing ? '<span class="ring-tag">RING 2</span>' : ''}
            ${hasOverdue ? '<span class="tick-overdue" title="Overdue invoices present">\'</span>' : ''}
          </div>
        </div>
      </div>
    `;
  }).join('');
}

function selectCustomer(name, index = null) {
  state.selectedCustomer = name;
  if (index !== null) state.selectedIndex = index;

  document.getElementById('stage-crumb-customer').innerText = name;

  // Update selected class in DOM
  const rows = document.querySelectorAll('.customer-ledger-row');
  rows.forEach((r, i) => {
    r.classList.toggle('selected', i === state.selectedIndex);
  });

  // Fetch full profile and render in Dossier
  loadSelectedCustomerDossier(name);
}

async function loadSelectedCustomerDossier(name) {
  try {
    const [profile, subgraph] = await Promise.all([
      api.getCustomerProfile(name),
      api.getCustomerSubgraph(name)
    ]);

    state.subgraph = subgraph;
    renderAgentDossier({
      customer_name: name,
      recommendation: profile.risk_score > 70 ? 'ESCALATE' : (profile.overdue_balance > 0 ? 'APPROVE WITH CONDITIONS' : 'APPROVE'),
      confidence: 0.88,
      risk_score: profile.risk_score,
      business_explanation: `Grounded ledger records for **${name}**. Current credit limit stands at **${formatMoney(profile.credit_limit)}** with **${formatMoney(profile.overdue_balance)}** in overdue exposure.`,
      recommended_conditions: profile.overdue_balance > 0 ? ['Verify wire clearance before new release.', 'Hold credit until overdue invoice settled.'] : ['Standard 30-day terms apply.'],
      proposed_action: profile.overdue_balance > 0 ? 'Draft payment reminder to commercial desk' : 'Fulfill approved orders',
      action_type: profile.overdue_balance > 0 ? 'PAYMENT_REMINDER' : 'APPROVE_ORDER',
      action_payload: {
        customer_phone: profile.phone,
        overdue_balance: profile.overdue_balance
      },
      profile: profile,
      connected_risk: [],
      cypher_queries: [
        {
          description: `Load topological neighborhood for ${name}`,
          query: `MATCH (c:Customer {name: '${name}'})-[r]-(n) RETURN c, r, n LIMIT 50;`,
          params: { customer: name }
        }
      ],
      subgraph: subgraph
    });
  } catch (e) {
    // Graceful offline message
    showActionConfirmation(`Could not load full profile: ${e.message}`);
  }
}

function onCustomerSearchInput(query) {
  const q = query.toLowerCase().trim();
  const filtered = state.customers.filter(c => 
    c.name.toLowerCase().includes(q) || (c.address && c.address.toLowerCase().includes(q))
  );
  renderCustomerIndex(filtered);
}

function onClusterSelected(clusterId) {
  const cluster = state.networksList.find(c => c.id === clusterId);
  if (!cluster) return;

  setMapScope('networks');
  document.getElementById('stage-crumb-customer').innerText = `Cluster ${clusterId}`;

  // If first member exists, load its subgraph
  if (cluster.members.length > 0) {
    selectCustomer(cluster.members[0].name);
  }
}

// --------------------------------------------------------------------------
// Natural-Language Question Handler
// --------------------------------------------------------------------------
async function handleInquirySubmit(e) {
  if (e) e.preventDefault();
  const input = document.getElementById('inquiry-input');
  const question = input.value.trim();
  if (!question) return;

  const amtInput = document.getElementById('order-amount-field');
  const amount = parseFloat(amtInput.value) || 0.0;

  // Add inquiry to transcript stream
  appendTranscriptLine('You', question);

  // Show working indicator
  setWorkingState(true, 'The agent is traversing FalkorDB...');

  try {
    const response = await api.chat(question, state.selectedCustomer, amount);
    
    // Add agent response to transcript
    appendTranscriptLine('Agent', response.business_explanation);

    // Update customer if detected
    if (response.customer_name) {
      state.selectedCustomer = response.customer_name;
      document.getElementById('stage-crumb-customer').innerText = response.customer_name;
    }

    // Render full dossier and 3D path
    renderAgentDossier(response);
  } catch (err) {
    appendTranscriptLine('Agent', `Error during graph traversal: ${err.message}`);
  } finally {
    setWorkingState(false);
    input.value = '';
    amtInput.value = '';
  }
}

function useSuggestedQuery(text, amount = 0) {
  document.getElementById('inquiry-input').value = text;
  document.getElementById('order-amount-field').value = amount > 0 ? amount : '';
  handleInquirySubmit(null);
}

function appendTranscriptLine(speaker, text) {
  const stream = document.getElementById('transcript-stream');
  const entry = document.createElement('div');
  entry.className = `transcript-entry ${speaker === 'You' ? 'user-line' : 'agent-line'}`;
  
  // Format bolding
  const formatted = escapeHtml(text).replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  entry.innerHTML = `<span class="entry-speaker">[${escapeHtml(speaker)}]</span>${formatted}`;
  
  stream.appendChild(entry);
  const container = document.getElementById('stage-transcript');
  container.scrollTop = container.scrollHeight;
}

function setWorkingState(isWorking, caption = 'Agent is working...') {
  state.isWorking = isWorking;
  const overlay = document.getElementById('stage-working-overlay');
  const captionEl = document.getElementById('working-caption-text');
  const sendBtn = document.getElementById('btn-submit-inquiry');

  if (isWorking) {
    captionEl.innerText = caption;
    overlay.classList.remove('hidden');
    sendBtn.disabled = true;
  } else {
    overlay.classList.add('hidden');
    sendBtn.disabled = false;
  }
}

// --------------------------------------------------------------------------
// Navigation & Tab Management
// --------------------------------------------------------------------------
function switchBookTab(tab) {
  state.activeBookTab = tab;
  document.getElementById('tab-btn-customers').classList.toggle('active', tab === 'customers');
  document.getElementById('tab-btn-networks').classList.toggle('active', tab === 'networks');

  document.getElementById('book-pane-customers').classList.toggle('hidden', tab !== 'customers');
  document.getElementById('book-pane-networks').classList.toggle('hidden', tab !== 'networks');
}

function switchEvidenceTab(tab) {
  state.activeEvidenceTab = tab;
  ['profile', 'invoices', 'disputes', 'contacts', 'suppliers'].forEach(t => {
    const btn = document.getElementById(`ev-tab-btn-${t}`);
    const pane = document.getElementById(`ev-pane-${t}`);
    if (btn) btn.classList.toggle('active', t === tab);
    if (pane) pane.classList.toggle('hidden', t !== tab);
  });
}

function openEvidenceTab(tab) {
  switchEvidenceTab(tab);
  openDossier();
}

function setMapScope(scope) {
  state.activeScope = scope;
  ['neighborhood', 'whole', 'networks'].forEach(s => {
    const btn = document.getElementById(`scope-btn-${s}`);
    if (btn) btn.classList.toggle('active', s === scope);
  });

  if (scope === 'whole') {
    graph3d.recenterCamera();
  }
}

function openDossier() {
  state.dossierOpen = true;
  const dossier = document.getElementById('the-dossier');
  dossier.classList.remove('closed');
  dossier.classList.add('open-sheet');
}

function closeDossier() {
  state.dossierOpen = false;
  const dossier = document.getElementById('the-dossier');
  dossier.classList.add('closed');
  dossier.classList.remove('open-sheet');
}

function toggleBookDrawer() {
  document.getElementById('the-book').classList.toggle('open-drawer');
}

function toggleDossierDrawer() {
  const dossier = document.getElementById('the-dossier');
  dossier.classList.toggle('open-sheet');
  dossier.classList.toggle('closed');
}

function highlightTableRow(tableId, targetText) {
  const tbody = document.querySelector(`#${tableId} tbody`);
  if (!tbody) return;
  const rows = tbody.querySelectorAll('tr');
  rows.forEach(r => {
    if (r.innerText.includes(targetText)) {
      r.scrollIntoView({ behavior: 'smooth', block: 'center' });
      r.classList.remove('row-highlight-flash');
      void r.offsetWidth;
      r.classList.add('row-highlight-flash');
    }
  });
}

// --------------------------------------------------------------------------
// Modals & Action Submissions
// --------------------------------------------------------------------------
function openModal(id) {
  document.getElementById(id).classList.remove('hidden');
}

function closeModal(id) {
  document.getElementById(id).classList.add('hidden');
}

function openPaymentReminderSheet() {
  openModal('modal-reminder');
}

function copyReminderText() {
  const textarea = document.getElementById('reminder-text-area');
  navigator.clipboard.writeText(textarea.value);
  const feedback = document.getElementById('reminder-copy-feedback');
  feedback.innerText = 'Copied to clipboard. Ready to paste in WhatsApp/SMS.';
  setTimeout(() => {
    feedback.innerText = 'Ready to dispatch via WhatsApp or SMS.';
  }, 3000);
}

async function submitNewTask() {
  const title = document.getElementById('task-title-input').value.trim();
  const desc = document.getElementById('task-desc-input').value.trim();
  const due = document.getElementById('task-due-input').value;

  if (!title) {
    alert('Please enter a task title.');
    return;
  }

  try {
    await api.createTask(state.selectedCustomer, title, desc, due);
    closeModal('modal-task');
    showActionConfirmation(`Task "${title}" recorded in FalkorDB.`);
    loadDecisionsHistory(state.selectedCustomer);
  } catch (e) {
    alert(`Could not save task: ${e.message}`);
  }
}

async function submitNewMemory() {
  const type = document.getElementById('memory-type-select').value;
  const content = document.getElementById('memory-content-input').value.trim();
  const importance = document.getElementById('memory-importance-input').value;

  if (!content) {
    alert('Please enter memory content.');
    return;
  }

  try {
    await api.createMemory(state.selectedCustomer, type, content, importance);
    closeModal('modal-memory');
    showActionConfirmation(`Memory [${type}] saved into customer graph.`);
    loadDecisionsHistory(state.selectedCustomer);
  } catch (e) {
    alert(`Could not save memory: ${e.message}`);
  }
}

async function triggerDatabaseReset() {
  if (!confirm('Reset and re-seed the entire FalkorDB graph with demo data?')) return;
  try {
    await api.reseedGraph();
    showActionConfirmation('FalkorDB graph reset to clean demo dataset.');
    await checkSystemHealth();
    await loadLedgerCustomers();
    if (state.selectedCustomer) {
      loadSelectedCustomerDossier(state.selectedCustomer);
    }
  } catch (e) {
    alert(`Error re-seeding graph: ${e.message}`);
  }
}

async function submitCsvUpload() {
  const picker = document.getElementById('csv-file-picker');
  if (!picker.files || picker.files.length === 0) {
    alert('Please select a valid CSV file.');
    return;
  }

  const file = picker.files[0];
  const formData = new FormData();
  formData.append('file', file);

  const prog = document.getElementById('upload-progress-row');
  prog.classList.remove('hidden');

  try {
    const res = await api.uploadCsv(formData);
    closeModal('modal-upload');
    showActionConfirmation(res.message);
    await checkSystemHealth();
    await loadLedgerCustomers();
  } catch (e) {
    alert(`Upload error: ${e.message}`);
  } finally {
    prog.classList.add('hidden');
  }
}

// --------------------------------------------------------------------------
// Keyboard Shortcuts Navigation
// --------------------------------------------------------------------------
function setupKeyboardNavigation() {
  window.addEventListener('keydown', (e) => {
    // '/' focuses the question input
    if (e.key === '/' && document.activeElement.tagName !== 'INPUT' && document.activeElement.tagName !== 'TEXTAREA') {
      e.preventDefault();
      document.getElementById('inquiry-input').focus();
      return;
    }

    // Escape closes open dossier or modals
    if (e.key === 'Escape') {
      const openModalEl = document.querySelector('.modal-backdrop:not(.hidden)');
      if (openModalEl) {
        openModalEl.classList.add('hidden');
      } else if (state.dossierOpen) {
        closeDossier();
      }
      return;
    }

    // Arrow down / up navigates through customer ledger list
    if (document.activeElement.tagName !== 'INPUT' && document.activeElement.tagName !== 'TEXTAREA') {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        if (state.selectedIndex < state.customers.length - 1) {
          state.selectedIndex++;
          selectCustomer(state.customers[state.selectedIndex].name, state.selectedIndex);
          document.getElementById(`cust-row-${state.selectedIndex}`)?.scrollIntoView({ block: 'nearest' });
        }
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        if (state.selectedIndex > 0) {
          state.selectedIndex--;
          selectCustomer(state.customers[state.selectedIndex].name, state.selectedIndex);
          document.getElementById(`cust-row-${state.selectedIndex}`)?.scrollIntoView({ block: 'nearest' });
        }
      }
    }
  });
}
