import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { buildResumeMessage, hasResumeContext } from "../lib/resumeContext.js";
import { AzureOpenAIService } from "../services/azureOpenAIService.js";
import { readDemoSession } from "../services/demoSession.js";

const raw = readFileSync(
  new URL("../../backend/tests/fixtures/complete-resume.txt", import.meta.url),
  "utf8",
);

test("full resume survives attachment formatting and serialization at the AI request boundary", async () => {
  // Deliberately incomplete structured fields reproduce the original failure.
  const extraction = {
    full_name: "Alex Rivera",
    hard_skills: ["Python"],
    work_experience: [],
    raw_text: raw,
  };
  const identity = readDemoSession({ getItem: () => null });
  const before = structuredClone(identity);
  const content = buildResumeMessage(
    "Review the evidence",
    "complete-resume.pdf",
    extraction,
  );
  const originalFetch = globalThis.fetch;
  let captured;
  globalThis.fetch = async (_url, options) => {
    captured = JSON.parse(options.body);
    return new Response(
      JSON.stringify({ content: "Stub response for serialization test" }),
      { status: 200 },
    );
  };
  try {
    await AzureOpenAIService.invokeChatCompletion({
      messages: [{ role: "user", content }],
    });
  } finally {
    globalThis.fetch = originalFetch;
  }
  assert.ok(captured.messages[0].content.includes(raw));
  for (const section of [
    "EDUCATION",
    "PROJECTS",
    "EXPERIENCE",
    "LEADERSHIP EXPERIENCE",
    "SKILLS",
    "LANGUAGES",
    "OTHER ACTIVITIES",
  ])
    assert.ok(captured.messages[0].content.includes(section), section);
  assert.ok(
    captured.messages[0].content.includes("Community library coding volunteer"),
  );
  assert.ok(hasResumeContext(captured.messages));
  assert.deepEqual(identity, before);
  assert.equal(identity.full_name, "Demo Candidate");
  assert.ok(!content.includes("Demo Candidate"));
});

test("complete text is required; oversized documents are rejected rather than silently truncated", () => {
  assert.throws(
    () => buildResumeMessage("", "resume.pdf", { full_name: "Alex" }),
    /No complete resume text/,
  );
  assert.throws(
    () => buildResumeMessage("", "resume.pdf", { raw_text: "a".repeat(40000) }),
    /No resume text has been truncated/,
  );
  const long =
    raw +
    "\n" +
    "Evidence preserved. ".repeat(1600) +
    "\nFINAL PROJECT: Tail sentinel";
  assert.ok(
    buildResumeMessage("", "resume.pdf", { raw_text: long }).includes(long),
  );
  assert.ok(
    buildResumeMessage("", "resume.pdf", {
      raw_text: "EDUCATION\r\nPROJECTS",
    }).includes("EDUCATION\nPROJECTS"),
  );
});
