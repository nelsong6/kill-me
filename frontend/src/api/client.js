const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export async function apiFetch(path, options = {}) {
  const token = localStorage.getItem('token');
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  let res;
  for (let attempt = 0; attempt < 3; attempt++) {
    res = await fetch(`${API_URL}${path}`, { ...options, headers });
    if (res.status !== 503) break;
    await new Promise((r) => setTimeout(r, 1000 * 2 ** attempt));
  }

  if (!res) throw new Error('No response');

  if (res.status === 401) {
    localStorage.removeItem('token');
    // Only redirect for authenticated actions, not public reads
    if (options.method && options.method !== 'GET') {
      import('../auth/msal.js').then(({ loginWithMicrosoft }) => loginWithMicrosoft());
    }
    throw new Error('Unauthorized');
  }

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `Request failed: ${res.status}`);
  }

  if (res.status === 204) return undefined;
  return res.json();
}
