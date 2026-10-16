import { ResumeSkillsDialog } from "../components/ResumeSkillsDialog";
import { apiFetch } from "../services/apiClient";
import React, { useState, useEffect, useRef } from "react";
import { createPageUrl } from "../utils";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AzureOpenAIService } from "../services/azureOpenAIService";
import { AzureDocumentIntelligenceService } from "../services/azureDocumentIntelligenceService";
import { useAuth } from "../components/AuthProvider";
import { dataService } from "../services/dataService";
import { BackButton } from "../components/BackButton";
import { addNotification } from "../components/NotificationCenter";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { buildResumeMessage, hasResumeContext } from "../lib/resumeContext.js";
import ReactMarkdown from "react-markdown";
import {
  Bot,
  Send,
  Sparkles,
  Target,
  FileText,
  MessageSquare,
  Lightbulb,
  Clock,
  Plus,
  Loader2,
  User,
  Trash2,
  ChevronRight,
  Map,
  ArrowRight,
  Paperclip,
  X,
  Upload,
} from "lucide-react";

const interviewPrepSuggestions = [
  { label: "Common interview questions", icon: MessageSquare },
  { label: "STAR method examples", icon: FileText },
  { label: "Technical interview tips", icon: Lightbulb },
  { label: "Mock interview practice", icon: Target },
];

const roadmapSuggestions = [
  { label: "Create learning roadmap", icon: Map },
  { label: "Skill gap analysis", icon: Target },
  { label: "Industry trends", icon: Lightbulb },
  { label: "Career progression path", icon: FileText },
];

type ModeType = "interview" | "roadmap" | null;

