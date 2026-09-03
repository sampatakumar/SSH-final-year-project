import React from "react";
import { Download, Printer, X, FileJson, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { GitHubAnalysisData } from "../types/github.types";
import { toast } from "sonner";

export interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  analysis: GitHubAnalysisData;
}

export const ExportModal: React.FC<ExportModalProps> = ({
  isOpen,
  onClose,
  analysis,
}) => {
  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadJSON = () => {
    const exportObject = {
      exportedAt: new Date().toISOString(),
      platform: "Smart Skill Hub GitHub Intelligence",
      username: analysis.username,
      profile: analysis.profile,
      aggregateStats: analysis.aggregateStats,
      dominantLanguage: analysis.dominantLanguage,
      languages: analysis.languages,
      topRepositories: analysis.repositories.slice(0, 15),
      engineeringQuality: analysis.engineeringQuality,
      projectComplexity: analysis.projectComplexity?.summary,
      aiInsights: analysis.aiInsights,
    };

    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(exportObject, null, 2));
    const downloadAnchor = document.createElement("a");
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `smart-skill-hub-github-${analysis.username}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    toast.success("GitHub developer report JSON downloaded!");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-in fade-in-50 duration-150">
      <div className="bg-card w-full max-w-lg rounded-2xl border border-border/60 shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-border/40 flex items-center justify-between shrink-0 bg-muted/20">
          <div className="flex items-center gap-2 font-bold text-base text-foreground">
            <Download className="h-5 w-5 text-primary" />
            <span>Export GitHub Developer Report</span>
          </div>

          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4 text-xs">
          <p className="text-muted-foreground leading-relaxed">
            Export comprehensive developer intelligence for <strong>@{analysis.username}</strong> including repository directory metrics, language breakdowns, engineering quality signals, and AI insights.
          </p>

          <div className="space-y-3 pt-2">
            <button
              onClick={handlePrint}
              className="w-full p-4 rounded-xl border border-border/60 bg-background/80 hover:bg-primary/5 hover:border-primary/40 flex items-center justify-between font-semibold text-foreground transition-all"
            >
              <div className="flex items-center gap-3 text-left">
                <Printer className="h-5 w-5 text-primary" />
                <div>
                  <div className="font-bold">Print / Save as PDF</div>
                  <div className="text-[11px] font-normal text-muted-foreground">
                    Formatted document for portfolio and hiring reviews
                  </div>
                </div>
              </div>
              <ArrowRight className="h-4 w-4 text-muted-foreground" />
            </button>

            <button
              onClick={handleDownloadJSON}
              className="w-full p-4 rounded-xl border border-border/60 bg-background/80 hover:bg-primary/5 hover:border-primary/40 flex items-center justify-between font-semibold text-foreground transition-all"
            >
              <div className="flex items-center gap-3 text-left">
                <FileJson className="h-5 w-5 text-blue-500" />
                <div>
                  <div className="font-bold">Download Structured JSON</div>
                  <div className="text-[11px] font-normal text-muted-foreground">
                    Machine-readable metrics and analysis payload
                  </div>
                </div>
              </div>
              <ArrowRight className="h-4 w-4 text-muted-foreground" />
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-border/40 flex justify-end shrink-0 bg-muted/20">
          <Button variant="outline" size="sm" onClick={onClose} className="text-xs">
            Close
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ExportModal;
