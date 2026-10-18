import { create } from 'zustand';
import {
  HealthResponse,
  CustomerSummary,
  CustomerProfile,
  SubgraphResponse,
  PaymentHistoryItem,
  ConnectedRiskItem,
  CustomerDecisionsResponse,
  ChatResponse,
  NetworkRing,
  Verdict,
} from '@/api/types';
import { apiClient } from '@/api/client';
import { discoverNetworkRings } from '@/lib/networks';

export type ModalType = 'override' | 'reminder' | 'task' | 'memory' | 'upload' | 'transcript' | null;

interface StoreState {
  // Graph health & metadata
  health: HealthResponse | null;
  isLoadingHealth: boolean;

  // Customers & Networks
  customers: CustomerSummary[];
  rings: NetworkRing[];
  isLoadingCustomers: boolean;
  activeRailTab: 'customers' | 'networks';
  searchQuery: string;
  sortBy: 'risk' | 'balance' | 'limit' | 'name';

  // Selection
  selectedCustomerName: string | null;
  selectedRingId: string | null;
  focusedNodeId: string | null;

  // Selected Customer Data
  profile: CustomerProfile | null;
  subgraph: SubgraphResponse | null;
  history: PaymentHistoryItem[];
  connectedRisks: ConnectedRiskItem[];
  decisions: CustomerDecisionsResponse | null;
  isLoadingCustomerData: boolean;

  // Agent State
  isAgentWorking: boolean;
  agentStatusText: string;
  lastChatResponse: ChatResponse | null;
  chatTranscript: Array<{ role: 'user' | 'agent'; text: string; timestamp: Date; response?: ChatResponse }>;
  activeEvidenceNodes: string[];
  activeEvidenceEdges: Array<{ source: string; target: string; type: string }>;

  // Dossier State
  dossierOpen: boolean;
  activeDossierTab: 'overview' | 'covenants' | 'cypher' | 'history' | 'journal';

  // Modals
  activeModal: ModalType;
  modalData: any;

  // Camera & View Mode
  viewMode: 'holistic' | 'focused';
  cameraCommand: 'zoom_in' | 'zoom_out' | 'holistic' | 'focus' | null;

  // Actions
  fetchHealth: () => Promise<void>;
  fetchCustomers: () => Promise<void>;
  selectCustomer: (name: string, openDossier?: boolean) => Promise<void>;
  selectRing: (ring: NetworkRing | null) => void;
  setFocusedNode: (id: string | null) => void;
  triggerCameraCommand: (cmd: 'zoom_in' | 'zoom_out' | 'holistic' | 'focus') => void;
  clearCameraCommand: () => void;
  setViewMode: (mode: 'holistic' | 'focused') => void;
  setActiveRailTab: (tab: 'customers' | 'networks') => void;
  setSearchQuery: (query: string) => void;
  setSortBy: (sort: 'risk' | 'balance' | 'limit' | 'name') => void;
  setDossierOpen: (open: boolean) => void;
  setActiveDossierTab: (tab: 'overview' | 'covenants' | 'cypher' | 'history' | 'journal') => void;
  openModal: (type: ModalType, data?: any) => void;
  closeModal: () => void;
  askAgent: (question: string, customerName?: string, orderAmount?: number) => Promise<void>;
  seedData: () => Promise<void>;
}

