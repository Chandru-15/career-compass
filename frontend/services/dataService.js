//middleman for the frontend
import { apiFetch, resumeUrl } from "./apiClient";
const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:3001/api";

export const dataService = {
  async getResumes() {
    const response = await apiFetch(`${API_BASE_URL}/resumes`);
    return response.json();
  },
  async replaceSkills(skills) {
    const response = await apiFetch(API_BASE_URL + "/skill-roadmap", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ skills }),
    });
    return response.json();
  },
  async getUserProfile(email) {
    const response = await apiFetch(
      `${API_BASE_URL}/profile/${encodeURIComponent(email)}`,
    );
    if (!response.ok) throw new Error("Failed to fetch profile");
    const profile = await response.json();
    return { ...profile, resume_url: resumeUrl(profile.resume_url) };
  },

  async updateUserProfile(email, data) {
    const response = await apiFetch(
      `${API_BASE_URL}/profile/${encodeURIComponent(email)}`,
      {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      },
    );
    if (!response.ok) throw new Error("Failed to update profile");
    return await response.json();
  },

  async getApplications(email) {
    const response = await apiFetch(
      `${API_BASE_URL}/applications/${encodeURIComponent(email)}`,
    );
    if (!response.ok) throw new Error("Failed to fetch applications");
    return await response.json();
  },

  async createApplication(email, data) {
    const response = await apiFetch(`${API_BASE_URL}/applications`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...data, email }),
    });
    if (!response.ok) throw new Error("Failed to create application");
    return await response.json();
  },

  async updateApplication(id, data) {
    const response = await apiFetch(`${API_BASE_URL}/applications/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error("Failed to update application");
    return await response.json();
  },

  async deleteApplication(id, userEmail) {
    const url = userEmail
      ? `${API_BASE_URL}/applications/${id}?email=${encodeURIComponent(userEmail)}`
      : `${API_BASE_URL}/applications/${id}`;
    const response = await apiFetch(url, {
      method: "DELETE",
    });
    if (!response.ok) throw new Error("Failed to delete application");
    return { success: true };
  },

  async getJobs() {
    const response = await apiFetch(`${API_BASE_URL}/jobs`);
    if (!response.ok) throw new Error("Failed to fetch jobs");
    return await response.json();
  },

  async addJob(jobData) {
    const response = await apiFetch(`${API_BASE_URL}/jobs`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(jobData),
    });
    if (!response.ok) throw new Error("Failed to create job");
    return await response.json();
  },

  async getCompanies() {
    const response = await apiFetch(`${API_BASE_URL}/companies`);
    if (!response.ok) throw new Error("Failed to fetch companies");
    return await response.json();
  },

  async getConversations(email) {
    const response = await apiFetch(
      `${API_BASE_URL}/conversations/${encodeURIComponent(email)}`,
    );
    if (!response.ok) throw new Error("Failed to fetch conversations");
    return await response.json();
  },

  async createConversation(email, data) {
    const response = await apiFetch(`${API_BASE_URL}/conversations`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...data, email }),
    });
    if (!response.ok) throw new Error("Failed to create conversation");
    return await response.json();
  },

  async updateConversation(id, data) {
    const response = await apiFetch(`${API_BASE_URL}/conversations/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error("Failed to update conversation");
    return await response.json();
  },

  async deleteConversation(id, userEmail) {
    const url = userEmail
      ? `${API_BASE_URL}/conversations/${id}?email=${encodeURIComponent(userEmail)}`
      : `${API_BASE_URL}/conversations/${id}`;
    const response = await apiFetch(url, {
      method: "DELETE",
    });
    if (!response.ok) throw new Error("Failed to delete conversation");
    return { success: true };
  },

  async getSavedJobs(email) {
    const response = await apiFetch(
      `${API_BASE_URL}/saved-jobs/${encodeURIComponent(email)}`,
    );
    if (!response.ok) throw new Error("Failed to fetch saved jobs");
    return await response.json();
  },

  async saveJob(email, jobData) {
    const response = await apiFetch(`${API_BASE_URL}/saved-jobs`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...jobData, email }),
    });
    if (!response.ok) throw new Error("Failed to save job");
    return await response.json();
  },

  async deleteSavedJob(id, userEmail) {
    const url = userEmail
      ? `${API_BASE_URL}/saved-jobs/${id}?email=${encodeURIComponent(userEmail)}`
      : `${API_BASE_URL}/saved-jobs/${id}`;
    const response = await apiFetch(url, {
      method: "DELETE",
    });
    if (!response.ok) throw new Error("Failed to delete saved job");
    return { success: true };
  },

  async getSkillProgress(email) {
    const response = await apiFetch(
      `${API_BASE_URL}/skill-progress/${encodeURIComponent(email)}`,
    );
    if (!response.ok) throw new Error("Failed to fetch skill progress");
    return await response.json();
  },

  async createSkillProgress(email, data) {
    const response = await apiFetch(`${API_BASE_URL}/skill-progress`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...data, email }),
    });
    if (!response.ok) throw new Error("Failed to create skill progress");
    return await response.json();
  },

  async updateSkillProgress(id, data) {
    const response = await apiFetch(`${API_BASE_URL}/skill-progress/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error("Failed to update skill progress");
    return await response.json();
  },

  async deleteSkillProgress(id, userEmail) {
    const url = userEmail
      ? `${API_BASE_URL}/skill-progress/${id}?email=${encodeURIComponent(userEmail)}`
      : `${API_BASE_URL}/skill-progress/${id}`;
    const response = await apiFetch(url, {
      method: "DELETE",
    });
    if (!response.ok) throw new Error("Failed to delete skill progress");
    return { success: true };
  },
};
