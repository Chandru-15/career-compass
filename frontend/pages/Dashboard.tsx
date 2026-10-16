import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { createPageUrl } from "../utils";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "../components/AuthProvider";
import { dataService } from "../services/dataService";
import { NotificationCenter } from "../components/NotificationCenter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { FitScoreCard } from "@/components/dashboard/FitScoreCard";
import { SkillsGapChart } from "@/components/dashboard/SkillsGapChart";
import { RealWorldPreview } from "@/components/dashboard/RealWorldPreview";
import { QuickActions } from "@/components/dashboard/QuickActions";
import {
  User,
  Sparkles,
  Briefcase,
  TrendingUp,
  Clock,
  CheckCircle2,
  AlertCircle,
  ChevronRight,
  Loader2,
} from "lucide-react";

export default function Dashboard() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user, isAuthenticated, loading: authLoading, login } = useAuth();
  const [selectedRole, setSelectedRole] = useState("");
  const addSkill = useMutation({
    mutationFn: async (skill: { name: string; status: string }) => {
      const existing = await dataService.getSkillProgress(user.email);
      if (
        existing.some(
          (item) => item.skill_name.toLowerCase() === skill.name.toLowerCase(),
        )
      )
        return;
      await dataService.createSkillProgress(user.email, {
        skill_name: skill.name,
        status: skill.status,
        progress: skill.status === "partial" ? 30 : 0,
        current_level: "beginner",
        target_level: "intermediate",
        importance: "medium",
        description: "Skill requirement from matching CSV jobs.",
        resources: [],
      });
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["skillProgress"] });
      navigate(createPageUrl("SkillsRoadmap"));
    },
  });

  const {
    data: profile,
    isLoading: profileLoading,
    error: profileError,
    refetch,
  } = useQuery({
    queryKey: ["userProfile", user?.email],
    queryFn: async () => {
      return await dataService.getUserProfile(user.email);
    },
    enabled: !!user?.email,
  });

  const { data: applications = [] } = useQuery({
    queryKey: ["applications", user?.email],
    queryFn: async () => {
      return await dataService.getApplications(user.email);
    },
    enabled: !!user?.email,
  });

  useEffect(() => {
    if (profile && !profile.onboarding_completed) {
      navigate(createPageUrl("Onboarding"));
    }
    if (profile?.target_role) {
      setSelectedRole(profile.target_role);
    }
  }, [profile, navigate]);

  const { data: jobs = [] } = useQuery({
    queryKey: ["jobs"],
    queryFn: () => dataService.getJobs(),
  });

  // Calculate deterministic fit score and skills analysis based on profile
  const calculateFitAnalysis = () => {
    if (!profile) return { score: 0, strengths: [], gaps: [], skills: [] };

    const userSkills = [
      ...(profile.hard_skills || []),
      ...(profile.soft_skills || []),
    ];

    // If user has no skills, return 0 score
    if (userSkills.length === 0) {
      return {
        score: 0,
        strengths: [],
        gaps: ["Complete your profile to get started"],
        skills: [],
      };
    }

    const target = (
      selectedRole ||
      profile.target_role ||
      profile.desired_roles?.[0] ||
      ""
    ).toLowerCase();
    const matchingJobs = target
      ? jobs.filter(
          (job) =>
            job.title.toLowerCase().includes(target) ||
            target
              .split(/\s+/)
              .filter((word) => word.length > 3)
              .some((word) => job.title.toLowerCase().includes(word)),
        )
      : jobs;
    const requiredSkills = [
      ...new Set(matchingJobs.flatMap((job) => job.required_skills || [])),
    ].slice(0, 16) as string[];
    if (!requiredSkills.length)
      return {
        score: 0,
        strengths: [],
        gaps: ["No CSV requirements found for this role"],
        skills: [],
      };

    const matchedSkills = requiredSkills.filter((skill) =>
      userSkills.some((s) => s.toLowerCase().includes(skill.toLowerCase())),
    );
    const missingSkills = requiredSkills.filter(
      (skill) =>
        !userSkills.some((s) => s.toLowerCase().includes(skill.toLowerCase())),
    );

    // Calculate score safely
    const matchRatio = matchedSkills.length / requiredSkills.length;
    const baseScore = Math.round(matchRatio * 100);
    const bonusScore = Math.min(15, matchedSkills.length * 2);
    const score = Math.min(95, Math.max(0, baseScore + bonusScore));

    const skillsAnalysis = requiredSkills.map((skill) => ({
      name: skill,
      status: matchedSkills.includes(skill)
        ? "matched"
        : userSkills.some((s) =>
              s.toLowerCase().includes(skill.toLowerCase().slice(0, 3)),
            )
          ? "partial"
          : "missing",
    }));

    return {
      score: isNaN(score) ? 0 : score,
      strengths:
        matchedSkills.length > 0
          ? matchedSkills.slice(0, 4)
          : ["Add skills to your profile"],
      gaps:
        missingSkills.length > 0
          ? missingSkills.slice(0, 4)
          : ["No gaps found"],
      skills: skillsAnalysis,
    };
  };

  const fitAnalysis = calculateFitAnalysis();

  // Show loading while authenticating or loading profile
  if (authLoading || profileLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-teal-500 mx-auto mb-4" />
          <p className="text-slate-500">
            {authLoading ? "Authenticating..." : "Loading your dashboard..."}
          </p>
        </div>
      </div>
    );
  }

  // If not authenticated after loading, show login prompt
  if (!isAuthenticated) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Card className="max-w-md w-full">
          <CardContent className="p-8 text-center">
            <div className="w-16 h-16 rounded-full bg-teal-100 flex items-center justify-center mx-auto mb-4">
              <User className="w-8 h-8 text-teal-600" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900 mb-2">
              Welcome to Career Compass
            </h2>
            <p className="text-slate-500 mb-6">
              Sign in with your Microsoft account to continue
            </p>
            <Button
              onClick={login}
              className="w-full bg-teal-500 hover:bg-teal-600"
            >
              Sign in with Microsoft
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (profileError)
    return (
      <div role="alert" className="p-6 bg-red-50 rounded-xl">
        <p>{profileError.message}</p>
        <Button onClick={() => refetch()}>Retry loading dashboard</Button>
      </div>
    );

  const pendingApplications = applications.filter((a) =>
    ["applied", "under_review", "interview"].includes(a.status),
  ).length;
  const interviewCount = applications.filter(
    (a) => a.status === "interview",
  ).length;

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Welcome Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-slate-900">
            Welcome back, {profile?.full_name?.split(" ")[0] || "there"} 👋
          </h1>
          <p className="text-slate-500 mt-1">
            Here's your career progress at a glance
          </p>
        </div>
        <div className="flex items-center gap-3">
          <NotificationCenter />
          <button
            onClick={() => navigate(createPageUrl("Profile"))}
            className="w-10 h-10 rounded-full bg-gradient-to-br from-teal-400 to-blue-500 flex items-center justify-center text-white hover:shadow-lg hover:scale-110 transition-all duration-200"
            title="Go to Profile"
          >
            <User className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Profile Completeness & Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div
          className="cursor-pointer hover:scale-105 transition-all"
          onClick={() => navigate("/profile")}
        >
          <Card className="bg-gradient-to-br from-teal-500 to-blue-600 text-white hover:shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
                  <User className="w-6 h-6" />
                </div>
                <Badge className="bg-white/20 text-white border-0 hover:bg-white/30">
                  {profile?.profile_completeness || 0}% Complete
                </Badge>
              </div>
              <h3 className="text-lg font-semibold mb-2">Profile Strength</h3>
              <ProgressBar
                value={profile?.profile_completeness || 0}
                color="teal"
                className="[&_div]:bg-white/30 [&_div>div]:bg-white"
              />
              <p className="text-sm text-white/80 mt-3">
                {profile?.profile_completeness < 80
                  ? "Complete your profile to get better job matches"
                  : "Great! Your profile is well optimized"}
              </p>
            </CardContent>
          </Card>
        </div>

        <Card className="bg-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center">
                <Briefcase className="w-6 h-6 text-purple-600" />
              </div>
              <span className="text-3xl font-bold text-slate-900">
                {pendingApplications}
              </span>
            </div>
            <h3 className="text-lg font-semibold text-slate-900">
              Active Applications
            </h3>
            <p className="text-sm text-slate-500 mt-1">
              Applied, under review or interviewing
            </p>
            <Link
              to={createPageUrl("Applications")}
              className="text-sm text-teal-600 hover:text-teal-700 flex items-center gap-1 mt-3 font-medium"
            >
              View all <ChevronRight className="w-4 h-4" />
            </Link>
          </CardContent>
        </Card>

        <Card className="bg-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-xl bg-amber-100 flex items-center justify-center">
                <Clock className="w-6 h-6 text-amber-600" />
              </div>
              <span className="text-3xl font-bold text-slate-900">
                {interviewCount}
              </span>
            </div>
            <h3 className="text-lg font-semibold text-slate-900">
              Upcoming Interviews
            </h3>
            <p className="text-sm text-slate-500 mt-1">Marked as interview</p>
            <Link
              to={createPageUrl("Applications")}
              className="text-sm text-teal-600 hover:text-teal-700 flex items-center gap-1 mt-3 font-medium"
            >
              Prepare now <ChevronRight className="w-4 h-4" />
            </Link>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <QuickActions />

      {/* Deterministic Fit Score Card */}
      <FitScoreCard
        score={fitAnalysis.score}
        targetRole={
          selectedRole || profile?.desired_roles?.[0] || "Software Engineer"
        }
        strengths={fitAnalysis.strengths}
        gaps={fitAnalysis.gaps}
      />

      {/* Skills Gap & Requirements */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-900">
              Skills Analysis
            </h2>
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
          </div>
          <SkillsGapChart
            skills={fitAnalysis.skills}
            targetRole={selectedRole || profile?.desired_roles?.[0]}
            onAddToRoadmap={(skill) => addSkill.mutate(skill)}
          />
        </div>

        {/* Transparent Requirements */}
        <Card className="bg-white">
          <CardHeader>
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-teal-500" />
              Role Requirements
            </CardTitle>
            <p className="text-sm text-slate-500">
              What employers typically look for
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <h4 className="text-sm font-medium text-slate-700 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-green-500" />
                Required Skills
              </h4>
              <div className="flex flex-wrap gap-2">
                {["JavaScript", "React", "Node.js", "SQL", "Git"].map(
                  (skill) => (
                    <Badge
                      key={skill}
                      variant="outline"
                      className="bg-slate-50"
                    >
                      {skill}
                    </Badge>
                  ),
                )}
              </div>
            </div>

            <div className="space-y-3">
              <h4 className="text-sm font-medium text-slate-700 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-amber-500" />
                Common Requirements
              </h4>
              <ul className="space-y-2 text-sm text-slate-600">
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-400 mt-1.5" />
                  Bachelor's degree in CS or related field
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-400 mt-1.5" />
                  0-2 years of relevant experience or internships
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-400 mt-1.5" />
                  Strong problem-solving abilities
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-400 mt-1.5" />
                  Singapore citizen/PR preferred for some roles
                </li>
              </ul>
            </div>

            <Link to={createPageUrl("JobSearch")}>
              <Button className="w-full bg-teal-500 hover:bg-teal-600 mt-2">
                Browse Matching Jobs
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>

      {/* Real World Preview */}
      <RealWorldPreview
        role={
          selectedRole || profile?.desired_roles?.[0] || "Software Engineer"
        }
      />
    </div>
  );
}
