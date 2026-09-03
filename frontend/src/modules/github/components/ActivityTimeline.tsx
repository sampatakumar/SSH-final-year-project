import React from "react";
import {
  Activity,
  GitCommit,
  GitPullRequest,
  PlusCircle,
  Star,
  GitFork,
  AlertCircle,
  Tag,
} from "lucide-react";

export interface ActivityTimelineProps {
  recentEvents?: any[];
}

export const ActivityTimeline: React.FC<ActivityTimelineProps> = ({ recentEvents = [] }) => {
  if (!recentEvents || recentEvents.length === 0) {
    return (
      <div className="bg-card rounded-2xl border border-border/50 p-5 shadow-xs">
        <div className="flex items-center gap-2 border-b border-border/40 pb-3 mb-3">
          <Activity className="h-4 w-4 text-primary" />
          <h3 className="font-bold text-sm text-foreground">Recent Public Activity</h3>
        </div>
        <p className="text-xs text-muted-foreground italic">
          No public events recorded in the last 30 GitHub activities.
        </p>
      </div>
    );
  }

  const formatRelativeTime = (dateStr: string) => {
    const diffMs = Date.now() - new Date(dateStr).getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    if (diffHours < 1) return "Just now";
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays === 1) return "Yesterday";
    return `${diffDays}d ago`;
  };

  const getEventIcon = (type: string) => {
    switch (type) {
      case "PushEvent":
        return <GitCommit className="h-3.5 w-3.5 text-emerald-500" />;
      case "PullRequestEvent":
        return <GitPullRequest className="h-3.5 w-3.5 text-purple-500" />;
      case "CreateEvent":
        return <PlusCircle className="h-3.5 w-3.5 text-blue-500" />;
      case "WatchEvent":
        return <Star className="h-3.5 w-3.5 text-amber-500" />;
      case "ForkEvent":
        return <GitFork className="h-3.5 w-3.5 text-indigo-500" />;
      case "IssuesEvent":
        return <AlertCircle className="h-3.5 w-3.5 text-orange-500" />;
      default:
        return <Tag className="h-3.5 w-3.5 text-muted-foreground" />;
    }
  };

  return (
    <div className="bg-card rounded-2xl border border-border/50 p-5 shadow-xs space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border/40 pb-3">
        <div className="flex items-center gap-2">
          <Activity className="h-4 w-4 text-primary" />
          <h3 className="font-bold text-sm text-foreground">
            Activity Timeline (Last {recentEvents.length} Events)
          </h3>
        </div>
        <span className="text-[11px] text-muted-foreground font-mono">Live Stream</span>
      </div>

      {/* Events List */}
      <div className="space-y-2.5 max-h-80 overflow-y-auto custom-scrollbar pr-1">
        {recentEvents.map((evt, idx) => {
          const repoName = evt.repo?.name || "Repository";
          const commitCount = evt.payload?.commits?.length || 0;
          const time = evt.created_at ? formatRelativeTime(evt.created_at) : "";

          return (
            <div
              key={idx}
              className="flex items-start justify-between gap-3 p-2.5 rounded-xl bg-background/60 border border-border/40 text-xs"
            >
              <div className="flex items-start gap-2.5 min-w-0">
                <div className="p-1.5 rounded-lg bg-muted shrink-0 mt-0.5">
                  {getEventIcon(evt.type)}
                </div>

                <div className="space-y-0.5 truncate">
                  <div className="font-bold text-foreground truncate">{repoName}</div>
                  <div className="text-muted-foreground text-[11px]">
                    {evt.type === "PushEvent"
                      ? `Pushed ${commitCount} commit${commitCount > 1 ? "s" : ""}`
                      : evt.type.replace("Event", "")}
                  </div>
                </div>
              </div>

              <span className="text-[10px] text-muted-foreground font-mono shrink-0">
                {time}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ActivityTimeline;
