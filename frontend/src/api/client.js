const API_BASE_URL = "http://127.0.0.1:8080/api";

class ApiService {
  constructor() {
    this.token = localStorage.getItem("pps_token") || null;
  }

  setToken(token) {
    this.token = token;
    if (token) {
      localStorage.setItem("pps_token", token);
    } else {
      localStorage.removeItem("pps_token");
    }
  }

  getHeaders(isMultipart = false) {
    const headers = {};
    if (!isMultipart) {
      headers["Content-Type"] = "application/json";
    }
    if (this.token) {
      headers["Authorization"] = `Bearer ${this.token}`;
    }
    return headers;
  }

  async request(endpoint, options = {}) {
    const url = `${API_BASE_URL}${endpoint}`;
    const headers = this.getHeaders(options.isMultipart);

    const config = {
      ...options,
      headers: {
        ...headers,
        ...options.headers,
      },
    };

    try {
      const response = await fetch(url, config);

      if (response.status === 401) {
        // Token expired or invalid
        this.setToken(null);
        window.dispatchEvent(new CustomEvent("pps_auth_expired"));
      }

      if (!response.ok) {
        let errorMsg = `HTTP ${response.status} Error`;
        try {
          const errData = await response.json();
          errorMsg = errData.detail || errData.message || errorMsg;
        } catch {
          // Response was not JSON
        }
        throw new Error(errorMsg);
      }

      // Check if response is file download (e.g. CSV or PDF)
      const contentType = response.headers.get("content-type");
      if (contentType && (contentType.includes("csv") || contentType.includes("pdf") || contentType.includes("octet-stream"))) {
        return response.blob();
      }

      return await response.json();
    } catch (err) {
      console.error(`API Error on [${options.method || "GET"} ${endpoint}]:`, err);
      throw err;
    }
  }

  // Auth
  login(email, password) {
    return this.request("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
  }

  register(data) {
    return this.request("/auth/register", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  getMe() {
    return this.request("/auth/me");
  }

  // Student
  getStudentBundle() {
    return this.request("/student/bundle");
  }

  updateProfile(data) {
    return this.request("/student/profile", {
      method: "PUT",
      body: JSON.stringify(data),
    });
  }

  updateAcademic(data) {
    return this.request("/student/academic", {
      method: "PUT",
      body: JSON.stringify(data),
    });
  }

  updateSkills(data) {
    return this.request("/student/skills", {
      method: "PUT",
      body: JSON.stringify(data),
    });
  }

  uploadResume(formData) {
    return this.request("/student/resume/upload", {
      method: "POST",
      body: formData,
      isMultipart: true,
    });
  }

  // Prediction
  predict(customInput = null) {
    return this.request("/prediction/predict", {
      method: "POST",
      body: customInput ? JSON.stringify(customInput) : JSON.stringify({}),
    });
  }

  getPredictionHistory() {
    return this.request("/prediction/history");
  }

  getLatestPrediction() {
    return this.request("/prediction/latest");
  }

  // Faculty
  getFacultyStudents(params = {}) {
    const query = new URLSearchParams(params).toString();
    return this.request(`/faculty/students${query ? `?${query}` : ""}`);
  }

  getFacultyOverview() {
    return this.request("/faculty/overview");
  }

  updateFacultyNote(studentId, data) {
    return this.request(`/faculty/students/${studentId}/notes`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  }

  // Admin
  getAdminStats() {
    return this.request("/admin/stats");
  }

  getAggregateReports() {
    return this.request("/admin/reports/aggregate");
  }

  getAllPredictions(params = {}) {
    const query = new URLSearchParams(params).toString();
    return this.request(`/admin/predictions${query ? `?${query}` : ""}`);
  }

  exportCsvReport() {
    return this.request("/admin/reports/export/csv");
  }

  exportPdfReport() {
    return this.request("/admin/reports/export/pdf");
  }

  getCompanies() {
    return this.request("/admin/companies");
  }

  createCompany(data) {
    return this.request("/admin/companies", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  deleteCompany(id) {
    return this.request(`/admin/companies/${id}`, {
      method: "DELETE",
    });
  }

  // Datasets
  uploadDataset(formData) {
    return this.request("/datasets/upload", {
      method: "POST",
      body: formData,
      isMultipart: true,
    });
  }

  getDatasets() {
    return this.request("/datasets/list");
  }

  previewDataset(id) {
    return this.request(`/datasets/${id}/preview`);
  }

  deleteDataset(id) {
    return this.request(`/datasets/${id}`, {
      method: "DELETE",
    });
  }

  // Models
  getModelVersions() {
    return this.request("/models/list");
  }

  retrainModel(data) {
    return this.request("/models/retrain", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  activateModel(id) {
    return this.request(`/models/${id}/activate`, {
      method: "POST",
    });
  }

  // Notifications
  getNotifications() {
    return this.request("/notifications");
  }

  markNotificationRead(id) {
    return this.request(`/notifications/${id}/read`, {
      method: "PUT",
    });
  }

  markAllNotificationsRead() {
    return this.request("/notifications/mark-all-read", {
      method: "PUT",
    });
  }

  // Audit
  getAuditLogs(params = {}) {
    const query = new URLSearchParams(params).toString();
    return this.request(`/audit/logs${query ? `?${query}` : ""}`);
  }
}

export const api = new ApiService();
