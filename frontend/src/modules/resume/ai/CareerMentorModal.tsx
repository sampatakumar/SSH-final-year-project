import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Compass, CheckCircle2, AlertTriangle, ArrowRight, Sparkles, Target, ShieldCheck, FileCode } from "lucide-react";
import type { ResumeData } from "../templates/types";

export interface CareerMentorModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  data: ResumeData;
  targetRole?: string;
  onNavigateToRoadmap?: () => void;
}

export const CareerMentorModal: React.FC<CareerMentorModalProps> = ({
  open,
  onOpenChange,
  data,
  targetRole = "Full Stack Developer",
  onNavigateToRoadmap,
}) => {
  const hasSummary = Boolean(data.professionalSummary?.trim());
  const experienceCount = data.experience?.length || 0;
  const projectCount = data.projects?.length || 0;
  const skillCount =
    (data.skills?.languages?.length || 0) +
    (data.skills?.frameworks?.length || 0) +
    (data.skills?.tools?.length || 0);

  // Calculate career readiness score (0–100)
  let readiness = 60;
  if (hasSummary) readiness += 10;
  if (experienceCount >= 1) readiness += 10;
  if (projectCount >= 2) readiness += 10;
  if (skillCount >= 8) readiness += 10;

  const strengths = [
    hasSummary ? "Professional summary clearly establishes career positioning." : null,
    projectCount > 0 ? `Portfolio contains ${projectCount} technical project(s) demonstrating architecture.` : null,
    skillCount >= 5 ? `Technical skill matrix includes ${skillCount}+ verified technologies.` : null,
    data.education?.length ? "Academic foundation and degree credentials verified." : null,
  ].filter(Boolean) as string[];

  const gaps = [
    experienceCount === 0 ? "No commercial work experience listed; prioritize project technical depth." : null,
    projectCount < 2 ? "Add at least 2 full-stack projects to strengthen portfolio evidence." : null,
    !data.github ? "Add your GitHub profile URL to provide verifiable commit evidence." : null,
    !data.linkedin ? "Add your LinkedIn URL for recruiter verification." : null,
  ].filter(Boolean) as string[];

  const nextActions = [
    "Ensure each project explains your personal technical contribution, architecture, and problem solved.",
    "Verify that your technical skills matrix aligns with the " + targetRole + " market demands.",
    "Add live demo links and GitHub repository links for all primary portfolio projects.",
    "Structure work experience bullets using active verbs (e.g. Architected, Engineered, Optimized).",
    "Review your interactive learning roadmap to close identified skill gaps.",
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto custom-scrollbar">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="h-9 w-9 rounded-xl bg-primary/20 flex items-center justify-center text-primary">
              <Compass className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle className="text-lg font-black text-foreground">
                AI Career Mentor
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                Career readiness & portfolio evaluation for <strong className="text-primary">{targetRole}</strong>
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-5 pt-2">
          {/* Career Readiness Score Card */}
          <div className="p-4 rounded-xl bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border border-primary/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                Career Readiness Score
              </div>
              <div className="text-2xl font-black text-foreground font-mono flex items-baseline gap-1">
                {readiness} <span className="text-xs text-muted-foreground font-normal">/ 100</span>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                Evaluated from engineering lead & technical recruiter perspectives.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold px-3 py-1 rounded-full bg-primary/20 text-primary border border-primary/30">
                {readiness >= 80 ? "Interview Ready" : "Building Momentum"}
              </span>
            </div>
          </div>

          {/* Strengths & Growth Gaps Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {/* Strengths */}
            <div className="p-3.5 rounded-xl border border-emerald-500/20 bg-emerald-500/5 space-y-2">
              <div className="text-xs font-bold text-emerald-500 flex items-center gap-1.5 uppercase tracking-wide">
                <CheckCircle2 className="h-4 w-4" /> Verified Strengths
              </div>
              <ul className="space-y-1.5 text-xs text-foreground/90">
                {strengths.length > 0 ? (
                  strengths.map((s, i) => (
                    <li key={i} className="flex items-start gap-1.5">
                      <span className="text-emerald-500 font-bold">•</span>
                      <span>{s}</span>
                    </li>
                  ))
                ) : (
                  <li className="text-muted-foreground italic">Add more resume sections to unlock strengths.</li>
                )}
              </ul>
            </div>

            {/* Growth Opportunities */}
            <div className="p-3.5 rounded-xl border border-amber-500/20 bg-amber-500/5 space-y-2">
              <div className="text-xs font-bold text-amber-500 flex items-center gap-1.5 uppercase tracking-wide">
                <AlertTriangle className="h-4 w-4" /> Growth Opportunities
              </div>
              <ul className="space-y-1.5 text-xs text-foreground/90">
                {gaps.length > 0 ? (
                  gaps.map((g, i) => (
                    <li key={i} className="flex items-start gap-1.5">
                      <span className="text-amber-500 font-bold">•</span>
                      <span>{g}</span>
                    </li>
                  ))
                ) : (
                  <li className="text-emerald-500 font-semibold flex items-center gap-1">
                    <CheckCircle2 className="h-3.5 w-3.5" /> All major resume sections complete!
                  </li>
                )}
              </ul>
            </div>
          </div>

          {/* Recommended Next Actions */}
          <div className="space-y-2.5">
            <div className="text-xs font-bold text-foreground uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="h-4 w-4 text-primary" /> Recommended Career Next Steps
            </div>

            <div className="space-y-2">
              {nextActions.map((action, i) => (
                <div
                  key={i}
                  className="p-2.5 rounded-lg border border-border/50 bg-background flex items-start gap-2 text-xs"
                >
                  <span className="h-5 w-5 rounded-full bg-primary/10 text-primary font-mono font-bold flex items-center justify-center shrink-0 text-[10px]">
                    {i + 1}
                  </span>
                  <span className="text-foreground leading-relaxed">{action}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0 pt-3 border-t border-border/40">
          <Button variant="ghost" size="sm" onClick={() => onOpenChange(false)} className="text-xs">
            Close
          </Button>
          {onNavigateToRoadmap && (
            <Button
              size="sm"
              onClick={() => {
                onOpenChange(false);
                onNavigateToRoadmap();
              }}
              className="text-xs font-semibold bg-primary hover:bg-primary/90 text-primary-foreground gap-1.5"
            >
              <span>View Career Roadmap</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
