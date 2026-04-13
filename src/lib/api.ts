/**
 * API Layer trung tam - tat ca cac service goi qua day
 * Base URL: https://localhost:44340/api
 */

const BASE_URL = 'https://localhost:44340/api';

// ─── Helper lay token tu localStorage ───────────────────────────────────────
const getAuthToken = (): string | null => {
  try {
    const isAdminPath = window.location.pathname.startsWith('/admin');
    
    // Thu tu uu tien dua tren route hien tai
    const storages = isAdminPath 
      ? ['sosmap-admin-storage', 'sosmap-auth-storage']
      : ['sosmap-auth-storage', 'sosmap-admin-storage'];

    for (const key of storages) {
      const raw = localStorage.getItem(key);
      if (raw) {
        const { state } = JSON.parse(raw);
        if (state?.token) return state.token;
      }
    }
  } catch { /* ignore */ }
  return null;
};

const buildHeaders = (withAuth = true): HeadersInit => {
  const headers: HeadersInit = { 'Content-Type': 'application/json' };
  if (withAuth) {
    const token = getAuthToken();
    if (token) (headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;
  }
  return headers;
};

// ─── GET ─────────────────────────────────────────────────────────────────────
export async function apiGet<T>(
  path: string,
  params?: Record<string, string | number | boolean | undefined>,
  withAuth = true
): Promise<T> {
  const url = new URL(`${BASE_URL}${path}`);
  if (params) {
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined) url.searchParams.append(k, String(v));
    });
  }
  const res = await fetch(url.toString(), { headers: buildHeaders(withAuth) });
  if (!res.ok) {
    const err = await res.json().catch(() => res.text()).catch(() => ({ message: res.statusText }));
    throw new Error(typeof err === 'string' ? err : (err.message || `HTTP ${res.status}`));
  }
  const text = await res.text();
  try { return JSON.parse(text); } catch { return text as T; }
}

// ─── POST ────────────────────────────────────────────────────────────────────
export async function apiPost<T>(
  path: string,
  body: unknown,
  withAuth = true
): Promise<T> {
  const isFormData = body instanceof FormData;
  const headers = buildHeaders(withAuth);
  
  if (isFormData) {
    // Let the browser set the boundary for multipart/form-data
    delete (headers as any)['Content-Type'];
  }

  const res = await fetch(`${BASE_URL}${path}`, {
    method: 'POST',
    headers,
    body: isFormData ? (body as any) : JSON.stringify(body),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => res.text()).catch(() => ({ message: res.statusText }));
    throw new Error(typeof err === 'string' ? err : (err.message || `HTTP ${res.status}`));
  }
  const text = await res.text();
  try { return JSON.parse(text); } catch { return text as T; }
}

// ─── PUT ─────────────────────────────────────────────────────────────────────
export async function apiPut<T>(
  path: string,
  body: unknown,
  withAuth = true
): Promise<T> {
  const isFormData = body instanceof FormData;
  const headers = buildHeaders(withAuth);
  
  if (isFormData) {
    delete (headers as any)['Content-Type'];
  }

  const res = await fetch(`${BASE_URL}${path}`, {
    method: 'PUT',
    headers,
    body: isFormData ? (body as any) : JSON.stringify(body),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => res.text()).catch(() => ({ message: res.statusText }));
    throw new Error(typeof err === 'string' ? err : (err.message || `HTTP ${res.status}`));
  }
  const text = await res.text();
  try { return JSON.parse(text); } catch { return text as T; }
}

// ─── DELETE ──────────────────────────────────────────────────────────────────
export async function apiDelete<T>(path: string, withAuth = true): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    method: 'DELETE',
    headers: buildHeaders(withAuth),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: res.statusText }));
    throw new Error(err.message || `HTTP ${res.status}`);
  }
  return res.json();
}

export { BASE_URL };
