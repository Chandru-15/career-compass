export const getRegionFromLocation = (location) => {
  if (!location) return "";

  // Extract 6-digit postal code from location string
  const postalMatch = location.match(/\b\d{6}\b/);
  if (!postalMatch)
    return (
      ["north-east", "central", "east", "north", "west"].find((region) =>
        location.toLowerCase().includes(region),
      ) || ""
    );

  const postalCode = postalMatch[0];
  const firstTwo = parseInt(postalCode.substring(0, 2));

  // Map postal code sectors to regions
  if (firstTwo >= 1 && firstTwo <= 33) return "central";
  if ((firstTwo >= 42 && firstTwo <= 48) || (firstTwo >= 49 && firstTwo <= 52))
    return "east";
  if ((firstTwo >= 53 && firstTwo <= 55) || firstTwo === 82)
    return "north-east";
  if (firstTwo === 56 || firstTwo === 57 || (firstTwo >= 75 && firstTwo <= 80))
    return "north";
  if ((firstTwo >= 58 && firstTwo <= 64) || (firstTwo >= 65 && firstTwo <= 68))
    return "west";

  return "";
};
export const calculateFitScore = (job, userSkills = []) => {
  // Fallback if no job requirements
  if (
    !job?.required_skills ||
    !Array.isArray(job.required_skills) ||
    job.required_skills.length === 0
  ) {
    return 50;
  }

  // Fallback if no user skills
  if (!userSkills || userSkills.length === 0) {
    return 30;
  }

  const normalize = (s) => String(s).toLowerCase().trim();

  // Convert job skills safely
  const jobSkills = job.required_skills.map((skill) =>
    normalize(skill.skill || skill),
  );

  // Convert user skills safely
  const candidateSkills = userSkills.map((skill) =>
    normalize(skill.skill || skill),
  );

  // Avoid divide-by-zero
  if (jobSkills.length === 0) return 50;

  // Count exact matches
  const matched = jobSkills.filter((js) => candidateSkills.includes(js));

  // Calculate base score
  const baseScore = Math.round((matched.length / jobSkills.length) * 100);

  // Add small bonus for number of matched skills (up to 15 points)
  const bonusScore = Math.min(15, matched.length * 3);

  // Return score between 5 and 95
  const finalScore = Math.min(95, Math.max(5, baseScore + bonusScore));

  return finalScore;
};

export const filterJobs = (
  jobs,
  filters,
  userSkills = [],
  savedJobs = [],
  showSavedOnly = false,
) =>
  jobs
    .filter((job) => {
      if (showSavedOnly && !savedJobs.some((saved) => saved.job_id === job.id))
        return false;
      if (
        filters.keyword &&
        !String(job.title || "")
          .toLowerCase()
          .includes(filters.keyword.toLowerCase()) &&
        !String(job.company || "")
          .toLowerCase()
          .includes(filters.keyword.toLowerCase())
      ) {
        return false;
      }

      const fitScore = calculateFitScore(job, userSkills);
      if (fitScore < filters.minFitScore) return false;
      if (filters.onlySuitable && fitScore < 60) return false;

      // Filter by region based on postal code
      if (filters.location) {
        const jobRegion = getRegionFromLocation(job.location);
        if (jobRegion !== filters.location.toLowerCase()) return false;
      }

      if (
        filters.roleType &&
        job.role_type?.toLowerCase() !== filters.roleType.toLowerCase()
      )
        return false;
      if (
        filters.workArrangement &&
        job.work_arrangement?.toLowerCase() !==
          filters.workArrangement.toLowerCase()
      )
        return false;
      if (
        filters.industry &&
        !job.industry
          ?.split(",")
          .some(
            (category) =>
              category.trim().toLowerCase() === filters.industry.toLowerCase(),
          )
      )
        return false;
      if (filters.techStack?.length > 0) {
        const hasAnyTech = filters.techStack.some((tech) =>
          job.required_skills?.some((skill) =>
            skill.toLowerCase().includes(tech.toLowerCase()),
          ),
        );
        if (!hasAnyTech) return false;
      }

      return true;
    })
    .sort(
      (a, b) =>
        calculateFitScore(b, userSkills) - calculateFitScore(a, userSkills),
    );
