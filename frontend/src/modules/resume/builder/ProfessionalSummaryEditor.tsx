import React, { useState } from "react";
import { Sparkles, RefreshCw, Wand2, Check, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { apiRequest } from "@/lib/api";
import { toast } from "sonner";
import type { ResumeData } from "../templates/types";
import { getRenderableSkillLines } from "@/components/resume/skillFormat";

export interface ProfessionalSummaryEditorProps {
  summary: string;
  onChange: (value: string) => void;
  resumeData: ResumeData;
  idToken: string | null;
}

export const ProfessionalSummaryEditor: React.FC<ProfessionalSummaryEditorProps> = ({
  summary,
  onChange,
  resumeData,
  idToken,
}) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedTone, setSelectedTone] = useState<"professional" | "technical" | "concise" | "fresher" | "ats">("professional");
  const [lineBudget, setLineBudget] = useState<2 | 3 | 4>(3);
  const [showOptions, setShowOptions] = useState(false);

  const generateGroundedFallbackSummary = (): string => {
    const candidateName = resumeData.name ? `${resumeData.name}` : "Motivated Software Developer";
    const skillLines = getRenderableSkillLines(resumeData);
    const topSkills = skillLines.flatMap((l) => l.skills).slice(0, 6).join(", ");
    const topDegree = resumeData.education?.[0]?.degree || "Computer Science / Engineering background";
    const topProject = resumeData.projects?.[0]?.name;

    if (selectedTone === "fresher") {
      return `Aspiring software engineer with a strong foundation in ${topDegree}. Hands-on experience developing ${topProject ? `projects like ${topProject}` : "web applications"}${topSkills ? ` utilizing ${topSkills}` : ""}. Eager to contribute to high-impact software engineering teams.`;
    }

    if (selectedTone === "technical") {
      return `Technical developer skilled in full-lifecycle software development with core competencies in ${topSkills || "modern software stacks"}. Demonstrated track record building responsive applications and scalable backend services.`;
    }

    if (selectedTone === "concise") {
      return `Software engineer specialized in ${topSkills || "web development"}. Experienced in building reliable applications and engineering practical software solutions.`;
    }

    // Default Professional / ATS
    return `Results-driven software developer with expertise in modern technologies${topSkills ? ` including ${topSkills}` : ""}. Experienced in building end-to-end applications${topProject ? ` such as ${topProject}` : ""}, focused on writing clean, maintainable code and delivering reliable software systems.`;
  };

  const handleGenerateSummary = async () => {
    setIsGenerating(true);
    try {
      // Build strictly grounded context from user facts
      const contextPieces = [
        resumeData.name ? `Name: ${resumeData.name}` : "",
        resumeData.education?.length ? `Education: ${resumeData.education.map((e) => `${e.degree} at ${e.school}`).join("; ")}` : "",
        resumeData.skills ? `Skills: ${JSON.stringify(resumeData.skills)}` : "",
        resumeData.projects?.length ? `Projects: ${resumeData.projects.map((p) => `${p.name} (${p.technologies})`).join("; ")}` : "",
        resumeData.experience?.length ? `Experience: ${resumeData.experience.map((e) => `${e.role} at ${e.company}`).join("; ")}` : "",
      ].filter(Boolean).join("\n");

      if (idToken) {
        try {
          const res = await apiRequest<{ summary?: string; profileSummary?: string }>("/ai/profile-summary", {
            method: "POST",
            token: idToken,
            body: {
              profileSource: contextPieces || "Software engineer developer",
              tone: selectedTone,
              maxWords: lineBudget * 28,
            },
          });

          const generatedText = (res.data?.profileSummary || res.data?.summary || "").trim();
          if (generatedText) {
            onChange(generatedText);
            toast.success("Professional summary generated!");
            return;
          }
        } catch {
          // Gracefully fallback to deterministic grounded generator if Groq network is unreachable
        }
      }

      // Grounded deterministic fallback
      const fallback = generateGroundedFallbackSummary();
      onChange(fallback);
      toast.success("Grounded professional summary generated!");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-3 bg-card p-4 rounded-xl border border-border/50 shadow-sm">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <FileText className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-bold text-foreground">Professional Summary</h3>
          <span className="text-[10px] text-muted-foreground bg-muted px-2 py-0.5 rounded">ATS Vital</span>
        </div>

        <div className="flex items-center gap-2">
          <Button
            type="button"
            size="sm"
            variant="ghost"
            onClick={() => setShowOptions(!showOptions)}
            className="text-xs h-7 text-muted-foreground hover:text-foreground"
          >
            ⚙️ Options
          </Button>

          <Button
            type="button"
            size="sm"
            onClick={handleGenerateSummary}
            disabled={isGenerating}
            className="text-xs h-7 bg-primary/10 hover:bg-primary/20 text-primary border border-primary/30"
          >
            {isGenerating ? (
              <><RefreshCw className="h-3 w-3 mr-1 animate-spin" /> Generating...</>
            ) : (
              <><Sparkles className="h-3 w-3 mr-1" /> ✨ Generate Summary</>
            )}
          </Button>
        </div>
      </div>

      {/* AI Summary Settings Panel */}
      {showOptions && (
        <div className="p-3 bg-muted/40 rounded-lg border border-border/40 space-y-2.5 text-xs animate-in fade-in-50 duration-150">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-muted-foreground">Tone Preset:</span>
            <div className="flex flex-wrap gap-1">
              {(["professional", "technical", "concise", "fresher", "ats"] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setSelectedTone(t)}
                  className={`px-2 py-0.5 rounded capitalize text-[11px] transition-colors ${
                    selectedTone === t
                      ? "bg-primary text-primary-foreground font-semibold"
                      : "bg-card border border-border/50 text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between">
            <span className="font-semibold text-muted-foreground">Target Length:</span>
            <div className="flex gap-1">
              {([2, 3, 4] as const).map((lines) => (
                <button
                  key={lines}
                  type="button"
                  onClick={() => setLineBudget(lines)}
                  className={`px-2 py-0.5 rounded text-[11px] transition-colors ${
                    lineBudget === lines
                      ? "bg-primary text-primary-foreground font-semibold"
                      : "bg-card border border-border/50 text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {lines} Lines
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Textarea */}
      <Textarea
        value={summary}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Brief 2-4 sentence executive overview highlighting your core strengths, engineering focus, and key technologies..."
        rows={4}
        className="text-xs resize-y leading-relaxed bg-background/60"
      />

      <p className="text-[11px] text-muted-foreground">
        💡 <strong>Tip:</strong> An impactful summary introduces your technical domain and 4-6 primary tools without buzzword overload.
      </p>
    </div>
  );
};

export default ProfessionalSummaryEditor;
