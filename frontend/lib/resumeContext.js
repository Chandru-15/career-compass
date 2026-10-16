export const RESUME_START = "=== FULL EXTRACTED RESUME TEXT ===";
export const RESUME_END = "=== END EXTRACTED RESUME TEXT ===";

// Profile fields are useful for onboarding, but are not a complete document.
// Preserve every extracted section and line; never fall back to a lossy summary.
export function buildResumeMessage(query, filename, extraction) {
  const text = extraction?.raw_text;
  if (typeof text !== "string" || !text.trim()) {
    throw new Error(
      "No complete resume text was extracted. Please try another file; a partial profile summary will not be sent.",
    );
  }
  const normalized = text.replace(/\r\n?/g, "\n");
  const message = `${query.trim() || "Please review my resume and provide detailed, evidence-based feedback."}\n\nAttached file: ${filename}\n${RESUME_START}\n${normalized}\n${RESUME_END}`;
  if (message.length > 40000) {
    throw new Error(
      "This extracted resume exceeds the 40,000-character chat limit. Please upload a shorter document. No resume text has been truncated or sent to chat.",
    );
  }
  return message;
}

export function hasResumeContext(messages) {
  return messages.some(
    (message) =>
      message.role === "user" && message.content.includes(RESUME_START),
  );
}
