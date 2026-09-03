import React, { useState, useMemo } from "react";
import {
  FolderGit2,
  Star,
  GitFork,
  Search,
  ExternalLink,
  Filter,
  Eye,
  Archive,
  ArrowUpDown,
  Code,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import type { GitHubRepositoryItem } from "../types/github.types";
import { getLanguageColor } from "./LanguageDistribution";

export interface RepoAnalysisProps {
  repositories: GitHubRepositoryItem[];
  selectedLanguage: string;
  onSelectLanguage: (lang: string) => void;
}

export const RepoAnalysis: React.FC<RepoAnalysisProps> = ({
  repositories,
  selectedLanguage,
  onSelectLanguage,
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState<"stars" | "forks" | "updated" | "size">("stars");
  const [hideForks, setHideForks] = useState(false);
  const [hideArchived, setHideArchived] = useState(false);

  // Unique languages for dropdown
  const availableLanguages = useMemo(() => {
    const langs = new Set<string>();
    repositories.forEach((r) => {
      if (r.language) langs.add(r.language);
    });
    return Array.from(langs).sort();
  }, [repositories]);

  // Filtered & Sorted repositories
  const filteredRepos = useMemo(() => {
    return repositories
      .filter((repo) => {
        if (hideForks && repo.fork) return false;
        if (hideArchived && repo.archived) return false;
        if (selectedLanguage !== "ALL" && repo.language !== selectedLanguage) return false;
        if (searchTerm) {
          const term = searchTerm.toLowerCase();
          const matchName = repo.name.toLowerCase().includes(term);
          const matchDesc = repo.description && repo.description.toLowerCase().includes(term);
          const matchTopic = repo.topics && repo.topics.some((t) => t.toLowerCase().includes(term));
          if (!matchName && !matchDesc && !matchTopic) return false;
        }
        return true;
      })
      .sort((a, b) => {
        if (sortBy === "stars") return b.stars - a.stars;
        if (sortBy === "forks") return b.forks - a.forks;
        if (sortBy === "size") return b.sizeKB - a.sizeKB;
        if (sortBy === "updated") return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
        return 0;
      });
  }, [repositories, searchTerm, selectedLanguage, sortBy, hideForks, hideArchived]);

  return (
    <div className="bg-card rounded-2xl border border-border/50 p-5 shadow-xs space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/40 pb-3">
        <div className="flex items-center gap-2">
          <FolderGit2 className="h-4 w-4 text-primary" />
          <h3 className="font-bold text-sm text-foreground">
            Repository Directory ({filteredRepos.length} of {repositories.length})
          </h3>
        </div>

        {/* Sorting Dropdown */}
        <div className="flex items-center gap-2 text-xs">
          <span className="text-muted-foreground flex items-center gap-1">
            <ArrowUpDown className="h-3 w-3" /> Sort:
          </span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="h-7 px-2 text-xs rounded-lg border border-border/60 bg-background text-foreground"
          >
            <option value="stars">Most Stars</option>
            <option value="forks">Most Forks</option>
            <option value="updated">Recently Updated</option>
            <option value="size">Codebase Size</option>
          </select>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2.5 text-xs">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search projects..."
            className="pl-8 h-8 text-xs bg-background/60"
          />
        </div>

        {/* Language Select */}
        <select
          value={selectedLanguage}
          onChange={(e) => onSelectLanguage(e.target.value)}
          className="h-8 px-2.5 text-xs rounded-lg border border-border/60 bg-background text-foreground"
        >
          <option value="ALL">All Languages</option>
          {availableLanguages.map((lang) => (
            <option key={lang} value={lang}>
              {lang}
            </option>
          ))}
        </select>

        {/* Hide Forks Checkbox */}
        <label className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-border/50 bg-background/60 cursor-pointer select-none text-muted-foreground hover:text-foreground">
          <input
            type="checkbox"
            checked={hideForks}
            onChange={(e) => setHideForks(e.target.checked)}
            className="rounded text-primary"
          />
          <span>Hide Forks</span>
        </label>

        {/* Hide Archived Checkbox */}
        <label className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-border/50 bg-background/60 cursor-pointer select-none text-muted-foreground hover:text-foreground">
          <input
            type="checkbox"
            checked={hideArchived}
            onChange={(e) => setHideArchived(e.target.checked)}
            className="rounded text-primary"
          />
          <span>Hide Archived</span>
        </label>
      </div>

      {/* Repositories Cards Grid */}
      <div className="space-y-3 pt-2">
        {filteredRepos.map((repo) => (
          <div
            key={repo.name}
            className="p-4 rounded-xl border border-border/50 bg-background/60 hover:bg-background/90 transition-all space-y-2 group"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2 truncate">
                <a
                  href={repo.htmlUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="font-bold text-sm text-foreground hover:text-primary transition-colors flex items-center gap-1.5 truncate group-hover:underline"
                >
                  {repo.name}
                  <ExternalLink className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                </a>

                {repo.fork && (
                  <span className="text-[10px] px-1.5 py-0.2 rounded bg-muted text-muted-foreground border border-border/40 font-mono">
                    Fork
                  </span>
                )}
                {repo.archived && (
                  <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-500/10 text-amber-500 border border-amber-500/20 font-mono flex items-center gap-0.5">
                    <Archive className="h-2.5 w-2.5" /> Archived
                  </span>
                )}
              </div>

              {/* Badges */}
              <div className="flex items-center gap-3 text-xs text-muted-foreground shrink-0">
                {repo.language && (
                  <span className="flex items-center gap-1 font-medium">
                    <span
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: getLanguageColor(repo.language) }}
                    />
                    {repo.language}
                  </span>
                )}
                <span className="flex items-center gap-0.5 text-amber-500 font-semibold">
                  <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                  {repo.stars}
                </span>
                <span className="flex items-center gap-0.5">
                  <GitFork className="h-3 w-3 text-purple-400" />
                  {repo.forks}
                </span>
              </div>
            </div>

            {repo.description && (
              <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">
                {repo.description}
              </p>
            )}

            {/* Topics & Meta Info */}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
              <div className="flex flex-wrap items-center gap-1">
                {repo.topics?.map((topic) => (
                  <span
                    key={topic}
                    className="text-[10px] px-2 py-0.5 rounded-md bg-primary/10 text-primary border border-primary/20 font-mono"
                  >
                    #{topic}
                  </span>
                ))}
              </div>

              <span className="text-[10px] text-muted-foreground font-mono">
                {repo.sizeKB > 1024
                  ? `${(repo.sizeKB / 1024).toFixed(1)} MB`
                  : `${repo.sizeKB} KB`}
              </span>
            </div>
          </div>
        ))}

        {filteredRepos.length === 0 && (
          <div className="p-8 text-center bg-muted/20 rounded-xl border border-dashed text-xs text-muted-foreground">
            No repositories matched your filters.
          </div>
        )}
      </div>
    </div>
  );
};

export default RepoAnalysis;
