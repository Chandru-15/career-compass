import { test } from "node:test";
import assert from "node:assert/strict";
import {
  availableResources,
  orderRoadmapSkills,
  prepareRoadmapSkills,
} from "../lib/roadmap.js";

test("generated roadmap keeps all skills visible, orders gaps first and preserves prior progress", () => {
  const generated = [
    {
      name: "JavaScript",
      category: "technical",
      importance: "high",
      description: "Build a small browser app.",
    },
    {
      name: "Version Control (Git)",
      category: "technical",
      importance: "high",
      description: "Practice branching and merging.",
    },
    {
      name: "Communication",
      category: "soft",
      importance: "medium",
      description: "Practice a short project presentation.",
    },
  ];
  const profile = { hard_skills: ["Java", "Git"], soft_skills: [] };
  const previous = [
    {
      skill_name: "Communication",
      progress: 45,
      status: "partial",
      current_level: "beginner",
      resources: [],
    },
  ];
  const skills = prepareRoadmapSkills(
    generated,
    profile,
    previous,
    {},
    new Date("2026-09-30T12:00:00Z"),
  );
  assert.equal(skills.length, 3);
  assert.equal(
    skills.find((s) => s.skill_name === "JavaScript").status,
    "missing",
  );
  assert.equal(
    skills.find((s) => s.skill_name === "Version Control (Git)").status,
    "matched",
  );
  assert.equal(
    skills.find((s) => s.skill_name === "Communication").progress,
    45,
  );
  assert.equal(
    skills.find((s) => s.skill_name === "Communication").status,
    "partial",
  );
  assert.deepEqual(
    orderRoadmapSkills(skills).map((s) => s.skill_name),
    ["JavaScript", "Communication", "Version Control (Git)"],
  );
  assert.equal(skills[0].description, generated[0].description);
  assert.equal(availableResources(skills[0], {}).length, 0);
});

test("invalid or duplicate AI skills fail before replacing persisted roadmap", () => {
  assert.throws(
    () => prepareRoadmapSkills([{ name: "SQL" }, { name: " sql " }], {}),
    /repeated/,
  );
  assert.throws(() => prepareRoadmapSkills([], {}), /usable/);
});
