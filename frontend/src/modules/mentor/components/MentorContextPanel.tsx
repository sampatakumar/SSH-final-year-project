import {
  Briefcase,
  Sparkles,
  Target,
  GitBranch,
  GraduationCap,
  RefreshCw,
  Award,
  AlertTriangle,
  FileText,
  BookOpen,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import type { MentorContextData } from "../types/smartMentor.types";

interface MentorContextPanelProps {
  context: MentorContextData | null;
  isLoading: boolean;
  onRefresh: () => void;
}

export const MentorContextPanel: React.FC<MentorContextPanelProps> = ({
  context,
  isLoading,
  onRefresh,
}) => {
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

  const { career, skills, skillGaps, github, learning } = context;

  return (
    <aside className="w-full lg:w-80 space-y-4 shrink-0">
      {/* Header with Refresh */}
      <div className="p-4 rounded-2xl bg-surface border border-border/50 shadow-neo-raised space-y-4">
        <div className="flex items-center justify-between gap-2 border-b border-border/30 pb-3">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            <h3 className="text-xs font-black uppercase tracking-wider text-foreground">
              Live Profile Signals
            </h3>
          </div>

          <Button
            size="sm"
            variant="ghost"
            onClick={onRefresh}
            disabled={isLoading}
            className="h-7 w-7 p-0 rounded-lg text-muted-foreground hover:text-foreground"
            title="Refresh Live Context"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? "animate-spin text-primary" : ""}`} />
          </Button>
        </div>

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
      </div>
    </aside>
  );
};
