const BASE = "/api";
const TOKEN_KEY = "brainhub_token";

export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token) {
  if (token) localStorage.setItem(TOKEN_KEY, token);
  else localStorage.removeItem(TOKEN_KEY);
}

// Fired whenever a request comes back 401 so the app can log the user out.
let onUnauthorized = () => {};
export function setUnauthorizedHandler(fn) {
  onUnauthorized = fn;
}

async function handle(res) {
  if (res.status === 401) {
    onUnauthorized();
  }
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `Request failed: ${res.status}`);
  }
  return res.json();
}

function authHeaders() {
  const token = getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export const api = {
  // --- Auth (public) ---
  register: (name, email, password) =>
    fetch(`${BASE}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password }),
    }).then(handle),
  login: (email, password) =>
    fetch(`${BASE}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    }).then(handle),
  me: () => fetch(`${BASE}/auth/me`, { headers: authHeaders() }).then(handle),

  // --- App data (protected) ---
  health: () => fetch(`${BASE}/health`).then(handle),
  meta: () => fetch(`${BASE}/meta`, { headers: authHeaders() }).then(handle),
  timeline: () => fetch(`${BASE}/timeline`, { headers: authHeaders() }).then(handle),
  decision: (id) => fetch(`${BASE}/decisions/${id}`, { headers: authHeaders() }).then(handle),
  search: (q, type) => {
    const params = new URLSearchParams({ q });
    if (type) params.set("type", type);
    return fetch(`${BASE}/search?${params}`, { headers: authHeaders() }).then(handle);
  },
  chat: (question) =>
    fetch(`${BASE}/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...authHeaders() },
      body: JSON.stringify({ question }),
    }).then(handle),
  graph: () => fetch(`${BASE}/graph`, { headers: authHeaders() }).then(handle),
  risk: () => fetch(`${BASE}/risk`, { headers: authHeaders() }).then(handle),
  people: () => fetch(`${BASE}/people`, { headers: authHeaders() }).then(handle),
};
