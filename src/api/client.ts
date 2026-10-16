/**
 * SpendWise API Client
 * Uses standard fetch with cookie credentials and token fallback.
 */

const BASE_URL = ((import.meta.env.VITE_API_URL as string) || '/api').replace(/\/+$/, '');

class ApiClient {
  private token: string | null = null;

  constructor() {
    this.token = localStorage.getItem('spendwise_token');
  }

  setToken(token: string | null) {
    this.token = token;
    if (token) {
      localStorage.setItem('spendwise_token', token);
    } else {
      localStorage.removeItem('spendwise_token');
    }
  }

  getToken(): string | null {
    return this.token;
  }

  private getHeaders(customHeaders: Record<string, string> = {}): HeadersInit {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...customHeaders,
    };
    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }
    return headers;
  }

  async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${BASE_URL}${endpoint}`;
    const headers = this.getHeaders((options.headers as Record<string, string>) || {});

    const response = await fetch(url, {
      ...options,
      headers,
      credentials: 'include',
    });

    if (response.status === 204) {
      return {} as T;
    }

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      const errorMsg = data.error || data.message || `Request failed with status ${response.status}`;
      const err = new Error(errorMsg) as any;
      err.status = response.status;
      err.data = data;
      throw err;
    }

    return data as T;
  }

  get<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'GET' });
  }

  post<T>(endpoint: string, body?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  put<T>(endpoint: string, body?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  delete<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'DELETE' });
  }

  /**
   * Triggers browser download for Excel or file exports
   */
  async downloadFile(endpoint: string, defaultFilename: string): Promise<void> {
    const url = `${BASE_URL}${endpoint}`;
    const headers: Record<string, string> = {};
    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    const response = await fetch(url, {
      method: 'GET',
      headers,
      credentials: 'include',
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({ error: 'Download failed' }));
      throw new Error(err.error || 'Failed to download file');
    }

    const blob = await response.blob();
    const excelBlob = new Blob([blob], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });
    const downloadUrl = window.URL.createObjectURL(excelBlob);
    const a = document.createElement('a');
    a.href = downloadUrl;

    // Read filename from Content-Disposition header if available
    const disposition = response.headers.get('content-disposition');
    let filename = defaultFilename;
    if (disposition && disposition.includes('filename=')) {
      const match = disposition.match(/filename="?([^"]+)"?/);
      if (match && match[1]) {
        filename = match[1];
      }
    }

    a.download = filename;
    document.body.appendChild(a);
    a.click();

    // Delay cleanup to allow browser download thread to complete
    setTimeout(() => {
      if (document.body.contains(a)) {
        document.body.removeChild(a);
      }
      window.URL.revokeObjectURL(downloadUrl);
    }, 30000);
  }
}

export const api = new ApiClient();
