const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { parseResumeData } = require("../services/resumeParser");
const { buildChatRequest } = require("../services/openaiService");

test("Document Intelligence text reaches the Azure request intact, including tail sections beyond 24k", () => {
  const fixture = fs.readFileSync(
    path.join(__dirname, "fixtures/complete-resume.txt"),
    "utf8",
  );
  const raw =
    fixture +
    "\n" +
    "Additional evidence. ".repeat(1400) +
    "\nPROJECTS: Final section";
  const parsed = parseResumeData({ content: raw });
  const payload = buildChatRequest({
    messages: [{ role: "user", content: parsed.raw_text }],
  });
  assert.equal(payload.messages[1].content, raw);
  assert.ok(payload.messages[1].content.includes("EDUCATION"));
  assert.ok(payload.messages[1].content.includes("PROJECTS: Final section"));
  assert.match(
    payload.messages[0].content,
    /Do not invent dates, graduation years, URLs/,
  );
  assert.match(
    payload.messages[0].content,
    /not provided in the supplied resume/,
  );
  assert.match(
    payload.messages[0].content,
    /signed-in demo identity.*separate context/,
  );
});
