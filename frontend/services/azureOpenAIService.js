import { apiFetch, API_BASE_URL } from "./apiClient.js";
export class AzureOpenAIService {
  static async invokeChatCompletion({
    systemPrompt,
    messages = [],
    temperature = 0.7,
    responseFormat = null,
  }) {
    const response = await apiFetch(API_BASE_URL + "/openai/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        systemPrompt,
        messages,
        temperature,
        responseFormat,
      }),
    });
    return (await response.json()).content;
  }
  static async analyzeDocument({
    prompt,
    fileUrls = [],
    responseSchema = null,
  }) {
    const response = await apiFetch(API_BASE_URL + "/openai/analyze", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt, fileUrls, responseSchema }),
    });
    return (await response.json()).result;
  }
  static async InvokeLLM({
    prompt,
    file_urls = [],
    response_json_schema = null,
  }) {
    return file_urls.length
      ? this.analyzeDocument({
          prompt,
          fileUrls: file_urls,
          responseSchema: response_json_schema,
        })
      : this.invokeChatCompletion({
          messages: [{ role: "user", content: prompt }],
          responseFormat: response_json_schema,
        });
  }
}
