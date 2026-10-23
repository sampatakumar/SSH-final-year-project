import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  AlertCircle,
  Award,
  BookOpen,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Clock,
  Code2,
  ExternalLink,
  Filter,
  Layers,
  RefreshCw,
  Search,
  ShieldCheck,
  Sparkles,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  SmartSkillApi,
  CompetencyMatrixItem,
  CompetencyMatrixSummary,
} from "@/lib/api";
import { toast } from "sonner";

export const CompetencyMatrixWidget: React.FC = () => {
  const [matrix, setMatrix] = useState<CompetencyMatrixItem[]>([]);
  const [summary, setSummary] = useState<CompetencyMatrixSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [claimingCompId, setClaimingCompId] = useState<string | null>(null);

  const fetchMatrix = async () => {
    try {
      setLoading(true);
      const res = await SmartSkillApi.getCompetencyMatrix();
      setMatrix(res.matrix || []);
      setSummary(res.summary || null);
    } catch (err: any) {
      console.warn("Failed to load competency matrix:", err.message);
      toast.error("Could not load competency matrix.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMatrix();
  }, []);

  const handleRefresh = async () => {
    try {
      setRefreshing(true);
      const res = await SmartSkillApi.getCompetencyMatrix();
      setMatrix(res.matrix || []);
      setSummary(res.summary || null);
      toast.success("Competency matrix refreshed!");
    } catch (err: any) {
      toast.error(err.message || "Failed to refresh matrix.");
    } finally {
      setRefreshing(false);
    }
  };

  const handleClaimBadge = async (competencyId: string, badgeType: string) => {
    try {
      setClaimingCompId(`${competencyId}:${badgeType}`);
      toast.info("Synthesizing evidence and generating digital signature...");
      const result = await SmartSkillApi.claimCompetencyBadge({
        competencyId,
        badgeType,
      });

      if (result.isNewlyIssued) {
        toast.success(`Verified badge awarded! ID: ${result.badge.badgeId}`);
      } else {
        toast.info("Existing active badge retrieved.");
      }

      await fetchMatrix();
    } catch (err: any) {
      toast.error(err.message || "Could not claim badge.");
    } finally {
      setClaimingCompId(null);
    }
  };

  // Status badge styling helper
  const renderStatusBadge = (status: string) => {
    switch (status) {
      case "capstone_competence":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-500 border border-emerald-500/30">
            <Sparkles className="w-3 h-3 text-emerald-400 animate-pulse" />
            Capstone Verified
          </span>
        );
      case "applied_verified":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-500/10 text-blue-500 border border-blue-500/30">
            <Code2 className="w-3 h-3" />
            Applied Verified
          </span>
        );
      case "retention_verified":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-500/10 text-purple-500 border border-purple-500/30">
            <Clock className="w-3 h-3" />
            Retention Verified
          </span>
        );
      case "knowledge_verified":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-500 border border-amber-500/30">
            <BookOpen className="w-3 h-3" />
            Knowledge Verified
          </span>
        );
      case "insufficient_evidence":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-500/10 text-slate-400 border border-slate-500/30">
            <AlertCircle className="w-3 h-3" />
            Evidence Incomplete
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-muted text-muted-foreground border border-border/40">
            Not Assessed
          </span>
        );
    }
  };

  const filteredMatrix = matrix.filter((item) => {
    const matchesSearch =
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.canonicalSkill.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.category.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || item.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-surface p-5 rounded-3xl border border-border/40 shadow-neo-raised">
        <div>
          <h2 className="text-xl font-extrabold tracking-tight text-foreground flex items-center gap-2">
            <ShieldCheck className="w-6 h-6 text-primary" />
            Competency Assessment Matrix
          </h2>
          <p className="text-xs text-muted-foreground mt-1">
            Deterministic, multi-format synthesis evaluating knowledge quizzes, sandbox execution, and retention intervals.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={refreshing}
            className="text-xs font-semibold gap-1.5 h-9"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? "animate-spin text-primary" : ""}`} />
            Re-evaluate Matrix
          </Button>
        </div>
      </div>

      {/* Summary KPI Cards */}
      {summary && (
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-3">
          <div className="p-4 rounded-2xl bg-surface border border-border/30 shadow-neo-raised">
            <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground block">
              Competencies
            </span>
            <span className="text-2xl font-black text-foreground mt-1 block">
              {summary.totalCompetencies}
            </span>
            <span className="text-[11px] text-muted-foreground font-mono">
              Rubric v{summary.rubricVersion}
            </span>
          </div>

          <div className="p-4 rounded-2xl bg-emerald-500/5 border border-emerald-500/20 shadow-neo-raised">
            <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-500 block">
              Capstone Verified
            </span>
            <span className="text-2xl font-black text-emerald-500 mt-1 block">
              {summary.capstoneVerified}
            </span>
            <span className="text-[11px] text-muted-foreground font-mono">
              All 3 Pillars Met
            </span>
          </div>

          <div className="p-4 rounded-2xl bg-blue-500/5 border border-blue-500/20 shadow-neo-raised">
            <span className="text-[11px] font-bold uppercase tracking-wider text-blue-500 block">
              Applied Skills
            </span>
            <span className="text-2xl font-black text-blue-500 mt-1 block">
              {summary.appliedVerified}
            </span>
            <span className="text-[11px] text-muted-foreground font-mono">
              Sandbox Passes
            </span>
          </div>

          <div className="p-4 rounded-2xl bg-amber-500/5 border border-amber-500/20 shadow-neo-raised">
            <span className="text-[11px] font-bold uppercase tracking-wider text-amber-500 block">
              Knowledge Quizzes
            </span>
            <span className="text-2xl font-black text-amber-500 mt-1 block">
              {summary.knowledgeVerified}
            </span>
            <span className="text-[11px] text-muted-foreground font-mono">
              EduTube Checkpoints
            </span>
          </div>

          <div className="p-4 rounded-2xl bg-purple-500/5 border border-purple-500/20 shadow-neo-raised col-span-2 sm:col-span-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-purple-500 block">
              Spaced Retention
            </span>
            <span className="text-2xl font-black text-purple-500 mt-1 block">
              {summary.retentionVerified}
            </span>
            <span className="text-[11px] text-muted-foreground font-mono">
              Multi-Stage Recall
            </span>
          </div>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between bg-surface p-4 rounded-2xl border border-border/30">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search competency or skill..."
            className="pl-9 h-9 text-xs bg-background/50 border-border/40"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
          <Filter className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
          {[
            { id: "all", label: "All" },
            { id: "capstone_competence", label: "Capstone" },
            { id: "applied_verified", label: "Applied" },
            { id: "knowledge_verified", label: "Knowledge" },
            { id: "retention_verified", label: "Retention" },
            { id: "insufficient_evidence", label: "Incomplete" },
          ].map((f) => (
            <button
              key={f.id}
              onClick={() => setStatusFilter(f.id)}
              className={`px-2.5 py-1 rounded-xl text-xs font-semibold transition-colors whitespace-nowrap ${
                statusFilter === f.id
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "bg-background/60 text-muted-foreground hover:bg-background border border-border/30"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Competencies List */}
      {loading ? (
        <div className="p-12 text-center bg-surface/40 border border-border/30 rounded-3xl">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-xs text-muted-foreground font-mono">
            Evaluating multi-source evidence criteria across database...
          </p>
        </div>
      ) : filteredMatrix.length === 0 ? (
        <div className="p-8 text-center bg-surface/30 border border-border/30 rounded-3xl text-muted-foreground text-xs">
          No competencies match the selected criteria.
        </div>
      ) : (
        <div className="space-y-4">
          {filteredMatrix.map((item) => {
            const isExpanded = expandedId === item.competencyId;
            const hasEligibleBadges = item.eligibleBadgeTypes && item.eligibleBadgeTypes.length > 0;
            const earnedBadgeTypes = (item.earnedBadges || []).map((b) => b.badgeType);

            return (
              <div
                key={item.competencyId}
                className="bg-surface border border-border/40 rounded-3xl shadow-neo-raised overflow-hidden transition-all duration-200"
              >
                {/* Main Card Header */}
                <div className="p-5 md:p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="space-y-1.5 max-w-2xl">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs font-bold text-primary px-2 py-0.5 rounded-md bg-primary/10 border border-primary/20">
                        {item.canonicalSkill}
                      </span>
                      <span className="text-xs text-muted-foreground font-mono">
                        {item.category}
                      </span>
                      {renderStatusBadge(item.status)}
                    </div>
                    <h3 className="text-lg font-bold text-foreground">
                      {item.name}
                    </h3>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      {item.description}
                    </p>
                  </div>

                  {/* Actions / Badges Claim Bar */}
                  <div className="flex flex-wrap sm:flex-nowrap items-center gap-2 self-start md:self-center shrink-0">
                    {hasEligibleBadges && (
                      <div className="flex items-center gap-1.5">
                        {item.eligibleBadgeTypes.includes("capstone_competence") && (
                          <Button
                            size="sm"
                            onClick={() => handleClaimBadge(item.competencyId, "capstone_competence")}
                            disabled={claimingCompId !== null}
                            className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs shadow-md gap-1.5 h-8 px-3"
                          >
                            <Award className="w-3.5 h-3.5" />
                            {earnedBadgeTypes.includes("capstone_competence")
                              ? "View Capstone Badge"
                              : "Claim Capstone Badge"}
                          </Button>
                        )}
                        {!item.eligibleBadgeTypes.includes("capstone_competence") &&
                          item.eligibleBadgeTypes[0] && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleClaimBadge(item.competencyId, item.eligibleBadgeTypes[0])}
                              disabled={claimingCompId !== null}
                              className="text-xs font-semibold gap-1.5 h-8 px-3 border-primary/30 text-primary hover:bg-primary/10"
                            >
                              <Award className="w-3.5 h-3.5 text-primary" />
                              Claim {item.eligibleBadgeTypes[0].replace(/_/g, " ")}
                            </Button>
                          )}
                      </div>
                    )}

                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setExpandedId(isExpanded ? null : item.competencyId)}
                      className="text-xs text-muted-foreground hover:text-foreground gap-1 h-8 px-2.5"
                    >
                      {isExpanded ? "Hide Evidence" : "Inspect Evidence"}
                      {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                    </Button>
                  </div>
                </div>

                {/* Evidence Pillars Row */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 px-5 pb-5">
                  {/* Knowledge Pillar */}
                  <div
                    className={`p-3 rounded-2xl border transition-colors ${
                      item.evidence.knowledge.satisfied
                        ? "bg-emerald-500/5 border-emerald-500/30 text-emerald-500"
                        : "bg-background/40 border-border/20 text-muted-foreground"
                    }`}
                  >
                    <div className="flex items-center justify-between text-xs font-bold">
                      <span className="flex items-center gap-1.5">
                        <BookOpen className="w-3.5 h-3.5" /> Knowledge Checks
                      </span>
                      {item.evidence.knowledge.satisfied ? (
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                      ) : (
                        <span className="text-[11px] font-mono text-muted-foreground">Incomplete</span>
                      )}
                    </div>
                    <div className="mt-2 text-xs text-foreground font-semibold flex items-center justify-between">
                      <span>Passed Checkpoints:</span>
                      <span className="font-mono">{item.evidence.knowledge.distinctCheckpointsPassed} / 1</span>
                    </div>
                    <div className="text-[11px] text-muted-foreground flex items-center justify-between">
                      <span>Avg Quiz Score:</span>
                      <span className="font-mono">{item.evidence.knowledge.averageScore}%</span>
                    </div>
                  </div>

                  {/* Applied Coding Pillar */}
                  <div
                    className={`p-3 rounded-2xl border transition-colors ${
                      item.evidence.applied.satisfied
                        ? "bg-blue-500/5 border-blue-500/30 text-blue-500"
                        : "bg-background/40 border-border/20 text-muted-foreground"
                    }`}
                  >
                    <div className="flex items-center justify-between text-xs font-bold">
                      <span className="flex items-center gap-1.5">
                        <Code2 className="w-3.5 h-3.5" /> Applied Challenge
                      </span>
                      {item.evidence.applied.satisfied ? (
                        <CheckCircle2 className="w-3.5 h-3.5 text-blue-500" />
                      ) : (
                        <span className="text-[11px] font-mono text-muted-foreground">Incomplete</span>
                      )}
                    </div>
                    <div className="mt-2 text-xs text-foreground font-semibold flex items-center justify-between">
                      <span>Problems Solved:</span>
                      <span className="font-mono">{item.evidence.applied.problemsSolvedCount} / 1</span>
                    </div>
                    <div className="text-[11px] text-muted-foreground flex items-center justify-between">
                      <span>Test Pass Rate:</span>
                      <span className="font-mono">
                        {Math.round(item.evidence.applied.testPassRate * 100)}%
                      </span>
                    </div>
                  </div>

                  {/* Spaced Retention Pillar */}
                  <div
                    className={`p-3 rounded-2xl border transition-colors ${
                      item.evidence.retention.satisfied
                        ? "bg-purple-500/5 border-purple-500/30 text-purple-500"
                        : "bg-background/40 border-border/20 text-muted-foreground"
                    }`}
                  >
                    <div className="flex items-center justify-between text-xs font-bold">
                      <span className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5" /> Spaced Retention
                      </span>
                      {item.evidence.retention.satisfied ? (
                        <CheckCircle2 className="w-3.5 h-3.5 text-purple-500" />
                      ) : (
                        <span className="text-[11px] font-mono text-muted-foreground">Incomplete</span>
                      )}
                    </div>
                    <div className="mt-2 text-xs text-foreground font-semibold flex items-center justify-between">
                      <span>Recall Streak:</span>
                      <span className="font-mono">{item.evidence.retention.consecutiveSuccesses} / 2</span>
                    </div>
                    <div className="text-[11px] text-muted-foreground flex items-center justify-between">
                      <span>Retention Stage:</span>
                      <span className="font-mono">Stage {item.evidence.retention.maxStage}</span>
                    </div>
                  </div>
                </div>

                {/* Missing Requirements Alert if any */}
                {item.missingRequirements && item.missingRequirements.length > 0 && (
                  <div className="mx-5 mb-5 p-3.5 rounded-2xl bg-amber-500/5 border border-amber-500/20 text-xs">
                    <span className="font-bold text-amber-500 block mb-1 flex items-center gap-1.5">
                      <AlertCircle className="w-3.5 h-3.5" /> Requirements for Capstone Verification
                    </span>
                    <ul className="space-y-1 list-disc list-inside text-muted-foreground">
                      {item.missingRequirements.map((req, i) => (
                        <li key={i}>{req}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Recommended Next Action Banner */}
                {item.recommendedNextAction && (
                  <div className="bg-background/50 border-t border-border/30 px-5 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <Zap className="w-3.5 h-3.5 text-primary shrink-0" />
                      <span className="text-xs font-semibold text-foreground">
                        {item.recommendedNextAction.title}
                      </span>
                      <span className="text-[11px] text-muted-foreground hidden sm:inline">
                        &bull; {item.recommendedNextAction.description}
                      </span>
                    </div>

                    <Button asChild size="sm" variant="ghost" className="text-xs font-bold text-primary hover:text-primary gap-1 h-7 px-2">
                      <Link
                        to={
                          item.recommendedNextAction.targetModule === "edutube"
                            ? "/dashboard/edutube"
                            : item.recommendedNextAction.targetModule === "coding"
                            ? "/dashboard/coding"
                            : "/dashboard"
                        }
                      >
                        Start Next Action <ExternalLink className="w-3 h-3 ml-1" />
                      </Link>
                    </Button>
                  </div>
                )}

                {/* Expanded Detailed Provenance Inspector */}
                {isExpanded && (
                  <div className="p-5 border-t border-border/30 bg-background/30 space-y-3 text-xs">
                    <h4 className="font-bold uppercase tracking-wider text-muted-foreground text-[11px]">
                      Historical Assessment Provenance
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div className="p-3 rounded-xl bg-background border border-border/20">
                        <span className="font-semibold block text-foreground mb-1">
                          Knowledge Assessment Records
                        </span>
                        {item.evidence.knowledge.checkpoints.length > 0 ? (
                          <div className="space-y-1 font-mono text-[11px] text-muted-foreground">
                            {item.evidence.knowledge.checkpoints.map((cp, idx) => (
                              <div key={idx} className="flex justify-between">
                                <span>ID: {cp.checkpointId}</span>
                                <span>{cp.score}% ({cp.isCorrect ? "Passed" : "Failed"})</span>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <span className="text-muted-foreground text-[11px] font-mono">
                            No checkpoint attempts recorded yet.
                          </span>
                        )}
                      </div>

                      <div className="p-3 rounded-xl bg-background border border-border/20">
                        <span className="font-semibold block text-foreground mb-1">
                          Applied Assessment Records
                        </span>
                        {item.evidence.applied.solvedTaskIds.length > 0 ? (
                          <div className="space-y-1 font-mono text-[11px] text-muted-foreground">
                            {item.evidence.applied.solvedTaskIds.map((taskId, idx) => (
                              <div key={idx} className="flex justify-between">
                                <span>Task: {taskId}</span>
                                <span className="text-emerald-500 font-semibold">Sandbox Passed</span>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <span className="text-muted-foreground text-[11px] font-mono">
                            No verified passed coding tasks recorded yet.
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default CompetencyMatrixWidget;
