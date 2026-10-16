const fs = require("node:fs");
const path = require("node:path");
const Papa = require("papaparse");
const jobsCsvPath = path.join(__dirname, "../mycareersfuture.csv");
const parseSalaryRange = (value) => {
  if (!value) return { salary_min: null, salary_max: null };
  const matches = String(value).match(/[\d,]+/g);
  if (!matches || matches.length === 0)
    return { salary_min: null, salary_max: null };
  const numbers = matches
    .map((m) => Number(m.replace(/,/g, "")))
    .filter((n) => !Number.isNaN(n));
  return {
    salary_min: numbers[0] || null,
    salary_max: numbers[1] || null,
  };
};

const normalizeRoleType = (value) => {
  if (!value) return null;
  const normalized = String(value).toLowerCase();
  if (normalized.includes("intern")) return "intern";
  if (normalized.includes("part")) return "part-time";
  if (normalized.includes("contract")) return "contract";
  return "full-time";
};

// Extract skills from job description
const extractSkills = (description, title, category) => {
  if (!description && !title && !category) return [];

  const text = `${title} ${description} ${category}`.toLowerCase();
  const skills = [];

  // Common technical skills to look for
  const technicalSkills = [
    "javascript",
    "python",
    "java",
    "react",
    "node.js",
    "sql",
    "aws",
    "docker",
    "typescript",
    "go",
    "c++",
    "c#",
    ".net",
    "angular",
    "vue",
    "mongodb",
    "postgresql",
    "kubernetes",
    "git",
    "ci/cd",
    "api",
    "rest",
    "graphql",
    "microservices",
    "machine learning",
    "ai",
    "data analysis",
    "agile",
    "scrum",
    "html",
    "css",
    "linux",
    "cloud",
    "azure",
    "gcp",
    "devops",
    "testing",
    "automation",
    "nosql",
    "redis",
    "kafka",
    "terraform",
    "jenkins",
    "php",
    "ruby",
    "swift",
    "kotlin",
    "flutter",
    "react native",
    "spring",
    "django",
    "flask",
    "express",
    "fastapi",
  ];

  // Soft skills to look for
  const softSkills = [
    "communication",
    "teamwork",
    "leadership",
    "problem solving",
    "collaboration",
    "analytical",
    "creative",
    "adaptable",
    "time management",
    "critical thinking",
  ];

  // Check for technical skills
  technicalSkills.forEach((skill) => {
    if (
      new RegExp(
        "(^|[^a-z0-9])" +
          skill.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") +
          "($|[^a-z0-9])",
        "i",
      ).test(text)
    ) {
      skills.push(skill.charAt(0).toUpperCase() + skill.slice(1));
    }
  });

  // Check for soft skills
  softSkills.forEach((skill) => {
    if (
      new RegExp(
        "(^|[^a-z0-9])" +
          skill.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") +
          "($|[^a-z0-9])",
        "i",
      ).test(text)
    ) {
      skills.push(
        skill
          .split(" ")
          .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
          .join(" "),
      );
    }
  });

  // Remove duplicates
  return [...new Set(skills)];
};

const loadJobsFromCsv = () => {
  if (!fs.existsSync(jobsCsvPath)) {
    console.warn("CSV file not found:", jobsCsvPath);
    return [];
  }

  const csv = fs.readFileSync(jobsCsvPath, "utf8");
  const parsed = Papa.parse(csv, { header: true, skipEmptyLines: true });
  const rows = parsed.data || [];
  const occurrences = new Map();

  return rows.map((row, index) => {
    const salary = parseSalaryRange(row.Salary);
    const description = row["Roles & Responsibilities"] || "";
    const title = row.Title || "";
    const category = row.Category || "";

    // Extract skills from description
    const extractedSkills = extractSkills(description, title, category);
    const sourceId = row["Job ID"] || `csv_${index}`;
    const occurrence = (occurrences.get(sourceId) || 0) + 1;
    occurrences.set(sourceId, occurrence);

    return {
      id: occurrence === 1 ? sourceId : `${sourceId}::${occurrence}`,
      source_job_id: sourceId,
      title: title,
      company: row.Company || "",
      location: row.Location || "",
      role_type: normalizeRoleType(row["Employment Type"]),
      industry: category,
      description: description,
      url: row.URL || "",
      salary_min: salary.salary_min,
      salary_max: salary.salary_max,
      work_arrangement: /\bhybrid\b/i.test(description)
        ? "hybrid"
        : /\bremote\b|work from home/i.test(description)
          ? "remote"
          : /on-site|onsite/i.test(description)
            ? "on-site"
            : null,
      required_skills: extractedSkills,
      preferred_skills: [],
      tags: category
        .split(",")
        .map((v) => v.trim())
        .filter(Boolean),
      posted_date: row["Posted Date"] || "",
      closing_date: row["Closing Date"] || "",
      response_time: row["Response Time"] || "",
    };
  });
};

module.exports = { loadJobsFromCsv, extractSkills, parseSalaryRange };
