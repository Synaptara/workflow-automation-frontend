import api from "./axios";

export const listWorkflows = () => api.get("/workflows/").then((r) => r.data);
export const createWorkflow = (name) => api.post("/workflows/", { name }).then((r) => r.data);
export const getWorkflow = (id) => api.get(`/workflows/${id}/`).then((r) => r.data);
export const saveSteps = (id, steps) => api.put(`/workflows/${id}/steps/`, { steps }).then((r) => r.data);
export const listRuns = (id) => api.get(`/workflows/${id}/runs/`).then((r) => r.data);

export const getGlobalHistory = () => api.get("/runs/history/").then((r) => r.data);
export const getUsage = () => api.get("/usage/").then((r) => r.data);
export const saveCredential = (service, data) => api.post("/credentials/", { service, data }).then((r) => r.data);
export const getCredentials = () => api.get("/credentials/").then((r) => r.data);
export const getTemplates = () => api.get("/workflows/templates/").then((r) => r.data);
export const useTemplate = (data) => api.post("/workflows/use_template/", data).then((r) => r.data);

export const updateWorkflow = async (id, data) => {
  const response = await api.patch(`/workflows/${id}/`, data);
  return response.data;
};

export const deleteWorkflow = async (id) => {
  await api.delete(`/workflows/${id}/`);
};

// Enterprise Test Data Fetch API
// (Currently throws an error to gracefully fallback to our schema_mock until the Django backend route is implemented)
export const fetchTriggerSchema = async (actionKey, appEvent, config) => {
    try {
        const response = await api.post("/test-trigger/", { action_key: actionKey, app_event: appEvent, config });
        return response.data;
    } catch (error) {
         // Graceful fallback to static schema if the backend fails or isn't built yet
         console.warn("Backend fetch failed, falling back to mock schema:", error.response?.data || error.message);
         throw error;
    }
};
