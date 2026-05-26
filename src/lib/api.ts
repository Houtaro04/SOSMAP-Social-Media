/**
 * API Layer trung tam - tat ca cac service goi qua day
 * Base URL: https://localhost:44340/api
 */

const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://localhost:44340/api';

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

const handleError = async (res: Response) => {
  let errData: any;
  try {
    errData = await res.json();
  } catch {
    try {
      errData = await res.text();
    } catch {
      errData = { message: res.statusText };
    }
  }

  let msg = typeof errData === 'string' ? errData : errData?.message;
  
  // Nêu lỗi rỗng hoặc là lỗi mặc định của HTTP, ta sẽ format lại thành tiếng Việt
  if (!msg || msg.trim() === '' || msg === 'Forbidden' || msg === 'Unauthorized' || msg === 'Not Found' || msg === res.statusText) {
    if (res.status === 403) msg = 'Bạn không có quyền truy cập hoặc tài khoản chưa được phê duyệt.';
    else if (res.status === 401) msg = 'Phiên đăng nhập không hợp lệ hoặc đã hết hạn.';
    else if (res.status === 404) msg = 'Không tìm thấy dữ liệu yêu cầu.';
    else if (res.status === 500) msg = 'Hệ thống đang bận. Vui lòng thử lại sau.';
    else msg = `Có lỗi xảy ra (Mã lỗi: ${res.status}).`;
  }
  
  throw new Error(msg);
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
    await handleError(res);
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
    await handleError(res);
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
    await handleError(res);
  }
  const text = await res.text();
  try { return JSON.parse(text); } catch { return text as T; }
}

// ─── PATCH ───────────────────────────────────────────────────────────────────
export async function apiPatch<T>(
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
    method: 'PATCH',
    headers,
    body: isFormData ? (body as any) : JSON.stringify(body),
  });
  if (!res.ok) {
    await handleError(res);
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
    await handleError(res);
  }
  return res.json();
}

export { BASE_URL };

