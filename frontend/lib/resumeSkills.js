// Keep manually selected labels and deduplicate extracted variations of them.
export function normalizeSkills(...lists) {
  const seen = new Set();
  return lists.flatMap((list) => (Array.isArray(list) ? list : [])).filter((skill) => {
    if (typeof skill !== "string" || !skill.trim()) return false;
    const key = skill.trim().toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  }).map((skill) => skill.trim());
}

export function getResumeSkills(extracted) {
  return {
    hard_skills: normalizeSkills(extracted?.hard_skills, extracted?.skills),
    soft_skills: normalizeSkills(extracted?.soft_skills),
  };
}

// Only these two fields may change when applying skills from a chat attachment.
export function mergeProfileSkills(profile, approved) {
  return {
    hard_skills: normalizeSkills(profile?.hard_skills, approved?.hard_skills),
    soft_skills: normalizeSkills(profile?.soft_skills, approved?.soft_skills),
  };
}

export async function saveResumeSkills(service, email, approved) {
  // Re-read before merging: the profile may have changed since extraction.
  const current = await service.getUserProfile(email);
  return service.updateUserProfile(email, mergeProfileSkills(current, approved));
}
