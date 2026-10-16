import React from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "../../utils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ScoreCircle } from "@/components/ui/ScoreCircle";
import {
  MapPin,
  Building2,
  Clock,
  DollarSign,
  Briefcase,
  Calendar,
  Users,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  Bookmark,
  BookMarked,
  TrendingUp,
  Award,
  Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface JobDetailsModalProps {
  job: any;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userSkills?: string[];
  fitScore?: number;
  isSaved?: boolean;
  onSave?: (job: any) => void;
  onApply?: (job: any) => void;
}

export function JobDetailsModal({
  job,
  open,
  onOpenChange,
  userSkills = [],
  fitScore = 50,
  isSaved = false,
  onSave,
  onApply,
}: JobDetailsModalProps) {
  if (!job) return null;

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
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] p-0 bg-white flex flex-col">
        <div className="bg-gradient-to-r from-teal-500 to-blue-600 text-white px-6 py-4 rounded-t-lg flex-shrink-0">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <h2 className="text-2xl font-bold mb-2">{job.title}</h2>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-white/90">
                <Link
                  to={createPageUrl(
                    `CompanyProfile?name=${encodeURIComponent(job.company)}`,
                  )}
                  className="flex items-center gap-1 hover:text-white transition-colors"
                  onClick={() => onOpenChange(false)}
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
                    <DollarSign className="w-4 h-4" />$
                    {job.salary_min?.toLocaleString()} - $
                    {job.salary_max?.toLocaleString()}
                  </span>
                )}
              </div>
            </div>
            <div className="flex flex-col items-center bg-white/10 backdrop-blur rounded-lg p-3">
              <ScoreCircle score={fitScore} size="md" />
              <Badge className={cn("mt-2 border-0", fitInfo.bg, fitInfo.color)}>
                {fitInfo.label}
              </Badge>
            </div>
          </div>
        </div>

        <ScrollArea className="flex-1 overflow-y-auto">
          <div className="px-6 py-4 space-y-6">
            {/* Job Details */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="flex items-center gap-2 text-sm">
                <Briefcase className="w-4 h-4 text-teal-500" />
                <div>
                  <p className="text-xs text-slate-500">Role Type</p>
                  <p className="font-medium text-slate-900">
                    {job.role_type || "Full-time"}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Calendar className="w-4 h-4 text-teal-500" />
                <div>
                  <p className="text-xs text-slate-500">Posted</p>
                  <p className="font-medium text-slate-900">
                    {job.posted_date || "Recently"}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Users className="w-4 h-4 text-teal-500" />
                <div>
                  <p className="text-xs text-slate-500">Experience</p>
                  <p className="font-medium text-slate-900">
                    {job.experience_required || "Not specified"}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Award className="w-4 h-4 text-teal-500" />
                <div>
                  <p className="text-xs text-slate-500">Industry</p>
                  <p className="font-medium text-slate-900">
                    {job.industry || "Technology"}
                  </p>
                </div>
              </div>
            </div>

            {/* Tags */}
            <div className="flex flex-wrap gap-2">
              <Badge
                variant="outline"
                className="bg-teal-50 text-teal-700 border-teal-200"
              >
                {job.work_arrangement || "Hybrid"}
              </Badge>
              {job.role_level && (
                <Badge
                  variant="outline"
                  className="bg-blue-50 text-blue-700 border-blue-200"
                >
                  {job.role_level}
                </Badge>
              )}
              {job.tags?.includes("Fast responder") && (
                <Badge className="bg-amber-50 text-amber-700 border-0">
                  <Zap className="w-3 h-3 mr-1" />
                  Fast Responder
                </Badge>
              )}
            </div>

            {/* Skills Match */}
            <div className="space-y-4">
              {matchedSkills.length > 0 && (
                <div className="bg-green-50 rounded-lg p-4 border border-green-100">
                  <p className="text-sm font-semibold text-green-700 mb-3 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4" />
                    Skills You Match ({matchedSkills.length})
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {matchedSkills.map((skill, i) => (
                      <Badge
                        key={i}
                        variant="secondary"
                        className="bg-green-100 text-green-800 border-green-200"
                      >
                        {skill}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {missingSkills.length > 0 && (
                <div className="bg-amber-50 rounded-lg p-4 border border-amber-100">
                  <p className="text-sm font-semibold text-amber-700 mb-3 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4" />
                    Skills to Develop ({missingSkills.length})
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {missingSkills.map((skill, i) => (
                      <Link
                        key={i}
                        to={createPageUrl("SkillsRoadmap")}
                        onClick={() => onOpenChange(false)}
                      >
                        <Badge
                          variant="secondary"
                          className="bg-amber-100 text-amber-800 border-amber-200 hover:bg-amber-200 cursor-pointer"
                        >
                          {skill}
                        </Badge>
                      </Link>
                    ))}
                  </div>
                  <p className="text-xs text-amber-600 mt-2">
                    Click on skills to view learning roadmap
                  </p>
                </div>
              )}
            </div>

            {/* Job Description */}
            <div className="bg-slate-50 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-slate-900 mb-3 flex items-center gap-2">
                <Briefcase className="w-5 h-5 text-teal-500" />
                Job Description
              </h3>
              <div className="text-sm text-slate-700 whitespace-pre-line leading-relaxed">
                {job.description ||
                  job.roles_responsibilities ||
                  "No description available for this position."}
              </div>
            </div>

            {/* Requirements */}
            {job.required_skills && job.required_skills.length > 0 && (
              <div className="bg-slate-50 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-slate-900 mb-3 flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-teal-500" />
                  Required Skills
                </h3>
                <div className="flex flex-wrap gap-2">
                  {job.required_skills.map((skill, i) => (
                    <Badge
                      key={i}
                      variant="outline"
                      className={cn(
                        userSkills.some((s) =>
                          s.toLowerCase().includes(skill.toLowerCase()),
                        )
                          ? "bg-green-50 text-green-700 border-green-300"
                          : "bg-slate-100 text-slate-700 border-slate-300",
                      )}
                    >
                      {skill}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* External Link */}
            {job.url && (
              <div className="bg-blue-50 rounded-lg p-4 border border-blue-100">
                <p className="text-sm text-blue-700 mb-2 font-medium">
                  View full job posting on MyCareersFuture
                </p>
                <a
                  href={job.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700 hover:underline"
                >
                  <ExternalLink className="w-4 h-4" />
                  Open in MyCareersFuture
                </a>
              </div>
            )}
          </div>
        </ScrollArea>

        {/* Footer Actions */}
        <div className="bg-white border-t border-slate-200 px-6 py-4 flex items-center justify-between rounded-b-lg flex-shrink-0">
          <Button
            variant="outline"
            className={cn(
              "gap-2",
              isSaved ? "text-teal-600 border-teal-600" : "text-slate-600",
            )}
            onClick={() => onSave?.(job)}
          >
            {isSaved ? (
              <>
                <BookMarked className="w-4 h-4" />
                Saved
              </>
            ) : (
              <>
                <Bookmark className="w-4 h-4" />
                Save Job
              </>
            )}
          </Button>
          <div className="flex gap-3">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Close
            </Button>
            <Button
              className="bg-gradient-to-r from-teal-500 to-blue-600 hover:from-teal-600 hover:to-blue-700 text-white"
              onClick={() => {
                onApply?.(job);
                onOpenChange(false);
              }}
            >
              Track Application
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
