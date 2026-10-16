import { test } from "node:test";
import assert from "node:assert/strict";
import { getResumeSkills, mergeProfileSkills, saveResumeSkills } from "../lib/resumeSkills.js";

test("extracts technical and soft skills, including skills outside the presets", () => {
  assert.deepEqual(getResumeSkills({ hard_skills: [" Rust ", "rust", "C++"],
    skills: ["PostgreSQL"], soft_skills: ["Mentoring", "Leadership", null, ""] }), {
    hard_skills: ["Rust", "C++", "PostgreSQL"], soft_skills: ["Mentoring", "Leadership"],
  });
});

test("approved skills merge without dropping manual choices or changing identity", () => {
  const original = { hard_skills: ["Python"], soft_skills: ["Teamwork"], full_name: "Demo Candidate" };
  const approved = { hard_skills: ["python", "Rust"], soft_skills: ["Leadership"], full_name: "Resume Candidate" };
  const patch = mergeProfileSkills(original, approved);
  assert.deepEqual(patch, { hard_skills: ["Python", "Rust"], soft_skills: ["Teamwork", "Leadership"] });
  assert.deepEqual(mergeProfileSkills(patch, approved), patch);
  assert.deepEqual(mergeProfileSkills(original, {}), { hard_skills: ["Python"], soft_skills: ["Teamwork"] });
  assert.equal(original.full_name, "Demo Candidate");
});

test("saving uses the latest profile and only persists approved skills", async () => {
  let stored = { hard_skills: ["Python", "Docker"], soft_skills: ["Teamwork"], email: "demo@example.test" };
  let calls = 0;
  const service = {
    getUserProfile: async () => structuredClone(stored),
    updateUserProfile: async (email, patch) => {
      assert.equal(email, stored.email);
      assert.deepEqual(Object.keys(patch).sort(), ["hard_skills", "soft_skills"]);
      stored = { ...stored, ...patch }; calls++; return structuredClone(stored);
    },
  };
  const extracted = getResumeSkills({ hard_skills: ["Rust", "Incorrect suggestion"], soft_skills: ["Mentoring"] });
  const approved = { ...extracted, hard_skills: extracted.hard_skills.filter((skill) => skill !== "Incorrect suggestion") };
  await saveResumeSkills(service, stored.email, approved);
  await saveResumeSkills(service, stored.email, approved);
  assert.equal(calls, 2);
  assert.deepEqual((await service.getUserProfile()).hard_skills, ["Python", "Docker", "Rust"]);
  assert.deepEqual(stored.soft_skills, ["Teamwork", "Mentoring"]);
  await assert.rejects(saveResumeSkills({ ...service, updateUserProfile: async () => { throw new Error("Database unavailable"); } }, stored.email, approved), /Database unavailable/);
});
