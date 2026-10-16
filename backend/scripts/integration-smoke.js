require("../config");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { spawn } = require("node:child_process");
const { DEMO_EMAIL } = require("../config");
const {
  SupabaseService: db,
  getClient,
  result,
} = require("../services/supabaseService");
const { BlobService } = require("../services/blobService");
const base = "http://127.0.0.1:3011/api";
const marker = "integration-" + Date.now();
let child;
const owned = [];
async function start() {
  child = spawn(process.execPath, ["server.js"], {
    cwd: path.join(__dirname, ".."),
    env: { ...process.env, PORT: "3011" },
    stdio: ["ignore", "pipe", "pipe"],
    windowsHide: true,
  });
  await new Promise((resolve, reject) => {
    const timer = setTimeout(
      () => reject(new Error("Backend startup timed out")),
      10000,
    );
    child.once("error", reject);
    child.once("exit", (code) => {
      clearTimeout(timer);
      reject(new Error("Backend exited " + code));
    });
    child.stdout.on("data", (bytes) => {
      if (bytes.toString().includes("backend ready")) {
        clearTimeout(timer);
        resolve();
      }
    });
  });
}
async function stop() {
  if (child && !child.killed) {
    const done = new Promise((resolve) => child.once("exit", resolve));
    child.kill();
    await done;
  }
}
async function api(route, method = "GET", data) {
  const response = await fetch(base + route, {
    method,
    headers: {
      "Content-Type": "application/json",
      "X-Career-Compass": "local-demo",
    },
    body: data === undefined ? undefined : JSON.stringify(data),
    signal: AbortSignal.timeout(240000),
  });
  const body = await response.json();
  if (!response.ok) throw new Error(body.message || "HTTP " + response.status);
  return body;
}
(async () => {
  let original;
  try {
    await start();
    await api("/health/database");
    console.log("PASS Supabase schema and API connectivity");
    original = await db.getUser(DEMO_EMAIL);
    const profile = await api("/profile/" + DEMO_EMAIL, "PUT", {
      phone: marker,
      hard_skills: ["Python", "React"],
      desired_roles: ["Software Engineer"],
      onboarding_completed: true,
    });
    assert.equal(profile.phone, marker);
    const jobs = await api("/jobs");
    assert.equal(jobs.filter((j) => j.source_job_id).length, 36);
    console.log("PASS 36 CSV jobs");
    for (const [endpoint, data] of [
      [
        "saved-jobs",
        {
          job_id: marker,
          job_title: "Synthetic Test Job",
          company: "Demo Company",
        },
      ],
      [
        "applications",
        {
          job_id: marker,
          job_title: "Synthetic Test Job",
          company: "Demo Company",
          status: "applied",
        },
      ],
      [
        "conversations",
        {
          title: marker,
          mode: "interview",
          messages: [
            {
              role: "user",
              content: "hello",
              timestamp: new Date().toISOString(),
            },
          ],
        },
      ],
      [
        "skill-progress",
        { skill_name: marker, category: "technical", progress: 25 },
      ],
    ]) {
      const row = await api("/" + endpoint, "POST", {
        ...data,
        email: DEMO_EMAIL,
      });
      owned.push({ endpoint, id: row.id });
    }
    const application = owned.find((x) => x.endpoint === "applications");
    await api("/applications/" + application.id, "PUT", {
      status: "interview",
      notes: marker,
    });
    const skill = owned.find((x) => x.endpoint === "skill-progress");
    await api("/skill-progress/" + skill.id, "PUT", { progress: 60 });
    const conversation = owned.find((x) => x.endpoint === "conversations");
    await api("/conversations/" + conversation.id, "PUT", {
      messages: [
        { role: "user", content: "hello" },
        {
          role: "assistant",
          content: "Synthetic persistence test, not an AI response.",
        },
      ],
    });
    await stop();
    await start();
    assert.equal((await api("/profile/" + DEMO_EMAIL)).phone, marker);
    for (const item of owned) {
      const list = await api("/" + item.endpoint + "/" + DEMO_EMAIL);
      const row = list.find((x) => x.id === item.id);
      assert.ok(row);
      if (item.endpoint === "conversations")
        assert.equal(row.messages.length, 2);
      if (item.endpoint === "applications")
        assert.equal(row.status, "interview");
      if (item.endpoint === "skill-progress") assert.equal(row.progress, 60);
    }
    console.log(
      "PASS profile, saved jobs, applications, skill progress and messages after actual backend process restart",
    );
    const analytics = await api("/analytics/" + DEMO_EMAIL);
    assert.ok(analytics.analytics.applications.total > 0);
    console.log("PASS dashboard analytics");
    for (const mode of ["interview", "roadmap"]) {
      const response = await api("/openai/chat", "POST", {
        systemPrompt:
          "You are Career Compass AI in " + mode + " mode. Reply briefly.",
        messages: [{ role: "user", content: "hello" }],
        model: "deliberately-invalid-client-override",
      });
      assert.ok(response.content?.length);
      console.log(
        "PASS genuine " + mode + " response; frontend model override ignored",
      );
    }
    for (const [filename, mime] of [
      ["demo-resume.pdf", "application/pdf"],
      [
        "demo-resume.docx",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      ],
    ]) {
      const bytes = fs.readFileSync(
        path.join(__dirname, "../tests/fixtures", filename),
      );
      const form = new FormData();
      form.append("file", new Blob([bytes], { type: mime }), filename);
      form.append("email", DEMO_EMAIL);
      const response = await fetch(base + "/document-intelligence/analyze", {
        method: "POST",
        headers: { "X-Career-Compass": "local-demo" },
        body: form,
        signal: AbortSignal.timeout(240000),
      });
      const data = await response.json();
      assert.ok(response.ok, data.message);
      assert.ok(data.raw_text.includes("Demo"));
      assert.ok(data.hard_skills.length);
      const metadata = await db.getResume(DEMO_EMAIL, data.resume_id);
      owned.push({
        endpoint: "resumes",
        id: metadata.id,
        blob: metadata.blob_name,
      });
      assert.equal(metadata.extraction_status, "completed");
      assert.equal(metadata.mime_type, mime);
      assert.equal(metadata.file_size, bytes.length);
      await BlobService.verifyPrivate();
      const downloaded = await fetch("http://127.0.0.1:3011" + data.fileUrl);
      assert.ok(downloaded.ok);
      assert.deepEqual(Buffer.from(await downloaded.arrayBuffer()), bytes);
      console.log(
        "PASS " +
          filename +
          ": upload, private blob, extraction, metadata, backend download",
      );
    }
    console.log("ALL CLOUD INTEGRATION CHECKS PASSED");
  } catch (error) {
    console.log(
      "FAIL " + error.message.replace(/https?:\/\/[^ ]+/g, "[URL redacted]"),
    );
    process.exitCode = 1;
  } finally {
    for (const item of owned) {
      try {
        if (item.blob) {
          await BlobService.deleteFile(item.blob);
          await db.remove("resumes", DEMO_EMAIL, item.id);
        } else await api("/" + item.endpoint + "/" + item.id, "DELETE");
      } catch {
        console.log("Test cleanup requires review for " + item.endpoint);
        process.exitCode = 1;
      }
    }
    if (original) {
      const data = { ...original };
      for (const k of ["id", "email", "createdAt", "updatedAt"]) delete data[k];
      try {
        await result(
          getClient().from("profiles").update({ data }).eq("id", original.id),
        );
      } catch {
        console.log("Profile restoration needs review");
        process.exitCode = 1;
      }
    }
    await stop();
  }
})().catch(() => {
  console.log("Integration runner failed");
  process.exitCode = 1;
});
