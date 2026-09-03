import React from "react";
import { Plus, Trash2, ChevronUp, ChevronDown, GraduationCap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { Education } from "../templates/types";

export interface EducationSectionEditorProps {
  education: Education[];
  onChange: (updated: Education[]) => void;
}

export const EducationSectionEditor: React.FC<EducationSectionEditorProps> = ({
  education = [],
  onChange,
}) => {
  const handleAddEducation = () => {
    const newEdu: Education = {
      school: "",
      degree: "",
      location: "",
      date: "",
      grade: "",
    };
    onChange([...education, newEdu]);
  };

  const handleUpdateEducation = (index: number, patch: Partial<Education>) => {
    onChange(education.map((edu, i) => (i === index ? { ...edu, ...patch } : edu)));
  };

  const handleRemoveEducation = (index: number) => {
    onChange(education.filter((_, i) => i !== index));
  };

  const handleMoveEducation = (index: number, direction: "up" | "down") => {
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= education.length) return;
    const next = [...education];
    const temp = next[index];
    next[index] = next[targetIndex];
    next[targetIndex] = temp;
    onChange(next);
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
            <GraduationCap className="h-4 w-4 text-primary" /> Education & Credentials
          </h3>
          <p className="text-[11px] text-muted-foreground">
            Degrees, academic institutions, majors, and honors.
          </p>
        </div>
        <Button size="sm" onClick={handleAddEducation} className="h-7 text-xs gap-1">
          <Plus className="h-3 w-3" /> Add Degree
        </Button>
      </div>

      {/* Education List */}
      {education.length === 0 ? (
        <div className="p-6 text-center rounded-xl border border-dashed border-border/70 text-muted-foreground space-y-2">
          <GraduationCap className="h-8 w-8 mx-auto text-muted-foreground/50" />
          <p className="text-xs">No education entries added.</p>
          <Button size="sm" variant="outline" onClick={handleAddEducation} className="h-7 text-xs">
            Add Degree
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          {education.map((edu, idx) => (
            <div
              key={idx}
              className="p-4 rounded-xl border border-border/60 bg-background/80 space-y-3 relative group"
            >
              {/* Card Title & Controls */}
              <div className="flex items-center justify-between border-b border-border/40 pb-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold font-mono text-primary bg-primary/10 px-2 py-0.5 rounded">
                    #{idx + 1}
                  </span>
                  <span className="text-xs font-bold text-foreground">
                    {edu.school || "Institution Name"}
                  </span>
                </div>

                <div className="flex items-center gap-1">
                  <Button
                    size="icon"
                    variant="ghost"
                    disabled={idx === 0}
                    onClick={() => handleMoveEducation(idx, "up")}
                    className="h-6 w-6 text-muted-foreground hover:text-foreground"
                    title="Move up"
                  >
                    <ChevronUp className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    disabled={idx === education.length - 1}
                    onClick={() => handleMoveEducation(idx, "down")}
                    className="h-6 w-6 text-muted-foreground hover:text-foreground"
                    title="Move down"
                  >
                    <ChevronDown className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => handleRemoveEducation(idx)}
                    className="h-6 w-6 text-destructive hover:bg-destructive/10"
                    title="Delete degree"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>

              {/* Form Fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div>
                  <label className="text-[11px] font-semibold text-muted-foreground block mb-1">
                    Institution / University
                  </label>
                  <Input
                    placeholder="e.g. Stanford University"
                    value={edu.school}
                    onChange={(e) => handleUpdateEducation(idx, { school: e.target.value })}
                    className="text-xs h-8 bg-card"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-muted-foreground block mb-1">
                    Degree & Major
                  </label>
                  <Input
                    placeholder="e.g. B.S. in Computer Science"
                    value={edu.degree}
                    onChange={(e) => handleUpdateEducation(idx, { degree: e.target.value })}
                    className="text-xs h-8 bg-card"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                <div>
                  <label className="text-[11px] font-semibold text-muted-foreground block mb-1">
                    Location
                  </label>
                  <Input
                    placeholder="e.g. Stanford, CA"
                    value={edu.location || ""}
                    onChange={(e) => handleUpdateEducation(idx, { location: e.target.value })}
                    className="text-xs h-8 bg-card"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-muted-foreground block mb-1">
                    Graduation Date
                  </label>
                  <Input
                    placeholder="e.g. May 2024"
                    value={edu.date || ""}
                    onChange={(e) => handleUpdateEducation(idx, { date: e.target.value })}
                    className="text-xs h-8 bg-card"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-muted-foreground block mb-1">
                    GPA / Grade (Optional)
                  </label>
                  <Input
                    placeholder="e.g. 3.9 GPA"
                    value={edu.grade || ""}
                    onChange={(e) => handleUpdateEducation(idx, { grade: e.target.value })}
                    className="text-xs h-8 bg-card"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
