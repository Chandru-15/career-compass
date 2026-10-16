import React, { useState } from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "../../utils";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScoreCircle } from "@/components/ui/ScoreCircle";
import { JobDetailsModal } from "./JobDetailsModal";
import { RealWorldPreviewModal } from "./RealWorldPreviewModal";
import {
  MapPin,
  Building2,
  Clock,
  DollarSign,
  CheckCircle2,
  AlertCircle,
  Bookmark,
  BookMarked,
  ExternalLink,
  Zap,
  Star,
  MessageSquare,
  FileCheck,
} from "lucide-react";
import { cn } from "@/lib/utils";

export function JobCard({
  job,
  userSkills = [],
  onSave,
  onApply,
  isSaved = false,
}) {
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);

  // Calculate fit score
  const calculateFitScore = () => {
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

  const fitScore = calculateFitScore();
  const matchedSkills = (job.required_skills || []).filter((skill) =>
    userSkills.some((s) => s.toLowerCase().includes(skill.toLowerCase())),
  );
  const missingSkills = (job.required_skills || []).filter(
    (skill) =>
      !userSkills.some((s) => s.toLowerCase().includes(skill.toLowerCase())),
  );

  const getFitLabel = () => {
    if (fitScore >= 80)
      return {
        label: "Excellent Fit",
        color: "text-green-600",
        bg: "bg-green-50",
      };
    if (fitScore >= 60)
      return { label: "Good Fit", color: "text-blue-600", bg: "bg-blue-50" };
    if (fitScore >= 40)
      return {
        label: "Moderate Fit",
        color: "text-amber-600",
        bg: "bg-amber-50",
      };
    return {
      label: "Needs Development",
      color: "text-red-600",
      bg: "bg-red-50",
    };
  };

  const fitInfo = getFitLabel();

  return (
    <Card className="bg-white hover:shadow-lg hover:shadow-slate-200/50 transition-all duration-300 group overflow-hidden">
      <CardContent className="p-0">
        <div className="p-5">
          {/* Header */}
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="text-lg font-semibold text-slate-900 group-hover:text-teal-600 transition-colors">
                  {job.title}
                </h3>
                {job.tags?.includes("Fast responder") && (
                  <Badge className="bg-teal-50 text-teal-700 border-0">
                    <Zap className="w-3 h-3 mr-1" />
                    Fast
                  </Badge>
                )}
              </div>
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-slate-500">
                <Link
                  to={createPageUrl(
                    `CompanyProfile?name=${encodeURIComponent(job.company)}`,
                  )}
                  className="flex items-center gap-1 hover:text-teal-600 transition-colors"
                  onClick={(e) => e.stopPropagation()}
                >
                  <Building2 className="w-4 h-4" />
                  {job.company}
                </Link>
                <span className="flex items-center gap-1">
                  <MapPin className="w-4 h-4" />
                  {job.location}
                </span>
                {job.salary_min && (
                  <span className="flex items-center gap-1">
                    ${job.salary_min.toLocaleString()} - $
                    {job.salary_max?.toLocaleString()}
                  </span>
                )}
              </div>
            </div>

            {/* Fit Score */}
            <div className="flex flex-col items-center">
              <ScoreCircle score={fitScore} size="sm" />
              <Badge className={cn("mt-1 border-0", fitInfo.bg, fitInfo.color)}>
                {fitInfo.label}
              </Badge>
            </div>
          </div>

          {/* Tags */}
          <div className="flex flex-wrap gap-2 mt-3">
            <Badge variant="outline" className="bg-slate-50">
              {job.role_type}
            </Badge>

            <Badge variant="outline" className="bg-slate-50">
              {job.industry}
            </Badge>
          </div>

          {/* Skills Match Section */}
          <div className="mt-4 space-y-3">
            {matchedSkills.length > 0 && (
              <div>
                <p className="text-xs font-medium text-green-600 mb-1.5 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Skills You Match ({matchedSkills.length})
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {matchedSkills.slice(0, 4).map((skill, i) => (
                    <Badge
                      key={i}
                      variant="secondary"
                      className="bg-green-50 text-green-700 text-xs"
                    >
                      {skill}
                    </Badge>
                  ))}
                  {matchedSkills.length > 4 && (
                    <Badge
                      variant="secondary"
                      className="bg-slate-100 text-slate-600 text-xs"
                    >
                      +{matchedSkills.length - 4} more
                    </Badge>
                  )}
                </div>
              </div>
            )}

            {missingSkills.length > 0 && (
              <div>
                <p className="text-xs font-medium text-amber-600 mb-1.5 flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5" />
                  Skills to Develop ({missingSkills.length})
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {missingSkills.slice(0, 3).map((skill, i) => (
                    <Link key={i} to={createPageUrl("SkillsRoadmap")}>
                      <Badge
                        variant="secondary"
                        className="bg-amber-50 text-amber-700 text-xs hover:bg-amber-100 cursor-pointer"
                      >
                        {skill}
                      </Badge>
                    </Link>
                  ))}
                  {missingSkills.length > 3 && (
                    <Badge
                      variant="secondary"
                      className="bg-slate-100 text-slate-600 text-xs"
                    >
                      +{missingSkills.length - 3} more
                    </Badge>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Employer Transparency */}
          {job.employer_transparency_score && (
            <div className="mt-4 p-3 bg-slate-50 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-slate-700">
                  Employer Transparency
                </span>
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className={cn(
                        "w-3 h-3",
                        star <= job.employer_transparency_score
                          ? "text-amber-400 fill-amber-400"
                          : "text-slate-300",
                      )}
                    />
                  ))}
                </div>
              </div>
              <div className="flex gap-4 text-xs text-slate-500">
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {job.hiring_responsiveness >= 4 ? "Fast" : "Average"} response
                </span>
                <span className="flex items-center gap-1">
                  <FileCheck className="w-3 h-3" />
                  {job.jd_accuracy >= 4 ? "Accurate" : "Good"} JD
                </span>
                <span className="flex items-center gap-1">
                  <MessageSquare className="w-3 h-3" />
                  {job.candidate_feedback >= 4 ? "Great" : "Good"} feedback
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="px-5 py-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="sm"
              className="text-slate-600 hover:text-teal-600"
              onClick={() => setDetailsOpen(true)}
            >
              View Details
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="text-slate-600 hover:text-purple-600"
              onClick={() => setPreviewOpen(true)}
            >
              Real-world Preview
            </Button>
          </div>
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="icon"
              className={cn(
                "h-9 w-9",
                isSaved
                  ? "text-teal-600"
                  : "text-slate-400 hover:text-teal-600",
              )}
              onClick={() => onSave?.(job)}
              aria-label={`${isSaved ? "Unsave" : "Save"} job: ${job.title}`}
              aria-pressed={isSaved}
            >
              {isSaved ? (
                <BookMarked className="w-5 h-5" />
              ) : (
                <Bookmark className="w-5 h-5" />
              )}
            </Button>
            <Button
              size="sm"
              className="bg-teal-500 hover:bg-teal-600"
              onClick={() => onApply?.(job)}
            >
              Track Application
            </Button>
          </div>
        </div>
      </CardContent>

      {/* Job Details Modal */}
      <JobDetailsModal
        job={job}
        open={detailsOpen}
        onOpenChange={setDetailsOpen}
        userSkills={userSkills}
        fitScore={fitScore}
        isSaved={isSaved}
        onSave={onSave}
        onApply={onApply}
      />

      {/* Real-world Preview Modal */}
      <RealWorldPreviewModal
        job={job}
        open={previewOpen}
        onOpenChange={setPreviewOpen}
      />
    </Card>
  );
}
