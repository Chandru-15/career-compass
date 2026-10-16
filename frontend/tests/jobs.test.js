import { test } from "node:test";
import assert from "node:assert/strict";
import { createRequire } from "node:module";
import {
  filterJobs,
  calculateFitScore,
  getRegionFromLocation,
} from "../lib/jobMatching.js";
const require = createRequire(import.meta.url);
const { loadJobsFromCsv } = require("../../backend/services/jobService.js");
const jobs = loadJobsFromCsv();
const filters = {
  keyword: "",
  minFitScore: 0,
  onlySuitable: false,
  location: "",
  roleType: "",
  workArrangement: "",
  industry: "",
  techStack: [],
};
test("all 36 CSV jobs visible without filters", () =>
  assert.equal(filterJobs(jobs, filters).length, 36));
test("keyword and role filters use real CSV data", () => {
  const job = jobs[0];
  const matches = filterJobs(jobs, {
    ...filters,
    keyword: job.company,
    roleType: job.role_type,
  });
  assert.ok(matches.length);
  assert.ok(
    matches.every(
      (j) =>
        j.company.toLowerCase().includes(job.company.toLowerCase()) &&
        j.role_type === job.role_type,
    ),
  );
});
test("industry filter matches one category in a multi-category CSV value", () => {
  const j = jobs.find((j) => j.industry.includes(",")) || jobs[0];
  const industry = j.industry.split(",")[0].trim();
  assert.ok(
    filterJobs(jobs, { ...filters, industry }).some((x) => x.id === j.id),
  );
});
test("saved filter and technical skill filter", () => {
  assert.equal(
    filterJobs(jobs, filters, [], [{ job_id: jobs[0].id }], true).length,
    1,
  );
  assert.ok(
    filterJobs(jobs, { ...filters, techStack: ["Python"] }).every((j) =>
      j.required_skills.some((s) => s.toLowerCase().includes("python")),
    ),
  );
});
test("deterministic fit and location filtering", () => {
  assert.ok(
    calculateFitScore({ required_skills: ["React"] }, ["React"]) >
      calculateFitScore({ required_skills: ["React"] }, []),
  );
  assert.equal(getRegionFromLocation("Singapore 018956"), "central");
});
