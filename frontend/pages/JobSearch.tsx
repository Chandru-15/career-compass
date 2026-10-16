import { calculateFitScore as scoreJob, filterJobs } from "../lib/jobMatching";
import { apiFetch } from "../services/apiClient";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { JobCard } from "@/components/jobs/JobCard";
import { JobFilters } from "@/components/jobs/JobFilters";
import { useAuth } from "../components/AuthProvider";
import { dataService } from "../services/dataService";
import { BackButton } from "../components/BackButton";
import { addNotification } from "../components/NotificationCenter";
import {
  SlidersHorizontal,
  Loader2,
  Briefcase,
  Search,
  BookMarked,
} from "lucide-react";
import { toast } from "sonner";

export default function JobSearch() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user, isAuthenticated, login } = useAuth();
  const [showSavedOnly, setShowSavedOnly] = useState(false);
  const [filters, setFilters] = useState<any>({
    keyword: "",
    minFitScore: 0,
    onlySuitable: false,
    location: "",
    roleType: "",
    workArrangement: "",
    industry: "",
    techStack: [],
  });

  const { data: profile } = useQuery<any>({
    queryKey: ["userProfile", user?.email],
    queryFn: async () => {
      return await dataService.getUserProfile(user.email);
    },
    enabled: !!user?.email,
  });

  const {
    data: jobs = [],
    isLoading: jobsLoading,
    error: loadError,
  } = useQuery<any[]>({
    queryKey: ["jobs"],
    queryFn: () => dataService.getJobs(),
  });

  const { data: savedJobs = [] } = useQuery<any[]>({
    queryKey: ["savedJobs", user?.email],
    queryFn: async () => {
      return await dataService.getSavedJobs(user.email);
    },
    enabled: !!user?.email,
  });

  const saveMutation = useMutation({
    mutationFn: async (job: any) => {
      const existing = savedJobs.find((s) => s.job_id === job.id);
      if (existing) {
        await dataService.deleteSavedJob(existing.id, user.email);
        return { action: "removed", job };
      } else {
        await dataService.saveJob(user.email, {
          job_id: job.id,
          job_title: job.title,
          company: job.company,
          saved_date: new Date().toISOString().split("T")[0],
        });
        return { action: "saved", job };
      }
    },
    onSuccess: async (result) => {
      queryClient.invalidateQueries({ queryKey: ["savedJobs"] });
      toast.success(
        result.action === "saved" ? "Job saved!" : "Job removed from saved",
      );

      if (result.action === "saved") {
        addNotification(
          "Job Saved",
          "Job has been added to your saved jobs list",
          "success",
        );

        // Track saved job in progress system
        try {
          const API_BASE_URL =
            import.meta.env.VITE_API_BASE_URL || "http://localhost:3001/api";
          await apiFetch(`${API_BASE_URL}/progress/${user.email}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              action: "job_saved",
            }),
          });

          // Track activity
          await apiFetch(`${API_BASE_URL}/activity/${user.email}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              activityType: "job_saved",
              activityData: {
                jobId: result.job.id,
                jobTitle: result.job.title,
                company: result.job.company,
              },
            }),
          });
        } catch (err) {
          console.warn("Progress tracking failed (non-critical):", err);
        }
      } else {
        // Track job unsaved
        try {
          const API_BASE_URL =
            import.meta.env.VITE_API_BASE_URL || "http://localhost:3001/api";
          await apiFetch(`${API_BASE_URL}/progress/${user.email}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              action: "job_unsaved",
            }),
          });
        } catch (err) {
          console.warn("Progress tracking failed (non-critical):", err);
        }
      }
    },
  });

  const applyMutation = useMutation({
    mutationFn: async (job: any) => {
      await dataService.createApplication(user.email, {
        job_id: job.id,
        job_title: job.title,
        company: job.company,
        status: "applied",
        applied_date: new Date().toISOString().split("T")[0],
      });
      return job;
    },
    onSuccess: async (job) => {
      queryClient.invalidateQueries({ queryKey: ["applications"] });
      toast.success(
        "Application added to tracker. Apply on the employer website.",
      );
      addNotification(
        "Application Tracked",
        "Application recorded locally. Submit it through the employer website.",
        "success",
      );

      // Track application in progress system
      try {
        const API_BASE_URL =
          import.meta.env.VITE_API_BASE_URL || "http://localhost:3001/api";
        await apiFetch(`${API_BASE_URL}/progress/${user.email}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "application_submitted",
          }),
        });

        // Track activity
        await apiFetch(`${API_BASE_URL}/activity/${user.email}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            activityType: "job_application",
            activityData: {
              jobId: job.id,
              jobTitle: job.title,
              company: job.company,
              status: "applied",
            },
          }),
        });
      } catch (err) {
        console.warn("Progress tracking failed (non-critical):", err);
      }
    },
  });

  const userSkills = [
    ...(profile?.hard_skills || []),
    ...(profile?.soft_skills || []),
  ];

  const calculateFitScore = (job) => scoreJob(job, userSkills);
  const filteredJobs = filterJobs(
    jobs,
    filters,
    userSkills,
    savedJobs,
    showSavedOnly,
  );

  const savedJobIds = savedJobs.map((s) => s.job_id);

  if (loadError)
    return (
      <div role="alert" className="p-6 bg-red-50 rounded-xl">
        {loadError.message}
        <Button onClick={() => queryClient.invalidateQueries()}>Retry</Button>
      </div>
    );

  return (
    <div className="max-w-7xl mx-auto">
      {/* Back Button */}
      <div className="mb-4">
        <BackButton />
      </div>

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-slate-900">
            Find Your Perfect Role
          </h1>
          <p className="text-slate-500 mt-1">
            {filteredJobs.length} jobs from the bundled MyCareersFuture CSV ·
            rule-based matching
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant={showSavedOnly ? "default" : "outline"}
            onClick={() => setShowSavedOnly((value) => !value)}
            className="gap-2"
          >
            <BookMarked className="w-4 h-4" />
            Saved ({savedJobs.length})
          </Button>

          {/* Mobile Filter */}
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" className="lg:hidden gap-2">
                <SlidersHorizontal className="w-4 h-4" />
                Filters
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-80 p-0 overflow-y-auto">
              <JobFilters
                industries={[
                  ...new Set(
                    jobs.flatMap((job) =>
                      (job.industry || "")
                        .split(",")
                        .map((value) => value.trim())
                        .filter(Boolean),
                    ),
                  ),
                ]}
                filters={filters}
                onFilterChange={setFilters}
                onClear={() =>
                  setFilters({
                    keyword: "",
                    minFitScore: 0,
                    onlySuitable: false,
                    location: "",
                    roleType: "",
                    workArrangement: "",
                    industry: "",
                    techStack: [],
                  })
                }
              />
            </SheetContent>
          </Sheet>
        </div>
      </div>

      <div className="flex gap-6">
        {/* Desktop Filters */}
        <div className="hidden lg:block w-80 flex-shrink-0">
          <JobFilters
            industries={[
              ...new Set(
                jobs.flatMap((job) =>
                  (job.industry || "")
                    .split(",")
                    .map((value) => value.trim())
                    .filter(Boolean),
                ),
              ),
            ]}
            filters={filters}
            onFilterChange={setFilters}
            onClear={() =>
              setFilters({
                keyword: "",
                minFitScore: 0,
                onlySuitable: false,
                location: "",
                roleType: "",
                workArrangement: "",
                industry: "",
                techStack: [],
              })
            }
          />
        </div>

        {/* Job List */}
        <div className="flex-1 space-y-4">
          {jobsLoading ? (
            <div className="flex items-center justify-center py-20">
              <div className="text-center">
                <Loader2 className="w-8 h-8 animate-spin text-teal-500 mx-auto mb-4" />
                <p className="text-slate-500">
                  Finding the best jobs for you...
                </p>
              </div>
            </div>
          ) : filteredJobs.length === 0 ? (
            <div className="text-center py-20 bg-white rounded-2xl border border-slate-200">
              <Briefcase className="w-12 h-12 text-slate-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-slate-900 mb-2">
                No jobs found
              </h3>
              <p className="text-slate-500 mb-4">
                Try adjusting your filters to see more results
              </p>
              <Button
                variant="outline"
                onClick={() =>
                  setFilters({
                    keyword: "",
                    minFitScore: 0,
                    onlySuitable: false,
                    location: "",
                    roleType: "",
                    workArrangement: "",
                    industry: "",
                    techStack: [],
                  })
                }
              >
                Clear all filters
              </Button>
            </div>
          ) : (
            filteredJobs.map((job) => (
              <JobCard
                key={job.id}
                job={job}
                userSkills={userSkills}
                isSaved={savedJobIds.includes(job.id)}
                onSave={(job) => saveMutation.mutate(job)}
                onApply={(job) => applyMutation.mutate(job)}
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
}
