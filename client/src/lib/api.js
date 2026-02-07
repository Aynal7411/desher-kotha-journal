export const API_BASE = import.meta.env.VITE_API_BASE || "";

export const getToken = () => localStorage.getItem("bn_token");

export const setToken = (token) => {
  if (token) {
    localStorage.setItem("bn_token", token);
  } else {
    localStorage.removeItem("bn_token");
  }
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event("bn_auth"));
  }
};

export const request = async (path, { method = "GET", body, token } = {}) => {
  const headers = {
    "Content-Type": "application/json"
  };
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const message = data?.message || "Request failed";
    throw new Error(message);
  }
  return data;
};
