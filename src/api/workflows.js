import api from "./axios";

export const listWorkflows = () => api.get("/workflows/").then((r) => r.data);
export const createWorkflow = (name) => api.post("/workflows/", { name }).then((r) => r.data);
export const getWorkflow = (id) => api.get(`/workflows/${id}/`).then((r) => r.data);
export const saveSteps = (id, steps) => api.put(`/workflows/${id}/steps/`, { steps }).then((r) => r.data);
export const listRuns = (id) => api.get(`/workflows/${id}/runs/`).then((r) => r.data);

// --- NEW GLOBAL ENDPOINTS ---
export const getGlobalHistory = () => api.get("/runs/history/").then((r) => r.data);
export const getUsage = () => api.get("/usage/").then((r) => r.data);
export const saveCredential = (service, data) => api.post("/credentials/", { service, data }).then((r) => r.data);
export const getCredentials = () => api.get("/credentials/").then((r) => r.data);
