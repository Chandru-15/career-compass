import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "../utils";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "../components/AuthProvider";
import { dataService } from "../services/dataService";
import { BackButton } from "../components/BackButton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ProgressBar } from "@/components/ui/ProgressBar";
import {
  Building2,
  Users,
  MapPin,
  Clock,
  Star,
  MessageSquare,
  FileCheck,
  ChevronRight,
  Briefcase,
  Loader2,
  ArrowLeft,
  Quote,
} from "lucide-react";

export default function CompanyProfile() {
  const urlParams = new URLSearchParams(window.location.search);
  const companyName = urlParams.get("name");
  const { user, isAuthenticated, login } = useAuth();

  const { data: companies = [], isLoading: companiesLoading } = useQuery({
    queryKey: ["companies"],
    queryFn: () => dataService.getCompanies(),
  });

  const { data: jobs = [] } = useQuery({
    queryKey: ["jobs"],
    queryFn: () => dataService.getJobs(),
  });

  const company = companyName
    ? companies.find((c) => c.name === companyName)
    : companies[0];
  const companyJobs = jobs.filter((j) => j.company === company?.name);

  if (companiesLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-teal-500" />
      </div>
    );
  }

  if (!company) {
    return (
      <div className="max-w-5xl mx-auto text-center py-20">
        <Building2 className="w-16 h-16 text-slate-300 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-slate-900 mb-2">
          Company not found
        </h2>
        <p className="text-slate-500 mb-4">
          The company you're looking for doesn't exist.
        </p>
        <Link to={createPageUrl("JobSearch")}>
          <Button>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Job Search
          </Button>
        </Link>
      </div>
    );
  }

  const ScoreMeter = ({ label, score, icon: Icon }) => (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-sm text-slate-600 flex items-center gap-2">
          <Icon className="w-4 h-4" />
          {label}
        </span>
        <span className="text-sm font-semibold text-slate-900">
          {score == null ? "Not available" : score + "/5"}
        </span>
      </div>
      <ProgressBar value={(score || 0) * 20} color="teal" />
    </div>
  );

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Back Button */}
      <Link
        to={createPageUrl("JobSearch")}
        className="inline-flex items-center text-slate-500 hover:text-teal-600 transition-colors"
      >
        <ArrowLeft className="w-4 h-4 mr-1" />
        Back to Job Search
      </Link>

      {/* Company Header */}
      <Card className="bg-white overflow-hidden">
        <div className="h-32 bg-gradient-to-r from-teal-500 to-blue-600" />
        <CardContent className="relative pt-0">
          <div className="flex flex-col md:flex-row md:items-end gap-4 -mt-12">
            <div className="w-24 h-24 rounded-2xl bg-white border-4 border-white shadow-lg flex items-center justify-center text-2xl font-bold text-teal-600">
              {company.name?.charAt(0)}
            </div>
            <div className="flex-1 pb-4">
              <h1 className="text-2xl font-bold text-slate-900">
                {company.name}
              </h1>
              <div className="flex flex-wrap items-center gap-4 mt-2 text-sm text-slate-500">
                <span className="flex items-center gap-1">
                  <Briefcase className="w-4 h-4" />
                  {company.industry}
                </span>
                <span className="flex items-center gap-1">
                  <Users className="w-4 h-4" />
                  {company.size || "N/A"} employees
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2 pb-4">
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    className={`w-5 h-5 ${
                      star <= company.transparency_score
                        ? "text-amber-400 fill-amber-400"
                        : "text-slate-300"
                    }`}
                  />
                ))}
              </div>
              <span className="text-lg font-bold text-slate-900">
                {company.transparency_score || 0}
              </span>
            </div>
          </div>
          <p className="text-slate-600 mt-4">
            {company.description || "No company description available."}
          </p>
        </CardContent>
      </Card>

      {/* Transparency Scores */}
      <Card className="bg-white">
        <CardHeader>
          <CardTitle className="text-lg font-semibold">
            Employer Transparency Score
          </CardTitle>
          <p className="text-sm text-slate-500">
            Based on candidate experiences and feedback
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <ScoreMeter
              label="Hiring Responsiveness"
              score={company.hiring_responsiveness}
              icon={Clock}
            />
            <ScoreMeter
              label="Job Description Accuracy"
              score={company.jd_accuracy}
              icon={FileCheck}
            />
            <ScoreMeter
              label="Candidate Feedback"
              score={company.candidate_feedback_score}
              icon={MessageSquare}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t">
            <div>
              <h4 className="text-sm font-medium text-slate-700 mb-2">
                Average Response Time
              </h4>
              <p className="text-lg font-semibold text-slate-900">
                {company.avg_response_time}
              </p>
            </div>
            <div>
              <h4 className="text-sm font-medium text-slate-700 mb-2">
                Typical Hiring Stages
              </h4>
              <div className="flex flex-wrap gap-2">
                {company.typical_stages?.map((stage, i) => (
                  <Badge key={i} variant="outline" className="bg-slate-50">
                    {i + 1}. {stage}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Candidate Feedback */}
      <Card className="bg-white">
        <CardHeader>
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <Quote className="w-5 h-5 text-teal-500" />
            Candidate Feedback
          </CardTitle>
          <p className="text-sm text-slate-500">
            Anonymous feedback from past candidates
          </p>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {company.feedback_snippets?.map((feedback, i) => (
              <div key={i} className="p-4 bg-slate-50 rounded-lg">
                <p className="text-slate-700 italic">"{feedback}"</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Open Positions */}
      <Card className="bg-white">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg font-semibold">
                Open Positions
              </CardTitle>
              <p className="text-sm text-slate-500">
                {companyJobs.length} jobs available
              </p>
            </div>
            <Link to={createPageUrl("JobSearch")}>
              <Button variant="outline">
                View All Jobs
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {companyJobs.map((job) => (
              <Link
                key={job.id}
                to={createPageUrl(`JobSearch?jobId=${job.id}`)}
                className="block p-4 border border-slate-200 rounded-lg hover:border-teal-300 hover:shadow-md transition-all"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium text-slate-900">{job.title}</h4>
                    <div className="flex items-center gap-3 text-sm text-slate-500 mt-1">
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        {job.location}
                      </span>
                      <Badge variant="outline">{job.role_type}</Badge>
                      <Badge variant="outline">{job.work_arrangement}</Badge>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-slate-400" />
                </div>
              </Link>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
