import { apiFetch, API_BASE_URL, resumeUrl } from "./apiClient";
export class AzureDocumentIntelligenceService {
  static async analyzeResume(file, options = {}) {
    if (!(file instanceof File))
      throw new Error("Please select a local resume file.");
    if (file.size > 10 * 1024 * 1024)
      throw new Error("Resume must be under 10 MB.");
    const form = new FormData();
    form.append("file", file);
    if (options.userEmail) form.append("email", options.userEmail);
    const response = await apiFetch(
      API_BASE_URL + "/document-intelligence/analyze",
      { method: "POST", body: form },
    );
    const data = await response.json();
    return { ...data, fileUrl: resumeUrl(data.fileUrl) };
  }
  static async analyzeLinkedInProfile(file) {
    const data = await this.analyzeResume(file);
    return {
      ...data,
      headline: data.summary,
      skills: data.hard_skills,
      experience: data.work_experience,
    };
  }
}
