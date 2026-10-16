import React, { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "./ui/dialog";
import { ResumeSkillsReview } from "./ResumeSkillsReview";
import { useAuth } from "./AuthProvider";
import { dataService } from "../services/dataService";
import { saveResumeSkills } from "../lib/resumeSkills.js";

export function ResumeSkillsDialog({ extracted, onClose }) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [saving, setSaving] = useState(false);
  const apply = async (approved) => {
    setSaving(true);
    try {
      const profile = await saveResumeSkills(dataService, user.email, approved);
      await queryClient.cancelQueries({ queryKey: ["userProfile", user.email] });
      queryClient.setQueryData(["userProfile", user.email], profile);
      await queryClient.invalidateQueries({ queryKey: ["userProfile", user.email] });
      toast.success("Technical and soft skills saved to your profile.");
      onClose();
    } catch (error) {
      toast.error(error.message || "Could not save skills. Please retry.");
    } finally {
      setSaving(false);
    }
  };
  return (
    <Dialog open={!!extracted} onOpenChange={(open) => { if (!open && !saving) onClose(); }}>
      <DialogContent className="max-h-[85dvh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Review resume skills</DialogTitle>
          <DialogDescription>Add skills from this resume to your profile, or close to keep your profile unchanged.</DialogDescription>
        </DialogHeader>
        {extracted && <ResumeSkillsReview extracted={extracted} onApply={apply} saving={saving} />}
      </DialogContent>
    </Dialog>
  );
}
