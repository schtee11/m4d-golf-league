const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:3001/api";

async function request(path, options = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || "Request failed");
  }
  if (res.status === 204) return null;
  return res.json();
}

export const api = {
  players: {
    list: () => request("/players"),
    create: (data) => request("/players", { method: "POST", body: JSON.stringify(data) }),
    update: (id, data) => request(`/players/${id}`, { method: "PATCH", body: JSON.stringify(data) }),
    remove: (id) => request(`/players/${id}`, { method: "DELETE" }),
  },
  courses: {
    list: () => request("/courses"),
    create: (data) => request("/courses", { method: "POST", body: JSON.stringify(data) }),
    update: (id, data) => request(`/courses/${id}`, { method: "PATCH", body: JSON.stringify(data) }),
    remove: (id) => request(`/courses/${id}`, { method: "DELETE" }),
    search: (q) => request(`/courses/search?q=${encodeURIComponent(q)}`),
  },
  weeks: {
    list: () => request("/weeks"),
    create: (data) => request("/weeks", { method: "POST", body: JSON.stringify(data) }),
    update: (id, data) => request(`/weeks/${id}`, { method: "PATCH", body: JSON.stringify(data) }),
    close: (id) => request(`/weeks/${id}/close`, { method: "PATCH" }),
    reopen: (id) => request(`/weeks/${id}/reopen`, { method: "PATCH" }),
    remove: (id) => request(`/weeks/${id}`, { method: "DELETE" }),
  },
  rounds: {
    list: (params = {}) => {
      const qs = new URLSearchParams(params).toString();
      return request(`/rounds${qs ? `?${qs}` : ""}`);
    },
    submit: (data) => request("/rounds", { method: "POST", body: JSON.stringify(data) }),
    remove: (id) => request(`/rounds/${id}`, { method: "DELETE" }),
  },
  leaderboard: {
    week: (weekId) => request(`/leaderboard/week/${weekId}`),
    weekAll: (weekId) => request(`/leaderboard/week/${weekId}/all`),
    season: () => request("/leaderboard/season"),
  },
};
