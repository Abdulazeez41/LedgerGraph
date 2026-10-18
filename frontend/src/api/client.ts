import {
  HealthResponse,
  CustomerSummary,
  CustomerProfile,
  SubgraphResponse,
  PaymentHistoryItem,
  ConnectedRiskItem,
  CustomerDecisionsResponse,
  ChatRequest,
  ChatResponse,
} from './types';
import { API_BASE_URL } from '@/config/locale';

async function apiRequest<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  });

  if (!response.ok) {
    let errorDetail = response.statusText;
    try {
      const errJson = await response.json();
      errorDetail = errJson.detail || errJson.message || errorDetail;
    } catch {
      // ignore
    }
    throw new Error(`API error (${response.status}): ${errorDetail}`);
  }

  return response.json();
}

export const apiClient = {
  async getHealth(): Promise<HealthResponse> {
    return apiRequest<HealthResponse>('/api/health');
  },

  async getCustomers(): Promise<{ customers: CustomerSummary[] }> {
    return apiRequest<{ customers: CustomerSummary[] }>('/api/customers');
  },

  async getCustomerProfile(customerName: string): Promise<CustomerProfile> {
    return apiRequest<CustomerProfile>(`/api/customers/${encodeURIComponent(customerName)}/profile`);
  },

  async getCustomerSubgraph(customerName: string): Promise<SubgraphResponse> {
    return apiRequest<SubgraphResponse>(`/api/customers/${encodeURIComponent(customerName)}/subgraph`);
  },

  async getCustomerHistory(customerName: string): Promise<{ customer_name: string; history: PaymentHistoryItem[] }> {
    return apiRequest<{ customer_name: string; history: PaymentHistoryItem[] }>(
      `/api/customers/${encodeURIComponent(customerName)}/history`
    );
  },

  async getConnectedRisk(customerName: string): Promise<{ customer_name: string; connected_risks: ConnectedRiskItem[] }> {
    return apiRequest<{ customer_name: string; connected_risks: ConnectedRiskItem[] }>(
      `/api/customers/${encodeURIComponent(customerName)}/connected-risk`
    );
  },

  async getCustomerDecisions(customerName: string): Promise<CustomerDecisionsResponse> {
    return apiRequest<CustomerDecisionsResponse>(
      `/api/customers/${encodeURIComponent(customerName)}/decisions`
    );
  },

  async askAgent(req: ChatRequest): Promise<ChatResponse> {
    const t0 = performance.now();
    const data = await apiRequest<ChatResponse>('/api/chat', {
      method: 'POST',
      body: JSON.stringify(req),
    });
    const t1 = performance.now();
    data.latency_ms = Math.round(t1 - t0);
    return data;
  },

  async overrideDecision(payload: {
    decision_id: string;
    override_recommendation: string;
    user_feedback: string;
  }): Promise<{ status: string; decision: any }> {
    return apiRequest('/api/actions/override', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  async createTask(payload: {
    customer_name: string;
    title: string;
    description: string;
    due_date?: string;
  }): Promise<{ status: string; task_id?: string }> {
    return apiRequest('/api/actions/task', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  async createMemory(payload: {
    customer_name: string;
    memory_type: string;
    content: string;
    importance: number;
  }): Promise<{ status: string; memory_id?: string }> {
    return apiRequest('/api/actions/memory', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  async generateReminder(payload: {
    customer_name: string;
    invoice_number?: string;
    custom_note?: string;
  }): Promise<{
    status: string;
    customer_name: string;
    phone: string;
    overdue_balance: number;
    message: string;
    reminder_text: string;
  }> {
    return apiRequest('/api/actions/reminder', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  async seedDatabase(): Promise<{ status: string; message: string }> {
    return apiRequest('/api/seed', {
      method: 'POST',
    });
  },

  async uploadCsv(file: File): Promise<{ status: string; message: string }> {
    const formData = new FormData();
    formData.append('file', file);
    const response = await fetch(`${API_BASE_URL}/api/upload-csv`, {
      method: 'POST',
      body: formData,
    });
    if (!response.ok) {
      const err = await response.json().catch(() => ({ detail: 'Upload error' }));
      throw new Error(err.detail || 'Upload failed');
    }
    return response.json();
  },
};
