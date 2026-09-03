import React, { useState } from "react";
import {
  GitCompare,
  X,
  Star,
  GitFork,
  Users,
  FolderGit2,
  Trophy,
  Loader2,
  ExternalLink,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { apiRequest } from "@/lib/api";
import type { GitHubAnalysisData } from "../types/github.types";
import { getLanguageColor } from "./LanguageDistribution";

export interface CompareProfilesProps {
  isOpen: boolean;
  onClose: () => void;
  initialUser1?: string;
}

export const CompareProfiles: React.FC<CompareProfilesProps> = ({
  isOpen,
  onClose,
  initialUser1 = "",
}) => {
  const [user1, setUser1] = useState(initialUser1);
  const [user2, setUser2] = useState("");
  const [loading, setLoading] = useState(false);
  const [comparison, setComparison] = useState<{
    user1: GitHubAnalysisData;
    user2: GitHubAnalysisData;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleCompare = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user1.trim() || !user2.trim()) return;

    setLoading(true);
    setError(null);
    try {
      const res = await apiRequest<{
        user1: GitHubAnalysisData;
        user2: GitHubAnalysisData;
      }>(`/github/compare?user1=${encodeURIComponent(user1.trim())}&user2=${encodeURIComponent(user2.trim())}`);

      if (res.data) {
        setComparison(res.data);
      }
    } catch (err: any) {
      setError(err.message || "Failed to compare profiles.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-in fade-in-50 duration-150">
      <div className="bg-card w-full max-w-3xl rounded-2xl border border-border/60 shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-border/40 flex items-center justify-between shrink-0 bg-muted/20">
          <div className="flex items-center gap-2 font-bold text-base text-foreground">
            <GitCompare className="h-5 w-5 text-primary" />
            <span>Developer Profile Battle & Comparison</span>
          </div>

          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto custom-scrollbar space-y-6">
          {/* Comparison Search Form */}
          <form onSubmit={handleCompare} className="grid grid-cols-1 sm:grid-cols-5 gap-3 text-xs">
            <Input
              value={user1}
              onChange={(e) => setUser1(e.target.value)}
              placeholder="First username (e.g. torvalds)"
              className="sm:col-span-2 text-xs h-9"
            />

            <div className="flex items-center justify-center font-black text-sm text-primary">
              VS
            </div>

            <Input
              value={user2}
              onChange={(e) => setUser2(e.target.value)}
              placeholder="Second username (e.g. gaearon)"
              className="sm:col-span-2 text-xs h-9"
            />

            <Button
              type="submit"
              disabled={loading || !user1.trim() || !user2.trim()}
              className="sm:col-span-5 h-9 font-semibold bg-primary hover:bg-primary/90 text-primary-foreground"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" /> Comparing Profiles...
                </>
              ) : (
                <>
                  <GitCompare className="h-4 w-4 mr-2" /> Compare Side-by-Side
                </>
              )}
            </Button>
          </form>

          {error && (
            <div className="p-3 bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20 rounded-xl text-xs">
              {error}
            </div>
          )}

          {/* Comparison Results */}
          {comparison && (
            <div className="space-y-5 animate-in fade-in-50 duration-150">
              {/* Header Cards */}
              <div className="grid grid-cols-2 gap-4">
                {/* User 1 Header */}
                <div className="p-4 rounded-xl bg-background/60 border border-border/40 text-center space-y-2">
                  <img
                    src={comparison.user1.profile.avatarUrl}
                    alt={comparison.user1.username}
                    className="w-16 h-16 rounded-full mx-auto border-2 border-primary/20 shadow-xs"
                  />
                  <div>
                    <h4 className="font-bold text-sm text-foreground">
                      {comparison.user1.profile.name || comparison.user1.username}
                    </h4>
                    <p className="text-xs text-muted-foreground font-mono">
                      @{comparison.user1.username}
                    </p>
                  </div>
                </div>

                {/* User 2 Header */}
                <div className="p-4 rounded-xl bg-background/60 border border-border/40 text-center space-y-2">
                  <img
                    src={comparison.user2.profile.avatarUrl}
                    alt={comparison.user2.username}
                    className="w-16 h-16 rounded-full mx-auto border-2 border-primary/20 shadow-xs"
                  />
                  <div>
                    <h4 className="font-bold text-sm text-foreground">
                      {comparison.user2.profile.name || comparison.user2.username}
                    </h4>
                    <p className="text-xs text-muted-foreground font-mono">
                      @{comparison.user2.username}
                    </p>
                  </div>
                </div>
              </div>

              {/* Metrics Table */}
              <div className="rounded-xl border border-border/50 overflow-hidden text-xs">
                <table className="w-full text-left">
                  <thead className="bg-muted/40 text-muted-foreground border-b border-border/40 font-semibold">
                    <tr>
                      <th className="p-3">Metric</th>
                      <th className="p-3">@{comparison.user1.username}</th>
                      <th className="p-3">@{comparison.user2.username}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/40 bg-card">
                    {/* Stars */}
                    <tr>
                      <td className="p-3 font-medium flex items-center gap-1.5">
                        <Star className="h-3.5 w-3.5 text-amber-500 fill-amber-400" /> Total Stars
                      </td>
                      <td className={`p-3 font-bold font-mono ${
                        comparison.user1.aggregateStats.totalStars >= comparison.user2.aggregateStats.totalStars
                          ? "text-amber-500 font-black"
                          : "text-muted-foreground"
                      }`}>
                        {comparison.user1.aggregateStats.totalStars}
                        {comparison.user1.aggregateStats.totalStars > comparison.user2.aggregateStats.totalStars && " 🏆"}
                      </td>
                      <td className={`p-3 font-bold font-mono ${
                        comparison.user2.aggregateStats.totalStars >= comparison.user1.aggregateStats.totalStars
                          ? "text-amber-500 font-black"
                          : "text-muted-foreground"
                      }`}>
                        {comparison.user2.aggregateStats.totalStars}
                        {comparison.user2.aggregateStats.totalStars > comparison.user1.aggregateStats.totalStars && " 🏆"}
                      </td>
                    </tr>

                    {/* Repos */}
                    <tr>
                      <td className="p-3 font-medium flex items-center gap-1.5">
                        <FolderGit2 className="h-3.5 w-3.5 text-blue-500" /> Public Repos
                      </td>
                      <td className="p-3 font-bold font-mono">
                        {comparison.user1.profile.publicRepos}
                      </td>
                      <td className="p-3 font-bold font-mono">
                        {comparison.user2.profile.publicRepos}
                      </td>
                    </tr>

                    {/* Forks */}
                    <tr>
                      <td className="p-3 font-medium flex items-center gap-1.5">
                        <GitFork className="h-3.5 w-3.5 text-purple-500" /> Total Forks
                      </td>
                      <td className="p-3 font-bold font-mono">
                        {comparison.user1.aggregateStats.totalForks}
                      </td>
                      <td className="p-3 font-bold font-mono">
                        {comparison.user2.aggregateStats.totalForks}
                      </td>
                    </tr>

                    {/* Followers */}
                    <tr>
                      <td className="p-3 font-medium flex items-center gap-1.5">
                        <Users className="h-3.5 w-3.5 text-emerald-500" /> Followers
                      </td>
                      <td className={`p-3 font-bold font-mono ${
                        comparison.user1.profile.followers >= comparison.user2.profile.followers
                          ? "text-emerald-500 font-black"
                          : "text-muted-foreground"
                      }`}>
                        {comparison.user1.profile.followers}
                        {comparison.user1.profile.followers > comparison.user2.profile.followers && " 🏆"}
                      </td>
                      <td className={`p-3 font-bold font-mono ${
                        comparison.user2.profile.followers >= comparison.user1.profile.followers
                          ? "text-emerald-500 font-black"
                          : "text-muted-foreground"
                      }`}>
                        {comparison.user2.profile.followers}
                        {comparison.user2.profile.followers > comparison.user1.profile.followers && " 🏆"}
                      </td>
                    </tr>

                    {/* Dominant Language */}
                    <tr>
                      <td className="p-3 font-medium">Dominant Stack</td>
                      <td className="p-3 font-bold">
                        <span
                          className="inline-block w-2 h-2 rounded-full mr-1.5"
                          style={{ backgroundColor: getLanguageColor(comparison.user1.dominantLanguage) }}
                        />
                        {comparison.user1.dominantLanguage}
                      </td>
                      <td className="p-3 font-bold">
                        <span
                          className="inline-block w-2 h-2 rounded-full mr-1.5"
                          style={{ backgroundColor: getLanguageColor(comparison.user2.dominantLanguage) }}
                        />
                        {comparison.user2.dominantLanguage}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}
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

export default CompareProfiles;
