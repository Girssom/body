const BASE = import.meta.env.VITE_API_BASE_URL || '';

function getToken(): string | null {
  return window.localStorage.getItem('fitness_token');
}

export async function api<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const token = getToken();
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };
  if (token) {
    (headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;
  }
  const res = await fetch(`${BASE}${path}`, { ...options, headers });
  if (res.status === 401) {
    window.localStorage.removeItem('fitness_token');
    window.location.href = '/login';
    throw new Error('Unauthorized');
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || res.statusText || 'Request failed');
  }
  return data as T;
}

export type User = { id: string; email: string; plan: 'free' | 'pro' };

export const authApi = {
  register: (email: string, password: string) =>
    api<{ token: string; user: User }>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),
  login: (email: string, password: string) =>
    api<{ token: string; user: User }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),
  me: () => api<{ user: User }>('/api/auth/me'),
};

export const workoutsApi = {
  list: () => api<{ logs: Array<Record<string, unknown>> }>('/api/workouts'),
  save: (logs: Array<Record<string, unknown>>) =>
    api<{ ok: boolean }>('/api/workouts', {
      method: 'POST',
      body: JSON.stringify({ logs }),
    }),
  delete: (id: string) =>
    api<{ ok: boolean }>(`/api/workouts/${id}`, { method: 'DELETE' }),
};

export const payApi = {
  createOrder: () =>
    api<{ orderId: string; code_url: string; amount: number }>('/api/pay/create-order', {
      method: 'POST',
    }),
};

export const reportApi = {
  list: () =>
    api<{
      reports: Array<{ id: string; year: number; downloadUrl: string | null; createdAt: string }>;
    }>('/api/report/list'),
  generate: (year: number) =>
    api<{ id: string; year: number; downloadUrl: string | null }>('/api/report/generate', {
      method: 'POST',
      body: JSON.stringify({ year }),
    }),
  getDownloadUrl: (id: string) =>
    api<{ url: string }>(`/api/report/url/${id}`).then((r) => r.url),
};
