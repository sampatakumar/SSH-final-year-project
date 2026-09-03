import React from "react";
import {
  ExternalLink,
  MapPin,
  Building,
  Globe,
  Calendar,
  Users,
  Star,
  GitFork,
  Compass,
  GitCompare,
  Download,
  FolderGit2,
  RefreshCw,
  CheckCircle2,
  Clock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import type { GitHubAnalysisData } from "../types/github.types";

export interface UserOverviewProps {
  data: GitHubAnalysisData;
  isConnected?: boolean;
  isSyncing?: boolean;
  lastSyncedAt?: string | null;
  onSync?: () => void;
  onOpenMentor?: () => void;
  onOpenCompare: () => void;
  onOpenExport: () => void;
}

export const UserOverview: React.FC<UserOverviewProps> = ({
  data,
  isConnected = false,
  isSyncing = false,
  lastSyncedAt,
  onSync,
  onOpenMentor,
  onOpenCompare,
  onOpenExport,
}) => {
  const { profile, aggregateStats } = data;

  const joinedYear = profile.createdAt
    ? new Date(profile.createdAt).getFullYear()
    : null;

  const formatLastSynced = (dateStr?: string | null) => {
    if (!dateStr) return null;
    try {
      const date = new Date(dateStr);
      const diffMinutes = Math.floor((Date.now() - date.getTime()) / (1000 * 60));
      if (diffMinutes < 1) return "Just now";
      if (diffMinutes < 60) return `${diffMinutes}m ago`;
      const diffHours = Math.floor(diffMinutes / 60);
      if (diffHours < 24) return `${diffHours}h ago`;
      return date.toLocaleDateString();
    } catch {
      return null;
    }
  };

  const formattedSyncTime = formatLastSynced(lastSyncedAt);

  return (
    <div className="bg-card rounded-2xl border border-border/50 p-6 shadow-sm">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        {/* User Info Block */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
          <img
            src={profile.avatarUrl}
            alt={profile.name || data.username}
            className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl border-2 border-primary/20 object-cover shadow-sm bg-muted shrink-0"
          />

          <div className="space-y-1.5 min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-2xl font-extrabold text-foreground tracking-tight truncate">
                {profile.name || data.username}
              </h2>
              <a
                href={`https://github.com/${data.username}`}
                target="_blank"
                rel="noreferrer"
                className="text-xs text-muted-foreground hover:text-primary transition-colors flex items-center gap-1 font-mono bg-muted/60 px-2 py-0.5 rounded-md"
              >
                @{data.username}
                <ExternalLink className="h-3 w-3" />
              </a>

              {isConnected ? (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-[10px] font-extrabold uppercase">
                  <CheckCircle2 className="h-3 w-3" />
                  GitHub Connected
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-[10px] font-medium">
                  Public Profile
                </span>
              )}
            </div>

            {profile.bio && (
              <p className="text-sm text-muted-foreground max-w-2xl leading-relaxed">
                {profile.bio}
              </p>
            )}

            {/* Meta Tags */}
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground pt-1">
              {profile.location && (
                <span className="flex items-center gap-1">
                  <MapPin className="h-3.5 w-3.5 text-primary/70" />
                  {profile.location}
                </span>
              )}
              {profile.company && (
                <span className="flex items-center gap-1">
                  <Building className="h-3.5 w-3.5 text-primary/70" />
                  {profile.company}
                </span>
              )}
              {profile.blog && (
                <a
                  href={profile.blog.startsWith("http") ? profile.blog : `https://${profile.blog}`}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1 hover:text-primary transition-colors truncate max-w-xs"
                >
                  <Globe className="h-3.5 w-3.5 text-primary/70" />
                  {profile.blog.replace(/^https?:\/\//, "")}
                </a>
              )}
              {joinedYear && (
                <span className="flex items-center gap-1">
                  <Calendar className="h-3.5 w-3.5 text-primary/70" />
                  Joined {joinedYear}
                </span>
              )}
              {formattedSyncTime && (
                <span className="flex items-center gap-1 text-muted-foreground/80">
                  <Clock className="h-3.5 w-3.5 text-primary/70" />
                  Synced {formattedSyncTime}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Action Buttons Toolbar */}
        <div className="flex flex-wrap items-center gap-2.5 shrink-0 pt-2 lg:pt-0 border-t lg:border-t-0 border-border/40">
          {isConnected && onSync && (
            <Button
              variant="outline"
              size="sm"
              onClick={onSync}
              disabled={isSyncing}
              className="text-xs h-9 font-semibold hover:border-primary/40 hover:bg-primary/5 shadow-xs"
            >
              <RefreshCw className={`h-3.5 w-3.5 mr-1.5 text-primary ${isSyncing ? "animate-spin" : ""}`} />
              {isSyncing ? "Syncing..." : "Sync Now"}
            </Button>
          )}

          <Button
            variant="outline"
            size="sm"
            onClick={onOpenCompare}
            className="text-xs h-9 font-medium hover:border-primary/40 hover:bg-primary/5"
          >
            <GitCompare className="h-4 w-4 mr-1.5 text-primary" />
            Compare
          </Button>

          {onOpenMentor && (
            <Button
              variant="outline"
              size="sm"
              onClick={onOpenMentor}
              className="text-xs h-9 font-medium text-primary hover:text-primary hover:bg-primary/10 border-primary/30"
            >
              <Compass className="h-4 w-4 mr-1.5 text-primary" />
              Career Mentor
            </Button>
          )}

          <Button
            variant="outline"
            size="sm"
            onClick={onOpenExport}
            className="text-xs h-9 font-medium hover:border-primary/40 hover:bg-primary/5"
          >
            <Download className="h-4 w-4 mr-1.5 text-primary" />
            Export
          </Button>
        </div>
      </div>

      {/* Quick Stat Highlights */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-5 border-t border-border/40 text-center">
        <div className="p-2.5 rounded-xl bg-background/50 border border-border/40">
          <div className="text-xl font-bold text-foreground flex items-center justify-center gap-1">
            <FolderGit2 className="h-4 w-4 text-primary" />
            {profile.publicRepos}
          </div>
          <span className="text-[11px] text-muted-foreground font-medium">Public Repos</span>
        </div>

        <div className="p-2.5 rounded-xl bg-background/50 border border-border/40">
          <div className="text-xl font-bold text-amber-500 flex items-center justify-center gap-1">
            <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
            {aggregateStats.totalStars}
          </div>
          <span className="text-[11px] text-muted-foreground font-medium">Total Stars</span>
        </div>

        <div className="p-2.5 rounded-xl bg-background/50 border border-border/40">
          <div className="text-xl font-bold text-purple-500 flex items-center justify-center gap-1">
            <GitFork className="h-4 w-4 text-purple-400" />
            {aggregateStats.totalForks}
          </div>
          <span className="text-[11px] text-muted-foreground font-medium">Total Forks</span>
        </div>

        <div className="p-2.5 rounded-xl bg-background/50 border border-border/40">
          <div className="text-xl font-bold text-emerald-500 flex items-center justify-center gap-1">
            <Users className="h-4 w-4 text-emerald-400" />
            {profile.followers}
          </div>
          <span className="text-[11px] text-muted-foreground font-medium">Followers</span>
        </div>
      </div>
    </div>
  );
};

export default UserOverview;
