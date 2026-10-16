const { AzureOpenAI } = require("openai");
const { required } = require("../config");
const { fail, logError } = require("./errors");
const { RESUME_GROUNDING } = require("./resumeGrounding");
let client;
function getClient() {
  if (!client)
    client = new AzureOpenAI({
      endpoint: required("AZURE_OPENAI_ENDPOINT"),
      apiKey: required("AZURE_OPENAI_KEY"),
      deployment: required("AZURE_OPENAI_DEPLOYMENT_NAME"),
      apiVersion: required("AZURE_OPENAI_API_VERSION"),
      timeout: 60000,
      maxRetries: 0,
    });
  return client;
}
function validateMessages(messages) {
  if (
    !Array.isArray(messages) ||
    !messages.length ||
    messages.length > 100 ||
    messages.some(
      (m) =>
        !m ||
        !["user", "assistant", "system"].includes(m.role) ||
        typeof m.content !== "string" ||
        m.content.length > 40000,
    )
  )
    throw fail(
      400,
      "Provide 1–100 text messages with valid roles, each at most 40,000 characters. No content is silently truncated.",
    );
  return messages.map(({ role, content }) => ({ role, content }));
}
function buildChatRequest({
  systemPrompt,
  messages,
  temperature = 0.7,
  responseFormat,
}) {
  const validated = validateMessages(messages);
  if (
    systemPrompt != null &&
    (typeof systemPrompt !== "string" || systemPrompt.length > 20000)
  )
    throw fail(400, "Invalid system prompt.");
  if (typeof temperature !== "number" || temperature < 0 || temperature > 2)
    throw fail(400, "Temperature must be between 0 and 2.");
  return {
    model: required("AZURE_OPENAI_DEPLOYMENT_NAME"),
    messages: [
      {
        role: "system",
        content:
          (systemPrompt ||
            "You are Career Compass AI, a helpful career assistant.") +
          "\n\n" +
          RESUME_GROUNDING +
          (responseFormat ? "\nReturn valid JSON only." : ""),
      },
      ...validated,
    ],
    temperature,
    max_tokens: 3000,
    response_format: responseFormat ? { type: "json_object" } : undefined,
  };
}
async function chat(options) {
  const request = buildChatRequest(options);
  try {
    const response = await getClient().chat.completions.create(request);
    const content = response.choices?.[0]?.message?.content;
    if (!content)
      throw fail(
        502,
        "Azure returned an empty or filtered response. Please rephrase your request.",
      );
    return content;
  } catch (error) {
    logError("Azure OpenAI", error);
    if (error.publicMessage) throw error;
    const status = Number(error.status);
    const advice =
      status === 404
        ? "Check AZURE_OPENAI_DEPLOYMENT_NAME and endpoint."
        : status === 401 || status === 403
          ? "Check Azure OpenAI credentials and permissions."
          : status === 429
            ? "Azure rate limit reached; retry shortly."
            : "Check Azure connectivity and retry.";
    throw fail(
      status === 429 ? 429 : 502,
      "Azure OpenAI request failed. " + advice,
    );
  }
}
module.exports = { chat, validateMessages, buildChatRequest };
