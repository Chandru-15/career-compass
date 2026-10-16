import { ResumeSkillsDialog } from "../components/ResumeSkillsDialog";
import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { createPageUrl } from "../utils";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AzureOpenAIService } from "../services/azureOpenAIService";
import { AzureDocumentIntelligenceService } from "../services/azureDocumentIntelligenceService";
import { useAuth } from "../components/AuthProvider";
import { dataService } from "../services/dataService";
import { BackButton } from "../components/BackButton";
import { addNotification } from "../components/NotificationCenter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ProgressBar } from "@/components/ui/ProgressBar";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  User,
  Mail,
  Phone,
  MapPin,
  GraduationCap,
  Briefcase,
  Award,
  FileText,
  Upload,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Pencil,
  ExternalLink,
  Eye,
  Download,
} from "lucide-react";
import { toast } from "sonner";

export default function Profile() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user, isAuthenticated, login } = useAuth();
  const [showResumeAnalyzer, setShowResumeAnalyzer] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<any>(null);
  const [isExtracting, setIsExtracting] = useState(false);
  const [resumeForSkills, setResumeForSkills] = useState<any>(null);

  const {
    data: profile,
    isLoading,
    error: profileError,
    refetch,
  } = useQuery({
    queryKey: ["userProfile", user?.email],
    queryFn: async () => {
      return await dataService.getUserProfile(user.email);
    },
    enabled: !!user?.email,
  });

  const analyzeResume = async (targetRole = "Software Engineer") => {
    if (!profile?.resume_url) {
      toast.error("Please upload a resume first");
      return;
    }

    setIsAnalyzing(true);
    setAnalysisResult(null);
    try {
      // Use Azure OpenAI with document analysis
      const response = await AzureOpenAIService.analyzeDocument({
        prompt: `Analyze this resume for a ${targetRole} position in Singapore. 
        Provide specific, actionable feedback in the following format:
        
        1. Overall Score (out of 100)
        2. Strengths (3-4 bullet points)
        3. Areas for Improvement (3-4 bullet points)
        4. ATS Optimization Tips (2-3 suggestions)
        5. Quantification Opportunities (suggest how to add metrics)
        
        Be specific and helpful.`,
        fileUrls: [profile.resume_url],
        responseSchema: {
          type: "object",
          properties: {
            overall_score: { type: "number" },
            strengths: { type: "array", items: { type: "string" } },
            improvements: { type: "array", items: { type: "string" } },
            ats_tips: { type: "array", items: { type: "string" } },
            quantification: { type: "array", items: { type: "string" } },
          },
        },
      });

      setAnalysisResult(response);
    } catch (error) {
      console.error("Analysis failed:", error);
      toast.error("Failed to analyze resume");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const reviewResumeSkills = async () => {
    setIsExtracting(true);
    try {
      const resumes = await dataService.getResumes();
      const resume = resumes.find((item) =>
        item.extraction_status === "completed" &&
        profile?.resume_url?.includes(`/resumes/${item.id}/file`));
      if (!resume?.extracted_data) throw new Error("No extracted skills available. Upload your resume in the profile editor first.");
      setResumeForSkills(resume.extracted_data);
    } catch (error) {
      toast.error(error.message || "Could not load resume skills. Please retry.");
    } finally {
      setIsExtracting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-teal-500" />
      </div>
    );
  }

  if (profileError)
    return (
      <div role="alert" className="p-6 bg-red-50 rounded-xl">
        {profileError.message}
        <Button onClick={() => refetch()}>Retry</Button>
      </div>
    );

  return (
    <div className="max-w-5xl mx-auto space-y-6 min-h-screen">
      {/* Back Button */}
      <BackButton />

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-slate-900">
            Profile
          </h1>
          <p className="text-slate-500 mt-1">
            Manage your profile and AI tools
          </p>
        </div>
        <Link to={createPageUrl("Onboarding")}>
          <Button className="bg-teal-500 hover:bg-teal-600">
            <Pencil className="w-4 h-4 mr-2" />
            Edit Profile
          </Button>
        </Link>
      </div>

      {/* Profile Card */}
      <Card className="bg-white overflow-hidden">
        <div className="h-32 bg-gradient-to-r from-teal-500 to-blue-600" />
        <CardContent className="relative pt-0">
          <div className="flex flex-col md:flex-row md:items-end gap-4 -mt-16">
            <div className="w-32 h-32 rounded-2xl bg-white border-4 border-white shadow-lg flex items-center justify-center text-4xl font-bold text-teal-600">
              {user?.full_name?.charAt(0) || "U"}
            </div>
            <div className="flex-1 pb-4">
              <h2 className="text-2xl font-bold text-slate-900">
                {user?.full_name || "User"}
              </h2>
              <p className="text-slate-500">
                {profile?.target_role ||
                  profile?.desired_roles?.[0] ||
                  "Job Seeker"}
              </p>
              <div className="flex flex-wrap items-center gap-4 mt-2 text-sm text-slate-500">
                <span className="flex items-center gap-1">
                  <Mail className="w-4 h-4" />
                  {user?.email}
                </span>
                {profile?.phone && (
                  <span className="flex items-center gap-1">
                    <Phone className="w-4 h-4" />
                    {profile.phone}
                  </span>
                )}
                {profile?.location && (
                  <span className="flex items-center gap-1">
                    <MapPin className="w-4 h-4" />
                    {profile.location}, Singapore
                  </span>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2 pb-4">
              <Badge className="bg-teal-50 text-teal-700 border-0">
                {profile?.profile_completeness || 0}% Complete
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs defaultValue="overview" className="w-full pb-12">
        <TabsList className="bg-white border w-full justify-start">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="resume">Resume Analyzer</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-4 space-y-6 pb-12">
          {/* Quick Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="bg-white">
              <CardContent className="p-4 text-center">
                <GraduationCap className="w-6 h-6 text-teal-500 mx-auto mb-2" />
                <p className="text-sm text-slate-500">Education</p>
                <p className="font-semibold text-slate-900">
                  {profile?.highest_degree || "Not set"}
                </p>
              </CardContent>
            </Card>
            <Card className="bg-white">
              <CardContent className="p-4 text-center">
                <Briefcase className="w-6 h-6 text-blue-500 mx-auto mb-2" />
                <p className="text-sm text-slate-500">Experience</p>
                <p className="font-semibold text-slate-900">
                  {profile?.work_experience?.length || 0} roles
                </p>
              </CardContent>
            </Card>
            <Card className="bg-white">
              <CardContent className="p-4 text-center">
                <Award className="w-6 h-6 text-purple-500 mx-auto mb-2" />
                <p className="text-sm text-slate-500">Certifications</p>
                <p className="font-semibold text-slate-900">
                  {profile?.certifications?.length || 0}
                </p>
              </CardContent>
            </Card>
            <Card className="bg-white">
              <CardContent className="p-4 text-center">
                <FileText className="w-6 h-6 text-amber-500 mx-auto mb-2" />
                <p className="text-sm text-slate-500">Resume</p>
                <p className="font-semibold text-slate-900">
                  {profile?.resume_url ? "Uploaded" : "Not set"}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Skills */}
          <Card className="bg-white">
            <CardHeader>
              <CardTitle className="text-lg font-semibold">Skills</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm font-medium text-slate-700 mb-2">
                  Technical Skills
                </p>
                <div className="flex flex-wrap gap-2">
                  {(profile?.hard_skills || []).map((skill, i) => (
                    <Badge
                      key={i}
                      variant="secondary"
                      className="bg-blue-50 text-blue-700"
                    >
                      {skill}
                    </Badge>
                  ))}
                  {(!profile?.hard_skills ||
                    profile.hard_skills.length === 0) && (
                    <p className="text-sm text-slate-400">
                      No skills added yet
                    </p>
                  )}
                </div>
              </div>
              <div>
                <p className="text-sm font-medium text-slate-700 mb-2">
                  Soft Skills
                </p>
                <div className="flex flex-wrap gap-2">
                  {(profile?.soft_skills || []).map((skill, i) => (
                    <Badge
                      key={i}
                      variant="secondary"
                      className="bg-purple-50 text-purple-700"
                    >
                      {skill}
                    </Badge>
                  ))}
                  {(!profile?.soft_skills ||
                    profile.soft_skills.length === 0) && (
                    <p className="text-sm text-slate-400">
                      No skills added yet
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {profile?.resume_url && (
            <Button variant="outline" onClick={reviewResumeSkills} disabled={isExtracting}>
              {isExtracting ? "Loading resume skills…" : "Review skills from saved resume"}
            </Button>
          )}

          {/* Education & Experience */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="bg-white">
              <CardHeader>
                <CardTitle className="text-lg font-semibold flex items-center gap-2">
                  <GraduationCap className="w-5 h-5 text-teal-500" />
                  Education
                </CardTitle>
              </CardHeader>
              <CardContent>
                {profile?.institution ? (
                  <div className="space-y-2">
                    <p className="font-medium text-slate-900">
                      {profile.highest_degree}
                    </p>
                    <p className="text-slate-600">{profile.major}</p>
                    <p className="text-sm text-slate-500">
                      {profile.institution}
                    </p>
                    {profile.graduation_year && (
                      <p className="text-sm text-slate-500">
                        Class of {profile.graduation_year}
                      </p>
                    )}
                  </div>
                ) : (
                  <p className="text-slate-400">No education added yet</p>
                )}
              </CardContent>
            </Card>

            <Card className="bg-white">
              <CardHeader>
                <CardTitle className="text-lg font-semibold flex items-center gap-2">
                  <Briefcase className="w-5 h-5 text-blue-500" />
                  Experience
                </CardTitle>
              </CardHeader>
              <CardContent>
                {profile?.work_experience?.length > 0 ? (
                  <div className="space-y-4">
                    {profile.work_experience.slice(0, 2).map((exp, i) => (
                      <div key={i} className="border-l-2 border-blue-200 pl-3">
                        <p className="font-medium text-slate-900">
                          {exp.title}
                        </p>
                        <p className="text-sm text-slate-600">{exp.company}</p>
                        <p className="text-xs text-slate-500">
                          {exp.start_date} - {exp.end_date || "Present"}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-slate-400">No experience added yet</p>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="resume" className="mt-4 pb-12">
          <Card className="bg-white">
            <CardHeader>
              <CardTitle className="text-lg font-semibold flex items-center gap-2">
                <FileText className="w-5 h-5 text-teal-500" />
                AI Resume Analyzer
              </CardTitle>
              <p className="text-sm text-slate-500">
                Get AI-powered feedback to improve your resume
              </p>
            </CardHeader>
            <CardContent className="space-y-6">
              {profile?.resume_url ? (
                <div className="p-4 bg-green-50 rounded-lg flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="w-5 h-5 text-green-600" />
                    <div>
                      <p className="font-medium text-green-700">
                        Resume Uploaded
                      </p>
                      <p className="text-sm text-green-600">
                        Ready for analysis
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" asChild>
                      <a
                        href={profile.resume_url}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <Eye className="w-4 h-4 mr-1" />
                        View
                      </a>
                    </Button>
                    <Button
                      size="sm"
                      className="bg-teal-500 hover:bg-teal-600"
                      onClick={() => analyzeResume()}
                      disabled={isAnalyzing}
                    >
                      {isAnalyzing ? (
                        <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                      ) : (
                        <Sparkles className="w-4 h-4 mr-1" />
                      )}
                      Analyze
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="p-4 bg-amber-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <AlertCircle className="w-5 h-5 text-amber-600" />
                    <div>
                      <p className="font-medium text-amber-700">
                        No Resume Uploaded
                      </p>
                      <p className="text-sm text-amber-600">
                        Upload your resume in the profile editor
                      </p>
                    </div>
                  </div>
                  <Link to={createPageUrl("Onboarding")}>
                    <Button className="mt-3" variant="outline">
                      <Upload className="w-4 h-4 mr-2" />
                      Upload Resume
                    </Button>
                  </Link>
                </div>
              )}

              {analysisResult && (
                <div className="space-y-4 border-t pt-4">
                  <div className="flex items-center gap-4">
                    <div className="text-center">
                      <div className="w-20 h-20 rounded-full bg-gradient-to-br from-teal-100 to-blue-100 flex items-center justify-center">
                        <span className="text-2xl font-bold text-teal-600">
                          {analysisResult.overall_score}
                        </span>
                      </div>
                      <p className="text-sm text-slate-500 mt-1">Score</p>
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-slate-900">
                        Resume Analysis Complete
                      </h4>
                      <p className="text-sm text-slate-500">
                        Here's your personalized feedback
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Card className="bg-green-50 border-green-200">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-green-700 flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4" />
                          Strengths
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <ul className="space-y-2">
                          {analysisResult.strengths?.map((item, i) => (
                            <li
                              key={i}
                              className="text-sm text-green-700 flex items-start gap-2"
                            >
                              <span className="w-1.5 h-1.5 rounded-full bg-green-500 mt-1.5 flex-shrink-0" />
                              {item}
                            </li>
                          ))}
                        </ul>
                      </CardContent>
                    </Card>

                    <Card className="bg-amber-50 border-amber-200">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-amber-700 flex items-center gap-2">
                          <AlertCircle className="w-4 h-4" />
                          Areas to Improve
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <ul className="space-y-2">
                          {analysisResult.improvements?.map((item, i) => (
                            <li
                              key={i}
                              className="text-sm text-amber-700 flex items-start gap-2"
                            >
                              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-1.5 flex-shrink-0" />
                              {item}
                            </li>
                          ))}
                        </ul>
                      </CardContent>
                    </Card>
                  </div>

                  <Card className="bg-blue-50 border-blue-200">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium text-blue-700">
                        ATS Optimization Tips
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-2">
                        {analysisResult.ats_tips?.map((item, i) => (
                          <li
                            key={i}
                            className="text-sm text-blue-700 flex items-start gap-2"
                          >
                            <span className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1.5 flex-shrink-0" />
                            {item}
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      <ResumeSkillsDialog extracted={resumeForSkills} onClose={() => setResumeForSkills(null)} />
    </div>
  );
}
