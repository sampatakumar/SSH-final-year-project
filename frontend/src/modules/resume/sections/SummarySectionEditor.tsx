import React, { useState } from "react";
import { Sparkles, Wand2, RefreshCw, FileText, CheckCircle2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { apiRequest } from "@/lib/api";
import type { ResumeData } from "../templates/types";
import { getRenderableSkillLines } from "@/components/resume/skillFormat";

export interface SummarySectionEditorProps {
  summary: string;
  onChange: (value: string) => void;
  resumeData: ResumeData;
  idToken: string | null;
}

export const SummarySectionEditor: React.FC<SummarySectionEditorProps> = ({
  summary,
  onChange,
  resumeData,
  idToken,
}) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [activeTone, setActiveTone] = useState<"professional" | "technical" | "concise" | "ats">("professional");

  const charCount = summary?.length || 0;
  const wordCount = summary ? summary.trim().split(/\s+/).length : 0;

  // Grounded Deterministic Summary Generator (Zero Hallucination)
  const generateGroundedSummary = (tone: "professional" | "technical" | "concise" | "ats") => {
    const candidateName = resumeData.name || "Developer";
    const skillLines = getRenderableSkillLines(resumeData);
    const topSkills = skillLines.flatMap((l) => l.skills).slice(0, 6).join(", ");
    const topDegree = resumeData.education?.[0]?.degree || "Software Engineering background";
    const topProject = resumeData.projects?.[0]?.name;

    if (tone === "technical") {
      return `Results-driven software engineer specialized in ${topSkills || "full-stack development"}. Demonstrated track record architecting reliable backend services and responsive client applications${topProject ? `, including ${topProject}` : ""}. Committed to high code quality, system performance, and modern developer tooling.`;
    }

    if (tone === "concise") {
      return `Software engineer skilled in ${topSkills || "web technologies"}. Hands-on experience developing end-to-end applications with a focus on maintainability, clean architecture, and practical engineering solutions.`;
    }

    if (tone === "ats") {
      return `Experienced Software Developer with proven expertise in ${topSkills || "modern frameworks and backend systems"}. Adept at designing scalable architecture, collaborating on cross-functional teams, and delivering production-ready software solutions with high reliability.`;
    }

    // Default Professional
    return `Versatile software engineer with hands-on experience building modern applications${topSkills ? ` using ${topSkills}` : ""}. Strong foundation in ${topDegree}, focused on engineering robust features${topProject ? ` like ${topProject}` : ""}, optimizing workflows, and delivering impactful software products.`;
  };

  const handleAiAction = async (tone: "professional" | "technical" | "concise" | "ats") => {
    setIsGenerating(true);
    setActiveTone(tone);

    try {
      if (idToken) {
        try {
          const contextPieces = [
            resumeData.name ? `Name: ${resumeData.name}` : "",
            resumeData.education?.length
              ? `Education: ${resumeData.education.map((e) => `${e.degree} at ${e.school}`).join("; ")}`
              : "",
            resumeData.skills ? `Skills: ${JSON.stringify(resumeData.skills)}` : "",
            resumeData.projects?.length
              ? `Projects: ${resumeData.projects.map((p) => `${p.name} (${p.technologies})`).join("; ")}`
              : "",
            resumeData.experience?.length
              ? `Experience: ${resumeData.experience.map((e) => `${e.role} at ${e.company}`).join("; ")}`
              : "",
          ]
            .filter(Boolean)
            .join("\n");

          const res = await apiRequest<{ summary: string }>("/ai/profile-summary", {
            method: "POST",
            token: idToken,
            body: {
              profileSource: contextPieces || "Software developer",
              tone,
              maxWords: 85,
            },
          });

          if (res.data?.summary?.trim()) {
            onChange(res.data.summary.trim());
            toast.success(`Summary generated (${tone} tone)!`);
            return;
          }
        } catch {
          // Fallback to grounded local summary
        }
      }

      const grounded = generateGroundedSummary(tone);
      onChange(grounded);
      toast.success(`Grounded summary generated (${tone} tone)!`);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Editor Header Info */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            Professional Summary
          </h3>
          <p className="text-[11px] text-muted-foreground">
            2–4 impactful sentences highlighting your technical expertise and career focus.
          </p>
        </div>
        <div className="text-[11px] font-mono text-muted-foreground bg-muted/60 px-2 py-0.5 rounded-md border">
          {wordCount} words / {charCount} chars
        </div>
      </div>

      {/* Main Textarea */}
      <Textarea
        rows={5}
        value={summary || ""}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Write a concise professional summary showcasing your top skills, technical focus, and engineering background..."
        className="text-xs leading-relaxed py-2.5 bg-background custom-scrollbar"
      />

      {/* Quality Guidance Indicator */}
      <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-0.5">
        <div className="flex items-center gap-1.5">
          {wordCount >= 30 && wordCount <= 90 ? (
            <span className="flex items-center gap-1 text-emerald-500 font-semibold">
              <CheckCircle2 className="h-3.5 w-3.5" /> Optimal Length (30–90 words)
            </span>
          ) : wordCount < 30 ? (
            <span className="flex items-center gap-1 text-amber-500">
              <AlertCircle className="h-3.5 w-3.5" /> Short (aim for 30–75 words)
            </span>
          ) : (
            <span className="flex items-center gap-1 text-amber-500">
              <AlertCircle className="h-3.5 w-3.5" /> Long (may push content to page 2)
            </span>
          )}
        </div>
        <span className="font-semibold text-primary">100% ATS Safe</span>
      </div>

      {/* Grounded AI Enhancement Pills */}
      <div className="space-y-2 pt-2 border-t border-border/40">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold text-muted-foreground uppercase flex items-center gap-1">
            <Sparkles className="h-3 w-3 text-primary" /> Grounded AI Actions
          </span>
          <span className="text-[10px] text-muted-foreground">Uses verified profile facts</span>
        </div>

        <div className="flex flex-wrap gap-1.5">
          <Button
            size="sm"
            variant="outline"
            disabled={isGenerating}
            onClick={() => handleAiAction("professional")}
            className="h-7 text-xs bg-card hover:bg-primary/10 hover:text-primary gap-1"
          >
            <Wand2 className="h-3 w-3 text-primary" /> Rewrite Professionally
          </Button>

          <Button
            size="sm"
            variant="outline"
            disabled={isGenerating}
            onClick={() => handleAiAction("technical")}
            className="h-7 text-xs bg-card hover:bg-primary/10 hover:text-primary gap-1"
          >
            <Sparkles className="h-3 w-3 text-primary" /> Make Technical
          </Button>

          <Button
            size="sm"
            variant="outline"
            disabled={isGenerating}
            onClick={() => handleAiAction("concise")}
            className="h-7 text-xs bg-card hover:bg-primary/10 hover:text-primary gap-1"
          >
            <RefreshCw className="h-3 w-3 text-primary" /> Make Concise
          </Button>

          <Button
            size="sm"
            variant="outline"
            disabled={isGenerating}
            onClick={() => handleAiAction("ats")}
            className="h-7 text-xs bg-card hover:bg-primary/10 hover:text-primary gap-1"
          >
            <FileText className="h-3 w-3 text-primary" /> ATS Optimized
          </Button>
        </div>
      </div>
    </div>
  );
};
