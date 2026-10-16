import { ResumeSkillsReview } from "../components/ResumeSkillsReview";
import { getResumeSkills, mergeProfileSkills, normalizeSkills } from "../lib/resumeSkills.js";
import { apiFetch } from "../services/apiClient";
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "../utils";
import { useAuth } from "../components/AuthProvider";
import { dataService } from "../services/dataService";
import { addNotification } from "../components/NotificationCenter";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { AzureDocumentIntelligenceService } from "../services/azureDocumentIntelligenceService";
import {
  User,
  GraduationCap,
  Wrench,
  Briefcase,
  Award,
  FileText,
  ChevronRight,
  ChevronLeft,
  Upload,
  Sparkles,
  Check,
  AlertCircle,
  Loader2,
  X,
  Plus,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const steps = [
  { id: 1, title: "Basic Profile", icon: User },
  { id: 2, title: "Education", icon: GraduationCap },
  { id: 3, title: "Skills & Interests", icon: Wrench },
  { id: 4, title: "Experience", icon: Briefcase },
  { id: 5, title: "Certifications", icon: Award },
  { id: 6, title: "Resume & LinkedIn", icon: FileText },
];

const roleTypes = ["Intern", "Contract", "Full-time", "Part-time"];
const workArrangements = ["Remote", "Hybrid", "On-site"];
const industries = [
  "Technology",
  "Finance",
  "Healthcare",
  "Manufacturing",
  "Retail",
  "Education",
  "Consulting",
  "Government",
  "Startup",
];
const hardSkillsList = [
  "Python",
  "JavaScript",
  "Java",
  "SQL",
  "React",
  "Node.js",
  "AWS",
  "Docker",
  "Machine Learning",
  "Data Analysis",
  "Excel",
  "Tableau",
  "Figma",
  "Adobe Creative Suite",
];
const softSkillsList = [
  "Communication",
  "Teamwork",
  "Leadership",
  "Problem Solving",
  "Critical Thinking",
  "Time Management",
  "Adaptability",
  "Creativity",
];
const domainsList = [
  "Web Development",
  "Mobile Development",
  "Data Science",
  "AI/ML",
  "Cloud Computing",
  "Cybersecurity",
  "Product Management",
  "UX Design",
  "Digital Marketing",
  "Business Analytics",
];

export default function Onboarding() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  const [isExtracting, setIsExtracting] = useState(false);
  const [extractedData, setExtractedData] = useState<any>(null);
  const [skillOptions, setSkillOptions] = useState({ hard_skills: [], soft_skills: [] });
  const [isEditMode, setIsEditMode] = useState(false);
  const [profileLoadError, setProfileLoadError] = useState("");
  const { user, isAuthenticated, login } = useAuth();

  const [formData, setFormData] = useState({
    // Step 1 - Basic
    phone: "",
    location: "",
    work_authorization: "",
    desired_roles: [],
    preferred_industries: [],
    role_type: [],
    work_arrangement: "",
    // Step 2 - Education
    highest_degree: "",
    institution: "",
    major: "",
    graduation_year: "",
    gpa: "",
    relevant_modules: [],
    capstone_projects: [],
    // Step 3 - Skills
    hard_skills: [],
    soft_skills: [],
    domains_of_interest: [],
    // Step 4 - Experience
    employment_status: "",
    work_experience: [],
    // Step 5 - Certifications
    certifications: [],
    awards: [],
    // Step 6 - Documents
    resume_url: "",
    linkedin_data: {},
  });

  const [newModule, setNewModule] = useState("");
  const [newRole, setNewRole] = useState("");

  useEffect(() => {
    const loadProfile = async () => {
      if (!user?.email) {
        setIsLoadingProfile(false);
        return;
      }

      try {
        const profile = await dataService.getUserProfile(user.email);

        if (profile && Object.keys(profile).length > 0) {
          // Profile exists - enter edit mode
          setIsEditMode(Boolean(profile.onboarding_completed));
          setSkillOptions(getResumeSkills(profile));

          // Load existing data into form
          setFormData({
            phone: profile.phone || "",
            location: profile.location || "",
            work_authorization: profile.work_authorization || "",
            desired_roles: profile.desired_roles || [],
            preferred_industries: profile.preferred_industries || [],
            role_type: profile.role_type || [],
            work_arrangement: profile.work_arrangement || "",
            highest_degree: profile.highest_degree || "",
            institution: profile.institution || "",
            major: profile.major || "",
            graduation_year: profile.graduation_year || "",
            gpa: profile.gpa || "",
            relevant_modules: profile.relevant_modules || [],
            capstone_projects: profile.capstone_projects || [],
            hard_skills: profile.hard_skills || [],
            soft_skills: profile.soft_skills || [],
            domains_of_interest: profile.domains_of_interest || [],
            employment_status: profile.employment_status || "",
            work_experience: profile.work_experience || [],
            certifications: profile.certifications || [],
            awards: profile.awards || [],
            resume_url: profile.resume_url || "",
            linkedin_data: profile.linkedin_data || {},
          });
        }
      } catch (error) {
        setProfileLoadError(error.message || "Failed to load profile.");
      } finally {
        setIsLoadingProfile(false);
      }
    };

    loadProfile();
  }, [user?.email]);

  const updateFormData = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const toggleArrayItem = (field, item) => {
    setFormData((prev) => ({
      ...prev,
      [field]: prev[field].includes(item)
        ? prev[field].filter((i) => i !== item)
        : [...prev[field], item],
    }));
  };

  const handleResumeUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setIsExtracting(true);
    try {
      const extracted = await AzureDocumentIntelligenceService.analyzeResume(
        file,
        { userEmail: user?.email },
      );
      updateFormData("resume_url", extracted.fileUrl);
      setExtractedData(extracted);
      if (extracted.warning) toast.warning(extracted.warning);

      toast.success("Resume uploaded and analyzed successfully!");
      addNotification(
        "Resume Analyzed",
        "Your resume has been analyzed. Review the feedback below.",
        "success",
      );
    } catch (error) {
      console.error("Upload failed:", error);
      toast.error(error.message || "Failed to analyze resume.");
    } finally {
      setIsExtracting(false);
    }
  };

  const applyExtractedData = (approvedSkills) => {
    if (!extractedData) return;

    // Parse education from array
    let degree = "";
    let institution = "";
    let major = "";
    let gradYear = "";

    if (extractedData.education && Array.isArray(extractedData.education)) {
      // Try to parse education lines
      extractedData.education.forEach((line) => {
        if (
          line.includes("Bachelor") ||
          line.includes("Master") ||
          line.includes("PhD")
        ) {
          degree = line;
        } else if (
          line.includes("University") ||
          line.includes("College") ||
          line.includes("Institute")
        ) {
          institution = line;
        } else if (line.match(/20\d{2}/)) {
          gradYear = line.match(/20\d{2}/)[0];
        }
      });
    }

    // Parse experience from array
    let experienceArray = [];
    if (extractedData.experience && Array.isArray(extractedData.experience)) {
      // Group experience lines into objects
      let currentExp = null;
      extractedData.experience.forEach((line) => {
        // Check if it's a title line (usually has | separators)
        if (line.includes("|") || line.match(/\d{4}/)) {
          if (currentExp) experienceArray.push(currentExp);
          const parts = line.split("|").map((p) => p.trim());
          currentExp = {
            position: parts[0] || line,
            company: parts[1] || "",
            duration: parts[2] || "",
            description: "",
          };
        } else if (currentExp && line.trim().startsWith("-")) {
          // It's a bullet point
          currentExp.description +=
            (currentExp.description ? "\n" : "") + line.trim();
        }
      });
      if (currentExp) experienceArray.push(currentExp);
    }

    setFormData((prev) => ({
      ...prev,
      // Contact info
      phone: extractedData.phone || prev.phone,
      location: extractedData.location || prev.location,

      // Education
      highest_degree:
        degree || extractedData.highest_degree || prev.highest_degree,
      institution: institution || extractedData.institution || prev.institution,
      major: major || extractedData.major || prev.major,
      graduation_year:
        gradYear || extractedData.graduation_year || prev.graduation_year,

      // Skills - merge with existing, remove duplicates
      ...mergeProfileSkills(prev, approvedSkills),

      // Experience - append to existing
      work_experience:
        experienceArray.length > 0
          ? [...prev.work_experience, ...experienceArray]
          : extractedData.work_experience || prev.work_experience,
    }));

    setSkillOptions((previous) => mergeProfileSkills(previous, getResumeSkills(extractedData)));
    setExtractedData(null);
    toast.success("Resume fields added to your draft. Save your profile to keep them.");
    addNotification(
      "Profile Draft Updated",
      "Review your details, then save your profile",
      "success",
    );
  };

  const calculateCompleteness = () => {
    let filled = 0;
    let total = 15;

    if (formData.phone) filled++;
    if (formData.location) filled++;
    if (formData.work_authorization) filled++;
    if (formData.desired_roles.length > 0) filled++;
    if (formData.highest_degree) filled++;
    if (formData.institution) filled++;
    if (formData.major) filled++;
    if (formData.hard_skills.length > 0) filled++;
    if (formData.soft_skills.length > 0) filled++;
    if (formData.employment_status) filled++;
    if (formData.role_type.length > 0) filled++;
    if (formData.work_arrangement) filled++;
    if (formData.preferred_industries.length > 0) filled++;
    if (formData.domains_of_interest.length > 0) filled++;
    if (formData.resume_url) filled++;

    return Math.round((filled / total) * 100);
  };

  const handleSubmit = async () => {
    setIsLoading(true);
    try {
      const completeness = calculateCompleteness();
      const profileData = {
        ...formData,
        onboarding_completed: true,
        profile_completeness: completeness,
        target_role: formData.desired_roles[0] || "",
      };

      // Update user profile
      const savedProfile = await dataService.updateUserProfile(
        user.email,
        profileData,
      );
      // The dashboard must see completed onboarding immediately, even if its
      // previous query is still cached or in flight when navigation occurs.
      await queryClient.cancelQueries({
        queryKey: ["userProfile", user.email],
      });
      queryClient.setQueryData(["userProfile", user.email], savedProfile);

      // Track profile creation in progress system
      try {
        const API_BASE_URL =
          import.meta.env.VITE_API_BASE_URL || "http://localhost:3001/api";

        // Create/update user in progress system
        await apiFetch(`${API_BASE_URL}/users`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId: user.email,
            email: user.email,
            name: user.full_name,
            profileData,
          }),
        });

        // Update progress with profile completeness
        await apiFetch(`${API_BASE_URL}/progress/${user.email}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "profile_updated",
            progress: {
              profileCompleteness: completeness,
            },
          }),
        });

        // Calculate and save completeness
        await apiFetch(`${API_BASE_URL}/calculate-completeness/${user.email}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ profileData }),
        });

        console.log("✅ Progress tracking updated");
      } catch (progressErr) {
        console.warn("Progress tracking failed (non-critical):", progressErr);
      }

      // Invalidate all related caches to ensure data consistency across tabs
      queryClient.invalidateQueries({ queryKey: ["userProfile"] });
      queryClient.invalidateQueries({ queryKey: ["skillProgress"] });
      queryClient.invalidateQueries({ queryKey: ["applications"] });
      queryClient.invalidateQueries({ queryKey: ["savedJobs"] });
      queryClient.invalidateQueries({ queryKey: ["conversations"] });

      if (isEditMode) {
        toast.success("Profile updated successfully!");
        addNotification(
          "Profile Updated",
          "Your profile changes have been saved",
          "success",
        );
      } else {
        toast.success("Profile setup completed!");
        addNotification(
          "Welcome to Career Compass!",
          "Your profile has been successfully created. Start exploring job opportunities!",
          "success",
        );
      }

      navigate(createPageUrl("Dashboard"));
    } catch (error) {
      console.error("Save failed:", error);
      toast.error(error.message || "Failed to save profile. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label>Phone Number</Label>
                <Input
                  type="tel"
                  placeholder="+65 9xxx xxxx"
                  value={formData.phone}
                  onChange={(e) => updateFormData("phone", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Location in Singapore</Label>
                <Input
                  placeholder="e.g., Central, East, West"
                  value={formData.location}
                  onChange={(e) => updateFormData("location", e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Work Authorization</Label>
              <Select
                value={formData.work_authorization}
                onValueChange={(v) => updateFormData("work_authorization", v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select your work authorization status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="citizen">Singapore Citizen</SelectItem>
                  <SelectItem value="pr">Permanent Resident</SelectItem>
                  <SelectItem value="ep">Employment Pass</SelectItem>
                  <SelectItem value="sp">S Pass</SelectItem>
                  <SelectItem value="dp">Dependant Pass</SelectItem>
                  <SelectItem value="student_pass">Student Pass</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Desired Roles (Add your target positions)</Label>
              <div className="flex gap-2">
                <Input
                  placeholder="e.g., Software Engineer, Data Analyst"
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === "Enter" && newRole.trim()) {
                      updateFormData("desired_roles", [
                        ...formData.desired_roles,
                        newRole.trim(),
                      ]);
                      setNewRole("");
                    }
                  }}
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    if (newRole.trim()) {
                      updateFormData("desired_roles", [
                        ...formData.desired_roles,
                        newRole.trim(),
                      ]);
                      setNewRole("");
                    }
                  }}
                >
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
              <div className="flex flex-wrap gap-2 mt-2">
                {formData.desired_roles.map((role, i) => (
                  <Badge
                    key={i}
                    variant="secondary"
                    className="flex items-center gap-1"
                  >
                    {role}
                    <X
                      className="w-3 h-3 cursor-pointer"
                      onClick={() =>
                        updateFormData(
                          "desired_roles",
                          formData.desired_roles.filter((_, idx) => idx !== i),
                        )
                      }
                    />
                  </Badge>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <Label>Preferred Industries</Label>
              <div className="flex flex-wrap gap-2">
                {industries.map((industry) => (
                  <Badge
                    key={industry}
                    variant={
                      formData.preferred_industries.includes(industry)
                        ? "default"
                        : "outline"
                    }
                    className={`cursor-pointer transition-all ${
                      formData.preferred_industries.includes(industry)
                        ? "bg-teal-500 hover:bg-teal-600"
                        : "hover:bg-slate-100"
                    }`}
                    onClick={() =>
                      toggleArrayItem("preferred_industries", industry)
                    }
                  >
                    {industry}
                  </Badge>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <Label>Preferred Role Type</Label>
              <div className="flex flex-wrap gap-2">
                {roleTypes.map((type) => (
                  <Badge
                    key={type}
                    variant={
                      formData.role_type.includes(type) ? "default" : "outline"
                    }
                    className={`cursor-pointer transition-all ${
                      formData.role_type.includes(type)
                        ? "bg-teal-500 hover:bg-teal-600"
                        : "hover:bg-slate-100"
                    }`}
                    onClick={() => toggleArrayItem("role_type", type)}
                  >
                    {type}
                  </Badge>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label>Work Arrangement</Label>
              <Select
                value={formData.work_arrangement}
                onValueChange={(v) => updateFormData("work_arrangement", v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select preferred work arrangement" />
                </SelectTrigger>
                <SelectContent>
                  {workArrangements.map((arr) => (
                    <SelectItem key={arr} value={arr.toLowerCase()}>
                      {arr}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label>Highest Degree</Label>
                <Select
                  value={formData.highest_degree}
                  onValueChange={(v) => updateFormData("highest_degree", v)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select degree" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="diploma">Diploma</SelectItem>
                    <SelectItem value="bachelors">Bachelor's Degree</SelectItem>
                    <SelectItem value="masters">Master's Degree</SelectItem>
                    <SelectItem value="phd">PhD</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Institution</Label>
                <Input
                  placeholder="e.g., National University of Singapore"
                  value={formData.institution}
                  onChange={(e) =>
                    updateFormData("institution", e.target.value)
                  }
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <Label>Major / Field of Study</Label>
                <Input
                  placeholder="e.g., Computer Science"
                  value={formData.major}
                  onChange={(e) => updateFormData("major", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Graduation Year</Label>
                <Input
                  type="number"
                  placeholder="2024"
                  value={formData.graduation_year}
                  onChange={(e) =>
                    updateFormData("graduation_year", e.target.value)
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>GPA (Optional)</Label>
                <Input
                  placeholder="e.g., 3.8/4.0"
                  value={formData.gpa}
                  onChange={(e) => updateFormData("gpa", e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Relevant Modules / Courses</Label>
              <div className="flex gap-2">
                <Input
                  placeholder="Add a relevant module"
                  value={newModule}
                  onChange={(e) => setNewModule(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === "Enter" && newModule.trim()) {
                      updateFormData("relevant_modules", [
                        ...formData.relevant_modules,
                        newModule.trim(),
                      ]);
                      setNewModule("");
                    }
                  }}
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    if (newModule.trim()) {
                      updateFormData("relevant_modules", [
                        ...formData.relevant_modules,
                        newModule.trim(),
                      ]);
                      setNewModule("");
                    }
                  }}
                >
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
              <div className="flex flex-wrap gap-2 mt-2">
                {formData.relevant_modules.map((mod, i) => (
                  <Badge
                    key={i}
                    variant="secondary"
                    className="flex items-center gap-1"
                  >
                    {mod}
                    <X
                      className="w-3 h-3 cursor-pointer"
                      onClick={() =>
                        updateFormData(
                          "relevant_modules",
                          formData.relevant_modules.filter(
                            (_, idx) => idx !== i,
                          ),
                        )
                      }
                    />
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <div className="space-y-3">
              <Label>Technical / Hard Skills</Label>
              <p className="text-sm text-slate-500">
                Select skills you're proficient in
              </p>
              <div className="flex flex-wrap gap-2">
                {normalizeSkills(formData.hard_skills, skillOptions.hard_skills, hardSkillsList).map((skill) => (
                  <button type="button" key={skill} aria-pressed={formData.hard_skills.includes(skill)}
                    className={`rounded-md border px-2.5 py-0.5 text-xs font-semibold transition-colors ${formData.hard_skills.includes(skill)
                      ? "bg-teal-500 text-white hover:bg-teal-600" : "hover:bg-slate-100"}`}
                    onClick={() => toggleArrayItem("hard_skills", skill)}>
                    {skill}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <Label>Soft Skills</Label>
              <p className="text-sm text-slate-500">
                Select your strongest soft skills
              </p>
              <div className="flex flex-wrap gap-2">
                {normalizeSkills(formData.soft_skills, skillOptions.soft_skills, softSkillsList).map((skill) => (
                  <button type="button" key={skill} aria-pressed={formData.soft_skills.includes(skill)}
                    className={`rounded-md border px-2.5 py-0.5 text-xs font-semibold transition-colors ${formData.soft_skills.includes(skill)
                      ? "bg-blue-500 text-white hover:bg-blue-600" : "hover:bg-slate-100"}`}
                    onClick={() => toggleArrayItem("soft_skills", skill)}>
                    {skill}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <Label>Domains of Interest</Label>
              <p className="text-sm text-slate-500">What areas excite you?</p>
              <div className="flex flex-wrap gap-2">
                {domainsList.map((domain) => (
                  <Badge
                    key={domain}
                    variant={
                      formData.domains_of_interest.includes(domain)
                        ? "default"
                        : "outline"
                    }
                    className={`cursor-pointer transition-all ${
                      formData.domains_of_interest.includes(domain)
                        ? "bg-purple-500 hover:bg-purple-600"
                        : "hover:bg-slate-100"
                    }`}
                    onClick={() =>
                      toggleArrayItem("domains_of_interest", domain)
                    }
                  >
                    {domain}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            <div className="space-y-2">
              <Label>Employment Status</Label>
              <Select
                value={formData.employment_status}
                onValueChange={(v) => updateFormData("employment_status", v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select your current status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="currently_employed">
                    Currently Employed
                  </SelectItem>
                  <SelectItem value="previously_employed">
                    Previously Employed
                  </SelectItem>
                  <SelectItem value="never_employed">
                    Never Employed (Fresh Graduate)
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {formData.employment_status !== "never_employed" && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label>Work Experience</Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      updateFormData("work_experience", [
                        ...formData.work_experience,
                        {
                          title: "",
                          company: "",
                          start_date: "",
                          end_date: "",
                          responsibilities: "",
                          type: "full-time",
                        },
                      ])
                    }
                  >
                    <Plus className="w-4 h-4 mr-1" /> Add Experience
                  </Button>
                </div>

                {formData.work_experience.map((exp, index) => (
                  <Card key={index} className="p-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Input
                        placeholder="Job Title"
                        value={exp.title}
                        onChange={(e) => {
                          const updated = [...formData.work_experience];
                          updated[index].title = e.target.value;
                          updateFormData("work_experience", updated);
                        }}
                      />
                      <Input
                        placeholder="Company"
                        value={exp.company}
                        onChange={(e) => {
                          const updated = [...formData.work_experience];
                          updated[index].company = e.target.value;
                          updateFormData("work_experience", updated);
                        }}
                      />
                      <Input
                        type="date"
                        placeholder="Start Date"
                        value={exp.start_date}
                        onChange={(e) => {
                          const updated = [...formData.work_experience];
                          updated[index].start_date = e.target.value;
                          updateFormData("work_experience", updated);
                        }}
                      />
                      <Input
                        type="date"
                        placeholder="End Date"
                        value={exp.end_date}
                        onChange={(e) => {
                          const updated = [...formData.work_experience];
                          updated[index].end_date = e.target.value;
                          updateFormData("work_experience", updated);
                        }}
                      />
                    </div>
                    <Textarea
                      className="mt-4"
                      placeholder="Key responsibilities and achievements"
                      value={exp.responsibilities}
                      onChange={(e) => {
                        const updated = [...formData.work_experience];
                        updated[index].responsibilities = e.target.value;
                        updateFormData("work_experience", updated);
                      }}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="mt-2 text-red-500 hover:text-red-600"
                      onClick={() => {
                        updateFormData(
                          "work_experience",
                          formData.work_experience.filter(
                            (_, i) => i !== index,
                          ),
                        );
                      }}
                    >
                      Remove
                    </Button>
                  </Card>
                ))}
              </div>
            )}
          </div>
        );

      case 5:
        return (
          <div className="space-y-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label>Certifications</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    updateFormData("certifications", [
                      ...formData.certifications,
                      { title: "", provider: "", expiry: "" },
                    ])
                  }
                >
                  <Plus className="w-4 h-4 mr-1" /> Add Certification
                </Button>
              </div>

              {formData.certifications.map((cert, index) => (
                <Card key={index} className="p-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Input
                      placeholder="Certification Title"
                      value={cert.title}
                      onChange={(e) => {
                        const updated = [...formData.certifications];
                        updated[index].title = e.target.value;
                        updateFormData("certifications", updated);
                      }}
                    />
                    <Input
                      placeholder="Provider (e.g., AWS, Google)"
                      value={cert.provider}
                      onChange={(e) => {
                        const updated = [...formData.certifications];
                        updated[index].provider = e.target.value;
                        updateFormData("certifications", updated);
                      }}
                    />
                    <Input
                      type="date"
                      placeholder="Expiry Date"
                      value={cert.expiry}
                      onChange={(e) => {
                        const updated = [...formData.certifications];
                        updated[index].expiry = e.target.value;
                        updateFormData("certifications", updated);
                      }}
                    />
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="mt-2 text-red-500"
                    onClick={() => {
                      updateFormData(
                        "certifications",
                        formData.certifications.filter((_, i) => i !== index),
                      );
                    }}
                  >
                    Remove
                  </Button>
                </Card>
              ))}
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label>Awards & Achievements</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    updateFormData("awards", [
                      ...formData.awards,
                      { title: "", issuer: "", year: "" },
                    ])
                  }
                >
                  <Plus className="w-4 h-4 mr-1" /> Add Award
                </Button>
              </div>

              {formData.awards.map((award, index) => (
                <Card key={index} className="p-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Input
                      placeholder="Award Title"
                      value={award.title}
                      onChange={(e) => {
                        const updated = [...formData.awards];
                        updated[index].title = e.target.value;
                        updateFormData("awards", updated);
                      }}
                    />
                    <Input
                      placeholder="Issuer"
                      value={award.issuer}
                      onChange={(e) => {
                        const updated = [...formData.awards];
                        updated[index].issuer = e.target.value;
                        updateFormData("awards", updated);
                      }}
                    />
                    <Input
                      type="number"
                      placeholder="Year"
                      value={award.year}
                      onChange={(e) => {
                        const updated = [...formData.awards];
                        updated[index].year = e.target.value;
                        updateFormData("awards", updated);
                      }}
                    />
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="mt-2 text-red-500"
                    onClick={() => {
                      updateFormData(
                        "awards",
                        formData.awards.filter((_, i) => i !== index),
                      );
                    }}
                  >
                    Remove
                  </Button>
                </Card>
              ))}
            </div>
          </div>
        );

      case 6:
        return (
          <div className="space-y-6">
            <Card className="border-2 border-dashed border-slate-200 hover:border-teal-300 transition-colors">
              <CardContent className="p-8 text-center">
                <Upload className="w-12 h-12 mx-auto text-slate-400 mb-4" />
                <h3 className="text-lg font-medium text-slate-900 mb-2">
                  Upload Your Resume
                </h3>
                <p className="text-sm text-slate-500 mb-4">
                  PDF or DOCX, max 10MB
                </p>
                <input
                  type="file"
                  accept=".pdf,.docx"
                  className="hidden"
                  id="resume-upload"
                  onChange={handleResumeUpload}
                />
                <Button
                  type="button"
                  variant="outline"
                  disabled={isExtracting}
                  onClick={() =>
                    document.getElementById("resume-upload")?.click()
                  }
                >
                  {isExtracting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Extracting...
                    </>
                  ) : (
                    "Choose File"
                  )}
                </Button>
                {formData.resume_url && (
                  <p className="mt-4 text-sm text-green-600 flex items-center justify-center gap-2">
                    <Check className="w-4 h-4" /> Resume uploaded successfully
                  </p>
                )}
              </CardContent>
            </Card>

            {extractedData && (
              <div className="space-y-6">
                {/* Status Card */}
                <Card className="bg-green-50 border-green-200">
                  <CardContent className="p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-green-500 flex items-center justify-center">
                        <Check className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-green-900">
                          Resume Uploaded
                        </h3>
                        <p className="text-sm text-green-700">
                          Extraction complete — review the detected skills below
                        </p>
                      </div>
                    </div>

                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <ResumeSkillsReview extracted={extractedData} onApply={applyExtractedData}
                      actionLabel="Apply to Profile"
                      description="Choose which detected skills to merge with your selections. Apply the extracted fields, then save your profile to keep the changes." />
                  </CardContent>
                </Card>

                {/* AI Analysis Results */}
                {extractedData.analysis && (
                  <div className="space-y-6">
                    {/* Score */}
                    <div className="flex items-center gap-4">
                      <div className="flex-shrink-0">
                        <div className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-50 to-cyan-50 flex items-center justify-center border-4 border-blue-200">
                          <div className="text-center">
                            <div className="text-3xl font-bold text-blue-600">
                              {extractedData.analysis.score}
                            </div>
                            <div className="text-xs text-blue-500">Score</div>
                          </div>
                        </div>
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-slate-900">
                          Resume Analysis Complete
                        </h3>
                        <p className="text-sm text-slate-600">
                          Here's your personalized feedback
                        </p>
                      </div>
                    </div>

                    {/* Strengths and Improvements Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Strengths */}
                      <Card className="bg-green-50 border-green-200">
                        <CardContent className="p-6">
                          <div className="flex items-center gap-2 mb-4">
                            <Check className="w-5 h-5 text-green-600" />
                            <h3 className="font-semibold text-green-900">
                              Strengths
                            </h3>
                          </div>
                          <ul className="space-y-3">
                            {extractedData.analysis.strengths?.map(
                              (strength, idx) => (
                                <li
                                  key={idx}
                                  className="flex gap-2 text-sm text-green-800"
                                >
                                  <span className="text-green-600 font-bold">
                                    •
                                  </span>
                                  <span>{strength}</span>
                                </li>
                              ),
                            )}
                          </ul>
                        </CardContent>
                      </Card>

                      {/* Areas to Improve */}
                      <Card className="bg-orange-50 border-orange-200">
                        <CardContent className="p-6">
                          <div className="flex items-center gap-2 mb-4">
                            <AlertCircle className="w-5 h-5 text-orange-600" />
                            <h3 className="font-semibold text-orange-900">
                              Areas to Improve
                            </h3>
                          </div>
                          <ul className="space-y-3">
                            {extractedData.analysis.improvements?.map(
                              (improvement, idx) => (
                                <li
                                  key={idx}
                                  className="flex gap-2 text-sm text-orange-800"
                                >
                                  <span className="text-orange-600 font-bold">
                                    •
                                  </span>
                                  <span>{improvement}</span>
                                </li>
                              ),
                            )}
                          </ul>
                        </CardContent>
                      </Card>
                    </div>

                    {/* ATS Optimization Tips */}
                    {extractedData.analysis.ats_tips &&
                      extractedData.analysis.ats_tips.length > 0 && (
                        <Card className="bg-blue-50 border-blue-200">
                          <CardContent className="p-6">
                            <div className="flex items-center gap-2 mb-4">
                              <Sparkles className="w-5 h-5 text-blue-600" />
                              <h3 className="font-semibold text-blue-900">
                                ATS Optimization Tips
                              </h3>
                            </div>
                            <ul className="space-y-3">
                              {extractedData.analysis.ats_tips.map(
                                (tip, idx) => (
                                  <li
                                    key={idx}
                                    className="flex gap-2 text-sm text-blue-800"
                                  >
                                    <span className="text-blue-600 font-bold">
                                      •
                                    </span>
                                    <span>{tip}</span>
                                  </li>
                                ),
                              )}
                            </ul>
                          </CardContent>
                        </Card>
                      )}
                  </div>
                )}
              </div>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  if (isLoadingProfile) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-teal-500 mx-auto mb-4" />
          <p className="text-slate-600">Loading your profile...</p>
        </div>
      </div>
    );
  }

  if (profileLoadError)
    return (
      <div role="alert" className="p-8 text-center">
        <p className="mb-4">{profileLoadError}</p>
        <Button onClick={() => window.location.reload()}>Reload profile</Button>
      </div>
    );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-teal-50/30">
      {/* Header */}
      <div className="fixed top-0 left-0 right-0 bg-white/80 backdrop-blur-xl border-b border-slate-100 z-50">
        <div className="max-w-5xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-xl font-bold bg-gradient-to-r from-teal-600 to-blue-600 bg-clip-text text-transparent">
              {isEditMode ? "Edit Your Profile" : "Career Compass Onboarding"}
            </h1>
            <Badge variant="outline" className="bg-white">
              Step {currentStep} of {steps.length}
            </Badge>
          </div>
          <ProgressBar value={currentStep} max={steps.length} color="teal" />
        </div>
      </div>

      {/* Step Indicators */}
      <div className="fixed top-24 left-0 right-0 bg-white/50 backdrop-blur-sm border-b border-slate-100 z-40">
        <div className="max-w-5xl mx-auto px-4 py-3">
          <div className="flex justify-between overflow-x-auto">
            {steps.map((step) => {
              const Icon = step.icon;
              const isActive = currentStep === step.id;
              const isComplete = currentStep > step.id;

              return (
                <button
                  key={step.id}
                  aria-label={step.title}
                  onClick={() => setCurrentStep(step.id)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-all whitespace-nowrap ${
                    isActive
                      ? "bg-teal-50 text-teal-700"
                      : isComplete
                        ? "text-teal-600"
                        : "text-slate-400"
                  }`}
                >
                  <div
                    className={`w-7 h-7 rounded-full flex items-center justify-center ${
                      isActive
                        ? "bg-teal-500 text-white"
                        : isComplete
                          ? "bg-teal-100 text-teal-600"
                          : "bg-slate-100 text-slate-400"
                    }`}
                  >
                    {isComplete ? (
                      <Check className="w-4 h-4" />
                    ) : (
                      <Icon className="w-4 h-4" />
                    )}
                  </div>
                  <span className="text-sm font-medium hidden sm:block">
                    {step.title}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="pt-44 pb-32 px-4">
        <div className="max-w-3xl mx-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              <Card className="bg-white/80 backdrop-blur-sm shadow-xl shadow-slate-200/50">
                <CardContent className="p-6 md:p-8">
                  <div className="mb-6">
                    <h2 className="text-2xl font-bold text-slate-900">
                      {steps[currentStep - 1].title}
                    </h2>
                    <p className="text-slate-500 mt-1">
                      {currentStep === 1 &&
                        "Let's start with your basic information"}
                      {currentStep === 2 &&
                        "Tell us about your educational background"}
                      {currentStep === 3 &&
                        "What skills and interests do you have?"}
                      {currentStep === 4 && "Share your work experience"}
                      {currentStep === 5 &&
                        "Add your certifications and achievements"}
                      {currentStep === 6 &&
                        "Upload your resume for AI-powered extraction"}
                    </p>
                  </div>
                  {renderStep()}
                </CardContent>
              </Card>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* Footer Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-xl border-t border-slate-100 z-50">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <Button
            variant="ghost"
            onClick={() => setCurrentStep(Math.max(1, currentStep - 1))}
            disabled={currentStep === 1}
          >
            <ChevronLeft className="w-4 h-4 mr-1" />
            Previous
          </Button>

          <div className="text-center">
            <p className="text-sm text-slate-500">Profile Completeness</p>
            <p className="text-lg font-bold text-teal-600">
              {calculateCompleteness()}%
            </p>
          </div>

          {currentStep < steps.length ? (
            <Button
              onClick={() => setCurrentStep(currentStep + 1)}
              className="bg-teal-500 hover:bg-teal-600"
            >
              Next
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          ) : (
            <Button
              onClick={handleSubmit}
              disabled={isLoading || isExtracting}
              className="bg-gradient-to-r from-teal-500 to-blue-500 hover:from-teal-600 hover:to-blue-600"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  {isEditMode ? "Updating..." : "Saving..."}
                </>
              ) : (
                <>
                  {isEditMode ? "Save Changes" : "Complete Setup"}
                  <Sparkles className="w-4 h-4 ml-2" />
                </>
              )}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
