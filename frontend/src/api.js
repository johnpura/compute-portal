/*
 * api.js
 * ------
 * A thin wrapper around fetch() so components never hard-code URLs or repeat
 * boilerplate. Every function returns parsed JSON (or throws on a bad status).
 *
 * The base URL points at the Flask backend. In Docker the browser still runs
 * on your host machine, so it reaches the backend via the published port on
 * localhost:5000. Override with VITE_API_URL if you run things differently.
 */

const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

async function request(path, options = {}) {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `Request failed (${res.status})`);
  }
  return res.json();
}

export const api = {
  getUsers: () => request("/users"),
  getJobs: (status) => request(status ? `/jobs?status=${status}` : "/jobs"),
  getStats: () => request("/stats"),
  createJob: (job) =>
    request("/jobs", { method: "POST", body: JSON.stringify(job) }),
  approveJob: (id) => request(`/jobs/${id}/approve`, { method: "POST" }),
  denyJob: (id) => request(`/jobs/${id}/deny`, { method: "POST" }),
};
