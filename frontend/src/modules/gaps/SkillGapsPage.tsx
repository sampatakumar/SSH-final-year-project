import { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import {
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  HelpCircle,
  RefreshCw,
  Sparkles,
  Target,
  TrendingUp,
  Info,
  Layers,
  Video,
  X,
  Plus,
  Compass,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { SmartSkillApi, SkillGapItem, MultiRoleComparisonReport } from "@/lib/api";
import { academicApi, type CareerRoleOption } from "@/modules/profile/services/academic.api";
import { useAuth } from "@/core/auth";
import { toast } from "sonner";

const BASELINE_FALLBACK_ROLES = [
  "Full Stack Developer",
  "Frontend Engineer",
  "Backend Node.js Engineer",
  "Software Engineer (General / Core CS)",
];

interface GapDataResponse {
  targetRole: string;
  roleDescription: string;
  roleMatchPercentage: number | null;
  benchmarkStatus?: "validated" | "benchmark_pending" | "unknown_role";
  benchmarkPending?: boolean;
  benchmarkNotice?: string;
  totalRequiredSkills?: number;
  metSkillsCount?: number;
  gapsCount?: number;
  gaps: SkillGapItem[];
  metSkills: any[];
  prerequisites?: string[];
  observableEvidence?: string[];
}

const SkillGapsPage = () => {
  const { backendUser } = useAuth();

  // Resolve initial role from authenticated user's targetRole, targetRoles array, or fallback
  const userTargetRoles = useMemo(() => {
    const list: string[] = [];
    if (backendUser?.targetRole) list.push(backendUser.targetRole);
    if (Array.isArray(backendUser?.targetRoles)) {
      for (const r of backendUser.targetRoles) {
        if (r && !list.includes(r)) list.push(r);
      }
    }
    return list;
  }, [backendUser?.targetRole, backendUser?.targetRoles]);

  const [viewMode, setViewMode] = useState<"single" | "compare">("single");

  const [selectedRole, setSelectedRole] = useState<string>(
    userTargetRoles[0] || "Full Stack Developer"
  );
  const [catalogRoles, setCatalogRoles] = useState<CareerRoleOption[]>([]);
  const [isCatalogLoading, setIsCatalogLoading] = useState<boolean>(true);
  const [catalogError, setCatalogError] = useState<string | null>(null);

  const [gapData, setGapData] = useState<GapDataResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Multi-role comparison state
  const [comparedRoles, setComparedRoles] = useState<string[]>(() => {
    if (userTargetRoles.length >= 2) return userTargetRoles.slice(0, 4);
    if (userTargetRoles.length === 1) {
      const first = userTargetRoles[0];
      const second = first === "Robotics Engineer" ? "Embedded Systems Engineer" : "Full Stack Developer";
      return [first, second];
    }
    return ["Full Stack Developer", "Embedded Systems Engineer"];
  });
  const [comparisonData, setComparisonData] = useState<MultiRoleComparisonReport | null>(null);
  const [isComparing, setIsComparing] = useState(false);
  const [roleToAdd, setRoleToAdd] = useState<string>("");

  // Sync selectedRole if userTargetRoles changes and current selection is default
  useEffect(() => {
    if (
      userTargetRoles.length > 0 &&
      selectedRole === "Full Stack Developer" &&
      !userTargetRoles.includes("Full Stack Developer")
    ) {
      setSelectedRole(userTargetRoles[0]);
    }
  }, [userTargetRoles]);

  // Load full academic catalog roles
  useEffect(() => {
    let isSubscribed = true;
    const fetchCatalog = async () => {
      try {
        setIsCatalogLoading(true);
        const options = await academicApi.getOptions();
        if (isSubscribed && options?.careerRoles?.length > 0) {
          setCatalogRoles(options.careerRoles);
          setCatalogError(null);
        }
      } catch (err: any) {
        if (isSubscribed) {
          console.warn("Could not load full academic career roles catalog:", err);
          setCatalogError("Catalog offline; showing profile roles and baseline tracks.");
        }
      } finally {
        if (isSubscribed) setIsCatalogLoading(false);
      }
    };
    fetchCatalog();
    return () => {
      isSubscribed = false;
    };
  }, []);

  const fetchGaps = async (role: string) => {
    if (!role) return;
    try {
      setIsLoading(true);
      const data = await SmartSkillApi.getSkillGaps(role);
      setGapData(data as GapDataResponse);
    } catch (err: any) {
      console.error("Failed to load gaps:", err);
      toast.error(err.message || `Failed to load skill gaps for ${role}`);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchComparison = async (roles: string[]) => {
    if (!roles || roles.length === 0) return;
    try {
      setIsComparing(true);
      const data = await SmartSkillApi.compareRoles(roles);
      setComparisonData(data);
    } catch (err: any) {
      console.error("Failed to run role comparison:", err);
      toast.error(err.message || "Failed to compare selected career roles");
    } finally {
      setIsComparing(false);
    }
  };

  useEffect(() => {
    if (viewMode === "single") {
      fetchGaps(selectedRole);
    } else {
      fetchComparison(comparedRoles);
    }
  }, [selectedRole, viewMode, comparedRoles]);

  // Deduplicated role list for dropdown
  const { userRolesList, catalogRolesList } = useMemo(() => {
    const userList = userTargetRoles;
    const otherRoles = catalogRoles
      .map((c) => c.title)
      .filter((title) => !userList.includes(title));

    // Ensure baseline roles exist if catalog failed
    for (const base of BASELINE_FALLBACK_ROLES) {
      if (!userList.includes(base) && !otherRoles.includes(base)) {
        otherRoles.push(base);
      }
    }

    // Ensure currently selected role is in the list
    if (selectedRole && !userList.includes(selectedRole) && !otherRoles.includes(selectedRole)) {
      otherRoles.unshift(selectedRole);
    }

    return {
      userRolesList: userList,
      catalogRolesList: otherRoles.sort((a, b) => a.localeCompare(b)),
    };
  }, [userTargetRoles, catalogRoles, selectedRole]);

  const gaps = gapData?.gaps || [];
  const metSkills = gapData?.metSkills || [];
  const matchPercentage = gapData?.roleMatchPercentage;

  // Group gaps by status
  const missingGaps = gaps.filter((g) => g.status === "Missing");
  const weakGaps = gaps.filter((g) => g.status === "Weak / Action Required");
  const developingGaps = gaps.filter((g) => g.status === "Developing / Limited Evidence");

  const handleAddComparedRole = () => {
    if (!roleToAdd) return;
    if (comparedRoles.includes(roleToAdd)) {
      toast.info(`"${roleToAdd}" is already in comparison`);
      return;
    }
    setComparedRoles([...comparedRoles, roleToAdd]);
    setRoleToAdd("");
  };

  const handleRemoveComparedRole = (roleToRemove: string) => {
    if (comparedRoles.length <= 2) {
      toast.info("Please keep at least 2 roles for comparison");
      return;
    }
    setComparedRoles(comparedRoles.filter((r) => r !== roleToRemove));
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Top Header & View Switcher */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border/30 pb-5">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-foreground flex items-center gap-2">
            <Target className="h-5 w-5 text-primary" /> Target Role Skill Gap Analysis
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Compare your verified skills against evidence-based benchmarks across engineering & technical domains.
          </p>
        </div>

        {/* View Mode Toggle */}
        <div className="flex items-center gap-2 bg-surface p-1 rounded-xl border border-border/40 shadow-neo-raised-sm">
          <Button
            size="sm"
            variant={viewMode === "single" ? "default" : "ghost"}
            className="text-xs font-bold gap-1.5 h-8 px-3 rounded-lg"
            onClick={() => setViewMode("single")}
          >
            <Target className="h-3.5 w-3.5" /> Single Role Deep Dive
          </Button>
          <Button
            size="sm"
            variant={viewMode === "compare" ? "default" : "ghost"}
            className="text-xs font-bold gap-1.5 h-8 px-3 rounded-lg"
            onClick={() => setViewMode("compare")}
          >
            <Layers className="h-3.5 w-3.5" /> Multi-Role Comparison
          </Button>
        </div>
      </div>

      {viewMode === "single" ? (
        <>
          {/* Single Role Controls */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-surface/50 p-3 rounded-2xl border border-border/30">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-muted-foreground">Select Career Track:</span>
              <select
                value={selectedRole}
                onChange={(e) => setSelectedRole(e.target.value)}
                disabled={isLoading && !gapData}
                className="bg-background text-foreground text-xs font-bold border border-border/40 rounded-xl px-3 py-2 h-9 focus:outline-none focus:ring-1 focus:ring-primary shadow-neo-raised-sm max-w-[280px] truncate"
              >
                {userRolesList.length > 0 && (
                  <optgroup label="My Target Roles">
                    {userRolesList.map((role) => (
                      <option key={`user-${role}`} value={role}>
                        ★ {role}
                      </option>
                    ))}
                  </optgroup>
                )}

                <optgroup label="All Career Pathways">
                  {catalogRolesList.map((role) => (
                    <option key={`cat-${role}`} value={role}>
                      {role}
                    </option>
                  ))}
                </optgroup>
              </select>
            </div>

            <Button
              size="sm"
              variant="outline"
              onClick={() => fetchGaps(selectedRole)}
              disabled={isLoading}
              className="text-xs font-semibold h-8 gap-1.5 self-end sm:self-auto"
            >
              <RefreshCw className={`h-3 w-3 ${isLoading ? "animate-spin" : ""}`} /> Refresh Analysis
            </Button>
          </div>

          {/* Benchmark Status Banner */}
          {gapData?.benchmarkStatus === "benchmark_pending" && (
            <div className="p-4 rounded-2xl border border-primary/30 bg-primary/5 flex items-start gap-3 shadow-neo-raised-sm animate-in fade-in-50">
              <Sparkles className="h-5 w-5 text-primary shrink-0 mt-0.5" />
              <div className="space-y-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="text-xs font-bold text-foreground">Catalog Core Skills Assessment</h3>
                  <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-md bg-primary/15 text-primary border border-primary/30">
                    Rubric Pending
                  </span>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {gapData.benchmarkNotice ||
                    "This career track is evaluated against canonical catalog core skills. Detailed weighted rubrics will be published in an upcoming update."}
                </p>
              </div>
            </div>
          )}

          {gapData?.benchmarkStatus === "unknown_role" && (
            <div className="p-4 rounded-2xl border border-warning/40 bg-warning/5 flex items-start gap-3 shadow-neo-raised-sm animate-in fade-in-50">
              <AlertCircle className="h-5 w-5 text-warning shrink-0 mt-0.5" />
              <div className="space-y-1 min-w-0">
                <h3 className="text-xs font-bold text-foreground">Unrecognized Career Role</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {gapData.benchmarkNotice ||
                    `"${selectedRole}" is not recognized in system benchmarks or the academic catalog. Please select a recognized career track above.`}
                </p>
              </div>
            </div>
          )}

          {/* Role Overview & Match Card */}
          <div className="p-6 bg-surface border border-border/40 rounded-2xl shadow-neo-raised flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="space-y-2 max-w-xl">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-primary uppercase tracking-wider">Benchmark Evaluation</span>
                {gapData?.benchmarkStatus === "validated" && (
                  <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-md bg-success/15 text-success border border-success/30">
                    Validated Benchmark
                  </span>
                )}
                {gapData?.benchmarkPending && (
                  <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded bg-muted text-muted-foreground">
                    Catalog Track
                  </span>
                )}
              </div>
              <h2 className="text-xl font-bold text-foreground">{gapData?.targetRole || selectedRole}</h2>
              <p className="text-xs text-muted-foreground leading-relaxed">
                {gapData?.roleDescription || "Standard technical requirements and proficiency expectations for this track."}
              </p>

              {/* Prerequisites row if available */}
              {gapData?.prerequisites && gapData.prerequisites.length > 0 && (
                <div className="flex flex-wrap items-center gap-1.5 pt-2">
                  <span className="text-[11px] font-semibold text-muted-foreground">Prerequisites:</span>
                  {gapData.prerequisites.map((p) => (
                    <span
                      key={p}
                      className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-background/80 border border-border/30 text-foreground"
                    >
                      {p}
                    </span>
                  ))}
                </div>
              )}

              <div className="flex items-center gap-4 text-xs font-medium text-muted-foreground pt-2">
                <span>Met Criteria: <b className="text-success">{metSkills.length}</b></span>
                <span>Identified Gaps: <b className="text-warning">{gaps.length}</b></span>
                {gapData?.totalRequiredSkills !== undefined && (
                  <span>Total Core Track Skills: <b className="text-foreground">{gapData.totalRequiredSkills}</b></span>
                )}
              </div>
            </div>

            {/* Match Percentage Visual */}
            <div className="flex flex-col items-center justify-center p-4 bg-background/80 rounded-2xl border border-border/30 min-w-[160px] text-center shadow-neo-pressed">
              <span className="text-xs font-bold text-muted-foreground uppercase">Role Match</span>
              <span className="text-4xl font-black text-foreground my-1">
                {isLoading
                  ? "--"
                  : matchPercentage !== null && matchPercentage !== undefined
                  ? `${matchPercentage}%`
                  : "N/A"}
              </span>
              <span className="text-[11px] text-muted-foreground">
                {gapData?.benchmarkStatus === "unknown_role"
                  ? "Unknown Track"
                  : gapData?.benchmarkPending
                  ? "Core Skills Match (Rubric Pending)"
                  : (matchPercentage || 0) >= 75
                  ? "Strong Candidate"
                  : (matchPercentage || 0) >= 50
                  ? "Developing Profile"
                  : "Requires Preparation"}
              </span>
            </div>
          </div>

          {/* Observable Evidence Benchmark Guidelines if present */}
          {gapData?.observableEvidence && gapData.observableEvidence.length > 0 && (
            <div className="p-4 rounded-2xl border border-border/30 bg-surface/60 shadow-neo-raised-sm space-y-2">
              <h3 className="text-xs font-bold text-foreground flex items-center gap-2">
                <Compass className="h-4 w-4 text-primary" /> Observable Evidence Benchmark Guidelines
              </h3>
              <p className="text-[11px] text-muted-foreground">
                Authentic verification artifacts expected by industry technical evaluators for this specialization:
              </p>
              <ul className="grid grid-cols-1 md:grid-cols-3 gap-2 pt-1">
                {gapData.observableEvidence.map((ev, idx) => (
                  <li
                    key={idx}
                    className="text-[11px] text-muted-foreground p-2.5 rounded-xl bg-background/60 border border-border/20 leading-relaxed"
                  >
                    • {ev}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Gaps List by Severity */}
          {isLoading ? (
            <div className="py-16 text-center text-sm text-muted-foreground space-y-2">
              <RefreshCw className="h-6 w-6 animate-spin mx-auto text-primary" />
              <p>Analyzing role skill gaps...</p>
            </div>
          ) : gaps.length === 0 && metSkills.length === 0 ? (
            <div className="py-16 text-center border border-border/40 bg-surface rounded-2xl p-8 space-y-3">
              <Info className="h-8 w-8 text-primary mx-auto" />
              <h3 className="text-base font-bold text-foreground">No Requirements Available</h3>
              <p className="text-xs text-muted-foreground max-w-md mx-auto">
                {gapData?.benchmarkStatus === "unknown_role"
                  ? "Please select a recognized career track from your target roles or the catalog dropdown above."
                  : "No core skills or benchmark requirements found for this role."}
              </p>
            </div>
          ) : gaps.length === 0 && metSkills.length > 0 ? (
            <div className="py-16 text-center border border-border/40 bg-surface rounded-2xl p-8 space-y-3">
              <CheckCircle2 className="h-8 w-8 text-success mx-auto" />
              <h3 className="text-base font-bold text-foreground">All Core Requirements Satisfied!</h3>
              <p className="text-xs text-muted-foreground max-w-md mx-auto">
                Your verified skill evidence meets all evaluated requirements for {gapData?.targetRole || selectedRole}.
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* 1. Missing Critical Requirements */}
              {missingGaps.length > 0 && (
                <div className="space-y-3">
                  <h3 className="text-sm font-bold text-destructive flex items-center gap-2">
                    <AlertCircle className="h-4 w-4" /> Missing Role Requirements ({missingGaps.length})
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {missingGaps.map((gap) => (
                      <div
                        key={gap.canonicalName}
                        className="p-4 rounded-xl border border-destructive/30 bg-destructive/5 shadow-neo-raised-sm space-y-2 flex flex-col justify-between"
                      >
                        <div>
                          <div className="flex items-start justify-between">
                            <span className="text-sm font-bold text-foreground">{gap.canonicalName}</span>
                            <span className="text-[10px] font-extrabold px-2 py-0.5 rounded bg-destructive/10 text-destructive border border-destructive/20 uppercase">
                              {gap.priority}
                            </span>
                          </div>
                          <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{gap.reason}</p>
                          {gap.observableEvidence && (
                            <div className="mt-2 p-2 rounded-lg bg-background/60 border border-destructive/20 text-[11px] text-muted-foreground">
                              <span className="font-semibold text-foreground">Evidence Standard:</span> {gap.observableEvidence}
                            </div>
                          )}
                        </div>
                        <div className="pt-2 border-t border-border/20 flex flex-wrap items-center justify-between gap-2 text-xs">
                          <span className="text-muted-foreground font-medium">Required: {gap.requiredLevel}</span>
                          <div className="flex items-center gap-2">
                            <Link
                              to={gap.learningRoute || `/dashboard/edutube?search=${encodeURIComponent(gap.canonicalName)}`}
                              className="text-primary hover:text-primary/80 font-semibold flex items-center gap-1 bg-primary/10 px-2 py-1 rounded-md"
                            >
                              <Video className="h-3 w-3" /> EduTube
                            </Link>
                            <Link
                              to="/dashboard/roadmap"
                              className="text-foreground hover:underline font-semibold flex items-center gap-1"
                            >
                              Action Plan <ArrowRight className="h-3 w-3" />
                            </Link>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 2. Weak / Action Required */}
              {weakGaps.length > 0 && (
                <div className="space-y-3">
                  <h3 className="text-sm font-bold text-warning flex items-center gap-2">
                    <AlertCircle className="h-4 w-4" /> Weak Evidence / Action Required ({weakGaps.length})
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {weakGaps.map((gap) => (
                      <div
                        key={gap.canonicalName}
                        className="p-4 rounded-xl border border-warning/30 bg-warning/5 shadow-neo-raised-sm space-y-2 flex flex-col justify-between"
                      >
                        <div>
                          <div className="flex items-start justify-between">
                            <span className="text-sm font-bold text-foreground">{gap.canonicalName}</span>
                            <span className="text-[10px] font-extrabold px-2 py-0.5 rounded bg-warning/10 text-warning border border-warning/20 uppercase">
                              {gap.priority}
                            </span>
                          </div>
                          <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{gap.reason}</p>
                          {gap.observableEvidence && (
                            <div className="mt-2 p-2 rounded-lg bg-background/60 border border-warning/20 text-[11px] text-muted-foreground">
                              <span className="font-semibold text-foreground">Evidence Standard:</span> {gap.observableEvidence}
                            </div>
                          )}
                        </div>
                        <div className="pt-2 border-t border-border/20 flex flex-wrap items-center justify-between gap-2 text-xs">
                          <span className="text-muted-foreground font-medium">
                            Current: {gap.currentLevel} ({gap.currentScore} pts) → Target: {gap.requiredLevel}
                          </span>
                          <div className="flex items-center gap-2">
                            <Link
                              to={gap.learningRoute || `/dashboard/edutube?search=${encodeURIComponent(gap.canonicalName)}`}
                              className="text-primary hover:text-primary/80 font-semibold flex items-center gap-1 bg-primary/10 px-2 py-1 rounded-md"
                            >
                              <Video className="h-3 w-3" /> EduTube
                            </Link>
                            <Link
                              to="/dashboard/coding"
                              className="text-foreground hover:underline font-semibold flex items-center gap-1"
                            >
                              Practice Task <ArrowRight className="h-3 w-3" />
                            </Link>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 3. Developing Competence */}
              {developingGaps.length > 0 && (
                <div className="space-y-3">
                  <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                    <HelpCircle className="h-4 w-4 text-primary" /> Developing Competence ({developingGaps.length})
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {developingGaps.map((gap) => (
                      <div
                        key={gap.canonicalName}
                        className="p-4 rounded-xl border border-border/30 bg-surface shadow-neo-raised-sm space-y-2 flex flex-col justify-between"
                      >
                        <div>
                          <div className="flex items-start justify-between">
                            <span className="text-sm font-bold text-foreground">{gap.canonicalName}</span>
                            <span className="text-[10px] font-extrabold px-2 py-0.5 rounded bg-secondary text-muted-foreground border border-border/30 uppercase">
                              {gap.priority}
                            </span>
                          </div>
                          <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{gap.reason}</p>
                        </div>
                        <div className="pt-2 border-t border-border/20 flex flex-wrap items-center justify-between gap-2 text-xs">
                          <span className="text-muted-foreground font-medium">
                            Current: {gap.currentLevel} ({gap.currentScore} pts) → Target: {gap.requiredLevel}
                          </span>
                          <div className="flex items-center gap-2">
                            <Link
                              to={gap.learningRoute || `/dashboard/edutube?search=${encodeURIComponent(gap.canonicalName)}`}
                              className="text-primary hover:text-primary/80 font-semibold flex items-center gap-1 bg-primary/10 px-2 py-1 rounded-md"
                            >
                              <Video className="h-3 w-3" /> EduTube
                            </Link>
                            <Link
                              to="/dashboard/roadmap"
                              className="text-foreground hover:underline font-semibold flex items-center gap-1"
                            >
                              Recommended Steps <ArrowRight className="h-3 w-3" />
                            </Link>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 4. Met Criteria */}
              {metSkills.length > 0 && (
                <div className="space-y-3 pt-4 border-t border-border/30">
                  <h3 className="text-sm font-bold text-success flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4" /> Met Requirements ({metSkills.length})
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {metSkills.map((skill) => (
                      <div
                        key={skill.canonicalName}
                        className="p-3 rounded-xl border border-success/30 bg-success/5 flex items-center justify-between"
                      >
                        <div>
                          <span className="text-xs font-bold text-foreground block">{skill.canonicalName}</span>
                          <span className="text-[10px] text-muted-foreground">{skill.currentLevel} ({skill.currentScore}/100)</span>
                        </div>
                        <CheckCircle2 className="h-4 w-4 text-success" />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </>
      ) : (
        /* Multi-Role Comparison View */
        <div className="space-y-6">
          {/* Active Comparison Roles Selector */}
          <div className="p-4 bg-surface border border-border/40 rounded-2xl shadow-neo-raised space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                  <Layers className="h-4 w-4 text-primary" /> Compared Target Roles ({comparedRoles.length})
                </h3>
                <p className="text-xs text-muted-foreground">
                  Select 2 or more target roles to cross-compare your readiness, overlapping skills, and strategic learning priorities.
                </p>
              </div>

              {/* Add role input */}
              <div className="flex items-center gap-2 self-start sm:self-auto">
                <select
                  value={roleToAdd}
                  onChange={(e) => setRoleToAdd(e.target.value)}
                  className="bg-background text-foreground text-xs font-semibold border border-border/40 rounded-xl px-2.5 py-1.5 h-8 focus:outline-none focus:ring-1 focus:ring-primary max-w-[200px] truncate"
                >
                  <option value="">+ Add Role to Compare</option>
                  {catalogRolesList
                    .filter((r) => !comparedRoles.includes(r))
                    .map((r) => (
                      <option key={`add-${r}`} value={r}>
                        {r}
                      </option>
                    ))}
                </select>
                <Button
                  size="sm"
                  onClick={handleAddComparedRole}
                  disabled={!roleToAdd}
                  className="h-8 text-xs font-bold px-2.5"
                >
                  <Plus className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>

            {/* Role Chips */}
            <div className="flex flex-wrap items-center gap-2 pt-1">
              {comparedRoles.map((role) => (
                <div
                  key={`chip-${role}`}
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-background border border-border/40 text-xs font-bold text-foreground shadow-neo-raised-sm"
                >
                  <span>{role}</span>
                  <button
                    onClick={() => handleRemoveComparedRole(role)}
                    className="text-muted-foreground hover:text-destructive p-0.5 rounded-full"
                    title="Remove role from comparison"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {isComparing ? (
            <div className="py-16 text-center text-sm text-muted-foreground space-y-2">
              <RefreshCw className="h-6 w-6 animate-spin mx-auto text-primary" />
              <p>Computing multi-role readiness and gap overlap...</p>
            </div>
          ) : !comparisonData || comparisonData.rolesSummary.length === 0 ? (
            <div className="py-16 text-center border border-border/40 bg-surface rounded-2xl p-8 space-y-3">
              <Info className="h-8 w-8 text-primary mx-auto" />
              <h3 className="text-base font-bold text-foreground">Select Roles to Compare</h3>
              <p className="text-xs text-muted-foreground max-w-md mx-auto">
                Add at least two career tracks from your target roles or the catalog to view multi-role benchmarks.
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* 1. Side-by-Side Readiness Cards */}
              <div className="space-y-3">
                <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                  <Target className="h-4 w-4 text-primary" /> Target Role Readiness Breakdown
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {comparisonData.rolesSummary.map((role) => (
                    <div
                      key={role.roleName}
                      className="p-5 bg-surface border border-border/40 rounded-2xl shadow-neo-raised space-y-4 flex flex-col justify-between"
                    >
                      <div className="space-y-2">
                        <div className="flex items-start justify-between gap-2">
                          <h4 className="text-base font-bold text-foreground">{role.roleName}</h4>
                          {role.benchmarkStatus === "validated" ? (
                            <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-md bg-success/15 text-success border border-success/30 shrink-0">
                              Validated
                            </span>
                          ) : (
                            <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-md bg-primary/15 text-primary border border-primary/30 shrink-0">
                              Rubric Pending
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground line-clamp-2">
                          {role.roleDescription || "Technical track requirements."}
                        </p>
                      </div>

                      <div className="p-3 bg-background/80 rounded-xl border border-border/30 flex items-center justify-between">
                        <div>
                          <span className="text-[10px] uppercase font-bold text-muted-foreground block">Role Readiness</span>
                          <span className="text-2xl font-black text-foreground">
                            {role.roleMatchPercentage !== null ? `${role.roleMatchPercentage}%` : "N/A"}
                          </span>
                        </div>
                        <div className="text-right text-xs">
                          <div className="text-success font-semibold">Met: {role.metSkillsCount}</div>
                          <div className="text-warning font-semibold">Gaps: {role.gapsCount}</div>
                        </div>
                      </div>

                      {role.topPriorityGap && (
                        <div className="text-xs p-2.5 rounded-xl bg-destructive/5 border border-destructive/20 text-muted-foreground">
                          <span className="font-bold text-destructive block">Top Priority Gap:</span>
                          <span className="font-semibold text-foreground">{role.topPriorityGap.canonicalName}</span>
                          <span className="text-[10px] block text-muted-foreground">({role.topPriorityGap.priority} Priority)</span>
                        </div>
                      )}

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedRole(role.roleName);
                          setViewMode("single");
                        }}
                        className="w-full text-xs font-semibold gap-1.5"
                      >
                        Deep Dive into {role.roleName} <ArrowRight className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>

              {/* 2. High-Leverage Skills Card (Key Phase 9 Feature) */}
              {comparisonData.highLeverageSkills && comparisonData.highLeverageSkills.length > 0 && (
                <div className="p-5 rounded-2xl border border-primary/30 bg-primary/5 shadow-neo-raised space-y-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="text-sm font-extrabold text-foreground flex items-center gap-2">
                        <Sparkles className="h-4 w-4 text-primary" /> High-Leverage Multi-Role Skills
                      </h3>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        These skills close gaps across multiple selected roles simultaneously. Mastering them yields the highest career efficiency!
                      </p>
                    </div>
                    <span className="text-[10px] font-black uppercase px-2.5 py-1 rounded-full bg-primary/20 text-primary border border-primary/30 shrink-0">
                      High ROI
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 pt-1">
                    {comparisonData.highLeverageSkills.map((skill) => (
                      <div
                        key={`hl-${skill.canonicalName}`}
                        className="p-4 rounded-xl bg-background border border-border/40 shadow-neo-raised-sm space-y-2 flex flex-col justify-between"
                      >
                        <div>
                          <div className="flex items-start justify-between gap-1">
                            <span className="text-sm font-bold text-foreground">{skill.canonicalName}</span>
                            <span className="text-[10px] font-black px-2 py-0.5 rounded bg-primary/15 text-primary border border-primary/30 uppercase shrink-0">
                              {skill.roleCount} Roles
                            </span>
                          </div>
                          <div className="flex flex-wrap gap-1 mt-1.5">
                            {skill.roles.map((r) => (
                              <span
                                key={r}
                                className="text-[10px] font-medium px-2 py-0.5 rounded bg-secondary text-muted-foreground"
                              >
                                {r}
                              </span>
                            ))}
                          </div>
                          {skill.observableEvidence && (
                            <p className="text-[11px] text-muted-foreground mt-2 line-clamp-2 italic">
                              "{skill.observableEvidence}"
                            </p>
                          )}
                        </div>

                        <div className="pt-2 border-t border-border/20 flex items-center justify-between">
                          <span className="text-[11px] text-muted-foreground font-medium">
                            Current: {skill.currentLevel || "None"}
                          </span>
                          <Link
                            to={skill.learningRoute || `/dashboard/edutube?search=${encodeURIComponent(skill.canonicalName)}`}
                            className="text-primary hover:text-primary/80 font-bold text-xs flex items-center gap-1 bg-primary/10 px-2 py-1 rounded-md"
                          >
                            <Video className="h-3 w-3" /> Learn on EduTube
                          </Link>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 3. Shared vs Role-Specific Skills Breakdown */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Shared Skills */}
                <div className="p-5 bg-surface border border-border/40 rounded-2xl shadow-neo-raised space-y-3">
                  <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-primary" /> Common Skills Across Tracks ({comparisonData.sharedSkills.length})
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    Skills required by two or more of your compared career tracks.
                  </p>

                  <div className="space-y-2 max-h-[380px] overflow-y-auto pr-1">
                    {comparisonData.sharedSkills.map((s) => {
                      const isFullyMet = s.rolesMissing.length === 0;
                      return (
                        <div
                          key={`shared-${s.canonicalName}`}
                          className={`p-3 rounded-xl border flex items-center justify-between gap-3 text-xs ${
                            isFullyMet
                              ? "bg-success/5 border-success/30"
                              : "bg-background border-border/30"
                          }`}
                        >
                          <div>
                            <span className="font-bold text-foreground block">{s.canonicalName}</span>
                            <span className="text-[10px] text-muted-foreground">
                              Required by: {s.rolesRequiring.join(", ")}
                            </span>
                          </div>
                          <div className="text-right shrink-0">
                            {isFullyMet ? (
                              <span className="text-success font-bold flex items-center gap-1">
                                <CheckCircle2 className="h-3.5 w-3.5" /> Met
                              </span>
                            ) : (
                              <span className="text-warning font-bold">
                                Missing in {s.rolesMissing.length} role(s)
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Role-Specific Skills */}
                <div className="p-5 bg-surface border border-border/40 rounded-2xl shadow-neo-raised space-y-3">
                  <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                    <Compass className="h-4 w-4 text-primary" /> Role-Specific Specializations
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    Distinct technologies unique to a single career track.
                  </p>

                  <div className="space-y-3 max-h-[380px] overflow-y-auto pr-1">
                    {Object.entries(comparisonData.roleSpecificSkills).map(([roleName, skills]) => (
                      <div key={`spec-${roleName}`} className="space-y-1.5">
                        <span className="text-xs font-bold text-foreground block border-b border-border/20 pb-1">
                          {roleName} ({skills.length})
                        </span>
                        <div className="flex flex-wrap gap-1.5">
                          {skills.map((s) => (
                            <span
                              key={`spec-pill-${s.canonicalName}`}
                              className="text-[11px] font-medium px-2 py-0.5 rounded-lg bg-background border border-border/30 text-foreground"
                            >
                              {s.canonicalName}
                            </span>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* 4. Top Combined Gaps Backlog */}
              {comparisonData.topCombinedGaps && comparisonData.topCombinedGaps.length > 0 && (
                <div className="space-y-3">
                  <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 text-warning" /> Prioritized Cross-Role Action Backlog ({comparisonData.topCombinedGaps.length})
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {comparisonData.topCombinedGaps.slice(0, 8).map((gap) => (
                      <div
                        key={`comb-gap-${gap.canonicalName}`}
                        className="p-4 rounded-xl border border-border/40 bg-surface shadow-neo-raised-sm flex flex-col justify-between gap-3"
                      >
                        <div>
                          <div className="flex items-start justify-between">
                            <span className="text-sm font-bold text-foreground">{gap.canonicalName}</span>
                            <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded bg-warning/10 text-warning border border-warning/20">
                              {gap.priority}
                            </span>
                          </div>
                          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{gap.reason}</p>
                          <div className="flex flex-wrap gap-1 mt-2">
                            <span className="text-[10px] text-muted-foreground font-semibold">Impacts:</span>
                            {gap.affectedRoles?.map((r) => (
                              <span
                                key={`aff-${r}`}
                                className="text-[10px] font-bold px-2 py-0.5 rounded bg-secondary text-primary"
                              >
                                {r}
                              </span>
                            ))}
                          </div>
                        </div>

                        <div className="pt-2 border-t border-border/20 flex items-center justify-between text-xs">
                          <Link
                            to={gap.learningRoute || `/dashboard/edutube?search=${encodeURIComponent(gap.canonicalName)}`}
                            className="text-primary hover:text-primary/80 font-bold flex items-center gap-1 bg-primary/10 px-2 py-1 rounded-md"
                          >
                            <Video className="h-3 w-3" /> Learn on EduTube
                          </Link>
                          <Link
                            to="/dashboard/roadmap"
                            className="text-foreground hover:underline font-semibold flex items-center gap-1"
                          >
                            Action Plan <ArrowRight className="h-3 w-3" />
                          </Link>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SkillGapsPage;
