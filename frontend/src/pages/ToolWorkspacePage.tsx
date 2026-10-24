import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { CanonicalTool } from "../modules/tools/types/tools.types";
import { toolsApi } from "../modules/tools/services/tools.api";
import { MechanicalCalcWorkspace } from "../modules/tools/components/MechanicalCalcWorkspace";
import { EceCircuitsWorkspace } from "../modules/tools/components/EceCircuitsWorkspace";
import { CivilBoqWorkspace } from "../modules/tools/components/CivilBoqWorkspace";
import { ChemProcessWorkspace } from "../modules/tools/components/ChemProcessWorkspace";
import { BiotechResearchWorkspace } from "../modules/tools/components/BiotechResearchWorkspace";
import { BusinessKpiWorkspace } from "../modules/tools/components/BusinessKpiWorkspace";
import { FinanceAccountingWorkspace } from "../modules/tools/components/FinanceAccountingWorkspace";
import { ArtsWritingWorkspace } from "../modules/tools/components/ArtsWritingWorkspace";
import { NursingStudyWorkspace } from "../modules/tools/components/NursingStudyWorkspace";
import { SharedReportReviewerWorkspace } from "../modules/tools/components/SharedReportReviewerWorkspace";
import {
  ChevronLeft,
  Wrench,
  ShieldCheck,
  Zap,
  Cpu,
  ExternalLink,
  AlertCircle,
  HelpCircle,
  Layers,
} from "lucide-react";

export const ToolWorkspacePage: React.FC = () => {
  const { toolId } = useParams<{ toolId: string }>();
  const navigate = useNavigate();

  const [tool, setTool] = useState<CanonicalTool | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (toolId) {
      loadToolSpec(toolId);
    }
  }, [toolId]);

  const loadToolSpec = async (id: string) => {
    setLoading(true);
    setError(null);
    try {
      const data = await toolsApi.getToolById(id);
      setTool(data);
    } catch (err: any) {
      setError(err.message || "Failed to load tool specification.");
    } finally {
      setLoading(false);
    }
  };

  const renderActiveWorkspace = () => {
    if (!tool) return null;

    switch (tool.toolId) {
      case "mech-calc":
        return <MechanicalCalcWorkspace />;
      case "ece-circuits":
        return <EceCircuitsWorkspace />;
      case "civil-boq":
        return <CivilBoqWorkspace />;
      case "chem-process":
        return <ChemProcessWorkspace />;
      case "biotech-research":
        return <BiotechResearchWorkspace />;
      case "business-kpi":
        return <BusinessKpiWorkspace />;
      case "finance-accounting":
        return <FinanceAccountingWorkspace />;
      case "arts-writing":
        return <ArtsWritingWorkspace />;
      case "nursing-study":
        return <NursingStudyWorkspace />;
      case "report-reviewer":
        return <SharedReportReviewerWorkspace />;
      case "cse-resume-ai":
      case "cse-coding-platform":
      case "cse-github-reviewer":
        return (
          <div className="p-8 rounded-xl border border-border/80 bg-card/60 backdrop-blur-md text-center max-w-xl mx-auto space-y-4">
            <h3 className="text-base font-semibold text-foreground">{tool.displayName}</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              {tool.shortDescription}
            </p>
            <Link
              to={tool.route}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-xs font-medium hover:bg-primary/90 transition-all shadow-sm"
            >
              <span>Launch Dedicated Platform Workspace</span>
              <ExternalLink className="w-4 h-4" />
            </Link>
          </div>
        );
      default:
        return (
          <div className="p-8 text-center text-muted-foreground text-xs">
            Workspace component under active configuration.
          </div>
        );
    }
  };

  if (loading) {
    return (
      <div className="py-24 flex flex-col items-center justify-center text-muted-foreground text-xs gap-3">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        <span>Loading tool workspace...</span>
      </div>
    );
  }

  if (error || !tool) {
    return (
      <div className="py-12 max-w-lg mx-auto text-center space-y-4">
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center gap-2 justify-center">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{error || "Tool not found."}</span>
        </div>
        <button
          onClick={() => navigate("/dashboard/tools")}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-card border border-border text-xs text-foreground hover:bg-muted"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Back to Tool Hub</span>
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Breadcrumb & Navigation */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate("/dashboard/tools")}
          className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors group"
        >
          <ChevronLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
          <span>Back to Tool Hub</span>
        </button>

        <div className="flex items-center gap-2">
          <span className="text-xs font-mono text-muted-foreground">v{tool.version}</span>
          <span
            className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-medium border ${
              tool.executionMode === "deterministic"
                ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                : "bg-indigo-500/10 text-indigo-400 border-indigo-500/20"
            }`}
          >
            {tool.executionMode === "deterministic" ? (
              <>
                <Zap className="w-3 h-3" />
                Deterministic Math
              </>
            ) : (
              <>
                <Cpu className="w-3 h-3" />
                Hybrid AI
              </>
            )}
          </span>
        </div>
      </div>

      {/* Tool Header Banner */}
      <div className="rounded-2xl border border-border/60 bg-gradient-to-r from-card/80 via-muted/20 to-card/80 p-6 backdrop-blur-md">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium px-2.5 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
                {tool.academicDiscipline}
              </span>
              <span className="text-xs text-muted-foreground">• {tool.category}</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-foreground tracking-tight">
              {tool.displayName}
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground max-w-2xl leading-relaxed">
              {tool.intendedTask}
            </p>
          </div>
        </div>

        {/* Safety Disclaimer Banner */}
        {tool.safetyDisclaimers && (
          <div className="mt-4 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-300 text-[11px] leading-relaxed flex items-start gap-2">
            <ShieldCheck className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{tool.safetyDisclaimers}</span>
          </div>
        )}
      </div>

      {/* Main Interactive Workspace */}
      <div className="pt-2">{renderActiveWorkspace()}</div>
    </div>
  );
};
