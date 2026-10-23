import React, { useState } from "react";
import { motion } from "framer-motion";
import {
  CheckCircle2,
  Clock,
  AlertCircle,
  FileText,
  Upload,
  Link as LinkIcon,
  Save,
  Send,
  Layers,
  Award,
  ChevronDown,
  ChevronUp,
  Sparkles,
  ArrowLeft,
  FileCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { StudentProject, ProjectTemplate } from "../types/projectStudio.types";
import { toast } from "sonner";

interface ActiveProjectWorkspaceProps {
  project: StudentProject;
  template?: ProjectTemplate;
  onUpdateMilestone: (milestoneId: string, status: "pending" | "in_progress" | "completed", notes: string) => Promise<void>;
  onSaveDeliverables: (deliverables: any[], writtenExplanations: string) => Promise<void>;
  onSubmitProject: (writtenExplanations: string) => Promise<void>;
  onBack: () => void;
  onViewPortfolio?: () => void;
  saving: boolean;
  submitting: boolean;
}

export const ActiveProjectWorkspace: React.FC<ActiveProjectWorkspaceProps> = ({
  project,
  template,
  onUpdateMilestone,
  onSaveDeliverables,
  onSubmitProject,
  onBack,
  onViewPortfolio,
  saving,
  submitting,
}) => {
  const [writtenExplanations, setWrittenExplanations] = useState<string>(
    project.writtenExplanations || ""
  );
  const [deliverableInputs, setDeliverableInputs] = useState<Record<string, { content?: string; externalUrl?: string; notes?: string }>>(
    () => {
      const initial: Record<string, any> = {};
      (project.deliverables || []).forEach((d) => {
        initial[d.key || d.deliverableId || ""] = {
          content: d.content || d.textContent || "",
          externalUrl: d.externalUrl || "",
          notes: d.notes || "",
        };
      });
      return initial;
    }
  );
  const [expandedMilestone, setExpandedMilestone] = useState<string | null>(null);
  const [milestoneNotes, setMilestoneNotes] = useState<Record<string, string>>(() => {
    const initial: Record<string, string> = {};
    (project.milestoneProgress || []).forEach((m) => {
      initial[m.milestoneId] = m.notes || "";
    });
    return initial;
  });

  const isCompleted = project.status === "completed";
  const isSubmitted = project.status === "submitted";
  const isChangesRequested = project.status === "changes_requested";

  const handleDeliverableChange = (key: string, field: "content" | "externalUrl" | "notes", val: string) => {
    setDeliverableInputs((prev) => ({
      ...prev,
      [key]: {
        ...prev[key],
        [field]: val,
      },
    }));
  };

  const handleSaveAll = async () => {
    const formattedDeliverables = Object.entries(deliverableInputs).map(([key, val]) => ({
      key,
      deliverableId: key,
      content: val.content,
      textContent: val.content,
      externalUrl: val.externalUrl,
      notes: val.notes,
    }));
    await onSaveDeliverables(formattedDeliverables, writtenExplanations);
    toast.success("Project deliverables and explanations saved.");
  };

  const handleSubmit = async () => {
    // Format deliverables first
    const formattedDeliverables = Object.entries(deliverableInputs).map(([key, val]) => ({
      key,
      deliverableId: key,
      content: val.content,
      textContent: val.content,
      externalUrl: val.externalUrl,
      notes: val.notes,
    }));
    await onSaveDeliverables(formattedDeliverables, writtenExplanations);
    await onSubmitProject(writtenExplanations);
  };

  const completedMilestones = (project.milestoneProgress || []).filter(
    (m) => m.completed || m.status === "completed"
  ).length;
  const totalMilestones = (project.milestoneProgress || []).length || 1;
  const progressPercent = project.progressPercentage ?? Math.round((completedMilestones / totalMilestones) * 100);

  return (
    <div className="space-y-8">
      {/* Top Navigation & Status Bar */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 glass p-6 rounded-2xl border border-border/50">
        <div className="space-y-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={onBack}
            className="mb-1 text-xs text-muted-foreground hover:text-foreground pl-0"
          >
            <ArrowLeft className="h-3.5 w-3.5 mr-1" />
            Back to All Projects
          </Button>

          <div className="flex items-center gap-2">
            <h2 className="text-2xl font-extrabold text-foreground tracking-tight">
              {project.title}
            </h2>
            <Badge
              variant="outline"
              className={`text-xs uppercase font-mono px-2.5 py-0.5 ${
                isCompleted
                  ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/30"
                  : isChangesRequested
                  ? "bg-amber-500/10 text-amber-500 border-amber-500/30"
                  : isSubmitted
                  ? "bg-blue-500/10 text-blue-500 border-blue-500/30"
                  : "bg-primary/10 text-primary border-primary/30"
              }`}
            >
              {project.status.replace("_", " ")}
            </Badge>
          </div>

          <p className="text-xs text-muted-foreground">
            Discipline: <span className="font-medium text-foreground">{template?.disciplineCategory || project.branchSlug}</span>
            {template?.estimatedEffort && ` • Estimated Effort: ${template.estimatedEffort}`}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          {!isCompleted && !isSubmitted && (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={handleSaveAll}
                disabled={saving || submitting}
                className="bg-card/40 border-border/50"
              >
                <Save className="h-3.5 w-3.5 mr-1.5" />
                {saving ? "Saving..." : "Save Progress"}
              </Button>
              <Button
                variant="hero"
                size="sm"
                onClick={handleSubmit}
                disabled={saving || submitting}
                className="glow-primary"
              >
                <Send className="h-3.5 w-3.5 mr-1.5" />
                {submitting ? "Evaluating..." : "Submit for Rubric Evaluation"}
              </Button>
            </>
          )}

          {isCompleted && onViewPortfolio && (
            <Button variant="hero" size="sm" onClick={onViewPortfolio} className="glow-primary">
              <Award className="h-3.5 w-3.5 mr-1.5" />
              View in Evidence Portfolio
            </Button>
          )}
        </div>
      </div>

      {/* Progress Bar Header */}
      <div className="glass p-5 rounded-2xl border border-border/40 space-y-2">
        <div className="flex items-center justify-between text-xs">
          <span className="font-semibold text-foreground flex items-center gap-1.5">
            <Layers className="h-4 w-4 text-primary" />
            Milestone Progress: {completedMilestones} of {totalMilestones} Completed
          </span>
          <span className="font-bold text-primary">{progressPercent}%</span>
        </div>
        <div className="w-full h-2.5 rounded-full bg-background/60 overflow-hidden p-0.5 border border-border/40">
          <motion.div
            className="h-full rounded-full bg-gradient-to-r from-primary to-accent"
            initial={{ width: 0 }}
            animate={{ width: `${progressPercent}%` }}
            transition={{ duration: 0.5, ease: "easeOut" }}
          />
        </div>
      </div>

      {/* Rubric Evaluation Feedback Banner */}
      {project.evaluation && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className={`p-6 rounded-2xl border ${
            isCompleted
              ? "bg-emerald-500/5 border-emerald-500/30 text-emerald-950 dark:text-emerald-100"
              : isChangesRequested
              ? "bg-amber-500/5 border-amber-500/30 text-amber-950 dark:text-amber-100"
              : "bg-blue-500/5 border-blue-500/30"
          }`}
        >
          <div className="flex items-start gap-4">
            {isCompleted ? (
              <FileCheck className="h-6 w-6 text-emerald-500 shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="h-6 w-6 text-amber-500 shrink-0 mt-0.5" />
            )}
            <div className="space-y-3 flex-1">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <h4 className="text-base font-bold text-foreground">
                  {isCompleted
                    ? `Rubric Evaluation Passed (${project.evaluation.percentScore}%)`
                    : `Revision Requested (${project.evaluation.percentScore}% / 70% required)`}
                </h4>
                <Badge variant="outline" className="text-xs font-mono w-fit">
                  Provenance: {project.evaluation.provenance || "RUBRIC_EVALUATED"}
                </Badge>
              </div>

              <p className="text-xs text-muted-foreground leading-relaxed">
                {project.evaluation.overallFeedback || project.evaluation.feedbackSummary}
              </p>

              {project.evaluation.missingDeliverables && project.evaluation.missingDeliverables.length > 0 && (
                <div className="p-3 rounded-xl bg-destructive/10 border border-destructive/20 text-xs">
                  <span className="font-semibold text-destructive">Missing Required Deliverables:</span>
                  <ul className="list-disc list-inside mt-1 space-y-0.5 text-muted-foreground">
                    {project.evaluation.missingDeliverables.map((item, idx) => (
                      <li key={idx}>{item}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Rubric Dimension Scores Breakdown */}
              {(project.evaluation.rubricFeedback || project.evaluation.rubricBreakdown) && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-2">
                  {(project.evaluation.rubricFeedback || project.evaluation.rubricBreakdown || []).map((dim) => (
                    <div
                      key={dim.dimensionKey}
                      className="p-3 rounded-xl bg-card/40 border border-border/30 text-xs flex flex-col justify-between"
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-semibold text-foreground">{dim.dimensionName}</span>
                        <span className="font-bold text-primary">
                          {dim.score}/{dim.maxScore}
                        </span>
                      </div>
                      <p className="text-[11px] text-muted-foreground leading-snug">{dim.feedback}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </motion.div>
      )}

      {/* Structured Milestones Progression */}
      <div className="space-y-4">
        <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
          <Layers className="h-5 w-5 text-primary" />
          Milestones & Step-by-Step Execution
        </h3>

        <div className="space-y-3">
          {(project.milestoneProgress || []).map((milestone, idx) => {
            const isExpanded = expandedMilestone === milestone.milestoneId;
            const isMilestoneCompleted = milestone.completed || milestone.status === "completed";
            return (
              <div
                key={milestone.milestoneId}
                className="glass rounded-2xl p-5 border border-border/50 transition-all hover:border-primary/30"
              >
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <button
                      disabled={isCompleted || isSubmitted}
                      onClick={() =>
                        onUpdateMilestone(
                          milestone.milestoneId,
                          isMilestoneCompleted ? "pending" : "completed",
                          milestoneNotes[milestone.milestoneId] || ""
                        )
                      }
                      className={`w-7 h-7 rounded-full flex items-center justify-center transition-all ${
                        isMilestoneCompleted
                          ? "bg-emerald-500 text-white shadow-sm shadow-emerald-500/30"
                          : "border-2 border-border/80 hover:border-primary text-muted-foreground"
                      }`}
                    >
                      {isMilestoneCompleted ? (
                        <CheckCircle2 className="h-4 w-4" />
                      ) : (
                        <span className="text-xs font-bold">{idx + 1}</span>
                      )}
                    </button>
                    <div>
                      <h4
                        className={`text-sm font-bold ${
                          isMilestoneCompleted ? "line-through text-muted-foreground" : "text-foreground"
                        }`}
                      >
                        {milestone.title}
                      </h4>
                      {milestone.notes && (
                        <p className="text-[11px] text-muted-foreground mt-0.5 line-clamp-1">
                          Notes: {milestone.notes}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-xs h-8 px-2 text-muted-foreground"
                      onClick={() =>
                        setExpandedMilestone(isExpanded ? null : milestone.milestoneId)
                      }
                    >
                      {isExpanded ? "Collapse" : "Add Notes"}
                      {isExpanded ? (
                        <ChevronUp className="h-3.5 w-3.5 ml-1" />
                      ) : (
                        <ChevronDown className="h-3.5 w-3.5 ml-1" />
                      )}
                    </Button>
                  </div>
                </div>

                {isExpanded && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    className="mt-4 pt-3 border-t border-border/30 space-y-3"
                  >
                    <label className="text-xs font-medium text-foreground">
                      Engineering / Process Notes for Milestone {idx + 1}:
                    </label>
                    <Textarea
                      rows={2}
                      placeholder="Document calculations, design decisions, or references used in this milestone..."
                      value={milestoneNotes[milestone.milestoneId] || ""}
                      onChange={(e) =>
                        setMilestoneNotes((prev) => ({
                          ...prev,
                          [milestone.milestoneId]: e.target.value,
                        }))
                      }
                      className="text-xs bg-background/50 border-border/40"
                    />
                    <div className="flex justify-end">
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-xs h-7"
                        onClick={() =>
                          onUpdateMilestone(
                            milestone.milestoneId,
                            milestone.status || "in_progress",
                            milestoneNotes[milestone.milestoneId] || ""
                          )
                        }
                      >
                        Save Milestone Notes
                      </Button>
                    </div>
                  </motion.div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Deliverables & Evidence Submission */}
      <div className="space-y-4">
        <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
          <FileText className="h-5 w-5 text-primary" />
          Project Deliverables & Artifact Evidence
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {(template?.deliverables || project.deliverables || []).map((deliv) => {
            const key = deliv.key || deliv.deliverableId || "";
            const current = deliverableInputs[key] || {};
            return (
              <div
                key={key}
                className="glass rounded-2xl p-5 border border-border/50 flex flex-col justify-between space-y-3"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <span className="font-bold text-sm text-foreground">{deliv.label || deliv.title || key}</span>
                    {deliv.required && (
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-destructive/10 text-destructive border border-destructive/20">
                        Required
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mb-3">{deliv.description || `Submit ${deliv.type} evidence`}</p>

                  {deliv.type === "link" ? (
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-medium text-foreground flex items-center gap-1">
                        <LinkIcon className="h-3 w-3 text-primary" /> External Repository or Demo URL:
                      </label>
                      <Input
                        placeholder="https://github.com/... or cloud viewer link"
                        value={current.externalUrl || ""}
                        onChange={(e) => handleDeliverableChange(key, "externalUrl", e.target.value)}
                        disabled={isCompleted || isSubmitted}
                        className="text-xs bg-background/50 border-border/40"
                      />
                    </div>
                  ) : (
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-medium text-foreground flex items-center gap-1">
                        <FileText className="h-3 w-3 text-primary" /> Summary or Calculation Text:
                      </label>
                      <Textarea
                        rows={3}
                        placeholder="Enter deliverable text, calculation derivations, or description..."
                        value={current.content || ""}
                        onChange={(e) => handleDeliverableChange(key, "content", e.target.value)}
                        disabled={isCompleted || isSubmitted}
                        className="text-xs bg-background/50 border-border/40"
                      />
                    </div>
                  )}
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] text-muted-foreground">Artifact Notes / Captions:</label>
                  <Input
                    placeholder="e.g. Figure 1 assembly drawing revision B"
                    value={current.notes || ""}
                    onChange={(e) => handleDeliverableChange(key, "notes", e.target.value)}
                    disabled={isCompleted || isSubmitted}
                    className="text-[11px] h-7 bg-background/30 border-border/30"
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Written Explanations / Engineering Report */}
      <div className="glass p-6 rounded-2xl border border-border/50 space-y-3">
        <h3 className="text-base font-bold text-foreground flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-primary" />
          Overall Technical Summary & Engineering Rationale
        </h3>
        <p className="text-xs text-muted-foreground leading-relaxed">
          Provide a comprehensive written explanation describing your design choices, equations evaluated, trade-off justifications, and verification results. The evaluation rubric evaluates this for technical depth and reasoning quality.
        </p>
        <Textarea
          rows={5}
          placeholder="Detail your engineering decisions, materials chosen, formulas applied (e.g. stress factors, mass balance, financial ratios), and key insights..."
          value={writtenExplanations}
          onChange={(e) => setWrittenExplanations(e.target.value)}
          disabled={isCompleted || isSubmitted}
          className="text-xs bg-background/50 border-border/40 leading-relaxed font-sans"
        />
        <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-1">
          <span>{writtenExplanations.length} characters (150+ recommended for full rubric points)</span>
          {!isCompleted && !isSubmitted && (
            <Button size="sm" variant="outline" onClick={handleSaveAll} disabled={saving} className="h-7 text-xs">
              Save Explanations
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};