export default function AIPlanner() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user, isAuthenticated, login } = useAuth();
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [currentConversation, setCurrentConversation] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [selectedMode, setSelectedMode] = useState<ModeType>(null);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [isAnalyzingFile, setIsAnalyzingFile] = useState(false);
  const [resumeForSkills, setResumeForSkills] = useState<any>(null);
  const messagesViewportRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: profile } = useQuery({
    queryKey: ["userProfile", user?.email],
    queryFn: async () => {
      return await dataService.getUserProfile(user.email);
    },
    enabled: !!user?.email,
  });

  const { data: conversations = [] } = useQuery({
    queryKey: ["conversations", user?.email],
    queryFn: async () => {
      return await dataService.getConversations(user.email);
    },
    enabled: !!user?.email,
  });

  const scrollToBottom = () => {
    const viewport = messagesViewportRef.current;
    viewport?.scrollTo({ top: viewport.scrollHeight, behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const startNewConversation = () => {
    setCurrentConversation(null);
    setMessages([]);
    setSelectedMode(null);
  };

  const selectMode = (mode: ModeType) => {
    setSelectedMode(mode);
    setMessages([]);
    setCurrentConversation(null);
  };

  const loadConversation = (conv) => {
    setCurrentConversation(conv);
    setMessages(conv.messages || []);
    setSelectedMode(conv.mode || "interview");
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Check file type
      const allowedTypes = [
        "application/pdf",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "image/png",
        "image/jpeg",
        "image/jpg",
      ];
      if (!allowedTypes.includes(file.type)) {
        toast.error("Please upload a PDF, DOCX, or image file");
        return;
      }

      // Check file size (10MB max)
      if (file.size > 10 * 1024 * 1024) {
        toast.error("File size must be less than 10MB");
        return;
      }

      setUploadedFile(file);
      toast.success(`File "${file.name}" attached`);
    }
  };

  const removeFile = () => {
    setUploadedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const analyzeResumeFile = async (file: File) => {
    setIsAnalyzingFile(true);
    try {
      const result = await AzureDocumentIntelligenceService.analyzeResume(
        file,
        {
          userEmail: user?.email,
        },
      );

      setResumeForSkills(result);
      return { success: true, data: result };
    } catch (error) {
      console.error("Resume analysis error:", error);
      toast.error(error.message || "Failed to analyze resume.");
      return {
        success: false,
        error: error.message,
      };
    } finally {
      setIsAnalyzingFile(false);
    }
  };

  const sendMessage = async (content) => {
    if (isLoading || isAnalyzingFile || (!content.trim() && !uploadedFile))
      return;

    let messageContent = content;
    let resumeAnalysis = null;

    // If there's a file, analyze it first
    if (uploadedFile) {
      toast.info("Analyzing your resume...");
      resumeAnalysis = await analyzeResumeFile(uploadedFile);

      if (resumeAnalysis.success) {
        const userQuery =
          content || "Please review my resume and provide detailed feedback";
        try {
          messageContent = buildResumeMessage(
            userQuery,
            uploadedFile.name,
            resumeAnalysis.data,
          );
        } catch (error) {
          toast.error(error.message);
          return;
        }

        toast.success("Resume analyzed successfully!");
        addNotification(
          "Resume Analyzed",
          "Your resume has been analyzed and saved",
          "success",
        );
      } else {
        toast.error("Failed to analyze resume");
        return;
      }

      removeFile();
    }

    const userMessage = {
      role: "user",
      content: messageContent,
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      // Build context from user profile
      const resumeReview = hasResumeContext([...messages, userMessage]);
      const profileContext =
        profile && !resumeReview
          ? `
User Profile Context:
- Name: ${user?.full_name || "User"}
- Target Role: ${profile.target_role || profile.desired_roles?.[0] || "Not specified"}
- Skills: ${[...(profile.hard_skills || []), ...(profile.soft_skills || [])].join(", ") || "Not specified"}
- Education: ${profile.highest_degree || ""} in ${profile.major || ""} from ${profile.institution || ""}
- Experience Status: ${profile.employment_status || "Not specified"}
- Preferred Industries: ${(profile.preferred_industries || []).join(", ") || "Not specified"}
- Location: Singapore
      `
          : "";

      let systemPrompt = "";

      if (selectedMode === "interview") {
        systemPrompt = `You are Career Compass AI in Interview Prep Mode, an expert interview coach for fresh graduates in Singapore.
${profileContext}

Your specialized focus is on:
1. Common and behavioral interview questions for ${profile?.target_role || "fresh graduates"}
2. STAR method (Situation, Task, Action, Result) response examples
3. Technical interview preparation and coding challenges
4. Mock interview practice and feedback
5. Body language and presentation tips
6. Handling difficult questions and salary negotiations
7. Company-specific interview preparation

Be encouraging, provide specific examples, and tailor advice to the Singapore job market.
Use markdown formatting for better readability. Provide actionable feedback.`;
      } else if (selectedMode === "roadmap") {
        systemPrompt = `You are Career Compass AI in Roadmap Mode, an expert career development strategist for fresh graduates in Singapore.
${profileContext}

Your specialized focus is on:
1. Creating personalized learning roadmaps for ${profile?.target_role || "career development"}
2. Identifying skill gaps and suggesting learning resources
3. Industry trends and emerging technologies
4. Career progression paths and milestones
5. Certification and course recommendations
6. Building a portfolio and personal projects
7. Networking strategies and professional development

Be strategic, provide structured plans with clear milestones.
Use markdown formatting for roadmaps and timelines. Be specific to the Singapore market.`;
      } else {
        systemPrompt = `You are Career Compass AI, an expert career advisor for fresh graduates in Singapore.
${profileContext}

Your role is to:
1. Provide personalized career advice based on the user's profile
2. Help with resume writing and optimization
3. Prepare for interviews with common questions and tips
4. Suggest learning paths and skill development
5. Create career plans with realistic timelines
6. Offer time management strategies

Be encouraging, practical, and specific to the Singapore job market. 
Keep responses concise but helpful. Use markdown formatting when appropriate.`;
      }

      // Use Azure OpenAI service
      const response = await AzureOpenAIService.invokeChatCompletion({
        systemPrompt,
        messages: [...messages, userMessage].map(({ role, content }) => ({
          role,
          content,
        })),
        temperature: resumeReview ? 0.2 : 0.7,
      });

      const assistantMessage = {
        role: "assistant",
        content: response,
        timestamp: new Date().toISOString(),
      };

      setMessages((prev) => [...prev, assistantMessage]);

      // Save conversation without presenting a persistence error as an AI response.
      try {
        if (currentConversation) {
          await dataService.updateConversation(currentConversation.id, {
            title: (content || "Resume review").slice(0, 50),
            mode: selectedMode,
            messages: [...messages, userMessage, assistantMessage],
          });
          queryClient.invalidateQueries({ queryKey: ["conversations"] });
        } else {
          const conv = await dataService.createConversation(user.email, {
            title: (content || "Resume review").slice(0, 50),
            mode: selectedMode,
            messages: [...messages, userMessage, assistantMessage],
          });
          setCurrentConversation(conv);
          queryClient.invalidateQueries({ queryKey: ["conversations"] });

          // Track new conversation in progress system
          try {
            const API_BASE_URL =
              import.meta.env.VITE_API_BASE_URL || "http://localhost:3001/api";
            await apiFetch(`${API_BASE_URL}/progress/${user.email}`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                action: "conversation_started",
              }),
            });

            // Track activity
            await apiFetch(`${API_BASE_URL}/activity/${user.email}`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                activityType: "ai_conversation",
                activityData: {
                  conversationId: conv.id,
                  mode: selectedMode,
                  firstMessage: content.slice(0, 100),
                },
              }),
            });
          } catch (err) {
            console.warn("Progress tracking failed (non-critical):", err);
          }
        }
      } catch (saveError) {
        toast.error(
          "AI replied, but conversation was not saved: " + saveError.message,
        );
      }
    } catch (error) {
      console.error("AI Error:", error);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: error.message || "The request failed. Please try again.",
          timestamp: new Date().toISOString(),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const deleteConversation = async (id, e) => {
    e.stopPropagation();
    try {
      await dataService.deleteConversation(id, user.email);
    } catch (error) {
      toast.error(error.message);
      return;
    }
    if (currentConversation?.id === id) {
      setCurrentConversation(null);
      setMessages([]);
    }
    queryClient.invalidateQueries({ queryKey: ["conversations"] });
  };

  return (
    <div className="ai-planner max-w-7xl mx-auto h-full min-h-0 min-w-0">
      <div className="grid h-full min-h-0 min-w-0 grid-cols-1 grid-rows-[auto_minmax(0,1fr)] lg:grid-rows-1 lg:grid-cols-[minmax(12rem,1fr)_minmax(0,3fr)] gap-3 lg:gap-6">
        {/* Sidebar - Conversations */}
        <div className="min-w-0 min-h-0">
          <Card className="h-full min-h-0 min-w-0 bg-white flex flex-col">
            <CardHeader className="py-2 px-4 lg:p-6 lg:pb-3 shrink-0">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg font-semibold">
                  Conversations
                </CardTitle>
                <Button
                  variant="ghost"
                  size="icon"
                  disabled={isLoading || isAnalyzingFile}
                  aria-label="New conversation"
                  onClick={startNewConversation}
                >
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-2 pt-0 min-h-0 min-w-0 lg:flex-1">
              <div
                className="max-h-20 lg:max-h-none lg:h-full overflow-y-auto min-w-0"
                aria-label="Saved conversations"
              >
                <div className="space-y-1">
                  {conversations.map((conv) => (
                    <div
                      role="button"
                      tabIndex={0}
                      onKeyDown={(event) => {
                        if (
                          event.key === "Enter" &&
                          event.target === event.currentTarget &&
                          !isLoading &&
                          !isAnalyzingFile
                        )
                          loadConversation(conv);
                      }}
                      key={conv.id}
                      onClick={() =>
                        !isLoading && !isAnalyzingFile && loadConversation(conv)
                      }
                      className={`w-full flex items-center justify-between p-3 rounded-lg text-left transition-colors group ${
                        currentConversation?.id === conv.id
                          ? "bg-teal-50 text-teal-700"
                          : "hover:bg-slate-50"
                      }`}
                    >
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <MessageSquare className="w-4 h-4 flex-shrink-0" />
                        <span className="text-sm truncate">{conv.title}</span>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 opacity-0 group-hover:opacity-100"
                        aria-label="Delete conversation"
                        disabled={isLoading || isAnalyzingFile}
                        onClick={(e) => deleteConversation(conv.id, e)}
                      >
                        <Trash2 className="w-3 h-3 text-slate-400" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Chat Area */}
        <div className="flex flex-col min-w-0 min-h-0">
          <Card className="flex-1 min-h-0 min-w-0 bg-white flex flex-col overflow-hidden">
            {/* Chat Header */}
            <CardHeader className="border-b flex-shrink-0 p-3 lg:p-4">
              <div className="flex items-center gap-3">
                <BackButton toDashboard={true} label="" className="p-2" />
                <div
                  className={`w-10 h-10 shrink-0 rounded-xl flex items-center justify-center ${
                    selectedMode === "interview"
                      ? "bg-gradient-to-br from-blue-500 to-purple-600"
                      : selectedMode === "roadmap"
                        ? "bg-gradient-to-br from-teal-500 to-green-600"
                        : "bg-gradient-to-br from-teal-500 to-blue-600"
                  }`}
                >
                  {selectedMode === "interview" ? (
                    <MessageSquare className="w-5 h-5 text-white" />
                  ) : selectedMode === "roadmap" ? (
                    <Map className="w-5 h-5 text-white" />
                  ) : (
                    <Bot className="w-5 h-5 text-white" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <CardTitle className="text-lg font-semibold">
                      Career Compass AI
                    </CardTitle>
                    {selectedMode && (
                      <Badge
                        variant="secondary"
                        className={`text-xs ${
                          selectedMode === "interview"
                            ? "bg-blue-100 text-blue-700"
                            : "bg-teal-100 text-teal-700"
                        }`}
                      >
                        {selectedMode === "interview"
                          ? "Interview Prep"
                          : "Roadmap"}
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-slate-500">
                    {selectedMode === "interview"
                      ? "Interview preparation mode"
                      : selectedMode === "roadmap"
                        ? "Career roadmap mode"
                        : "Your personal career advisor"}
                  </p>
                </div>
              </div>
            </CardHeader>

            {/* Messages */}
            <CardContent className="flex-1 min-h-0 min-w-0 overflow-hidden p-0">
              <div
                ref={messagesViewportRef}
                role="region"
                aria-label="Conversation messages"
                tabIndex={0}
                className="h-full min-w-0 overflow-y-auto overscroll-contain p-3 sm:p-4"
              >
                {!selectedMode ? (
                  /* Mode Selection Screen */
                  <div className="min-h-full min-w-0 flex flex-col items-center justify-center text-center p-3 sm:p-8">
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-teal-500 to-blue-600 flex items-center justify-center mb-4">
                      <Bot className="w-8 h-8 text-white" />
                    </div>
                    <h3 className="text-2xl font-bold text-slate-900 mb-2">
                      Career Compass AI
                    </h3>
                    <p className="text-slate-500 mb-8 max-w-md">
                      Choose your focus area to get personalized AI assistance
                    </p>

                    {/* Mode Selection Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-2xl">
                      {/* Interview Prep Mode */}
                      <Card
                        className="cursor-pointer hover:shadow-lg transition-all hover:scale-105 border-2 hover:border-teal-500"
                        onClick={() => selectMode("interview")}
                      >
                        <CardContent className="p-6 text-center">
                          <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center mx-auto mb-4">
                            <MessageSquare className="w-7 h-7 text-white" />
                          </div>
                          <h4 className="text-lg font-semibold text-slate-900 mb-2">
                            Interview Prep Mode
                          </h4>
                          <p className="text-sm text-slate-500 mb-4">
                            Practice interviews, get tips on common questions,
                            learn STAR method, and ace your next interview
                          </p>
                          <Button className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700">
                            Start Prep
                            <ArrowRight className="w-4 h-4 ml-2" />
                          </Button>
                        </CardContent>
                      </Card>

                      {/* Roadmap Mode */}
                      <Card
                        className="cursor-pointer hover:shadow-lg transition-all hover:scale-105 border-2 hover:border-teal-500"
                        onClick={() => selectMode("roadmap")}
                      >
                        <CardContent className="p-6 text-center">
                          <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-teal-500 to-green-600 flex items-center justify-center mx-auto mb-4">
                            <Map className="w-7 h-7 text-white" />
                          </div>
                          <h4 className="text-lg font-semibold text-slate-900 mb-2">
                            Roadmap Mode
                          </h4>
                          <p className="text-sm text-slate-500 mb-4">
                            Create learning paths, identify skill gaps, get
                            career progression plans, and achieve your goals
                          </p>
                          <Button className="w-full bg-gradient-to-r from-teal-500 to-green-600 hover:from-teal-600 hover:to-green-700">
                            Build Roadmap
                            <ArrowRight className="w-4 h-4 ml-2" />
                          </Button>
                        </CardContent>
                      </Card>
                    </div>

                    {/* Quick Action Buttons */}
                    <div className="mt-8 w-full max-w-2xl">
                      <p className="text-sm font-medium text-slate-600 mb-3">
                        Quick Actions
                      </p>
                      <div className="flex flex-wrap justify-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="rounded-full text-sm"
                          onClick={() => {
                            setSelectedMode("interview");
                            setTimeout(
                              () => sendMessage("Review my resume"),
                              100,
                            );
                          }}
                        >
                          <FileText className="w-4 h-4 mr-2" />
                          Review my resume
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="rounded-full text-sm"
                          onClick={() => {
                            setSelectedMode("roadmap");
                            setTimeout(
                              () => sendMessage("Career path advice"),
                              100,
                            );
                          }}
                        >
                          <Lightbulb className="w-4 h-4 mr-2" />
                          Career path advice
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="rounded-full text-sm"
                          onClick={() => {
                            setSelectedMode("roadmap");
                            setTimeout(
                              () => sendMessage("Time management tips"),
                              100,
                            );
                          }}
                        >
                          <Clock className="w-4 h-4 mr-2" />
                          Time management tips
                        </Button>
                      </div>
                    </div>

                    {/* Suggested Career Paths Section */}
                    <div className="mt-8 w-full max-w-3xl">
                      <h4 className="text-sm font-medium text-slate-700 mb-4">
                        Suggested Career Paths
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {[
                          {
                            title: "Software Engineer Track",
                            time: "6-12 months",
                            desc: "Full-stack development skills",
                            gradient: "from-blue-500 to-blue-600",
                          },
                          {
                            title: "Data Analyst Path",
                            time: "4-8 months",
                            desc: "SQL, Python, visualization",
                            gradient: "from-purple-500 to-purple-600",
                          },
                          {
                            title: "Product Manager Route",
                            time: "8-12 months",
                            desc: "Product thinking, analytics",
                            gradient: "from-teal-500 to-teal-600",
                          },
                        ].map((plan, i) => (
                          <Card
                            key={i}
                            className="cursor-pointer hover:shadow-md transition-all hover:scale-105 border"
                            onClick={() => {
                              setSelectedMode("roadmap");
                              setTimeout(
                                () =>
                                  sendMessage(
                                    `Tell me more about the ${plan.title}`,
                                  ),
                                100,
                              );
                            }}
                          >
                            <CardContent className="p-4">
                              <div
                                className={`w-10 h-10 rounded-lg bg-gradient-to-br ${plan.gradient} flex items-center justify-center mb-3`}
                              >
                                <Target className="w-5 h-5 text-white" />
                              </div>
                              <h5 className="font-semibold text-slate-900 mb-1">
                                {plan.title}
                              </h5>
                              <p className="text-xs text-slate-500 mb-3">
                                {plan.desc}
                              </p>
                              <Badge variant="outline" className="text-xs">
                                <Clock className="w-3 h-3 mr-1" />
                                {plan.time}
                              </Badge>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </div>

                    <p className="text-xs text-slate-400 mt-8">
                      You can switch modes anytime by starting a new
                      conversation
                    </p>
                  </div>
                ) : messages.length === 0 ? (
                  /* Empty State with Selected Mode */
                  <div className="h-full flex flex-col items-center justify-center text-center p-8">
                    <div
                      className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-4 ${
                        selectedMode === "interview"
                          ? "bg-gradient-to-br from-blue-500 to-purple-600"
                          : "bg-gradient-to-br from-teal-500 to-green-600"
                      }`}
                    >
                      {selectedMode === "interview" ? (
                        <MessageSquare className="w-8 h-8 text-white" />
                      ) : (
                        <Map className="w-8 h-8 text-white" />
                      )}
                    </div>
                    <h3 className="text-xl font-semibold text-slate-900 mb-2">
                      {selectedMode === "interview"
                        ? "Interview Prep Mode"
                        : "Roadmap Mode"}
                    </h3>
                    <p className="text-slate-500 mb-6 max-w-md">
                      {selectedMode === "interview"
                        ? "I'll help you prepare for interviews with practice questions, STAR method examples, and expert tips."
                        : "I'll help you create personalized learning roadmaps, identify skill gaps, and plan your career progression."}
                    </p>

                    {/* Mode-specific Suggestion Chips */}
                    <div className="flex flex-wrap justify-center gap-2 mb-6">
                      {(selectedMode === "interview"
                        ? interviewPrepSuggestions
                        : roadmapSuggestions
                      ).map((chip) => {
                        const Icon = chip.icon;
                        return (
                          <Button
                            key={chip.label}
                            variant="outline"
                            className="rounded-full"
                            onClick={() => sendMessage(chip.label)}
                          >
                            <Icon className="w-4 h-4 mr-2" />
                            {chip.label}
                          </Button>
                        );
                      })}
                    </div>

                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSelectedMode(null)}
                      className="text-slate-500 hover:text-teal-600"
                    >
                      ← Change Mode
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4 pb-4">
                    {messages.map((msg, index) => (
                      <div
                        key={index}
                        className={`flex min-w-0 ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                      >
                        <div
                          className={`flex min-w-0 gap-2 sm:gap-3 max-w-[98%] sm:max-w-[90%] ${
                            msg.role === "user" ? "flex-row-reverse" : ""
                          }`}
                        >
                          <div
                            className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                              msg.role === "user"
                                ? "bg-teal-500"
                                : "bg-gradient-to-br from-teal-500 to-blue-600"
                            }`}
                          >
                            {msg.role === "user" ? (
                              <User className="w-4 h-4 text-white" />
                            ) : (
                              <Bot className="w-4 h-4 text-white" />
                            )}
                          </div>
                          <div
                            className={`min-w-0 max-w-full rounded-2xl px-3 sm:px-4 py-3 [overflow-wrap:anywhere] ${
                              msg.role === "user"
                                ? "bg-teal-500 text-white"
                                : "bg-slate-100 text-slate-900"
                            }`}
                          >
                            {msg.role === "user" ? (
                              <p className="text-sm whitespace-pre-wrap">
                                {msg.content}
                              </p>
                            ) : (
                              <div className="chat-markdown prose prose-sm min-w-0 max-w-full">
                                <ReactMarkdown>{msg.content}</ReactMarkdown>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                    {isLoading && (
                      <div className="flex justify-start">
                        <div className="flex gap-3 max-w-[80%]">
                          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-teal-500 to-blue-600 flex items-center justify-center">
                            <Bot className="w-4 h-4 text-white" />
                          </div>
                          <div className="rounded-2xl px-4 py-3 bg-slate-100">
                            <div className="flex gap-1">
                              <div
                                className="w-2 h-2 rounded-full bg-slate-400 animate-bounce"
                                style={{ animationDelay: "0ms" }}
                              />
                              <div
                                className="w-2 h-2 rounded-full bg-slate-400 animate-bounce"
                                style={{ animationDelay: "150ms" }}
                              />
                              <div
                                className="w-2 h-2 rounded-full bg-slate-400 animate-bounce"
                                style={{ animationDelay: "300ms" }}
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </CardContent>

            {/* Input Area */}
            <div className="border-t p-3 sm:p-4 flex-shrink-0 min-w-0">
              {/* File attachment preview */}
              {uploadedFile && (
                <div className="mb-2 p-2 bg-slate-50 rounded-lg flex items-center justify-between min-w-0 gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <FileText className="w-4 h-4 text-teal-600" />
                    <span className="text-sm text-slate-700 truncate">
                      {uploadedFile.name}
                    </span>
                    <span className="text-xs text-slate-400">
                      ({(uploadedFile.size / 1024).toFixed(1)} KB)
                    </span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    aria-label="Remove attachment"
                    disabled={isLoading || isAnalyzingFile}
                    onClick={removeFile}
                    className="h-6 w-6 p-0"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              )}

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  sendMessage(input);
                }}
                className="flex min-w-0 gap-2"
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.docx,image/*"
                  className="hidden"
                  onChange={handleFileSelect}
                  disabled={isLoading || isAnalyzingFile}
                />

                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isLoading || !selectedMode || isAnalyzingFile}
                  title="Attach resume or document"
                  className="shrink-0"
                >
                  {isAnalyzingFile ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Paperclip className="w-4 h-4" />
                  )}
                </Button>

                <Input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder={
                    selectedMode === "interview"
                      ? "Ask about interview questions, STAR method, tips..."
                      : selectedMode === "roadmap"
                        ? "Ask about learning paths, skill gaps, career planning..."
                        : "Choose a mode to get started..."
                  }
                  aria-label="Chat message"
                  className="flex-1 min-w-0"
                  disabled={isLoading || isAnalyzingFile || !selectedMode}
                />
                <Button
                  type="submit"
                  aria-label="Send message"
                  className={`shrink-0 ${
                    selectedMode === "interview"
                      ? "bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
                      : selectedMode === "roadmap"
                        ? "bg-gradient-to-r from-teal-500 to-green-600 hover:from-teal-600 hover:to-green-700"
                        : "bg-teal-500 hover:bg-teal-600"
                  }`}
                  disabled={
                    (!input.trim() && !uploadedFile) ||
                    isLoading ||
                    !selectedMode ||
                    isAnalyzingFile
                  }
                >
                  {isLoading || isAnalyzingFile ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                </Button>
              </form>

              {messages.length > 0 && selectedMode && (
                <div className="flex flex-wrap gap-1 mt-2 max-h-20 overflow-y-auto">
                  {(selectedMode === "interview"
                    ? interviewPrepSuggestions
                    : roadmapSuggestions
                  )
                    .slice(0, 3)
                    .map((chip) => (
                      <Button
                        key={chip.label}
                        variant="ghost"
                        size="sm"
                        className="text-xs text-slate-500 hover:text-teal-600"
                        onClick={() => sendMessage(chip.label)}
                      >
                        {chip.label}
                        <ChevronRight className="w-3 h-3 ml-1" />
                      </Button>
                    ))}
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>
      <ResumeSkillsDialog extracted={resumeForSkills} onClose={() => setResumeForSkills(null)} />
    </div>
  );
}
