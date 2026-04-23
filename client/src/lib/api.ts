import { toast } from 'sonner';
import { useStore } from '@/store';

class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = 'ApiError';
  }
}

async function request<T>(url: string, options: RequestInit = {}): Promise<T> {
  const user = useStore.getState().user;
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (user) {
    headers['X-User-Id'] = user.id;
  }

  // Add access code from localStorage
  const accessCode = localStorage.getItem('fathom_access_code');
  if (accessCode) {
    headers['X-Access-Code'] = accessCode;
  }

  const res = await fetch(url, { ...options, headers });

  if (res.status === 403) {
    // Access denied - clear invalid code and redirect to auth
    localStorage.removeItem('fathom_access_code');
    useStore.getState().logout();
    window.location.href = '/auth';
    throw new ApiError(403, 'Access denied');
  }

  if (res.status === 401) {
    useStore.getState().logout();
    window.location.href = '/auth';
    throw new ApiError(401, 'Unauthorized');
  }

  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: 'Request failed' }));
    const message = body.error || body.message || `Request failed (${res.status})`;
    toast.error(message);
    throw new ApiError(res.status, message);
  }

  return res.json() as Promise<T>;
}

export const api = {
  get<T>(url: string): Promise<T> {
    return request<T>(url);
  },

  post<T>(url: string, body?: unknown): Promise<T> {
    return request<T>(url, {
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined,
    });
  },

  patch<T>(url: string, body?: unknown): Promise<T> {
    return request<T>(url, {
      method: 'PATCH',
      body: body ? JSON.stringify(body) : undefined,
    });
  },

  delete<T>(url: string): Promise<T> {
    return request<T>(url, { method: 'DELETE' });
  },
};
