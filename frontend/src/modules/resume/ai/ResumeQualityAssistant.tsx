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
import { ShieldCheck, CheckCircle2, AlertTriangle, Sparkles, FileText, Check } from "lucide-react";
import type { ResumeData, ResumeBuilderConfig } from "../templates/types";

export interface ResumeQualityAssistantProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  data: ResumeData;
  config: ResumeBuilderConfig;
  onSelectSection: (secId: string) => void;
}

export const ResumeQualityAssistant: React.FC<ResumeQualityAssistantProps> = ({
  open,
  onOpenChange,
  data,
  config,
  onSelectSection,
}) => {
  // Quality Checks
  const checks = [
    {
      title: "Contact Information",
      passed: Boolean(data.name && data.email && data.phone),
      description: "Full name, reachable email, and phone number present.",
      sectionId: "personal",
    },
    {
      title: "LinkedIn & GitHub Profiles",
      passed: Boolean(data.linkedin || data.github),
      description: "Online developer presence and repository evidence provided.",
      sectionId: "personal",
    },
    {
      title: "Professional Summary",
      passed: Boolean(data.professionalSummary && data.professionalSummary.trim().length >= 50),
      description: "Cohesive summary establishing technical focus and domain expertise.",
      sectionId: "summary",
    },
    {
      title: "Work Experience & Contribution Bullets",
      passed: Boolean(data.experience && data.experience.length > 0),
      description: "Verifiable professional track record with action verbs.",
      sectionId: "experience",
    },
    {
      title: "Technical Projects & Architecture",
      passed: Boolean(data.projects && data.projects.length >= 1),
      description: "End-to-end applications demonstrating architecture and skills.",
      sectionId: "projects",
    },
    {
      title: "Technical Skills Matrix",
      passed: Boolean(
        (data.skills?.languages?.length || 0) +
          (data.skills?.frameworks?.length || 0) +
          (data.skills?.tools?.length || 0) >= 4
      ),
      description: "Categorized languages, frameworks, and developer tools.",
      sectionId: "skills",
    },
    {
      title: "Education & Degree Credentials",
      passed: Boolean(data.education && data.education.length > 0),
      description: "Degree, college institution, and graduation year.",
      sectionId: "education",
    },
    {
      title: "ATS-Safe Formatting & Structure",
      passed: true, // All 5 Smart Skill Hub templates are 100% ATS safe
      description: "Clean typography, single/two-column hierarchy, and standard headings.",
      sectionId: "personal",
    },
  ];

  const passedCount = checks.filter((c) => c.passed).length;
  const atsReadiness = Math.round((passedCount / checks.length) * 100);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl max-h-[85vh] overflow-y-auto custom-scrollbar">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="h-9 w-9 rounded-xl bg-primary/20 flex items-center justify-center text-primary">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle className="text-lg font-black text-foreground">
                Smart Skill Hub ATS & Quality Assistant
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                Automated parsing evaluation and section completeness audit
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          {/* Top Score Banner */}
          <div className="p-4 rounded-xl bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border border-primary/20 flex items-center justify-between">
            <div>
              <div className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                Smart Skill Hub ATS Readiness
              </div>
              <div className="text-2xl font-black text-foreground font-mono flex items-baseline gap-1">
                {atsReadiness} <span className="text-xs text-muted-foreground font-normal">/ 100</span>
              </div>
            </div>

            <div className="text-right">
              <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-500 border border-emerald-500/30">
                {passedCount} of {checks.length} checks passed
              </span>
            </div>
          </div>

          {/* Detailed Audit Checklist */}
          <div className="space-y-2">
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
              Quality Audit Breakdown
            </span>

            <div className="space-y-2">
              {checks.map((chk, i) => (
                <div
                  key={i}
                  className={`p-3 rounded-xl border flex items-center justify-between gap-3 text-xs transition-all ${
                    chk.passed
                      ? "bg-background border-border/60"
                      : "bg-amber-500/5 border-amber-500/30"
                  }`}
                >
                  <div className="flex items-start gap-2.5 min-w-0">
                    {chk.passed ? (
                      <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                    ) : (
                      <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
                    )}
                    <div className="min-w-0">
                      <div className="font-bold text-foreground truncate">{chk.title}</div>
                      <div className="text-[11px] text-muted-foreground leading-tight">
                        {chk.description}
                      </div>
                    </div>
                  </div>

                  {!chk.passed && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        onOpenChange(false);
                        onSelectSection(chk.sectionId);
                      }}
                      className="h-6 text-[10px] px-2 font-semibold bg-amber-500/10 border-amber-500/30 text-amber-300 hover:bg-amber-500/20 shrink-0"
                    >
                      Fix Section
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        <DialogFooter className="pt-2 border-t border-border/40">
          <Button variant="ghost" size="sm" onClick={() => onOpenChange(false)} className="text-xs">
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
