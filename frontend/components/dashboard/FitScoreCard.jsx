import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScoreCircle } from "@/components/ui/ScoreCircle";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, Zap, Target } from "lucide-react";

export function FitScoreCard({ score, targetRole, strengths = [], gaps = [] }) {
  const getScoreLabel = () => {
    if (score >= 80)
      return {
        label: "Excellent Match",
        color: "text-teal-600",
        bg: "bg-teal-50",
      };
    if (score >= 60)
      return { label: "Good Match", color: "text-blue-600", bg: "bg-blue-50" };
    if (score >= 40)
      return {
        label: "Moderate Match",
        color: "text-amber-600",
        bg: "bg-amber-50",
      };
    return {
      label: "Needs Improvement",
      color: "text-red-600",
      bg: "bg-red-50",
    };
  };

  const scoreInfo = getScoreLabel();

  return (
    <Card className="bg-white overflow-hidden">
      <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-teal-100/50 to-blue-100/50 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
      <CardHeader className="relative">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg font-semibold text-slate-900">
              Job-Candidate Skill Fit
            </CardTitle>
            <p className="text-sm text-slate-500 mt-1">
              Rule-based match · For: {targetRole || "Software Engineer"}
            </p>
          </div>
          <Badge className={`${scoreInfo.bg} ${scoreInfo.color} border-0`}>
            {scoreInfo.label}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="relative">
        <div className="flex items-center gap-8">
          <ScoreCircle score={score} size="lg" />

          <div className="flex-1 space-y-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="w-4 h-4 text-green-500" />
                <span className="text-sm font-medium text-slate-700">
                  Your Strengths
                </span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {strengths.slice(0, 4).map((strength, i) => (
                  <Badge
                    key={i}
                    variant="secondary"
                    className="bg-green-50 text-green-700 border-green-200"
                  >
                    {strength}
                  </Badge>
                ))}
              </div>
            </div>

            <div>
              <div className="flex items-center gap-2 mb-2">
                <Target className="w-4 h-4 text-amber-500" />
                <span className="text-sm font-medium text-slate-700">
                  Skills to Develop
                </span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {gaps.slice(0, 4).map((gap, i) => (
                  <Badge
                    key={i}
                    variant="secondary"
                    className="bg-amber-50 text-amber-700 border-amber-200"
                  >
                    {gap}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
