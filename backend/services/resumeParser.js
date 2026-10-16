function parseResumeData(docIntelligenceResult) {
  const content = (docIntelligenceResult.content || "").replace(/\r\n?/g, "\n");
  const keyValuePairs = docIntelligenceResult.keyValuePairs || [];

  // Extract structured data
  const extracted = {
    raw_text: content,
    phone: null,
    email: null,
    location: null,
    full_name: null,
    highest_degree: null,
    institution: null,
    major: null,
    graduation_year: null,
    gpa: null,
    hard_skills: [],
    soft_skills: [],
    work_experience: [],
    certifications: [],
    summary: null,
  };

  // Extract email using regex
  const emailMatch = content.match(/[\w.-]+@[\w.-]+\.\w+/);
  if (emailMatch) extracted.email = emailMatch[0];

  // Extract phone using regex (Singapore format)
  const phoneMatch = content.match(/(\+65\s?)?[689]\d{7}/);
  if (phoneMatch) extracted.phone = phoneMatch[0];

  // Try to extract data from key-value pairs
  keyValuePairs.forEach((pair) => {
    const key = pair.key?.content?.toLowerCase() || "";
    const value = pair.value?.content || "";

    if (key.includes("email")) extracted.email = extracted.email || value;
    if (key.includes("phone") || key.includes("mobile"))
      extracted.phone = extracted.phone || value;
    if (key.includes("address") || key.includes("location"))
      extracted.location = extracted.location || value;
    if (key.includes("name") && !extracted.full_name)
      extracted.full_name = value;
    if (key.includes("degree"))
      extracted.highest_degree = extracted.highest_degree || value;
    if (
      key.includes("university") ||
      key.includes("institution") ||
      key.includes("school")
    ) {
      extracted.institution = extracted.institution || value;
    }
    if (key.includes("major") || key.includes("field"))
      extracted.major = extracted.major || value;
    if (key.includes("gpa")) extracted.gpa = extracted.gpa || value;
  });

  // Extract skills from content (common technical skills)
  const technicalSkills = [
    "Python",
    "JavaScript",
    "Java",
    "C++",
    "C#",
    "SQL",
    "React",
    "Angular",
    "Vue",
    "Node.js",
    "Express",
    "Django",
    "Flask",
    "Spring",
    "AWS",
    "Azure",
    "GCP",
    "Docker",
    "Kubernetes",
    "Git",
    "MongoDB",
    "PostgreSQL",
    "MySQL",
    "HTML",
    "CSS",
    "TypeScript",
    "PHP",
    "Ruby",
    "Go",
    "Rust",
    "Swift",
    "Kotlin",
    "Machine Learning",
    "Deep Learning",
    "Data Science",
    "AI",
    "TensorFlow",
    "PyTorch",
    "Excel",
    "Tableau",
    "Power BI",
    "Figma",
    "Adobe",
    "Photoshop",
  ];

  const softSkills = [
    "Communication",
    "Leadership",
    "Teamwork",
    "Problem Solving",
    "Critical Thinking",
    "Time Management",
    "Adaptability",
    "Creativity",
    "Analytical",
    "Interpersonal",
  ];

  // Helper function to escape special regex characters
  const escapeRegex = (str) => str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

  technicalSkills.forEach((skill) => {
    const escapedSkill = escapeRegex(skill);
    const regex = new RegExp(`\\b${escapedSkill}\\b`, "i");
    if (regex.test(content)) {
      extracted.hard_skills.push(skill);
    }
  });

  softSkills.forEach((skill) => {
    const escapedSkill = escapeRegex(skill);
    const regex = new RegExp(`\\b${escapedSkill}\\b`, "i");
    if (regex.test(content)) {
      extracted.soft_skills.push(skill);
    }
  });

  // Extract work experience sections (look for common section headers)
  const expSectionMatch = content.match(
    /(?:EXPERIENCE|WORK HISTORY|EMPLOYMENT)([\s\S]*?)(?=EDUCATION|SKILLS|CERTIFICATIONS|$)/i,
  );
  if (expSectionMatch) {
    const expContent = expSectionMatch[1];
    // Try to split by date patterns
    const datePattern =
      /(\d{4}|\w+\s+\d{4})\s*[-–]\s*(\d{4}|\w+\s+\d{4}|Present)/gi;
    const matches = [...expContent.matchAll(datePattern)];

    matches.forEach((match, idx) => {
      const startPos = match.index;
      const endPos = matches[idx + 1]?.index || expContent.length;
      const section = expContent.substring(0, startPos);

      const lines = section.split("\n").filter((l) => l.trim());
      if (lines.length >= 2) {
        extracted.work_experience.push({
          title: lines[0]?.trim() || "",
          company: lines[1]?.trim() || "",
          start_date: match[1] || "",
          end_date: match[2] || "",
          responsibilities: lines.slice(2).join(" ").trim(),
        });
      }
    });
  }

  // Extract certifications
  const certSectionMatch = content.match(
    /(?:CERTIFICATIONS|CERTIFICATES|LICENSES)([\s\S]*?)(?=EDUCATION|SKILLS|EXPERIENCE|$)/i,
  );
  if (certSectionMatch) {
    const certLines = certSectionMatch[1]
      .split("\n")
      .filter((l) => l.trim() && l.length > 3);
    extracted.certifications = certLines
      .slice(0, 10)
      .map((line) => ({ title: line.trim() }));
  }

  return extracted;
}

// ----------------------------
// AI-Powered Resume Analysis with Scoring
// ----------------------------

module.exports = { parseResumeData };
