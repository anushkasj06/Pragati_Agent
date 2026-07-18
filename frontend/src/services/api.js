/**
 * Axios API client — connects to the Meesho Pragati Agent backend.
 * Base URL: http://localhost:3001
 * Never mocks responses. If backend is offline, surfaces a structured error.
 */

import axios from "axios";

const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3001";

// ---------------------------------------------------------------------------
// Axios instance
// ---------------------------------------------------------------------------
export const apiClient = axios.create({
  baseURL: BASE_URL,
  timeout: 35_000,          // 35s — agent pipeline can take time
  headers: { "Content-Type": "application/json" },
});

// ---------------------------------------------------------------------------
// Request interceptor — logging
// ---------------------------------------------------------------------------
apiClient.interceptors.request.use(
  (config) => {
    config.metadata = { startTime: Date.now() };
    return config;
  },
  (error) => Promise.reject(error)
);

// ---------------------------------------------------------------------------
// Response interceptor — normalise errors
// ---------------------------------------------------------------------------
apiClient.interceptors.response.use(
  (response) => {
    const elapsed = Date.now() - (response.config.metadata?.startTime ?? Date.now());
    response.elapsed_ms = elapsed;
    return response;
  },
  (error) => {
    const elapsed = Date.now() - (error.config?.metadata?.startTime ?? Date.now());

    // Network / offline
    if (!error.response) {
      return Promise.reject({
        type: "NETWORK_ERROR",
        message: "Cannot connect to Pragati backend. Please make sure the server is running on port 3001.",
        elapsed_ms: elapsed,
      });
    }

    // HTTP errors
    const { status, data } = error.response;
    return Promise.reject({
      type: "HTTP_ERROR",
      status,
      message: data?.error || `Request failed with status ${status}`,
      data,
      elapsed_ms: elapsed,
    });
  }
);

// ---------------------------------------------------------------------------
// API methods
// ---------------------------------------------------------------------------

/**
 * GET /health — liveness probe.
 * @returns {Promise<{status: string, service: string, version: string}>}
 */
export async function checkHealth() {
  const res = await apiClient.get("/health");
  return res.data;
}

/**
 * GET /api/debug/groq — test Groq LLM connectivity.
 * @returns {Promise<object>}
 */
export async function debugGroq() {
  const res = await apiClient.get("/api/debug/groq");
  return res.data;
}

/**
 * POST /api/loan/evaluate — full underwriting pipeline.
 *
 * @param {object} params
 * @param {string} params.seller_id
 * @param {string} params.language
 * @param {string} [params.phone_number]
 * @param {object} params.seller_data
 * @returns {Promise<{
 *   seller_id: string,
 *   decision: {risk_class: string, risk_score: number, loan_limit: number, requires_human_review: boolean, decision_status: string},
 *   top_reasoning_features: Array<{feature: string, impact: string, reason: string}>,
 *   seller_message: string,
 *   auditor_trail: string,
 *   improvement_plan: string[],
 *   language: string,
 *   execution_time_ms: number,
 * }>}
 */
export async function evaluateLoan({ seller_id, language, phone_number, seller_data }) {
  const res = await apiClient.post("/api/loan/evaluate", {
    seller_id,
    language,
    ...(phone_number ? { phone_number } : {}),
    seller_data,
  });
  return res.data;
}

/**
 * GET /api/loan/decisions — recent persisted decisions.
 * @param {object} [params]
 * @returns {Promise<Array<object>>}
 */
export async function getDecisionHistory(params = {}) {
  try {
    const res = await apiClient.get("/api/loan/decisions", { params });
    return res.data.decisions ?? [];
  } catch {
    return []; // endpoint may not exist — fail gracefully
  }
}

// NOTE: Seller profiles, estimates, and profile lookups are served from
// client-side data in utils/sellerData.js — the backend has no /api/sellers endpoint.
// These stubs are kept for forward-compatibility only.
export async function registerSeller(payload) {
  const res = await apiClient.post("/api/seller/register", payload);
  return res.data;
}

export async function getSellerProfiles() { return []; }
export async function getSellerProfile()  { return null; }
export async function getSellerEstimate(sellerId) {
  if (!sellerId) return null;
  const res = await apiClient.get(`/api/sellers/${sellerId}/estimate`);
  return res.data;
}

export async function submitLoanApplication(payload) {
  const formData = new FormData();

  Object.entries(payload).forEach(([key, value]) => {
    if (value === undefined || value === null) return;

    if (key === "documents") {
      const metadata = {};

      Object.entries(value).forEach(([docKey, file]) => {
        if (file instanceof File) {
          formData.append(docKey, file, file.name);
        } else {
          metadata[docKey] = file;
        }
      });

      if (Object.keys(metadata).length > 0) {
        formData.append("documents", JSON.stringify(metadata));
      }
      return;
    }

    if (typeof value === "object") {
      formData.append(key, JSON.stringify(value));
    } else {
      formData.append(key, String(value));
    }
  });

  const res = await apiClient.post("/api/sellers/applications", formData);
  return res.data.application;
}

export async function getLoanApplications(params = {}) {
  const res = await apiClient.get("/api/sellers/applications", { params });
  return res.data.applications ?? [];
}

export async function approveLoanApplication(id, adminNote = "") {
  const res = await apiClient.post(`/api/sellers/applications/${id}/approve`, { adminNote });
  return res.data.application;
}

export async function rejectLoanApplication(id, adminNote = "") {
  const res = await apiClient.post(`/api/sellers/applications/${id}/reject`, { adminNote });
  return res.data.application;
}

export async function getSellerNotifications(params = {}) {
  const res = await apiClient.get("/api/sellers/notifications", { params });
  return res.data.notifications ?? [];
}
