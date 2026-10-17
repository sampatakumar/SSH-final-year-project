import React, { useState, useEffect, useMemo } from "react";
import {
  GraduationCap,
  Sparkles,
  BookOpen,
  Target,
  Building,
  Calendar,
  Check,
  Plus,
  X,
  Search,
  Loader2,
  RefreshCw,
  ArrowRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import {
  academicApi,
  type AcademicOptionsResponse,
  type CareerRoleOption,
} from "@/modules/profile/services/academic.api";

export interface AcademicState {
  degreeSlug: string;
  degreeName: string;
  branchSlug: string;
  branchName: string;
  specializationSlug: string;
  specializationName: string;
  currentYear: number | null;
  currentSemester: number | null;
  institution: string;
}

interface AcademicBackgroundStepProps {
  academic: AcademicState;
  setAcademic: React.Dispatch<React.SetStateAction<AcademicState>>;
  targetRoles: string[];
  setTargetRoles: React.Dispatch<React.SetStateAction<string[]>>;
  onSkip: () => void;
}

export const AcademicBackgroundStep: React.FC<AcademicBackgroundStepProps> = ({
  academic,
  setAcademic,
  targetRoles,
  setTargetRoles,
  onSkip,
}) => {
  const [catalog, setCatalog] = useState<AcademicOptionsResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [roleSearch, setRoleSearch] = useState("");
  const [branchRoles, setBranchRoles] = useState<CareerRoleOption[]>([]);

  // Load catalog options
  const fetchCatalog = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const options = await academicApi.getOptions();
      setCatalog(options);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to load academic catalog. You can skip this step or retry."
      );
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void fetchCatalog();
  }, []);

  // Fetch branch-recommended roles when branchSlug changes
  useEffect(() => {
    if (!academic.branchSlug) {
      setBranchRoles([]);
      return;
    }
    let isMounted = true;
    academicApi
      .getBranchRoles(academic.branchSlug)
      .then((roles) => {
        if (isMounted) setBranchRoles(roles || []);
      })
      .catch(() => {
        // Fallback gracefully without breaking UI
      });
    return () => {
      isMounted = false;
    };
  }, [academic.branchSlug]);

  // Selected Degree configuration
  const selectedDegree = useMemo(() => {
    return catalog?.degrees.find((d) => d.slug === academic.degreeSlug);
  }, [catalog, academic.degreeSlug]);

  // Filter branches by selected degree
  const filteredBranches = useMemo(() => {
    if (!catalog?.branches) return [];
    if (!academic.degreeSlug) return catalog.branches;
    return catalog.branches.filter(
      (b) =>
        !b.degreeSlugs ||
        b.degreeSlugs.length === 0 ||
        b.degreeSlugs.includes(academic.degreeSlug)
    );
  }, [catalog, academic.degreeSlug]);

  // Selected Branch configuration
  const selectedBranch = useMemo(() => {
    return catalog?.branches.find((b) => b.slug === academic.branchSlug);
  }, [catalog, academic.branchSlug]);

  // Available specializations for selected branch
  const availableSpecializations = useMemo(() => {
    return selectedBranch?.specializations || [];
  }, [selectedBranch]);

  // Handlers for cascading dropdowns
  const handleDegreeChange = (degreeSlug: string) => {
    const deg = catalog?.degrees.find((d) => d.slug === degreeSlug);
    setAcademic((prev) => {
      // Check if current branch is still valid for this degree
      const branchStillValid = catalog?.branches.some(
        (b) =>
          b.slug === prev.branchSlug &&
          (!b.degreeSlugs || b.degreeSlugs.includes(degreeSlug))
      );

      return {
        ...prev,
        degreeSlug,
        degreeName: deg?.name || "",
        branchSlug: branchStillValid ? prev.branchSlug : "",
        branchName: branchStillValid ? prev.branchName : "",
        specializationSlug: branchStillValid ? prev.specializationSlug : "",
        specializationName: branchStillValid ? prev.specializationName : "",
      };
    });
  };

  const handleBranchChange = (branchSlug: string) => {
    const branch = catalog?.branches.find((b) => b.slug === branchSlug);
    setAcademic((prev) => ({
      ...prev,
      branchSlug,
      branchName: branch?.name || "",
      specializationSlug: "",
      specializationName: "",
    }));
  };

  const handleSpecializationChange = (specSlug: string) => {
    const spec = availableSpecializations.find((s) => s.slug === specSlug);
    setAcademic((prev) => ({
      ...prev,
      specializationSlug: specSlug,
      specializationName: spec?.name || "",
    }));
  };

  // Toggle career goal in multi-select targetRoles
  const toggleRole = (title: string) => {
    setTargetRoles((prev) =>
      prev.includes(title) ? prev.filter((r) => r !== title) : [...prev, title]
    );
  };

  // Filter career roles by search term
  const allRoles = useMemo(() => {
    const catalogRoles = catalog?.careerRoles || [];
    // Prioritize branch roles at the top if present
    const combined = [...catalogRoles];
    if (branchRoles.length > 0) {
      for (const br of branchRoles) {
        if (!combined.some((r) => r.title.toLowerCase() === br.title.toLowerCase())) {
          combined.push(br);
        }
      }
    }
    return combined;
  }, [catalog, branchRoles]);

  const displayedRoles = useMemo(() => {
    if (!roleSearch.trim()) return allRoles.slice(0, 18);
    const q = roleSearch.toLowerCase();
    return allRoles.filter(
      (r) =>
        r.title.toLowerCase().includes(q) ||
        r.category?.toLowerCase().includes(q) ||
        r.coreSkills?.some((s) => s.toLowerCase().includes(q))
    );
  }, [allRoles, roleSearch]);

  const maxYears = selectedDegree?.durationYears || 4;
  const maxSemesters = selectedDegree?.totalSemesters || 8;

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/20 pb-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-primary/10 text-primary border border-primary/20">
            <GraduationCap className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-foreground">
                Academic Background & Career Goals
              </h2>
              <span className="text-[10px] font-bold uppercase tracking-wider bg-muted text-muted-foreground px-2 py-0.5 rounded-full border border-border/30">
                Optional
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              Calibrate learning benchmarks, skill gap metrics, and role requirements for your discipline.
            </p>
          </div>
        </div>

        {/* Clear Skip Option */}
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={onSkip}
          className="text-xs text-muted-foreground hover:text-foreground hover:bg-muted/40 gap-1 self-start sm:self-center shrink-0 border border-border/40"
        >
          <span>Skip this step</span>
          <ArrowRight className="h-3.5 w-3.5" />
        </Button>
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center p-12 space-y-3">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
          <p className="text-xs text-muted-foreground">Loading academic options catalog...</p>
        </div>
      ) : error ? (
        <div className="p-6 rounded-2xl border border-destructive/20 bg-destructive/5 text-center space-y-3">
          <p className="text-xs text-destructive">{error}</p>
          <div className="flex items-center justify-center gap-3">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={fetchCatalog}
              className="text-xs gap-1.5"
            >
              <RefreshCw className="h-3 w-3" />
              Retry Catalog
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onSkip}
              className="text-xs"
            >
              Skip and Continue
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-5">
          {/* Degree & Branch Selectors */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Degree Selection */}
            <div className="space-y-1.5">
              <label
                htmlFor="onboarding-degree-select"
                className="text-xs font-bold uppercase tracking-wider text-muted-foreground ml-1 flex items-center gap-1.5"
              >
                <BookOpen className="h-3.5 w-3.5 text-primary" />
                Degree Program
              </label>
              <select
                id="onboarding-degree-select"
                value={academic.degreeSlug}
                onChange={(e) => handleDegreeChange(e.target.value)}
                className="w-full h-11 px-3 rounded-xl border border-border/50 bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 shadow-neo-raised-sm"
              >
                <option value="">Select Degree (e.g. B.Tech, M.Tech)...</option>
                {catalog?.degrees.map((deg) => (
                  <option key={deg.slug} value={deg.slug}>
                    {deg.name} ({deg.shortName})
                  </option>
                ))}
              </select>
            </div>

            {/* Branch Selection (Filtered by Degree) */}
            <div className="space-y-1.5">
              <label
                htmlFor="onboarding-branch-select"
                className="text-xs font-bold uppercase tracking-wider text-muted-foreground ml-1 flex items-center gap-1.5"
              >
                <Sparkles className="h-3.5 w-3.5 text-primary" />
                Academic Branch
              </label>
              <select
                id="onboarding-branch-select"
                value={academic.branchSlug}
                onChange={(e) => handleBranchChange(e.target.value)}
                className="w-full h-11 px-3 rounded-xl border border-border/50 bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 shadow-neo-raised-sm"
              >
                <option value="">
                  {academic.degreeSlug ? "Select Branch..." : "Select Degree first (or pick any branch)..."}
                </option>
                {filteredBranches.map((branch) => (
                  <option key={branch.slug} value={branch.slug}>
                    {branch.name} ({branch.code})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Specialization & Institution */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Specialization Selection */}
            <div className="space-y-1.5">
              <label
                htmlFor="onboarding-spec-select"
                className="text-xs font-bold uppercase tracking-wider text-muted-foreground ml-1"
              >
                Specialization / Track
              </label>
              <select
                id="onboarding-spec-select"
                value={academic.specializationSlug}
                onChange={(e) => handleSpecializationChange(e.target.value)}
                disabled={availableSpecializations.length === 0}
                className={cn(
                  "w-full h-11 px-3 rounded-xl border border-border/50 bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 shadow-neo-raised-sm",
                  availableSpecializations.length === 0 && "opacity-60 cursor-not-allowed"
                )}
              >
                <option value="">
                  {availableSpecializations.length > 0
                    ? "Select Specialization (Optional)..."
                    : "Standard / No specializations listed"}
                </option>
                {availableSpecializations.map((spec) => (
                  <option key={spec.slug} value={spec.slug}>
                    {spec.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Institution / University */}
            <div className="space-y-1.5">
              <label
                htmlFor="onboarding-institution-input"
                className="text-xs font-bold uppercase tracking-wider text-muted-foreground ml-1 flex items-center gap-1.5"
              >
                <Building className="h-3.5 w-3.5 text-primary" />
                Institution / University
              </label>
              <Input
                id="onboarding-institution-input"
                placeholder="e.g. Indian Institute of Technology"
                value={academic.institution}
                onChange={(e) =>
                  setAcademic((prev) => ({ ...prev, institution: e.target.value }))
                }
                className="h-11 rounded-xl shadow-neo-raised-sm"
              />
            </div>
          </div>

          {/* Academic Year and Semester */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label
                htmlFor="onboarding-year-select"
                className="text-xs font-bold uppercase tracking-wider text-muted-foreground ml-1 flex items-center gap-1.5"
              >
                <Calendar className="h-3.5 w-3.5 text-primary" />
                Current Year
              </label>
              <select
                id="onboarding-year-select"
                value={academic.currentYear || ""}
                onChange={(e) =>
                  setAcademic((prev) => ({
                    ...prev,
                    currentYear: e.target.value ? parseInt(e.target.value, 10) : null,
                  }))
                }
                className="w-full h-11 px-3 rounded-xl border border-border/50 bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 shadow-neo-raised-sm"
              >
                <option value="">Select Year...</option>
                {Array.from({ length: maxYears }, (_, i) => i + 1).map((yr) => (
                  <option key={yr} value={yr}>
                    Year {yr}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label
                htmlFor="onboarding-semester-select"
                className="text-xs font-bold uppercase tracking-wider text-muted-foreground ml-1"
              >
                Current Semester
              </label>
              <select
                id="onboarding-semester-select"
                value={academic.currentSemester || ""}
                onChange={(e) =>
                  setAcademic((prev) => ({
                    ...prev,
                    currentSemester: e.target.value ? parseInt(e.target.value, 10) : null,
                  }))
                }
                className="w-full h-11 px-3 rounded-xl border border-border/50 bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 shadow-neo-raised-sm"
              >
                <option value="">Select Semester...</option>
                {Array.from({ length: maxSemesters }, (_, i) => i + 1).map((sem) => (
                  <option key={sem} value={sem}>
                    Semester {sem}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Multi-Select Career Goals Section */}
          <div className="space-y-3 pt-2 border-t border-border/20">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground ml-1 flex items-center gap-1.5">
                  <Target className="h-3.5 w-3.5 text-primary" />
                  Target Career Goals (Multi-Select)
                </label>
                <p className="text-[11px] text-muted-foreground ml-1">
                  Select one or more roles to compare benchmark expectations and multi-role skill leverage.
                </p>
              </div>

              {/* Quick Search */}
              <div className="relative w-full sm:w-48">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <Input
                  placeholder="Filter roles..."
                  value={roleSearch}
                  onChange={(e) => setRoleSearch(e.target.value)}
                  className="h-8 pl-8 text-xs rounded-lg"
                />
              </div>
            </div>

            {/* Selected Roles Badges */}
            {targetRoles.length > 0 && (
              <div className="flex flex-wrap gap-1.5 p-2 rounded-xl bg-primary/5 border border-primary/20">
                <span className="text-[11px] font-semibold text-primary self-center mr-1">
                  Selected ({targetRoles.length}):
                </span>
                {targetRoles.map((role) => (
                  <span
                    key={role}
                    className="inline-flex items-center gap-1 text-xs font-medium px-2.5 py-0.5 rounded-full bg-primary text-primary-foreground shadow-sm"
                  >
                    {role}
                    <button
                      type="button"
                      onClick={() => toggleRole(role)}
                      className="hover:opacity-75 focus:outline-none ml-0.5"
                      aria-label={`Remove ${role}`}
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}

            {/* Role Options Chips */}
            <div className="max-h-48 overflow-y-auto p-1 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 custom-scrollbar">
              {displayedRoles.map((role) => {
                const isSelected = targetRoles.includes(role.title);
                return (
                  <button
                    key={role.slug || role.title}
                    type="button"
                    onClick={() => toggleRole(role.title)}
                    className={cn(
                      "text-left p-2.5 rounded-xl border text-xs transition-all flex items-center justify-between group",
                      isSelected
                        ? "border-primary bg-primary/10 text-primary font-semibold shadow-neo-pressed"
                        : "border-border/40 bg-background/50 hover:border-primary/40 hover:bg-muted/30 text-muted-foreground hover:text-foreground"
                    )}
                  >
                    <span className="truncate pr-1">{role.title}</span>
                    {isSelected ? (
                      <Check className="h-3.5 w-3.5 shrink-0 text-primary" />
                    ) : (
                      <Plus className="h-3.5 w-3.5 shrink-0 opacity-40 group-hover:opacity-100" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AcademicBackgroundStep;
