const API_URL = 'http://localhost:5000/api';

export default async function apiFetch(endpoint, method = 'GET', body = null, token = null) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(API_URL + endpoint, {
    method,
    headers,
    body: body ? JSON.stringify(body) : null,
  });

  if (!response.ok) {
    let errorMessage = 'API Error';
    try {
      const errorData = await response.json();
      errorMessage = errorData.message || errorMessage;
    } catch (err) {
      console.error('Failed to parse error response:', err);
    }
    throw new Error(errorMessage);
  }
  return response.json();
}
