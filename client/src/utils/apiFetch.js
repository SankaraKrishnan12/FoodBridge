const API_URL = (import.meta.env.VITE_API_URL || '/api').replace(/\/$/, '');

export function mediaUrl(filename) {
  if (!filename) return '';
  if (filename.startsWith('http')) return filename;
  return `${API_URL.replace(/\/api$/, '')}/uploads/${filename}`;
}

export default async function apiFetch(endpoint, method = 'GET', body = null, token = null) {
  const headers = {};
  if (token) headers.Authorization = `Bearer ${token}`;
  const isFormData = typeof FormData !== 'undefined' && body instanceof FormData;
  if (body && !isFormData) headers['Content-Type'] = 'application/json';

  const path = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  const response = await fetch(API_URL + path, {
    method,
    headers,
    credentials: 'include',
    body: body ? (isFormData ? body : JSON.stringify(body)) : null,
  });

  if (response.status === 401) {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.dispatchEvent(new Event('auth:expired'));
  }

  if (!response.ok) {
    let errorMessage = 'API Error';
    try {
      const errorData = await response.json();
      errorMessage = errorData.message || errorData.error || errorMessage;
    } catch {
      /* ignore */
    }
    throw new Error(errorMessage);
  }
  return response.json();
}
