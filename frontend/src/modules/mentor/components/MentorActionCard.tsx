import React from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowRight,
  Clock,
  GitBranch,
  Target,
  GraduationCap,
  FileText,
  Code2,
  Briefcase,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import type { MentorAction } from "../types/smartMentor.types";

interface MentorActionCardProps {
  action: MentorAction;
}

export const MentorActionCard: React.FC<MentorActionCardProps> = ({ action }) => {
  const navigate = useNavigate();

  const getPriorityStyle = (priority: string) => {
    switch (priority.toLowerCase()) {
      case "critical":
        return "bg-destructive/15 text-destructive border-destructive/30";
      case "high":
        return "bg-warning/15 text-warning border-warning/30";
      case "medium":
        return "bg-primary/15 text-primary border-primary/30";
      default:
        return "bg-muted text-muted-foreground border-border/40";
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "github":
        return <GitBranch className="h-3.5 w-3.5 text-primary" />;
      case "skills":
      case "learning":
        return <Target className="h-3.5 w-3.5 text-accent" />;
      case "edutube":
        return <GraduationCap className="h-3.5 w-3.5 text-primary" />;
      case "resume":
        return <FileText className="h-3.5 w-3.5 text-success" />;
      case "project":
        return <Code2 className="h-3.5 w-3.5 text-secondary-foreground" />;
      default:
        return <Briefcase className="h-3.5 w-3.5 text-muted-foreground" />;
    }
  };

  const getTargetRoute = (): string => {
    if (action.route?.trim()) return action.route;
    switch (action.category) {
      case "github":
        return "/dashboard/github";
      case "skills":
        return "/dashboard/gaps";
      case "learning":
      case "edutube":
        return "/dashboard/edutube";
      case "resume":
        return "/dashboard/resumes";
      case "project":
        return "/dashboard/projects";
      case "career":
        return "/dashboard/roadmap";
      default:
        return "/dashboard";
    }
  };

  const getButtonLabel = (): string => {
    switch (action.category) {
      case "github":
        return "Review GitHub";
      case "skills":
        return "Open Skill Gaps";
      case "edutube":
      case "learning":
        return "Open EduTube";
      case "resume":
        return "Open Resume AI";
      case "project":
        return "View Projects";
      default:
        return "Take Action";
    }
  };

  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3 rounded-xl bg-surface border border-border/50 hover:border-primary/40 shadow-neo-raised-sm hover:shadow-neo-raised transition-all group">
      <div className="flex items-start gap-2.5 min-w-0">
        <div className="p-1.5 rounded-lg bg-surface/80 border border-border/40 shrink-0 mt-0.5">
          {getCategoryIcon(action.category)}
        </div>
        <div className="space-y-1 min-w-0">
          <p className="text-xs font-bold text-foreground group-hover:text-primary transition-colors line-clamp-1">
            {action.title}
          </p>
          <div className="flex items-center gap-2 flex-wrap text-[10px]">
            <span
              className={`px-2 py-0.5 rounded-md font-bold uppercase border ${getPriorityStyle(
                action.priority
              )}`}
            >
              {action.priority}
            </span>
            {action.estimatedMinutes && (
              <span className="flex items-center gap-1 text-muted-foreground font-medium">
                <Clock className="h-3 w-3" />
                {action.estimatedMinutes} mins
              </span>
            )}
          </div>
        </div>
      </div>

      <Button
        size="sm"
        variant="outline"
        onClick={() => navigate(getTargetRoute())}
        className="text-xs font-bold gap-1.5 h-7 px-3 rounded-lg border-border/60 hover:border-primary/40 hover:bg-primary/10 hover:text-primary transition-all shrink-0 self-end sm:self-center"
      >
        <span>{getButtonLabel()}</span>
        <ArrowRight className="h-3 w-3" />
      </Button>
    </div>
  );
};
