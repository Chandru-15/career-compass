import React, { useEffect, useState } from "react";
import { Button } from "./ui/button";
import { getResumeSkills } from "../lib/resumeSkills.js";

export function ResumeSkillsReview({ extracted, onApply, saving = false,
  actionLabel = "Save skills to profile", description = "Select the skills you want to add. Your existing skills will be kept." }) {
  const [selected, setSelected] = useState(() => getResumeSkills(extracted));
  useEffect(() => setSelected(getResumeSkills(extracted)), [extracted]);
  const detected = getResumeSkills(extracted);
  const toggle = (field, skill) => setSelected((previous) => ({
    ...previous,
    [field]: previous[field].includes(skill)
      ? previous[field].filter((value) => value !== skill)
      : [...previous[field], skill],
  }));
  return (
    <div className="space-y-4 min-w-0">
      <p className="text-sm text-slate-600">{description}</p>
      {extracted?.full_name && (
        <p className="text-sm text-slate-600">Resume candidate: {extracted.full_name}. Your signed-in identity stays the same.</p>
      )}
      {[["hard_skills", "Technical skills"], ["soft_skills", "Soft skills"]].map(([field, label]) => (
        <div key={field} role="group" aria-label={`Extracted ${label.toLowerCase()}`}>
          <h4 className="font-medium text-slate-900 mb-2">{label}</h4>
          <div className="flex flex-wrap gap-2">
            {detected[field].map((skill) => (
              <button key={skill} type="button" aria-pressed={selected[field].includes(skill)}
                disabled={saving} onClick={() => toggle(field, skill)}
                className={`rounded-full border px-3 py-1 text-sm break-words max-w-full ${selected[field].includes(skill)
                  ? "bg-teal-50 border-teal-500 text-teal-800" : "bg-white border-slate-200 text-slate-500"}`}>
                {skill}
              </button>
            ))}
            {!detected[field].length && <p className="text-sm text-slate-500">None detected. You can add skills in the profile editor.</p>}
          </div>
        </div>
      ))}
      <Button type="button" disabled={saving} onClick={() => onApply(selected)} className="bg-teal-500 hover:bg-teal-600">
        {saving ? "Saving skills…" : actionLabel}
      </Button>
    </div>
  );
}
