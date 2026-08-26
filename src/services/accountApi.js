import { API_URL, apiRequest } from "./apiConfig";

async function upload(path, file) {
  if (!API_URL) throw new Error("API_NOT_CONFIGURED");
  const response = await fetch(`${API_URL}${path}`, {
    method: "PUT",
    credentials: "include",
    headers: {
      "Content-Type": file.type,
      "X-File-Name": encodeURIComponent(file.name),
    },
    body: file,
  });
  const body = await response.json();
  if (!response.ok) throw new Error(body?.message || `HTTP_${response.status}`);
  return body;
}

export const accountApi = {
  googleLogin: (credential) =>
    apiRequest("/auth/google", {
      method: "POST",
      body: JSON.stringify({ credential }),
    }),
  me: () => apiRequest("/auth/me"),
  socketTicket: () =>
    apiRequest("/auth/socket-ticket", { method: "POST" }),
  updateMe: (payload) =>
    apiRequest("/auth/me", { method: "PATCH", body: JSON.stringify(payload) }),
  syncFavorites: (doctorIds) =>
    apiRequest("/auth/me/favorites", {
      method: "PUT",
      body: JSON.stringify({ doctorIds }),
    }),
  logout: () => apiRequest("/auth/logout", { method: "POST" }),
  slots: (doctorId) => apiRequest(`/appointments/availability/${doctorId}`),
  mySchedule: () => apiRequest("/appointments/schedule/me"),
  updateSchedule: (payload) =>
    apiRequest("/appointments/schedule/me", {
      method: "PUT",
      body: JSON.stringify(payload),
    }),
  appointments: () => apiRequest("/appointments"),
  createAppointment: (payload) =>
    apiRequest("/appointments", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  updateAppointment: (id, status) =>
    apiRequest(`/appointments/${id}`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    }),
  doctorProfile: (id) => apiRequest(`/medicos/${id}`),
  updateDoctorProfile: (payload) =>
    apiRequest("/medicos/me/profile", {
      method: "PATCH",
      body: JSON.stringify(payload),
    }),
  myMedicalApplication: () => apiRequest("/medical-applications/me"),
  saveMedicalApplication: (payload) =>
    apiRequest("/medical-applications/me", {
      method: "PUT",
      body: JSON.stringify(payload),
    }),
  uploadMedicalDocument: (type, file) =>
    upload(`/medical-applications/me/documents/${type}`, file),
  deleteMedicalDocument: (type) =>
    apiRequest(`/medical-applications/me/documents/${type}`, {
      method: "DELETE",
    }),
  discardMedicalApplication: () =>
    apiRequest("/medical-applications/me", { method: "DELETE" }),
  submitMedicalApplication: () =>
    apiRequest("/medical-applications/me/submit", { method: "POST" }),
  medicalApplications: () => apiRequest("/medical-applications"),
  reviewMedicalApplication: (id, payload) =>
    apiRequest(`/medical-applications/${id}/review`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    }),
  deleteMedicalApplication: (id) =>
    apiRequest(`/medical-applications/${id}`, { method: "DELETE" }),
  withdrawDoctor: (id, note) =>
    apiRequest(`/medical-applications/${id}/doctor`, {
      method: "DELETE",
      body: JSON.stringify({ note }),
    }),
  eraseDoctorData: (id, confirmation) =>
    apiRequest(`/medical-applications/${id}/personal-data`, {
      method: "DELETE",
      body: JSON.stringify({ confirmation }),
    }),
  applicationAudit: (id) => apiRequest(`/medical-applications/${id}/audit`),
  openMedicalDocument: async (applicationId, documentId) => {
    const response = await fetch(
      `${API_URL}/medical-applications/${applicationId}/documents/${documentId}`,
      { credentials: "include" },
    );
    if (!response.ok) throw new Error("No fue posible abrir el documento");
    const url = URL.createObjectURL(await response.blob());
    window.open(url, "_blank", "noopener,noreferrer");
    setTimeout(() => URL.revokeObjectURL(url), 60_000);
  },
};
