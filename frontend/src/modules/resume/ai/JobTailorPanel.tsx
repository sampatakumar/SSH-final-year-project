import React, { useState } from "react";
import { Sparkles, Target, CheckCircle2, AlertCircle, XCircle, Wand2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import type { ResumeData } from "../templates/types";
import { getRenderableSkillLines } from "@/components/resume/skillFormat";

export interface JobTailorPanelProps {
  data: ResumeData;
  onApplyKeywordFocus?: (focusedSkills: string[]) => void;
}

interface MatchResult {
  keyword: string;
  category: "MATCHED" | "WEAK_EVIDENCE" | "NOT_FOUND";
  contextFound?: string;
}

export const JobTailorPanel: React.FC<JobTailorPanelProps> = ({
  data,
  onApplyKeywordFocus,
}) => {
  const [jobDescription, setJobDescription] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [results, setResults] = useState<MatchResult[] | null>(null);

  // Analyze Job Description against Resume Data
  const handleAnalyzeJob = () => {
    if (!jobDescription.trim() || jobDescription.trim().length < 30) {
      toast.error("Please paste a job description with at least 30 characters.");
      return;
    }

    setIsAnalyzing(true);

    try {
      const textLower = jobDescription.toLowerCase();

      // Extract candidate terms from JD
      const commonTechKeywords = [
        "react", "typescript", "javascript", "node.js", "nodejs", "python", "java", "c++",
        "golang", "rust", "docker", "kubernetes", "aws", "gcp", "azure", "postgresql",
        "mongodb", "redis", "graphql", "rest", "ci/cd", "tailwind", "next.js", "express",
        "microservices", "unit testing", "agile", "git", "linux", "sql", "nosql",
        "system design", "data structures", "algorithms", "redux", "html5", "css3"
      ];

      const foundJdKeywords = commonTechKeywords.filter((kw) => {
        const regex = new RegExp(`\\b${kw.replace(/[.+*?^${}()|[\]\\]/g, "\\$&")}\\b`, "i");
        return regex.test(textLower);
      });

      // Collect resume text corpus
      const resumeSkillLines = getRenderableSkillLines(data) || [];
      const resumeSkills = resumeSkillLines
        .flatMap((l) => (l?.value ? l.value.split(",").map((s) => s.trim().toLowerCase()) : []))
        .filter(Boolean);

      const resumeProjectsText = (data.projects || [])
        .map((p) => `${p.name || ""} ${p.technologies || ""} ${Array.isArray(p.bullets) ? p.bullets.join(" ") : ""}`)
        .join(" ")
        .toLowerCase();
      const resumeExperienceText = (data.experience || [])
        .map((e) => `${e.role || ""} ${e.company || ""} ${Array.isArray(e.bullets) ? e.bullets.join(" ") : ""}`)
        .join(" ")
        .toLowerCase();
      const resumeSummaryText = (data.professionalSummary || "").toLowerCase();

      const fullResumeCorpus = `${resumeSkills.join(" ")} ${resumeProjectsText} ${resumeExperienceText} ${resumeSummaryText}`;

      const matchResults: MatchResult[] = foundJdKeywords.map((kw) => {
        const isDirectSkill = resumeSkills.some((s) => s.includes(kw) || kw.includes(s));
        const isInCorpus = fullResumeCorpus.includes(kw);

        if (isDirectSkill) {
          return { keyword: kw, category: "MATCHED", contextFound: "Verified in Skills matrix" };
        } else if (isInCorpus) {
          return { keyword: kw, category: "WEAK_EVIDENCE", contextFound: "Mentioned in projects/experience text" };
        } else {
          return { keyword: kw, category: "NOT_FOUND" };
        }
      });

      setResults(matchResults);
      toast.success(`Extracted and matched ${foundJdKeywords.length} target job keywords!`);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const matchedCount = results?.filter((r) => r.category === "MATCHED").length || 0;
  const weakCount = results?.filter((r) => r.category === "WEAK_EVIDENCE").length || 0;
  const notFoundCount = results?.filter((r) => r.category === "NOT_FOUND").length || 0;
  const totalCount = results?.length || 0;

  const matchPercentage = totalCount > 0 ? Math.round(((matchedCount + weakCount * 0.5) / totalCount) * 100) : 0;

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
          <Target className="h-4 w-4 text-primary" /> Tailor for Job Description
        </h3>
        <p className="text-[11px] text-muted-foreground">
          Compare your resume against target job requirements to identify keyword matches and skill gaps.
        </p>
      </div>

      {/* JD Input */}
      <div className="space-y-2">
        <Textarea
          rows={4}
          value={jobDescription}
          onChange={(e) => setJobDescription(e.target.value)}
          placeholder="Paste job description or requirements list here..."
          className="text-xs bg-background custom-scrollbar"
        />
        <div className="flex items-center justify-between">
          <span className="text-[10px] text-muted-foreground">
            {jobDescription.length} characters
          </span>
          <Button
            size="sm"
            onClick={handleAnalyzeJob}
            disabled={isAnalyzing}
            className="h-7 text-xs bg-primary hover:bg-primary/90 text-primary-foreground font-semibold gap-1.5"
          >
            <Sparkles className="h-3.5 w-3.5" />
            {isAnalyzing ? "Analyzing Job..." : "Analyze & Match"}
          </Button>
        </div>
      </div>

      {/* Match Results */}
      {results && (
        <div className="space-y-3 pt-2 border-t border-border/40">
          {/* Match Score Banner */}
          <div className="p-3 rounded-xl bg-muted/40 border border-border/60 flex items-center justify-between">
            <div>
              <div className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">
                Keyword Match Index
              </div>
              <div className="text-xl font-black font-mono text-foreground">
                {matchPercentage}%
              </div>
            </div>
            <div className="flex items-center gap-1.5 text-[11px] font-semibold">
              <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                {matchedCount} Matched
              </span>
              <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-400 border border-amber-500/30">
                {weakCount} Partial
              </span>
              <span className="px-2 py-0.5 rounded bg-red-500/10 text-red-400 border border-red-500/20">
                {notFoundCount} Missing
              </span>
            </div>
          </div>

          {/* Chips */}
          <div className="space-y-2">
            <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
              Keyword Match Breakdown
            </span>
            <div className="flex flex-wrap gap-1.5">
              {results.map((r, i) => (
                <span
                  key={i}
                  className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold border ${
                    r.category === "MATCHED"
                      ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                      : r.category === "WEAK_EVIDENCE"
                      ? "bg-amber-500/10 text-amber-400 border-amber-500/30"
                      : "bg-muted/40 text-muted-foreground border-border/60"
                  }`}
                >
                  {r.category === "MATCHED" && <CheckCircle2 className="h-3 w-3 text-emerald-400" />}
                  {r.category === "WEAK_EVIDENCE" && <AlertCircle className="h-3 w-3 text-amber-400" />}
                  {r.category === "NOT_FOUND" && <XCircle className="h-3 w-3 text-muted-foreground" />}
                  <span className="capitalize">{r.keyword}</span>
                  <span className="text-[9px] uppercase font-mono opacity-80">
                    ({r.category.replace("_", " ")})
                  </span>
                </span>
              ))}
            </div>
          </div>

          {/* Grounded Advice */}
          <div className="p-3 rounded-xl bg-primary/5 border border-primary/20 text-xs space-y-1">
            <div className="font-bold text-primary flex items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5" /> Grounded Tailoring Guidance
            </div>
            <ul className="space-y-1 text-[11px] text-muted-foreground list-disc list-inside">
              <li>Highlight your existing matching projects at the top of the Projects section.</li>
              <li>Promote matched skills to the front of your technical skills matrix.</li>
              <li className="text-amber-400/90 font-medium">Do not fabricate unverified skills or tools. Highlight transferable concepts instead.</li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
};

export default JobTailorPanel;
