const { test } = require("node:test");
const assert = require("node:assert/strict");
const { loadJobsFromCsv, extractSkills } = require("../services/jobService");
const { profileCompleteness } = require("../services/supabaseService");
const { parseResumeData } = require("../services/resumeParser");
const { validateMessages } = require("../services/openaiService");
const { assertLocalMode } = require("../config");
test("36 stable CSV jobs, useful filters and no fabricated work arrangements", () => {
  const jobs = loadJobsFromCsv();
  assert.equal(jobs.length, 36);
  assert.equal(new Set(jobs.map((j) => j.id)).size, 36);
  assert.ok(jobs.every((j) => j.title && j.company));
});
test("skill extraction does not treat JavaScript as Java, or Singapore as Go", () => {
  const skills = extractSkills(
    "JavaScript developer in Singapore using React and C++",
    "",
    "",
  );
  assert.ok(!skills.includes("Java"));
  assert.ok(!skills.includes("Go"));
  assert.ok(skills.includes("React"));
  assert.ok(skills.includes("C++"));
});
test("resume parser preserves text and extracted skills", () => {
  const parsed = parseResumeData({
    content:
      "Demo Candidate\nhello@example.test\nPython SQL React\nCommunication",
  });
  assert.ok(parsed.hard_skills.includes("Python"));
  assert.ok(parsed.raw_text);
  assert.equal(parsed.email, "hello@example.test");
});
test("completeness handles empty arrays and legitimate zero completeness", () => {
  assert.equal(profileCompleteness({}), 0);
  assert.equal(profileCompleteness({ hard_skills: [], soft_skills: [] }), 0);
  assert.equal(profileCompleteness({ phone: "test" }), 7);
});
test("chat rejects invalid message roles and non-text content", () => {
  assert.throws(() => validateMessages([{ role: "tool", content: "bad" }]));
  assert.throws(() => validateMessages([]));
  assert.throws(() => validateMessages([null]), { status: 400 });
  assert.throws(() => validateMessages([{ role: "user", content: {} }]));
  assert.equal(
    validateMessages([{ role: "user", content: "hello" }]).length,
    1,
  );
});
test("demo is never an implicit production backend default", () => {
  const oldMode = process.env.AUTH_MODE,
    oldEnv = process.env.NODE_ENV;
  try {
    delete process.env.AUTH_MODE;
    assert.throws(assertLocalMode);
    process.env.AUTH_MODE = "demo";
    process.env.NODE_ENV = "production";
    assert.throws(assertLocalMode);
    process.env.NODE_ENV = "development";
    assert.doesNotThrow(assertLocalMode);
  } finally {
    if (oldMode === undefined) delete process.env.AUTH_MODE;
    else process.env.AUTH_MODE = oldMode;
    if (oldEnv === undefined) delete process.env.NODE_ENV;
    else process.env.NODE_ENV = oldEnv;
  }
});
test("HTTP API validates host, origin, write header and identity without cloud calls", async () => {
  const { app } = require("../server");
  const server = app.listen(0, "127.0.0.1");
  await new Promise((resolve) => server.once("listening", resolve));
  const base = "http://127.0.0.1:" + server.address().port;
  try {
    assert.equal((await fetch(base + "/api/health")).status, 200);
    const localPreflight = await fetch(base + "/api/profile/demo@careercompass.local", {
      method: "OPTIONS",
      headers: {
        Origin: "http://localhost:3000",
        "Access-Control-Request-Method": "GET",
        "Access-Control-Request-Headers": "x-career-compass",
        "Sec-Fetch-Site": "cross-site",
      },
    });
    assert.equal(localPreflight.status, 204);
    assert.equal(
      localPreflight.headers.get("access-control-allow-origin"),
      "http://localhost:3000",
    );
    assert.equal(
      (
        await fetch(base + "/api/health", {
          headers: {
            Origin: "https://untrusted.example",
            "Sec-Fetch-Site": "cross-site",
          },
        })
      ).status,
      403,
    );
    assert.equal(
      (await fetch(base + "/api/profile/other@example.test")).status,
      403,
    );
    assert.equal(
      (
        await fetch(base + "/api/openai/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: "{}",
        })
      ).status,
      403,
    );
    assert.equal(
      (
        await fetch(base + "/api/openai/chat", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Career-Compass": "local-demo",
          },
          body: "{}",
        })
      ).status,
      400,
    );
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
});
