import React from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Briefcase,
  Clock,
  Users,
  TrendingUp,
  Award,
  Calendar,
  Target,
  DollarSign,
  MapPin,
  Laptop,
  Coffee,
  Heart,
  Zap,
} from "lucide-react";

interface RealWorldPreviewModalProps {
  job: any;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function RealWorldPreviewModal({
  job,
  open,
  onOpenChange,
}: RealWorldPreviewModalProps) {
  if (!job) return null;

  // Mock data for real-world preview (in production, this would come from the job data or API)
  const workCulture = {
    workLifeBalance:
      job.work_arrangement === "remote"
        ? 4.5
        : job.work_arrangement === "hybrid"
          ? 4.0
          : 3.5,
    teamCollaboration: 4.2,
    careerGrowth: 4.0,
    benefits: 4.3,
  };

  const typicalDay = [
    {
      time: "9:00 AM",
      activity: "Daily stand-up meeting with team",
      icon: Users,
    },
    {
      time: "9:30 AM",
      activity: "Focus time on core development work",
      icon: Laptop,
    },
    { time: "12:00 PM", activity: "Lunch break & team bonding", icon: Coffee },
    {
      time: "1:00 PM",
      activity: "Code reviews and collaboration",
      icon: Target,
    },
    {
      time: "3:00 PM",
      activity: "Project planning & sprint sessions",
      icon: Calendar,
    },
    {
      time: "5:00 PM",
      activity: "Wrap up & prepare for next day",
      icon: Briefcase,
    },
  ];

  const perks = [
    {
      icon: Heart,
      label: "Health Insurance",
      description: "Comprehensive medical coverage",
    },
    {
      icon: TrendingUp,
      label: "Learning Budget",
      description: "$2,000 annual training allowance",
    },
    {
      icon: Calendar,
      label: "Flexible Hours",
      description: "Work when you're most productive",
    },
    {
      icon: Coffee,
      label: "Free Meals",
      description: "Catered lunch & snacks",
    },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] p-0 bg-white flex flex-col">
        <div className="bg-gradient-to-r from-purple-500 to-pink-600 text-white px-6 py-4 rounded-t-lg flex-shrink-0">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <h2 className="text-2xl font-bold mb-2">
                Real-world Preview: {job.title}
              </h2>
              <p className="text-white/90 text-sm">
                Get a glimpse of what it's like working in this role
              </p>
            </div>
            <Badge className="bg-white/20 text-white border-0 backdrop-blur">
              <Zap className="w-3 h-3 mr-1" />
              Illustrative Example
            </Badge>
          </div>
        </div>

        <ScrollArea className="flex-1 overflow-y-auto">
          <div className="px-6 py-4 space-y-6">
            {/* Work Environment */}
            <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg p-5 border border-purple-100">
              <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
                <Briefcase className="w-5 h-5 text-purple-600" />
                Work Environment
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white rounded-lg p-4 shadow-sm">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-slate-700">
                      Work-Life Balance
                    </span>
                    <span className="text-lg font-bold text-purple-600">
                      {workCulture.workLifeBalance}/5
                    </span>
                  </div>
                  <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-purple-500 to-pink-500"
                      style={{
                        width: `${(workCulture.workLifeBalance / 5) * 100}%`,
                      }}
                    />
                  </div>
                </div>
                <div className="bg-white rounded-lg p-4 shadow-sm">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-slate-700">
                      Team Collaboration
                    </span>
                    <span className="text-lg font-bold text-purple-600">
                      {workCulture.teamCollaboration}/5
                    </span>
                  </div>
                  <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-purple-500 to-pink-500"
                      style={{
                        width: `${(workCulture.teamCollaboration / 5) * 100}%`,
                      }}
                    />
                  </div>
                </div>
                <div className="bg-white rounded-lg p-4 shadow-sm">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-slate-700">
                      Career Growth
                    </span>
                    <span className="text-lg font-bold text-purple-600">
                      {workCulture.careerGrowth}/5
                    </span>
                  </div>
                  <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-purple-500 to-pink-500"
                      style={{
                        width: `${(workCulture.careerGrowth / 5) * 100}%`,
                      }}
                    />
                  </div>
                </div>
                <div className="bg-white rounded-lg p-4 shadow-sm">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-slate-700">
                      Benefits
                    </span>
                    <span className="text-lg font-bold text-purple-600">
                      {workCulture.benefits}/5
                    </span>
                  </div>
                  <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-purple-500 to-pink-500"
                      style={{ width: `${(workCulture.benefits / 5) * 100}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Typical Day */}
            <div className="bg-slate-50 rounded-lg p-5">
              <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
                <Clock className="w-5 h-5 text-teal-600" />A Typical Day in This
                Role
              </h3>
              <div className="space-y-3">
                {typicalDay.map((item, i) => {
                  const Icon = item.icon;
                  return (
                    <div
                      key={i}
                      className="flex items-center gap-4 bg-white rounded-lg p-4 shadow-sm"
                    >
                      <div className="flex-shrink-0">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-teal-500 to-blue-600 flex items-center justify-center text-white">
                          <Icon className="w-5 h-5" />
                        </div>
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-teal-600">
                          {item.time}
                        </p>
                        <p className="text-sm text-slate-700">
                          {item.activity}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Perks & Benefits */}
            <div className="bg-gradient-to-br from-blue-50 to-teal-50 rounded-lg p-5 border border-blue-100">
              <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
                <Award className="w-5 h-5 text-blue-600" />
                Perks & Benefits
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {perks.map((perk, i) => {
                  const Icon = perk.icon;
                  return (
                    <div key={i} className="bg-white rounded-lg p-4 shadow-sm">
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-teal-600 flex items-center justify-center text-white flex-shrink-0">
                          <Icon className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="font-semibold text-slate-900 mb-1">
                            {perk.label}
                          </p>
                          <p className="text-sm text-slate-600">
                            {perk.description}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Job Details */}
            <div className="bg-slate-50 rounded-lg p-5">
              <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
                <MapPin className="w-5 h-5 text-slate-600" />
                Role Details
              </h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <Briefcase className="w-4 h-4 text-slate-500" />
                  <div>
                    <p className="text-xs text-slate-500">Employment Type</p>
                    <p className="font-medium text-slate-900">
                      {job.role_type || "Full-time"}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Laptop className="w-4 h-4 text-slate-500" />
                  <div>
                    <p className="text-xs text-slate-500">Work Arrangement</p>
                    <p className="font-medium text-slate-900">
                      {job.work_arrangement || "Not specified"}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-slate-500" />
                  <div>
                    <p className="text-xs text-slate-500">Location</p>
                    <p className="font-medium text-slate-900">
                      {job.location || "Singapore"}
                    </p>
                  </div>
                </div>
                {job.salary_min && (
                  <div className="flex items-center gap-2">
                    <DollarSign className="w-4 h-4 text-slate-500" />
                    <div>
                      <p className="text-xs text-slate-500">Salary Range</p>
                      <p className="font-medium text-slate-900">
                        ${job.salary_min?.toLocaleString()} - $
                        {job.salary_max?.toLocaleString()}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Disclaimer */}
            <div className="bg-amber-50 rounded-lg p-4 border border-amber-100">
              <p className="text-xs text-amber-700">
                <strong>Note:</strong> This static example illustrates a
                possible workday; ratings and benefits are examples, not
                verified employer data. Actual work conditions may vary. Please
                verify details during the interview process.
              </p>
            </div>
          </div>
        </ScrollArea>

        {/* Footer Actions */}
        <div className="bg-white border-t border-slate-200 px-6 py-4 flex items-center justify-end gap-3 rounded-b-lg flex-shrink-0">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
          <Button
            className="bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-white"
            onClick={() => onOpenChange(false)}
          >
            Learn More
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
