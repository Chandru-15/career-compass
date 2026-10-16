const normalize = (value) =>
  String(value || "")
    .trim()
    .replace(/\s+/g, " ")
    .toLowerCase();
const importanceRank = { high: 0, medium: 1, low: 2 };
const statusRank = { missing: 0, partial: 1, matched: 2 };

function hasProfileSkill(profileSkill, requiredSkill) {
  const candidate = normalize(profileSkill);
  const required = normalize(requiredSkill);
  if (!candidate) return false;
  if (candidate === required) return true;
  const escaped = candidate.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(`(^|[^a-z0-9])${escaped}([^a-z0-9]|$)`, "i").test(required);
}

export function prepareRoadmapSkills(
  requiredSkills,
  profile,
  existingSkills = [],
  defaultResources = [],
  now = new Date(),
) {
  if (
    !Array.isArray(requiredSkills) ||
    requiredSkills.length === 0 ||
    requiredSkills.length > 50
  ) {
    throw new Error(
      "The AI did not return a usable skills roadmap. Please try again.",
    );
  }
  const seen = new Set();
  const existing = new Map(
    existingSkills.map((skill) => [normalize(skill.skill_name), skill]),
  );
  const profileSkills = [
    ...(profile?.hard_skills || []),
    ...(profile?.soft_skills || []),
  ];

  return requiredSkills.map((item) => {
    const name = typeof item?.name === "string" ? item.name.trim() : "";
    const key = normalize(name);
    if (!key || seen.has(key)) {
      throw new Error(
        "The AI returned missing or repeated skill names. Please try again.",
      );
    }
    seen.add(key);
    const previous = existing.get(key);
    const matched =
      profileSkills.some((skill) => hasProfileSkill(skill, name)) ||
      previous?.status === "matched";
    const priorProgress = Number.isInteger(previous?.progress)
      ? previous.progress
      : null;
    const progress =
      priorProgress === null ? (matched ? 80 : 0) : priorProgress;
    const importance = ["high", "medium", "low"].includes(item.importance)
      ? item.importance
      : "medium";
    const target = new Date(now);
    target.setDate(
      target.getDate() +
        (importance === "high" ? 30 : importance === "medium" ? 60 : 90),
    );
    return {
      skill_name: name,
      category: ["technical", "soft", "domain"].includes(item.category)
        ? item.category
        : "technical",
      current_level: matched
        ? "intermediate"
        : previous?.current_level || "beginner",
      target_level: "advanced",
      status: matched ? "matched" : progress > 0 ? "partial" : "missing",
      importance,
      resources: previous?.resources?.length
        ? previous.resources
        : defaultResources[name] || [],
      progress,
      target_date: target.toISOString().split("T")[0],
      description:
        typeof item.description === "string" ? item.description.trim() : "",
    };
  });
}

export function orderRoadmapSkills(skills) {
  return [...skills].sort(
    (a, b) =>
      (statusRank[a.status] ?? 3) - (statusRank[b.status] ?? 3) ||
      (importanceRank[a.importance] ?? 3) -
        (importanceRank[b.importance] ?? 3) ||
      a.skill_name.localeCompare(b.skill_name),
  );
}

export function availableResources(skill, defaults) {
  return skill.resources?.length
    ? skill.resources
    : defaults[skill.skill_name] || [];
}
