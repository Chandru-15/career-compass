import { apiFetch } from "./apiClient";
/** Compatibility client for stateless career chat. Hosted agents and tool execution are not implemented. */

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:3001/api";

/**
 * Azure AI Agent Service
 * Creates and manages AI agents with tool/function calling capabilities
 */
export class AzureAgentService {
  /**
   * Create a new AI agent instance
   * @param {Object} config - Agent configuration
   * @param {string} config.name - Agent name
   * @param {string} config.systemPrompt - System prompt for the agent
   * @param {Array} config.tools - Available tools/functions for the agent
   */
  static async createAgent(config) {
    try {
      const response = await apiFetch(`${API_BASE_URL}/agent/create`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: config.name,
          systemPrompt: config.systemPrompt,
          tools: config.tools || [],
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to create agent");
      }

      const data = await response.json();
      return data.agentId;
    } catch (error) {
      console.error("Agent creation error:", error);
      throw error;
    }
  }

  /**
   * Send message to agent
   * @param {string} agentId - Agent ID
   * @param {string} message - User message
   * @param {Object} context - Additional context (user profile, job data, etc.)
   */
  static async sendMessage(agentId, message, context = {}) {
    try {
      const response = await apiFetch(`${API_BASE_URL}/agent/message`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          agentId,
          message,
          context,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to send message to agent");
      }

      const data = await response.json();
      return data.response;
    } catch (error) {
      console.error("Agent message error:", error);
      throw error;
    }
  }

  /**
   * Create a career advisor agent with predefined tools
   * @param {Object} userProfile - User profile data
   * @param {Array} availableJobs - Available jobs for recommendations
   */
  static async createCareerAdvisorAgent(userProfile, availableJobs = []) {
    const systemPrompt = `You are Career Compass AI, an expert career advisor for fresh graduates in Singapore.

User Profile:
- Name: ${userProfile?.full_name || "User"}
- Target Role: ${userProfile?.target_role || userProfile?.desired_roles?.[0] || "Not specified"}
- Skills: ${[...(userProfile?.hard_skills || []), ...(userProfile?.soft_skills || [])].join(", ") || "Not specified"}
- Education: ${userProfile?.highest_degree || ""} in ${userProfile?.major || ""} from ${userProfile?.institution || ""}
- Experience Status: ${userProfile?.employment_status || "Not specified"}
- Preferred Industries: ${(userProfile?.preferred_industries || []).join(", ") || "Not specified"}
- Location: ${userProfile?.location || "Singapore"}

Available Jobs: ${availableJobs.length} jobs in the system

Your role is to:
1. Provide personalized career advice based on the user's profile
2. Help with resume writing and optimization
3. Prepare for interviews with common questions and tips
4. Suggest learning paths and skill development
5. Create career plans with realistic timelines
6. Recommend relevant jobs from the available listings
7. Offer time management strategies

Be encouraging, practical, and specific to the Singapore job market. 
Keep responses concise but helpful. Use markdown formatting when appropriate.`;

    const tools = [
      {
        type: "function",
        function: {
          name: "search_jobs",
          description: "Search for jobs matching specific criteria",
          parameters: {
            type: "object",
            properties: {
              keyword: { type: "string", description: "Job title or keyword" },
              skills: {
                type: "array",
                items: { type: "string" },
                description: "Required skills",
              },
              location: { type: "string", description: "Job location" },
              roleType: {
                type: "string",
                description: "Type of role (full-time, part-time, etc.)",
              },
            },
          },
        },
      },
      {
        type: "function",
        function: {
          name: "analyze_resume",
          description: "Analyze user resume and provide feedback",
          parameters: {
            type: "object",
            properties: {
              resumeUrl: {
                type: "string",
                description: "URL of the resume file",
              },
              targetRole: { type: "string", description: "Target job role" },
            },
          },
        },
      },
      {
        type: "function",
        function: {
          name: "get_skill_recommendations",
          description: "Get skill recommendations based on target role",
          parameters: {
            type: "object",
            properties: {
              targetRole: { type: "string", description: "Target job role" },
            },
          },
        },
      },
    ];

    return this.createAgent({
      name: "career-advisor",
      systemPrompt,
      tools,
    });
  }
}