export const useStore = create<StoreState>((set, get) => ({
  health: null,
  isLoadingHealth: false,

  customers: [],
  rings: [],
  isLoadingCustomers: false,
  activeRailTab: 'customers',
  searchQuery: '',
  sortBy: 'risk',

  selectedCustomerName: null,
  selectedRingId: null,
  focusedNodeId: null,

  profile: null,
  subgraph: null,
  history: [],
  connectedRisks: [],
  decisions: null,
  isLoadingCustomerData: false,

  isAgentWorking: false,
  agentStatusText: '',
  lastChatResponse: null,
  chatTranscript: [],
  activeEvidenceNodes: [],
  activeEvidenceEdges: [],

  dossierOpen: false,
  activeDossierTab: 'overview',

  activeModal: null,
  modalData: null,

  viewMode: 'focused',
  cameraCommand: null,

  fetchHealth: async () => {
    set({ isLoadingHealth: true });
    try {
      const health = await apiClient.getHealth();
      set({ health, isLoadingHealth: false });
    } catch (e) {
      console.error('Failed to fetch health:', e);
      set({ isLoadingHealth: false });
    }
  },

  fetchCustomers: async () => {
    set({ isLoadingCustomers: true });
    try {
      const res = await apiClient.getCustomers();
      const rawCustomers = res.customers || [];
      const rings = discoverNetworkRings(rawCustomers);

      // Mark which customers are members of discovered rings
      const ringMemberNames = new Set<string>();
      for (const r of rings) {
        for (const m of r.members) {
          ringMemberNames.add(m.name);
        }
      }

      const customers = rawCustomers.map((c) => ({
        ...c,
        isPartOfRing: ringMemberNames.has(c.name),
      }));

      set({ customers, rings, isLoadingCustomers: false });
    } catch (e) {
      console.error('Failed to fetch customers:', e);
      set({ isLoadingCustomers: false });
    }
  },

  selectCustomer: async (name: string, openDossier = true) => {
    if (!name) return;
    set({
      selectedCustomerName: name,
      selectedRingId: null,
      focusedNodeId: name,
      isLoadingCustomerData: true,
      dossierOpen: openDossier,
    });

    try {
      const [profile, subgraph, historyRes, connectedRiskRes, decisionsRes] = await Promise.allSettled([
        apiClient.getCustomerProfile(name),
        apiClient.getCustomerSubgraph(name),
        apiClient.getCustomerHistory(name),
        apiClient.getConnectedRisk(name),
        apiClient.getCustomerDecisions(name),
      ]);

      set({
        profile: profile.status === 'fulfilled' ? profile.value : null,
        subgraph: subgraph.status === 'fulfilled' ? subgraph.value : null,
        history: historyRes.status === 'fulfilled' ? historyRes.value.history : [],
        connectedRisks: connectedRiskRes.status === 'fulfilled' ? connectedRiskRes.value.connected_risks : [],
        decisions: decisionsRes.status === 'fulfilled' ? decisionsRes.value : null,
        isLoadingCustomerData: false,
      });
    } catch (e) {
      console.error('Error fetching customer deep data:', e);
      set({ isLoadingCustomerData: false });
    }
  },

  selectRing: (ring: NetworkRing | null) => {
    if (!ring) {
      set({ selectedRingId: null });
      return;
    }
    set({
      selectedRingId: ring.id,
      selectedCustomerName: ring.members[0]?.name || null,
      dossierOpen: true,
    });
    if (ring.members[0]) {
      get().selectCustomer(ring.members[0].name, true);
    }
  },

  setFocusedNode: (id: string | null) => {
    set({ focusedNodeId: id });
  },

  triggerCameraCommand: (cmd) => set({ cameraCommand: cmd }),
  clearCameraCommand: () => set({ cameraCommand: null }),
  setViewMode: (mode) => set({ viewMode: mode }),

  setActiveRailTab: (tab) => set({ activeRailTab: tab }),
  setSearchQuery: (query) => set({ searchQuery: query }),
  setSortBy: (sort) => set({ sortBy: sort }),
  setDossierOpen: (open) => set({ dossierOpen: open }),
  setActiveDossierTab: (tab) => set({ activeDossierTab: tab }),
  openModal: (type, data = null) => set({ activeModal: type, modalData: data }),
  closeModal: () => set({ activeModal: null, modalData: null }),

  askAgent: async (question: string, customerName?: string, orderAmount = 0) => {
    const targetCust = customerName || get().selectedCustomerName || undefined;

    set((state) => ({
      isAgentWorking: true,
      agentStatusText: 'The agent is traversing multi-hop topologies...',
      chatTranscript: [
        ...state.chatTranscript,
        { role: 'user', text: question, timestamp: new Date() },
      ],
    }));

    try {
      const response = await apiClient.askAgent({
        question,
        customer_name: targetCust,
        order_amount: orderAmount,
      });

      // Normalize raw evidence nodes into string identifiers for 3D highlighting
      const rawEvidenceNodes = response.evidence_nodes || [];
      const normalizedEvidenceNodeIds: string[] = rawEvidenceNodes
        .map((n: any) => {
          if (typeof n === 'string') return n;
          if (n && typeof n === 'object') {
            return n.id || n.name || n.invoice_number || n.title || '';
          }
          return '';
        })
        .filter(Boolean);

      // Update active evidence nodes and edges
      set((state) => ({
        isAgentWorking: false,
        agentStatusText: '',
        lastChatResponse: response,
        activeEvidenceNodes: normalizedEvidenceNodeIds,
        activeEvidenceEdges: response.evidence_edges || [],
        selectedCustomerName: response.customer_name || targetCust || state.selectedCustomerName,
        dossierOpen: true,
        chatTranscript: [
          ...state.chatTranscript,
          {
            role: 'agent',
            text: response.business_explanation,
            timestamp: new Date(),
            response,
          },
        ],
      }));

      // If customer changed or returned in response, refresh profile
      if (response.customer_name) {
        get().selectCustomer(response.customer_name, true);
      }
    } catch (e: any) {
      console.error('Agent query error:', e);
      set({
        isAgentWorking: false,
        agentStatusText: '',
      });
      alert(`Agent inquiry failed: ${e.message}`);
    }
  },

  seedData: async () => {
    try {
      await apiClient.seedDatabase();
      await get().fetchHealth();
      await get().fetchCustomers();
    } catch (e: any) {
      console.error('Seed error:', e);
      alert(`Re-seeding failed: ${e.message}`);
    }
  },
}));
