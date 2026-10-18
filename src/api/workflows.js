import api from "./axios";

export const listWorkflows = () => api.get("/workflows/").then((r) => r.data);
export const createWorkflow = (name) =>
  api.post("/workflows/", { name }).then((r) => r.data);
export const getWorkflow = (id) =>
  api.get(`/workflows/${id}/`).then((r) => r.data);
export const saveSteps = (id, steps) =>
  api.put(`/workflows/${id}/steps/`, { steps }).then((r) => r.data);
export const listRuns = (id) =>
  api.get(`/workflows/${id}/runs/`).then((r) => r.data);

export const getGlobalHistory = () =>
  api.get("/runs/history/").then((r) => r.data);
export const getUsage = () => api.get("/usage/").then((r) => r.data);
export const saveCredential = (service, data) =>
  api.post("/credentials/", { service, data }).then((r) => r.data);
export const getCredentials = () =>
  api.get("/credentials/").then((r) => r.data);
export const deleteCredential = (service) =>
  api.delete(`/credentials/${service}/`).then((r) => r.data);
export const getTemplates = () =>
  api.get("/workflows/templates/").then((r) => r.data);
export const useTemplate = (data) =>
  api.post("/workflows/use_template/", data).then((r) => r.data);

export const updateWorkflow = async (id, data) => {
  const response = await api.patch(`/workflows/${id}/`, data);
  return response.data;
};

export const deleteWorkflow = async (id) => {
  await api.delete(`/workflows/${id}/`);
};

export const fetchTriggerSchema = async (actionKey, appEvent, config) => {
  try {
    const response = await api.post("/test-trigger/", {
      action_key: actionKey,
      app_event: appEvent,
      config,
    });
    return response.data;
  } catch (error) {
    console.warn(
      "Backend fetch failed, falling back to mock schema:",
      error.response?.data || error.message,
    );
    throw error;
  }
};

export const getNotifications = async (unreadOnly = false) => {
  const { data } = await api.get(
    `/notifications/${unreadOnly ? "?unread=1" : ""}`,
  );
  return data;
};

export const getUnreadCount = async () => {
  const { data } = await api.get("/notifications/unread-count/");
  return data.unread_count;
};

export const markNotificationRead = async (id) => {
  const { data } = await api.post(`/notifications/${id}/read/`);
  return data;
};

export const markAllNotificationsRead = async () => {
  const { data } = await api.post("/notifications/read-all/");
  return data;
};

export const getRun = (id) => api.get(`/runs/${id}/`).then((r) => r.data);

// NEW: Dodo Payments Checkout Generator
export const createCheckoutSession = async (planKey) => {
  const { data } = await api.post("/billing/checkout/", { plan_id: planKey });
  return data;
};

// WebSocket Single-Use Authentication Ticket
export const getWsTicket = async () => {
  const { data } = await api.post("/auth/ws-ticket/");
  return data.ticket;
};

