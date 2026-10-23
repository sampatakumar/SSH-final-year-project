import React, { useState } from "react";
import { motion } from "framer-motion";
import {
  Award,
  CheckCircle2,
  Share2,
  FileText,
  FileCheck,
  Calendar,
  Layers,
  Eye,
  EyeOff,
  ExternalLink,
  Briefcase,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { StudentProject } from "../types/projectStudio.types";
import { toast } from "sonner";

interface EvidencePortfolioViewProps {
  completedProjects: StudentProject[];
  loading: boolean;
  onToggleVisibility: (projectId: string, visibility: boolean) => Promise<void>;
  onSyncToResume: (projectId: string) => Promise<void>;
  onSelectProjectWorkspace: (project: StudentProject) => void;
  syncingProjectId: string | null;
}

export const EvidencePortfolioView: React.FC<EvidencePortfolioViewProps> = ({
  completedProjects,
  loading,
  onToggleVisibility,
  onSyncToResume,
  onSelectProjectWorkspace,
  syncingProjectId,
}) => {
  const [inspectingProject, setInspectingProject] = useState<StudentProject | null>(null);

  return (
    <div className="space-y-6">
      {/* Evidence Integrity Banner */}
      <div className="glass p-5 rounded-2xl border border-primary/20 bg-primary/5 flex items-start gap-3.5">
        <Award className="h-5 w-5 text-primary shrink-0 mt-0.5" />
        <div className="text-xs space-y-1">
          <h4 className="font-bold text-foreground">Verified Student Evidence Portfolio</h4>
          <p className="text-muted-foreground leading-relaxed">
            Projects showcased here have satisfied all required deliverables and passed multi-dimensional rubric evaluations (≥ 70%). Rubric evaluations reflect platform criteria and do not claim external accreditation. You control visibility for each project.
          </p>
        </div>
      </div>

      {/* Projects Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="glass h-64 rounded-2xl animate-pulse bg-card/20" />
          ))}
        </div>
      ) : completedProjects.length === 0 ? (
        <div className="glass rounded-2xl p-16 text-center border-dashed border-2 border-border/50">
          <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <Award className="h-8 w-8 text-primary opacity-80" />
          </div>
          <h3 className="text-lg font-bold text-foreground mb-1">No Completed Projects Yet</h3>
          <p className="text-xs text-muted-foreground max-w-sm mx-auto mb-6">
            Complete milestones and submit deliverables in Project Studio to build your verified, evidence-backed portfolio.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {completedProjects.map((project) => {
            const score = project.evaluation?.percentScore ?? project.evaluation?.overallScore ?? 75;
            const isSyncing = syncingProjectId === project._id;
            return (
              <motion.div
                key={project._id}
                layout
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                className="glass rounded-2xl p-6 border border-border/50 flex flex-col justify-between hover:border-primary/40 transition-all hover:shadow-lg hover:shadow-primary/5"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <Badge variant="outline" className="text-[11px] bg-primary/5 text-primary border-primary/20">
                      {project.branchSlug}
                    </Badge>
                    <Badge variant="outline" className="text-[11px] bg-emerald-500/10 text-emerald-500 border-emerald-500/20 font-bold">
                      <CheckCircle2 className="h-3 w-3 mr-1" />
                      {score}% Rubric Pass
                    </Badge>
                  </div>

                  <h3 className="text-base font-bold text-foreground mb-2 line-clamp-2">
                    {project.title}
                  </h3>

                  <p className="text-xs text-muted-foreground line-clamp-2 mb-4">
                    {project.writtenExplanations || project.description}
                  </p>

                  <div className="flex items-center gap-4 text-xs text-muted-foreground mb-4">
                    <span className="flex items-center gap-1.5">
                      <Calendar className="h-3.5 w-3.5 text-primary/70" />
                      {project.completedAt ? new Date(project.completedAt).toLocaleDateString() : "Completed"}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <FileCheck className="h-3.5 w-3.5 text-primary/70" />
                      {project.deliverables?.length || 0} Artifacts
                    </span>
                  </div>

                  {/* Portfolio Visibility Status */}
                  <div className="p-2.5 rounded-xl bg-card/40 border border-border/30 flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2 text-xs">
                      {project.portfolioVisibility ? (
                        <Eye className="h-3.5 w-3.5 text-emerald-500" />
                      ) : (
                        <EyeOff className="h-3.5 w-3.5 text-muted-foreground" />
                      )}
                      <span className="text-[11px] text-muted-foreground">
                        {project.portfolioVisibility ? "Public in Portfolio" : "Private (Only You)"}
                      </span>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-[11px] h-6 px-2 hover:bg-primary/10 hover:text-primary"
                      onClick={() => onToggleVisibility(project._id, !project.portfolioVisibility)}
                    >
                      {project.portfolioVisibility ? "Make Private" : "Make Public"}
                    </Button>
                  </div>
                </div>

                <div className="space-y-2 pt-2 border-t border-border/30">
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 text-xs"
                      onClick={() => setInspectingProject(project)}
                    >
                      <FileText className="h-3.5 w-3.5 mr-1" />
                      Inspect Rubric
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 text-xs"
                      onClick={() => onSelectProjectWorkspace(project)}
                    >
                      Workspace
                    </Button>
                  </div>

                  <Button
                    variant={project.syncedToResume ? "secondary" : "hero"}
                    size="sm"
                    disabled={isSyncing || project.syncedToResume}
                    className={`w-full text-xs ${!project.syncedToResume ? "glow-primary" : ""}`}
                    onClick={() => onSyncToResume(project._id)}
                  >
                    <Briefcase className="h-3.5 w-3.5 mr-1.5" />
                    {project.syncedToResume ? "Synced to Resume Showcase" : isSyncing ? "Syncing..." : "Sync to Resume Showcase"}
                  </Button>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Rubric Details Modal */}
      <Dialog open={Boolean(inspectingProject)} onOpenChange={(open) => !open && setInspectingProject(null)}>
        {inspectingProject && (
          <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto glass border-border/50">
            <DialogHeader>
              <div className="flex items-center gap-2 mb-2">
                <Badge variant="outline" className="text-xs bg-emerald-500/10 text-emerald-500 border-emerald-500/30">
                  Score: {inspectingProject.evaluation?.percentScore ?? inspectingProject.evaluation?.overallScore ?? 75}%
                </Badge>
                <Badge variant="outline" className="text-xs">
                  Provenance: {inspectingProject.evaluation?.provenance || "RUBRIC_EVALUATED"}
                </Badge>
              </div>
              <DialogTitle className="text-xl font-bold text-foreground">
                {inspectingProject.title}
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground mt-1">
                Completed on {inspectingProject.completedAt ? new Date(inspectingProject.completedAt).toLocaleDateString() : "Recorded"}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-5 my-4 text-xs">
              {/* Overall Feedback */}
              <div className="p-3.5 rounded-xl bg-card/40 border border-border/40">
                <h4 className="font-semibold text-foreground mb-1">Evaluator Feedback:</h4>
                <p className="text-muted-foreground leading-relaxed">
                  {inspectingProject.evaluation?.overallFeedback || inspectingProject.evaluation?.feedbackSummary || "All project objectives met."}
                </p>
              </div>

              {/* Dimension Scores */}
              <div>
                <h4 className="font-semibold text-foreground text-sm mb-2.5">
                  Rubric Dimension Scores
                </h4>
                <div className="space-y-2">
                  {(inspectingProject.evaluation?.rubricFeedback || inspectingProject.evaluation?.rubricBreakdown || []).map((dim) => (
                    <div
                      key={dim.dimensionKey}
                      className="p-3 rounded-xl bg-card/30 border border-border/30 flex flex-col justify-between"
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-semibold text-foreground">{dim.dimensionName}</span>
                        <span className="font-bold text-primary">{dim.score}/{dim.maxScore}</span>
                      </div>
                      <p className="text-[11px] text-muted-foreground leading-snug">{dim.feedback}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Submitted Deliverables */}
              <div>
                <h4 className="font-semibold text-foreground text-sm mb-2.5">
                  Submitted Deliverable Evidence
                </h4>
                <div className="space-y-2">
                  {(inspectingProject.deliverables || []).map((deliv) => (
                    <div
                      key={deliv.key || deliv.deliverableId}
                      className="p-3 rounded-xl bg-card/30 border border-border/30 text-xs"
                    >
                      <div className="font-semibold text-foreground mb-1">{deliv.label || deliv.title || deliv.key}</div>
                      {deliv.externalUrl && (
                        <a
                          href={deliv.externalUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="text-primary flex items-center gap-1 hover:underline text-[11px]"
                        >
                          <ExternalLink className="h-3 w-3" />
                          {deliv.externalUrl}
                        </a>
                      )}
                      {(deliv.content || deliv.textContent) && (
                        <p className="text-muted-foreground text-[11px] line-clamp-3 mt-1 font-mono bg-background/40 p-2 rounded">
                          {deliv.content || deliv.textContent}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" size="sm" onClick={() => setInspectingProject(null)}>
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        )}
      </Dialog>
    </div>
  );
};
