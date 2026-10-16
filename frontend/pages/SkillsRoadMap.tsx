import { apiFetch } from "../services/apiClient";
import React, { useState, useEffect, useRef } from "react";
import { createPageUrl } from "../utils";
import { useAuth } from "../components/AuthProvider";
import { dataService } from "../services/dataService";
import {
  availableResources,
  orderRoadmapSkills,
  prepareRoadmapSkills,
} from "../lib/roadmap";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { BackButton } from "../components/BackButton";
import { addNotification } from "../components/NotificationCenter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { StatusBadge } from "@/components/ui/StatusBadge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Target,
  BookOpen,
  Code,
  Users,
  Brain,
  ExternalLink,
  Clock,
  Calendar,
  Plus,
  CheckCircle2,
  AlertCircle,
  MinusCircle,
  Loader2,
  Sparkles,
  TrendingUp,
  Play,
} from "lucide-react";
import { toast } from "sonner";

const skillCategories = {
  technical: {
    label: "Technical",
    icon: Code,
    color: "text-blue-600",
    bg: "bg-blue-50",
  },
  soft: {
    label: "Soft Skills",
    icon: Users,
    color: "text-purple-600",
    bg: "bg-purple-50",
  },
  domain: {
    label: "Domain",
    icon: Brain,
    color: "text-amber-600",
    bg: "bg-amber-50",
  },
};

const defaultResources = {
  JavaScript: [
    {
      title: "JavaScript Guide",
      provider: "MDN",
      duration: "Self-paced",
      url: "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide",
    },
  ],
  React: [
    {
      title: "React Quick Start",
      provider: "React",
      duration: "Self-paced",
      url: "https://react.dev/learn",
    },
  ],
  Python: [
    {
      title: "Python Tutorial",
      provider: "Python",
      duration: "Self-paced",
      url: "https://docs.python.org/3/tutorial/",
    },
  ],
  SQL: [
    {
      title: "PostgreSQL Tutorial",
      provider: "PostgreSQL",
      duration: "Self-paced",
      url: "https://www.postgresql.org/docs/current/tutorial.html",
    },
  ],
};

