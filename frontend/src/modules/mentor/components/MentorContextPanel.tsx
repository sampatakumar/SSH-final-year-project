import React, { useEffect } from "react";
import {
  Briefcase,
  Sparkles,
  Target,
  GitBranch,
  GraduationCap,
  RefreshCw,
  AlertTriangle,
  BookOpen,
  X,
  Zap,
  CheckCircle2,
  Award,
  Brain,
  ShieldCheck,
  Layers,
  ArrowRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { MentorContextData } from "../types/smartMentor.types";

interface MentorContextPanelProps {
  context: MentorContextData | null;
  isLoading: boolean;
  onRefresh: () => void;
  isOpen?: boolean;
  onClose?: () => void;
}

export const MentorContextPanel: React.FC<MentorContextPanelProps> = ({
  context,
  isLoading,
  onRefresh,
  isOpen = true,
  onClose,
}) => {
  // Support Escape-key dismissal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen && onClose) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  const renderContent = () => {
    if (!context) {
      return (
        <div className="p-4 rounded-2xl bg-surface/80 border border-border/40 space-y-4 shadow-neo-raised-sm animate-pulse">
          <div className="h-4 w-32 bg-muted/60 rounded"></div>
          <div className="space-y-2">
            <div className="h-12 bg-muted/40 rounded-xl"></div>
            <div className="h-12 bg-muted/40 rounded-xl"></div>
            <div className="h-12 bg-muted/40 rounded-xl"></div>
          </div>
        </div>
      );
    }

    const { career, skillGaps, github, learning } = context;

    return (
      <div className="space-y-4 pb-6">
        {/* Career & Readiness */}
        <div className="space-y-2">
          <span className="text-[10px] font-bold text-muted-foreground uppercase flex items-center gap-1">
            <Briefcase className="h-3 w-3 text-primary" />
            Target Career
          </span>
          <div className="p-3 rounded-xl bg-surface/80 border border-border/40 space-y-2 shadow-neo-raised-sm">
            <div className="flex items-center justify-between">
              <p className="text-xs font-bold text-foreground line-clamp-1">{career.targetRole}</p>
              <span className="text-xs font-black text-primary px-2 py-0.5 rounded-md bg-primary/10 border border-primary/20">
                {career.readinessScore}%
              </span>
            </div>
            <div className="w-full h-1.5 rounded-full bg-muted overflow-hidden">
              <div
                className="h-full bg-primary rounded-full transition-all duration-500"
                style={{ width: `${career.readinessScore}%` }}
              />
            </div>
          </div>
        </div>

        {/* Academic Discipline */}
        <div className="space-y-2">
          <span className="text-[10px] font-bold text-muted-foreground uppercase flex items-center gap-1">
            <GraduationCap className="h-3 w-3 text-primary" />
            Academic Discipline
          </span>
          {career.academic?.isConfigured ? (
            <div className="p-3 rounded-xl bg-surface/80 border border-border/40 space-y-1.5 shadow-neo-raised-sm">
              <div className="flex items-center justify-between gap-1">
                <span className="text-xs font-bold text-foreground line-clamp-1">
                  {career.academic.branchName || career.academic.degreeName || "Engineering Track"}
                </span>
                {(career.academic.currentYear || career.academic.currentSemester) && (
                  <span className="text-[10px] font-black text-primary px-1.5 py-0.5 rounded bg-primary/10 border border-primary/20 shrink-0">
                    {career.academic.currentYear ? `Yr ${career.academic.currentYear}` : `Sem ${career.academic.currentSemester}`}
                  </span>
                )}
              </div>
              {career.academic.degreeName && (
                <p className="text-[11px] text-muted-foreground font-medium line-clamp-1">
                  {career.academic.degreeName}
                  {career.academic.specializationName ? ` • ${career.academic.specializationName}` : ""}
                </p>
              )}
              {career.academic.institution && (
                <p className="text-[10px] text-muted-foreground/80 line-clamp-1">
                  {career.academic.institution}
                </p>
              )}
            </div>
          ) : (
            <div className="p-2.5 rounded-xl bg-surface/50 border border-border/30 text-center">
              <p className="text-[11px] text-muted-foreground italic">Academic profile not configured</p>
            </div>
          )}
        </div>

        {/* Priority Skill Gap */}
        <div className="space-y-2">
          <span className="text-[10px] font-bold text-muted-foreground uppercase flex items-center gap-1">
            <Target className="h-3 w-3 text-warning" />
            Active Skill Gaps ({skillGaps.length})
          </span>
          {skillGaps.length > 0 ? (
            <div className="p-3 rounded-xl bg-surface/80 border border-border/40 space-y-1 shadow-neo-raised-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-foreground">{skillGaps[0].skill}</span>
                <span className="text-[10px] font-bold uppercase px-1.5 py-0.5 rounded bg-warning/15 text-warning border border-warning/30">
                  {skillGaps[0].priority}
                </span>
              </div>
              <p className="text-[11px] text-muted-foreground font-medium line-clamp-1">
                {skillGaps[0].reason}
              </p>
            </div>
          ) : (
            <p className="text-xs text-muted-foreground italic">No critical gaps recorded</p>
          )}
        </div>

        {/* GitHub Hygiene Card */}
        <div className="space-y-2">
          <span className="text-[10px] font-bold text-muted-foreground uppercase flex items-center gap-1">
            <GitBranch className="h-3 w-3 text-primary" />
            GitHub Repository Status
          </span>
          <div className="p-3 rounded-xl bg-surface/80 border border-border/40 space-y-2 shadow-neo-raised-sm">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground font-medium">Repositories:</span>
              <span className="font-bold text-foreground">{github.repositoryCount}</span>
            </div>
            {github.repositoriesWithoutDescription > 0 && (
              <div className="flex items-center gap-1.5 text-[11px] text-warning font-medium">
                <AlertTriangle className="h-3 w-3 shrink-0" />
                <span>{github.repositoriesWithoutDescription} missing descriptions</span>
              </div>
            )}
            {github.repositoriesWithoutReadme > 0 && (
              <div className="flex items-center gap-1.5 text-[11px] text-warning font-medium">
                <AlertTriangle className="h-3 w-3 shrink-0" />
                <span>{github.repositoriesWithoutReadme} missing README files</span>
              </div>
            )}
          </div>
        </div>

        {/* EduTube Activity */}
        <div className="space-y-2">
          <span className="text-[10px] font-bold text-muted-foreground uppercase flex items-center gap-1">
            <BookOpen className="h-3 w-3 text-primary" />
            EduTube Learning
          </span>
          <div className="grid grid-cols-2 gap-2">
            <div className="p-2.5 rounded-xl bg-surface/80 border border-border/40 text-center shadow-neo-raised-sm">
              <p className="text-xs font-black text-foreground">{learning.videosWatched}</p>
              <p className="text-[10px] text-muted-foreground font-medium">Watched</p>
            </div>
            <div className="p-2.5 rounded-xl bg-surface/80 border border-border/40 text-center shadow-neo-raised-sm">
              <p className="text-xs font-black text-success">{learning.completedVideos}</p>
              <p className="text-[10px] text-muted-foreground font-medium">Completed</p>
            </div>
          </div>
        </div>

        {/* Adaptive Learning Loop & Demonstrated Competency */}
        <div className="space-y-2">
          <span className="text-[10px] font-bold text-muted-foreground uppercase flex items-center gap-1">
            <Zap className="h-3 w-3 text-primary" />
            Adaptive Learning Loop
          </span>
          <div className="p-3 rounded-xl bg-surface/80 border border-border/40 space-y-2 shadow-neo-raised-sm">
            <div className="space-y-1">
              <span className="text-[10px] font-black uppercase text-primary tracking-wider">
                Current Objective
              </span>
              <p className="text-xs font-semibold text-foreground leading-snug">
                {context.adaptivePlan?.currentObjective || (skillGaps.length > 0 ? `Master ${skillGaps[0].skill} fundamentals and pass sandbox challenge` : `Reinforce full-stack competencies`)}
              </p>
            </div>

            {context.adaptivePlan?.nextAction && (
              <div className="pt-2 border-t border-border/30 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase">
                    Next Recommended Action
                  </span>
                  <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-primary/10 text-primary border border-primary/20 capitalize">
                    {context.adaptivePlan.nextAction.priority}
                  </span>
                </div>
                <p className="text-[11px] text-foreground/90 font-medium">
                  {context.adaptivePlan.nextAction.practicalAction}
                </p>
                <p className="text-[10px] text-muted-foreground italic">
                  Criteria: {context.adaptivePlan.nextAction.completionCriteria}
                </p>
              </div>
            )}

            <div className="pt-1.5 border-t border-border/30 flex items-center justify-between text-[11px]">
              <span className="text-muted-foreground font-medium flex items-center gap-1">
                <CheckCircle2 className="h-3.5 w-3.5 text-success" />
                Verified in Sandbox:
              </span>
              <span className="font-black text-foreground">
                {context.coding?.passedCount || context.adaptivePlan?.verifiedCompetenciesCount || 0} passed
              </span>
            </div>
          </div>
        </div>

        {/* Phase 41: Unified Next Action */}
        {context.unifiedNextActions && context.unifiedNextActions.length > 0 && (
          <div className="space-y-2">
            <span className="text-[10px] font-bold text-muted-foreground uppercase flex items-center gap-1">
              <Sparkles className="h-3 w-3 text-primary" />
              Prioritized Next Action
            </span>
            <div className="p-3 rounded-xl bg-primary/5 border border-primary/20 space-y-2 shadow-neo-raised-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-foreground line-clamp-1">
                  {context.unifiedNextActions[0].title}
                </span>
                <span className="text-[10px] font-bold uppercase px-1.5 py-0.5 rounded bg-primary/20 text-primary border border-primary/30">
                  {context.unifiedNextActions[0].priority}
                </span>
              </div>
              <p className="text-[11px] text-muted-foreground font-medium">
                {context.unifiedNextActions[0].reason}
              </p>
              <div className="pt-1 flex items-center justify-between text-[10px] text-muted-foreground">
                <span>~{context.unifiedNextActions[0].estimatedMinutes} mins • {context.unifiedNextActions[0].module}</span>
                {context.unifiedNextActions[0].actionUrl && (
                  <a
                    href={context.unifiedNextActions[0].actionUrl}
                    className="inline-flex items-center gap-1 text-primary font-bold hover:underline"
                  >
                    Act Now <ArrowRight className="h-2.5 w-2.5" />
                  </a>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Phase 41: Verified Competency Badges */}
        <div className="space-y-2">
          <span className="text-[10px] font-bold text-muted-foreground uppercase flex items-center gap-1">
            <Award className="h-3 w-3 text-warning" />
            Verified Competency Badges ({context.earnedBadges?.length || 0})
          </span>
          <div className="p-3 rounded-xl bg-surface/80 border border-border/40 space-y-2 shadow-neo-raised-sm">
            {context.earnedBadges && context.earnedBadges.length > 0 ? (
              <div className="space-y-1.5">
                {context.earnedBadges.slice(0, 3).map((b, idx) => (
                  <div key={b.id || b.badgeId || idx} className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-foreground flex items-center gap-1.5 line-clamp-1">
                      <ShieldCheck className="h-3.5 w-3.5 text-warning shrink-0" />
                      {b.competencyName}
                    </span>
                    <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-warning/10 text-warning border border-warning/20">
                      Verified
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-[11px] text-muted-foreground italic">
                No badges earned yet. Complete sandbox tests and checkpoint quizzes to qualify.
              </p>
            )}
          </div>
        </div>

        {/* Phase 41: Spaced Retention Health */}
        {context.retentionHealth && (
          <div className="space-y-2">
            <span className="text-[10px] font-bold text-muted-foreground uppercase flex items-center gap-1">
              <Brain className="h-3 w-3 text-primary" />
              Memory Retention Health
            </span>
            <div className="grid grid-cols-3 gap-1.5">
              <div className="p-2 rounded-xl bg-surface/80 border border-border/40 text-center shadow-neo-raised-sm">
                <p className={cn("text-xs font-black", context.retentionHealth.revisionsDueToday > 0 ? "text-warning" : "text-foreground")}>
                  {context.retentionHealth.revisionsDueToday}
                </p>
                <p className="text-[9px] text-muted-foreground font-medium">Due Today</p>
              </div>
              <div className="p-2 rounded-xl bg-surface/80 border border-border/40 text-center shadow-neo-raised-sm">
                <p className="text-xs font-black text-primary">{context.retentionHealth.streak}</p>
                <p className="text-[9px] text-muted-foreground font-medium">Streak</p>
              </div>
              <div className="p-2 rounded-xl bg-surface/80 border border-border/40 text-center shadow-neo-raised-sm">
                <p className="text-xs font-black text-success">{context.retentionHealth.masteredCards}</p>
                <p className="text-[9px] text-muted-foreground font-medium">Mastered</p>
              </div>
            </div>
          </div>
        )}

        {/* Phase 41: Evidence Quality Grounding */}
        {context.evidenceTiers && (
          <div className="space-y-2">
            <span className="text-[10px] font-bold text-muted-foreground uppercase flex items-center gap-1">
              <Layers className="h-3 w-3 text-primary" />
              Evidence Quality Grounding
            </span>
            <div className="p-2.5 rounded-xl bg-surface/80 border border-border/40 space-y-1.5 shadow-neo-raised-sm text-xs">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground flex items-center gap-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-success"></span>
                  Verified Empirical:
                </span>
                <span className="font-bold text-foreground">{context.evidenceTiers.verified?.length || 0} skills</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground flex items-center gap-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-warning"></span>
                  Inferred Signals:
                </span>
                <span className="font-bold text-foreground">{context.evidenceTiers.inferred?.length || 0} skills</span>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-xs z-40 transition-opacity duration-300 animate-in fade-in"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Slide-out Drawer */}
      <aside
        id="live-profile-signals-drawer"
        aria-label="Live Profile Signals Drawer"
        className={cn(
          "fixed inset-y-0 right-0 z-50 flex flex-col bg-background/95 backdrop-blur-2xl border-l border-border/50 shadow-2xl transition-transform duration-300 ease-in-out w-full sm:w-[380px] md:w-[400px] lg:w-[420px] max-w-full select-none",
          isOpen ? "translate-x-0 pointer-events-auto" : "translate-x-full pointer-events-none"
        )}
      >
        {/* Drawer Header */}
        <div className="flex items-center justify-between gap-3 p-4 sm:px-5 border-b border-border/30 bg-surface/80 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-xl bg-primary/10 text-primary border border-primary/20 flex items-center justify-center shrink-0 shadow-neo-raised-sm">
              <Sparkles className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-xs font-black uppercase tracking-wider text-foreground">
                Live Profile Signals
              </h3>
              <p className="text-[10px] text-muted-foreground font-medium">
                Real-time grounding for AI Mentor
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <Button
              size="sm"
              variant="ghost"
              onClick={onRefresh}
              disabled={isLoading}
              className="h-8 w-8 p-0 rounded-lg text-muted-foreground hover:text-foreground shadow-neo-raised-sm"
              title="Refresh Live Context"
              aria-label="Refresh profile signals"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? "animate-spin text-primary" : ""}`} />
            </Button>

            {onClose && (
              <Button
                size="sm"
                variant="ghost"
                onClick={onClose}
                className="h-8 w-8 p-0 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors shadow-neo-raised-sm"
                title="Close Drawer (Esc)"
                aria-label="Close profile signals drawer"
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 custom-scrollbar">
          {renderContent()}
        </div>
      </aside>
    </>
  );
};
