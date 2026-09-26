export const API_BASE = import.meta.env.DEV ? '/api-proxy' : 'https://api.meme.skyfly.hackclub.app';

let tokenPromise: Promise<string | null> | null = null;
let tokenRefreshPromise: Promise<string | null> | null = null;

async function requestGuestToken(): Promise<string | null> {
  try {
    const response = await fetch(`${API_BASE}/auth/guest`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    });
    if (response.ok) {
      const result = await response.json();
      const data = result.data !== undefined ? result.data : result;
      if (data.access_token) {
        localStorage.setItem('access_token', data.access_token);
        if (data.refresh_token) {
          localStorage.setItem('refresh_token', data.refresh_token);
        }
        return data.access_token;
      }
    }
    return null;
  } catch (err) {
    console.error('Failed to get guest token', err);
    return null;
  }
}

async function getValidToken(): Promise<string | null> {
  let token = localStorage.getItem('access_token');
  if (token) return token;

  if (tokenPromise) return tokenPromise;

  tokenPromise = requestGuestToken().finally(() => {
    tokenPromise = null;
  });

  return tokenPromise;
}

async function refreshTokenReq(): Promise<string | null> {
  const refresh_token = localStorage.getItem('refresh_token');
  if (!refresh_token) return null;

  if (tokenRefreshPromise) return tokenRefreshPromise;

  tokenRefreshPromise = (async () => {
    try {
      const response = await fetch(`${API_BASE}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refresh_token }),
      });
      if (response.ok) {
        const result = await response.json();
        const data = result.data !== undefined ? result.data : result;
        if (data.access_token) {
          localStorage.setItem('access_token', data.access_token);
          if (data.refresh_token) {
            localStorage.setItem('refresh_token', data.refresh_token);
          }
          return data.access_token;
        }
      }
      return null;
    } catch (err) {
      console.error('Failed to refresh token', err);
      return null;
    } finally {
      tokenRefreshPromise = null;
    }
  })();

  return tokenRefreshPromise;
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  // Skip interceptor for auth endpoints to prevent loops
  if (endpoint.includes('/auth/guest') || endpoint.includes('/auth/refresh') || endpoint.includes('/auth/login') || endpoint.includes('/auth/register')) {
    return doFetch<T>(endpoint, options, null);
  }

  let token = await getValidToken();
  try {
    return await doFetch<T>(endpoint, options, token);
  } catch (err: any) {
    if (err.status === 401) {
      // First try to refresh token
      const newToken = await refreshTokenReq();
      if (newToken) {
        return doFetch<T>(endpoint, options, newToken);
      }
      // If refresh failed, clear tokens and fallback to guest
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      token = await getValidToken();
      return doFetch<T>(endpoint, options, token);
    }
    throw err;
  }
}

async function doFetch<T>(endpoint: string, options: RequestInit, token: string | null): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...((options.headers as Record<string, string>) || {}),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const error: any = new Error(`API Error: ${response.status} ${response.statusText}`);
    error.status = response.status;
    throw error;
  }

  if (response.status === 204 || response.headers.get('content-length') === '0') {
    return {} as T;
  }

  const data = await response.json();
  return data.data !== undefined ? data.data : data;
}

export const api = {
  get: <T>(endpoint: string, options?: RequestInit) => request<T>(endpoint, { ...options, method: 'GET' }),
  post: <T>(endpoint: string, body?: any, options?: RequestInit) => request<T>(endpoint, { ...options, method: 'POST', body: body ? JSON.stringify(body) : undefined }),
  patch: <T>(endpoint: string, body?: any, options?: RequestInit) => request<T>(endpoint, { ...options, method: 'PATCH', body: body ? JSON.stringify(body) : undefined }),
  delete: <T>(endpoint: string, options?: RequestInit) => request<T>(endpoint, { ...options, method: 'DELETE' }),
};
