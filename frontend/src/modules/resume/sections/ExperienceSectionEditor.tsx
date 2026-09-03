import React, { useState } from "react";
import { Plus, Trash2, ChevronUp, ChevronDown, Sparkles, Briefcase, Wand2, Lightbulb } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { apiRequest } from "@/lib/api";
import type { Experience } from "../templates/types";

export interface ExperienceSectionEditorProps {
  experience: Experience[];
  onChange: (updated: Experience[]) => void;
  idToken: string | null;
}

const ACTION_VERBS = [
  "Architected", "Engineered", "Implemented", "Designed", "Developed",
  "Optimized", "Refactored", "Spearheaded", "Scaled", "Automated"
];

export const ExperienceSectionEditor: React.FC<ExperienceSectionEditorProps> = ({
  experience = [],
  onChange,
  idToken,
}) => {
  const [expandingKey, setExpandingKey] = useState<string | null>(null);

  const handleAddJob = () => {
    const newJob: Experience = {
      company: "",
      role: "",
      location: "",
      date: "",
      bullets: [""],
    };
    onChange([...experience, newJob]);
  };

  const handleUpdateJob = (index: number, patch: Partial<Experience>) => {
    onChange(experience.map((job, i) => (i === index ? { ...job, ...patch } : job)));
  };

  const handleRemoveJob = (index: number) => {
    onChange(experience.filter((_, i) => i !== index));
  };

  const handleMoveJob = (index: number, direction: "up" | "down") => {
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= experience.length) return;
    const next = [...experience];
    const temp = next[index];
    next[index] = next[targetIndex];
    next[targetIndex] = temp;
    onChange(next);
  };

  // Bullets
  const handleUpdateBullet = (jobIndex: number, bulletIndex: number, text: string) => {
    const job = experience[jobIndex];
    if (!job) return;
    const nextBullets = [...job.bullets];
    nextBullets[bulletIndex] = text;
    handleUpdateJob(jobIndex, { bullets: nextBullets });
  };

  const handleAddBullet = (jobIndex: number) => {
    const job = experience[jobIndex];
    if (!job) return;
    handleUpdateJob(jobIndex, { bullets: [...job.bullets, ""] });
  };

  const handleRemoveBullet = (jobIndex: number, bulletIndex: number) => {
    const job = experience[jobIndex];
    if (!job) return;
    handleUpdateJob(jobIndex, {
      bullets: job.bullets.filter((_, i) => i !== bulletIndex),
    });
  };

  // AI Bullet Enhancement
  const handleEnhanceBullet = async (
    jobIndex: number,
    bulletIndex: number,
    mode: "verb" | "ats" | "clarity"
  ) => {
    const job = experience[jobIndex];
    if (!job) return;
    const currentBullet = job.bullets[bulletIndex]?.trim();
    if (!currentBullet) {
      toast.error("Please enter a bullet point first");
      return;
    }

    const key = `${jobIndex}-${bulletIndex}`;
    setExpandingKey(key);

    try {
      if (idToken) {
        try {
          const res = await apiRequest<{ improvedBullet?: string; bullet?: string }>(
            "/ai/project-bullet/extend",
            {
              method: "POST",
              token: idToken,
              body: {
                bullet: currentBullet,
                projectName: `${job.role} at ${job.company}`,
                atsOptimized: true,
              },
            }
          );
          const improved = res.data?.improvedBullet || res.data?.bullet;
          if (improved?.trim()) {
            handleUpdateBullet(jobIndex, bulletIndex, improved.trim());
            toast.success("Bullet point enhanced with AI!");
            return;
          }
        } catch {
          // Fallback to grounded local polish
        }
      }

      // Grounded deterministic improvement
      let enhanced = currentBullet;
      if (mode === "verb") {
        const randomVerb = ACTION_VERBS[Math.floor(Math.random() * ACTION_VERBS.length)];
        enhanced = currentBullet.replace(/^(worked on|helped with|was doing|responsible for|made)\s+/i, "");
        enhanced = `${randomVerb} ${enhanced}`;
      } else {
        enhanced = currentBullet.replace(/^(worked on|helped with|did)\s+/i, "Engineered and implemented ");
        if (!/^[A-Z]/.test(enhanced)) {
          enhanced = enhanced.charAt(0).toUpperCase() + enhanced.slice(1);
        }
      }

      handleUpdateBullet(jobIndex, bulletIndex, enhanced);
      toast.success("Bullet point polished!");
    } finally {
      setExpandingKey(null);
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
            <Briefcase className="h-4 w-4 text-primary" /> Work Experience
          </h3>
          <p className="text-[11px] text-muted-foreground">
            Highlight your professional engineering contributions with active verbs.
          </p>
        </div>
        <Button size="sm" onClick={handleAddJob} className="h-7 text-xs gap-1">
          <Plus className="h-3 w-3" /> Add Position
        </Button>
      </div>

      {/* Experience List */}
      {experience.length === 0 ? (
        <div className="p-6 text-center rounded-xl border border-dashed border-border/70 text-muted-foreground space-y-2">
          <Briefcase className="h-8 w-8 mx-auto text-muted-foreground/50" />
          <p className="text-xs">No experience entries yet.</p>
          <Button size="sm" variant="outline" onClick={handleAddJob} className="h-7 text-xs">
            Add Your First Position
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          {experience.map((job, jIdx) => (
            <div
              key={jIdx}
              className="p-4 rounded-xl border border-border/60 bg-background/80 space-y-3 relative group"
            >
              {/* Card Title & Reordering */}
              <div className="flex items-center justify-between border-b border-border/40 pb-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold font-mono text-primary bg-primary/10 px-2 py-0.5 rounded">
                    #{jIdx + 1}
                  </span>
                  <span className="text-xs font-bold text-foreground">
                    {job.role || "Job Title"} {job.company ? `• ${job.company}` : ""}
                  </span>
                </div>

                <div className="flex items-center gap-1">
                  <Button
                    size="icon"
                    variant="ghost"
                    disabled={jIdx === 0}
                    onClick={() => handleMoveJob(jIdx, "up")}
                    className="h-6 w-6 text-muted-foreground hover:text-foreground"
                    title="Move up"
                  >
                    <ChevronUp className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    disabled={jIdx === experience.length - 1}
                    onClick={() => handleMoveJob(jIdx, "down")}
                    className="h-6 w-6 text-muted-foreground hover:text-foreground"
                    title="Move down"
                  >
                    <ChevronDown className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => handleRemoveJob(jIdx)}
                    className="h-6 w-6 text-destructive hover:bg-destructive/10"
                    title="Delete position"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>

              {/* Form Fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div>
                  <label className="text-[11px] font-semibold text-muted-foreground block mb-1">
                    Job Title / Role
                  </label>
                  <Input
                    placeholder="e.g. Senior Software Engineer"
                    value={job.role}
                    onChange={(e) => handleUpdateJob(jIdx, { role: e.target.value })}
                    className="text-xs h-8 bg-card"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-muted-foreground block mb-1">
                    Company Name
                  </label>
                  <Input
                    placeholder="e.g. Google"
                    value={job.company}
                    onChange={(e) => handleUpdateJob(jIdx, { company: e.target.value })}
                    className="text-xs h-8 bg-card"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div>
                  <label className="text-[11px] font-semibold text-muted-foreground block mb-1">
                    Location
                  </label>
                  <Input
                    placeholder="e.g. Mountain View, CA (or Remote)"
                    value={job.location || ""}
                    onChange={(e) => handleUpdateJob(jIdx, { location: e.target.value })}
                    className="text-xs h-8 bg-card"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-muted-foreground block mb-1">
                    Employment Dates
                  </label>
                  <Input
                    placeholder="e.g. Jun 2022 – Present"
                    value={job.date || ""}
                    onChange={(e) => handleUpdateJob(jIdx, { date: e.target.value })}
                    className="text-xs h-8 bg-card"
                  />
                </div>
              </div>

              {/* Bullets Section */}
              <div className="space-y-2 pt-1">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-semibold text-muted-foreground block">
                    Contribution Bullets ({job.bullets.length})
                  </label>
                  <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                    <Lightbulb className="h-3 w-3 text-amber-400" /> Start with strong action verbs
                  </span>
                </div>

                <div className="space-y-2">
                  {job.bullets.map((b, bIdx) => (
                    <div key={bIdx} className="space-y-1 bg-card p-2 rounded-lg border border-border/40">
                      <div className="flex gap-1.5 items-start">
                        <Textarea
                          rows={2}
                          value={b}
                          onChange={(e) => handleUpdateBullet(jIdx, bIdx, e.target.value)}
                          placeholder="Describe technical implementation, architecture, and measurable impact..."
                          className="text-xs min-h-[42px] py-1.5 bg-background custom-scrollbar"
                        />
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => handleRemoveBullet(jIdx, bIdx)}
                          className="h-7 w-7 text-muted-foreground hover:text-destructive shrink-0"
                          title="Remove bullet"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>

                      {/* AI Quick Actions */}
                      <div className="flex flex-wrap items-center gap-1 pt-0.5">
                        <Button
                          size="sm"
                          variant="ghost"
                          disabled={expandingKey === `${jIdx}-${bIdx}`}
                          onClick={() => handleEnhanceBullet(jIdx, bIdx, "verb")}
                          className="h-6 text-[10px] px-2 text-primary hover:bg-primary/10 gap-1"
                        >
                          <Sparkles className="h-2.5 w-2.5" /> Action Verb
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          disabled={expandingKey === `${jIdx}-${bIdx}`}
                          onClick={() => handleEnhanceBullet(jIdx, bIdx, "ats")}
                          className="h-6 text-[10px] px-2 text-primary hover:bg-primary/10 gap-1"
                        >
                          <Wand2 className="h-2.5 w-2.5" /> Polish Bullet
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>

                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => handleAddBullet(jIdx)}
                  className="h-6 text-[11px] text-primary hover:bg-primary/10 font-semibold"
                >
                  + Add Bullet Point
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