export default function SkillsRoadmap() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [selectedRole, setSelectedRole] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const [isGenerating, setIsGenerating] = useState(false);
  const roadmapSectionRef = useRef<HTMLDivElement>(null);
  const showRoadmap = () =>
    roadmapSectionRef.current?.scrollIntoView({
      behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
        ? "auto"
        : "smooth",
      block: "start",
    });

  const { data: profile } = useQuery<any>({
    queryKey: ["userProfile", user?.email],
    queryFn: async () => {
      return await dataService.getUserProfile(user.email);
    },
    enabled: !!user?.email,
  });

  const {
    data: skillProgress = [],
    isLoading,
    error: loadError,
  } = useQuery<any[]>({
    queryKey: ["skillProgress", user?.email],
    queryFn: async () => {
      return await dataService.getSkillProgress(user.email);
    },
    enabled: !!user?.email,
  });

  const updateProgressMutation = useMutation({
    mutationFn: async ({ id, progress }: { id: string; progress: number }) => {
      await dataService.updateSkillProgress(id, { progress });
      return { id, progress };
    },
    onSuccess: async (data) => {
      queryClient.invalidateQueries({ queryKey: ["skillProgress"] });
      toast.success("Progress updated!");
      addNotification(
        "Skill Progress Updated",
        "Your learning progress has been updated",
        "success",
      );

      // Track skill progress in progress system
      try {
        const API_BASE_URL =
          import.meta.env.VITE_API_BASE_URL || "http://localhost:3001/api";

        // Get all skills to calculate total in progress
        const allSkills = await dataService.getSkillProgress(user.email);
        const inProgress = allSkills.filter(
          (s) => s.progress < 100 && s.progress > 0,
        ).length;

        await apiFetch(`${API_BASE_URL}/progress/${user.email}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "skill_progress",
            progress: {
              skillsLearning: inProgress,
            },
          }),
        });

        // Track activity
        const skill = allSkills.find((s) => s.id === data.id);
        await apiFetch(`${API_BASE_URL}/activity/${user.email}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            activityType: "skill_update",
            activityData: {
              skillId: data.id,
              skillName: skill?.skill_name,
              newProgress: data.progress,
            },
          }),
        });
      } catch (err) {
        console.warn("Progress tracking failed (non-critical):", err);
      }
    },
  });

  const generateRoadmapMutation = useMutation({
    mutationFn: async () => {
      setIsGenerating(true);

      if (!selectedRole) {
        throw new Error("Please select a target role first");
      }

      // Call Azure OpenAI to get required skills for the role
      const API_BASE_URL =
        import.meta.env.VITE_API_BASE_URL || "http://localhost:3001/api";

      const prompt = `You are a career advisor specializing in the Singapore job market. Generate a skills roadmap for the role: "${selectedRole}".

User's current skills:
- Technical: ${profile?.hard_skills?.join(", ") || "None"}
- Soft Skills: ${profile?.soft_skills?.join(", ") || "None"}

Provide a JSON response with required skills for this role in Singapore. Include 8-12 skills total (mix of technical and soft skills).

Return in this exact format:
{
  "skills": [
    {
      "name": "skill name",
      "category": "technical" or "soft",
      "importance": "high" or "medium" or "low",
      "description": "one concrete practice step for this skill and why it helps (one sentence)"
    }
  ]
}`;

      {
        const aiResponse = await apiFetch(`${API_BASE_URL}/openai/analyze`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            messages: [{ role: "user", content: prompt }],
            responseSchema: true,
          }),
        });

        if (!aiResponse.ok) {
          throw new Error("Failed to generate skills from AI");
        }

        const aiData = await aiResponse.json();
        const skillsData =
          typeof aiData.result === "string"
            ? JSON.parse(aiData.result)
            : aiData.result;
        const existingSkills = await dataService.getSkillProgress(user.email);
        const newSkills = prepareRoadmapSkills(
          skillsData.skills,
          profile,
          existingSkills,
          defaultResources,
        );
        const savedSkills = await dataService.replaceSkills(newSkills);
        if (
          !Array.isArray(savedSkills) ||
          savedSkills.length !== newSkills.length
        ) {
          throw new Error(
            "The roadmap was not confirmed by the database. Please retry.",
          );
        }
        return savedSkills;
      }
    },
    onSuccess: (savedSkills) => {
      queryClient.setQueryData(["skillProgress", user.email], savedSkills);
      queryClient.invalidateQueries({
        queryKey: ["skillProgress", user.email],
      });
      toast.success("AI-powered learning roadmap generated!");
      addNotification(
        "Learning Roadmap Generated",
        `Your personalized learning roadmap for ${selectedRole} has been created`,
        "success",
      );
      setIsGenerating(false);
      requestAnimationFrame(() => requestAnimationFrame(showRoadmap));
    },
    onError: (error: any) => {
      setIsGenerating(false);
      toast.error(error.message || "Failed to generate roadmap");
    },
  });

  useEffect(() => {
    if (profile?.target_role) {
      setSelectedRole(profile.target_role);
    }
  }, [profile]);

  const filteredSkills =
    activeTab === "all"
      ? skillProgress
      : skillProgress.filter((s) => s.category === activeTab);
  const roadmapSkills = orderRoadmapSkills(filteredSkills);

  const overallProgress =
    skillProgress.length > 0
      ? Math.round(
          skillProgress.reduce((acc, s) => acc + (s.progress || 0), 0) /
            skillProgress.length,
        )
      : 0;

  const matchedCount = skillProgress.filter(
    (s) => s.status === "matched",
  ).length;
  const partialCount = skillProgress.filter(
    (s) => s.status !== "matched" && s.progress > 0 && s.progress < 100,
  ).length;
  const missingCount = skillProgress.filter(
    (s) => s.status === "missing",
  ).length;

  if (loadError)
    return (
      <div role="alert" className="p-6 bg-red-50 rounded-xl">
        {loadError.message}
        <Button onClick={() => queryClient.invalidateQueries()}>Retry</Button>
      </div>
    );

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Back Button */}
      <BackButton />

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-slate-900">
            Skills & Learning Roadmap
          </h1>
          <p className="text-slate-500 mt-1">
            Track your skill development and learning progress
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={selectedRole} onValueChange={setSelectedRole}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Select target role" />
            </SelectTrigger>
            <SelectContent>
              {(
                profile?.desired_roles || [
                  "Software Engineer",
                  "Data Analyst",
                  "Product Manager",
                ]
              ).map((role) => (
                <SelectItem key={role} value={role}>
                  {role}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            className="bg-teal-500 hover:bg-teal-600"
            onClick={() => generateRoadmapMutation.mutate()}
            disabled={isGenerating}
          >
            {isGenerating ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Sparkles className="w-4 h-4 mr-2" />
            )}
            Generate Roadmap
          </Button>
        </div>
      </div>

      {skillProgress.length > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-teal-200 bg-teal-50 px-4 py-3">
          <p className="text-sm text-teal-900">
            Your roadmap has <strong>{skillProgress.length} skills</strong>,
            including <strong>{missingCount} to learn</strong>. Follow the steps
            below and update your progress as you go.
          </p>
          <Button variant="outline" size="sm" onClick={showRoadmap}>
            View roadmap
          </Button>
        </div>
      )}

      {/* Overview Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-white">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <Target className="w-5 h-5 text-teal-500" />
              <span className="text-2xl font-bold text-teal-600">
                {overallProgress}%
              </span>
            </div>
            <p className="text-sm text-slate-600">Overall Progress</p>
            <ProgressBar
              value={overallProgress}
              className="mt-2"
              color="teal"
            />
          </CardContent>
        </Card>

        <Card className="bg-white">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <CheckCircle2 className="w-5 h-5 text-green-500" />
              <span className="text-2xl font-bold text-green-600">
                {matchedCount}
              </span>
            </div>
            <p className="text-sm text-slate-600">Skills Matched</p>
          </CardContent>
        </Card>

        <Card className="bg-white">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <MinusCircle className="w-5 h-5 text-amber-500" />
              <span className="text-2xl font-bold text-amber-600">
                {partialCount}
              </span>
            </div>
            <p className="text-sm text-slate-600">In Progress</p>
          </CardContent>
        </Card>

        <Card className="bg-white">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <AlertCircle className="w-5 h-5 text-red-500" />
              <span className="text-2xl font-bold text-red-600">
                {missingCount}
              </span>
            </div>
            <p className="text-sm text-slate-600">To Learn</p>
          </CardContent>
        </Card>
      </div>

      {/* Time Management Hint */}
      <Card className="bg-gradient-to-r from-teal-50 to-blue-50 border-teal-200">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-lg bg-teal-100 flex items-center justify-center flex-shrink-0">
              <Clock className="w-5 h-5 text-teal-600" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-900">
                Time Management Recommendation
              </h3>
              <p className="text-sm text-slate-600 mt-1">
                Based on your current progress, we recommend dedicating{" "}
                <strong>8-10 hours per week</strong> to skill development. Focus
                on{" "}
                {missingCount > 0
                  ? "high-priority missing skills first"
                  : "advancing your current skills"}
                . Target completion: <strong>3 months</strong> for job
                readiness.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Skills Inventory */}
        <div className="lg:col-span-1">
          <Card className="bg-white">
            <CardHeader>
              <CardTitle className="text-lg font-semibold">
                Skills Inventory
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="w-full grid grid-cols-4 mb-4">
                  <TabsTrigger value="all">All</TabsTrigger>
                  <TabsTrigger value="technical">Tech</TabsTrigger>
                  <TabsTrigger value="soft">Soft</TabsTrigger>
                  <TabsTrigger value="domain">Domain</TabsTrigger>
                </TabsList>

                <div className="space-y-3 max-h-[500px] overflow-y-auto">
                  {isLoading ? (
                    <div className="py-8 text-center">
                      <Loader2 className="w-6 h-6 animate-spin text-teal-500 mx-auto" />
                    </div>
                  ) : filteredSkills.length === 0 ? (
                    <div className="py-8 text-center text-slate-500">
                      <Target className="w-10 h-10 mx-auto mb-2 text-slate-300" />
                      <p>No skills tracked yet</p>
                      <p className="text-sm">
                        Generate a roadmap to get started
                      </p>
                    </div>
                  ) : (
                    filteredSkills.map((skill) => {
                      const category =
                        skillCategories[skill.category] ||
                        skillCategories.technical;
                      const Icon = category.icon;

                      return (
                        <div
                          key={skill.id}
                          className={`p-3 rounded-xl ${category.bg} transition-all hover:shadow-md cursor-pointer`}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <Icon className={`w-4 h-4 ${category.color}`} />
                              <span className="font-medium text-slate-900">
                                {skill.skill_name}
                              </span>
                            </div>
                            <StatusBadge status={skill.status} />
                          </div>
                          <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
                            <span>
                              {skill.current_level} → {skill.target_level}
                            </span>
                            <StatusBadge status={skill.importance} />
                          </div>
                          <ProgressBar
                            value={skill.progress || 0}
                            color={
                              skill.status === "matched"
                                ? "green"
                                : skill.status === "partial"
                                  ? "orange"
                                  : "red"
                            }
                          />
                        </div>
                      );
                    })
                  )}
                </div>
              </Tabs>
            </CardContent>
          </Card>
        </div>

        {/* Learning Roadmap */}
        <div ref={roadmapSectionRef} className="lg:col-span-2 scroll-mt-28">
          <Card className="bg-white">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg font-semibold flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-teal-500" />
                  Learning Roadmap
                </CardTitle>
              </div>
              <p className="text-sm text-slate-500">
                Prioritized steps for gaps and strengths, with your progress
                saved
              </p>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="py-12 text-center">
                  <Loader2 className="w-8 h-8 animate-spin text-teal-500 mx-auto mb-4" />
                  <p className="text-slate-500">Loading your roadmap...</p>
                </div>
              ) : roadmapSkills.length === 0 ? (
                <div className="py-12 text-center">
                  <BookOpen className="w-12 h-12 text-teal-500 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-slate-900 mb-2">
                    {skillProgress.length
                      ? "No skills in this category"
                      : "No roadmap yet"}
                  </h3>
                  <p className="text-slate-500">
                    {skillProgress.length
                      ? "Choose All or another category to view your steps."
                      : "Choose a target role and generate a roadmap to get started."}
                  </p>
                </div>
              ) : (
                <div className="space-y-6">
                  {roadmapSkills.map((skill) => (
                    <div
                      key={skill.id}
                      className="border border-slate-200 rounded-xl p-4"
                    >
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-10 h-10 rounded-lg ${skill.status === "partial" ? "bg-amber-100" : "bg-red-100"} flex items-center justify-center`}
                          >
                            <Code
                              className={`w-5 h-5 ${skill.status === "partial" ? "text-amber-600" : "text-red-600"}`}
                            />
                          </div>
                          <div>
                            <h4 className="font-semibold text-slate-900">
                              {skill.skill_name}
                            </h4>
                            <p className="text-sm text-slate-500">
                              {skill.current_level} → {skill.target_level}
                            </p>
                            <StatusBadge status={skill.status} />
                          </div>
                        </div>
                        <div className="text-right">
                          <StatusBadge status={skill.importance} />
                          {skill.target_date && (
                            <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              Target:{" "}
                              {new Date(skill.target_date).toLocaleDateString()}
                            </p>
                          )}
                        </div>
                      </div>

                      <ProgressBar
                        value={skill.progress || 0}
                        className="mb-4"
                        color="teal"
                        showLabel
                      />

                      {skill.description && (
                        <p className="mb-4 text-sm leading-relaxed text-slate-700">
                          {skill.description}
                        </p>
                      )}

                      {/* Resources */}
                      {availableResources(skill, defaultResources).length >
                        0 && (
                        <div className="space-y-2">
                          <p className="text-sm font-medium text-slate-700">
                            Recommended Resources:
                          </p>
                          {availableResources(skill, defaultResources)
                            .slice(0, 2)
                            .map((resource, i) => (
                              <div
                                key={i}
                                className="flex items-center justify-between p-3 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors"
                              >
                                <div className="flex items-center gap-3">
                                  <div className="w-8 h-8 rounded-lg bg-teal-100 flex items-center justify-center">
                                    <Play className="w-4 h-4 text-teal-600" />
                                  </div>
                                  <div>
                                    <p className="text-sm font-medium text-slate-900">
                                      {resource.title}
                                    </p>
                                    <p className="text-xs text-slate-500">
                                      {resource.provider} • {resource.duration}
                                    </p>
                                  </div>
                                </div>
                                <a
                                  href={resource.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex h-9 w-9 items-center justify-center rounded-md text-teal-600 hover:bg-teal-50"
                                  aria-label={`Open ${resource.title}`}
                                >
                                  <ExternalLink className="w-4 h-4" />
                                </a>
                              </div>
                            ))}
                        </div>
                      )}

                      <div className="flex items-center gap-2 mt-4">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            updateProgressMutation.mutate({
                              id: skill.id,
                              progress: Math.min(
                                100,
                                (skill.progress || 0) + 10,
                              ),
                            })
                          }
                        >
                          <TrendingUp className="w-4 h-4 mr-1" />
                          Update Progress
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
