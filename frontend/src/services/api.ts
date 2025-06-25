import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

// Create axios instance
const api = axios.create({
  baseURL: `${API_BASE_URL}/api/v1`,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    console.log(`Making ${config.method?.toUpperCase()} request to ${config.url}`);
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    console.error('API Error:', error.response?.data || error.message);
    return Promise.reject(error);
  }
);

// Types
export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  metadata?: any;
}

export interface ChatSession {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  messageCount?: number;
  lastMessage?: {
    content: string;
    timestamp: string;
    role: string;
  };
  messages?: ChatMessage[];
}

export interface Document {
  id: string;
  filename: string;
  size: number;
  mimeType: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  uploadedAt: string;
  processedAt?: string;
  metadata?: any;
  contentPreview?: string;
}

export interface ChatResponse {
  sessionId: string;
  message: ChatMessage;
  context: {
    documentsUsed: number;
    webSearchUsed: boolean;
    sources: any[];
  };
  usage?: any;
}

// Chat API
export const chatAPI = {
  sendMessage: async (message: string, sessionId?: string): Promise<ChatResponse> => {
    const response = await api.post('/chat', { message, sessionId });
    return response.data.data;
  },

  getSessions: async (): Promise<ChatSession[]> => {
    const response = await api.get('/chat/sessions');
    return response.data.data;
  },

  getSession: async (sessionId: string): Promise<ChatSession> => {
    const response = await api.get(`/chat/sessions/${sessionId}`);
    return response.data.data;
  },

  updateSession: async (sessionId: string, title: string): Promise<ChatSession> => {
    const response = await api.put(`/chat/sessions/${sessionId}`, { title });
    return response.data.data;
  },

  deleteSession: async (sessionId: string): Promise<void> => {
    await api.delete(`/chat/sessions/${sessionId}`);
  },
};

// Documents API
export const documentsAPI = {
  upload: async (file: File, onProgress?: (progress: number) => void): Promise<Document> => {
    const formData = new FormData();
    formData.append('document', file);

    const response = await api.post('/documents/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress: (progressEvent) => {
        if (onProgress && progressEvent.total) {
          const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          onProgress(progress);
        }
      },
    });

    return response.data.data;
  },

  getDocuments: async (): Promise<Document[]> => {
    const response = await api.get('/documents');
    return response.data.data;
  },

  getDocument: async (id: string): Promise<Document> => {
    const response = await api.get(`/documents/${id}`);
    return response.data.data;
  },

  deleteDocument: async (id: string): Promise<void> => {
    await api.delete(`/documents/${id}`);
  },

  reprocessDocument: async (id: string): Promise<void> => {
    await api.post(`/documents/${id}/reprocess`);
  },

  getStats: async (): Promise<any> => {
    const response = await api.get('/documents/stats/summary');
    return response.data.data;
  },
};

// Health check
export const healthAPI = {
  check: async (): Promise<any> => {
    const response = await api.get('/health');
    return response.data;
  },
};

export default api;
