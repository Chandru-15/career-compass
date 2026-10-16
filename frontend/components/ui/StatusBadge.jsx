import React from "react";
import { cn } from "@/lib/utils";

const statusConfig = {
  applied: { label: "Applied", color: "bg-blue-50 text-blue-700 border-blue-200" },
  under_review: { label: "Under Review", color: "bg-amber-50 text-amber-700 border-amber-200" },
  interview: { label: "Interview", color: "bg-purple-50 text-purple-700 border-purple-200" },
  offer: { label: "Offer", color: "bg-green-50 text-green-700 border-green-200" },
  accepted: { label: "Accepted", color: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  rejected: { label: "Rejected", color: "bg-red-50 text-red-700 border-red-200" },
  matched: { label: "Matched", color: "bg-green-50 text-green-700 border-green-200" },
  partial: { label: "Partial", color: "bg-amber-50 text-amber-700 border-amber-200" },
  missing: { label: "Missing", color: "bg-red-50 text-red-700 border-red-200" },
  high: { label: "High Priority", color: "bg-red-50 text-red-700 border-red-200" },
  medium: { label: "Medium Priority", color: "bg-amber-50 text-amber-700 border-amber-200" },
  low: { label: "Low Priority", color: "bg-slate-50 text-slate-700 border-slate-200" },
};

export function StatusBadge({ status, className }) {
  const config = statusConfig[status] || {
    label: status,
    color: "bg-slate-50 text-slate-700 border-slate-200",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border",
        config.color,
        className
      )}
    >
      {config.label}
    </span>
  );
}
