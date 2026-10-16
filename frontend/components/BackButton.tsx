import React from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Home } from "lucide-react";
import { createPageUrl } from "../utils";

interface BackButtonProps {
  toDashboard?: boolean;
  label?: string;
  className?: string;
}

export function BackButton({
  toDashboard = true,
  label,
  className = "",
}: BackButtonProps) {
  const navigate = useNavigate();

  const handleClick = () => {
    if (toDashboard) {
      navigate(createPageUrl("Dashboard"));
    } else {
      navigate(-1);
    }
  };

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleClick}
      aria-label={label || (toDashboard ? "Back to Dashboard" : "Back")}
      className={`gap-2 ${className}`}
    >
      {toDashboard ? (
        <>
          <Home className="w-4 h-4" />
          {label ?? "Back to Dashboard"}
        </>
      ) : (
        <>
          <ArrowLeft className="w-4 h-4" />
          {label ?? "Back"}
        </>
      )}
    </Button>
  );
}
