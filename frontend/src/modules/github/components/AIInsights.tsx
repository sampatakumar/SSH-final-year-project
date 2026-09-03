import React from "react";
import {
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Lightbulb,
  FileCode,
  Compass,
  ArrowUpRight,
  Copy,
  Check,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import type { GitHubAIInsights } from "../types/github.types";

export interface AIInsightsProps {
  insights?: GitHubAIInsights;
  username: string;
}

export const AIInsights: React.FC<AIInsightsProps> = ({ insights, username }) => {
  const [copied, setCopied] = React.useState(false);

  if (!insights) return null;

  const handleCopyMarkdown = () => {
    const md = `# GitHub Developer Review for @${username}
**Optimization Score**: ${insights.githubOptimizationScore}/100

## Summary
${insights.summary}

## Stack Assessment
${insights.skillAssessment}

## Strengths
${insights.strengths?.map((s) => `- ${s}`).join("\n")}

## Areas for Growth
${insights.weaknesses?.map((w) => `- ${w}`).join("\n")}

## Portfolio Tips
${insights.portfolioImprovementTips?.map((t) => `- ${t}`).join("\n")}

## Recommended Technologies
${insights.recommendedTechnologies?.map((r) => `- ${r}`).join("\n")}
`;

    navigator.clipboard.writeText(md);
    setCopied(true);
    toast.success("AI Insights copied to clipboard as Markdown!");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-card rounded-2xl border border-border/50 p-6 shadow-xs space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/40 pb-4">
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          <h3 className="font-bold text-base text-foreground">
            AI Professional Developer Review
          </h3>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-primary/10 px-3 py-1 rounded-xl border border-primary/20">
            <span className="text-xs text-muted-foreground font-medium">Optimization Score:</span>
            <span className="text-sm font-black text-primary font-mono">
              {insights.githubOptimizationScore}/100
            </span>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={handleCopyMarkdown}
            className="text-xs h-8"
          >
            {copied ? <Check className="h-3.5 w-3.5 mr-1 text-emerald-500" /> : <Copy className="h-3.5 w-3.5 mr-1" />}
            {copied ? "Copied" : "Copy MD"}
          </Button>
        </div>
      </div>

      {/* Summary & Stack Assessment */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-4 rounded-xl bg-background/60 border border-border/40 space-y-1.5">
          <h4 className="text-xs font-bold text-foreground flex items-center gap-1.5">
            <Compass className="h-3.5 w-3.5 text-primary" /> Specialization Summary
          </h4>
          <p className="text-xs text-muted-foreground leading-relaxed">
            {insights.summary}
          </p>
        </div>

        <div className="p-4 rounded-xl bg-background/60 border border-border/40 space-y-1.5">
          <h4 className="text-xs font-bold text-foreground flex items-center gap-1.5">
            <FileCode className="h-3.5 w-3.5 text-primary" /> Stack & Maturity Assessment
          </h4>
          <p className="text-xs text-muted-foreground leading-relaxed">
            {insights.skillAssessment}
          </p>
        </div>
      </div>

      {/* Strengths & Weaknesses */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        {/* Strengths */}
        <div className="space-y-2.5">
          <h4 className="text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5 uppercase tracking-wider">
            <CheckCircle2 className="h-4 w-4" /> Technical Strengths
          </h4>
          <ul className="space-y-2 text-xs text-muted-foreground">
            {insights.strengths?.map((str, idx) => (
              <li key={idx} className="flex items-start gap-2 p-2 rounded-lg bg-emerald-500/5 border border-emerald-500/10">
                <span className="text-emerald-500 font-bold">✓</span>
                <span>{str}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Growth Areas */}
        <div className="space-y-2.5">
          <h4 className="text-xs font-bold text-amber-600 dark:text-amber-400 flex items-center gap-1.5 uppercase tracking-wider">
            <AlertCircle className="h-4 w-4" /> Growth Opportunities
          </h4>
          <ul className="space-y-2 text-xs text-muted-foreground">
            {insights.weaknesses?.map((w, idx) => (
              <li key={idx} className="flex items-start gap-2 p-2 rounded-lg bg-amber-500/5 border border-amber-500/10">
                <span className="text-amber-500 font-bold">!</span>
                <span>{w}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Tips & Recommendations */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-border/40">
        {/* Portfolio Tips */}
        <div className="space-y-2">
          <h4 className="text-xs font-bold text-foreground flex items-center gap-1.5">
            <Lightbulb className="h-3.5 w-3.5 text-amber-500" /> Portfolio Optimization Tips
          </h4>
          <ul className="space-y-1.5 text-xs text-muted-foreground">
            {insights.portfolioImprovementTips?.map((tip, idx) => (
              <li key={idx} className="flex items-start gap-1.5">
                <span className="text-primary font-bold">→</span>
                <span>{tip}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Recommended Technologies */}
        <div className="space-y-2">
          <h4 className="text-xs font-bold text-foreground flex items-center gap-1.5">
            <ArrowUpRight className="h-3.5 w-3.5 text-primary" /> Recommended Next Technologies
          </h4>
          <div className="flex flex-wrap gap-1.5 pt-1">
            {insights.recommendedTechnologies?.map((tech, idx) => (
              <span
                key={idx}
                className="text-xs px-2.5 py-1 rounded-lg bg-primary/10 text-primary border border-primary/20 font-medium"
              >
                {tech}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AIInsights;
