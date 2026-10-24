import React, { useState, useEffect } from "react";
import { CareerRole } from "../modules/career/types/careerPathway.types";
import { careerPathwayApi } from "../modules/career/services/careerPathway.api";
import { RoleCard } from "../modules/career/components/RoleCard";
import { RoleDetailModal } from "../modules/career/components/RoleDetailModal";
import { RoleComparisonModal } from "../modules/career/components/RoleComparisonModal";
import { PreparationPlanModal } from "../modules/career/components/PreparationPlanModal";
import { useAuth } from "../core/auth/AuthContext";
import {
  Compass,
  Search,
  Filter,
  RefreshCw,
  AlertCircle,
  Sparkles,
  Layers,
  ArrowRight,
  X,
  SlidersHorizontal,
} from "lucide-react";

const DISCIPLINE_FAMILY_TABS = [
  { id: "all", label: "All Disciplines" },
  { id: "Software & Computing", label: "CSE & IT" },
  { id: "Mechanical & Manufacturing", label: "Mechanical" },
  { id: "Electronics & Embedded", label: "ECE & EEE" },
  { id: "Civil & Infrastructure", label: "Civil" },
  { id: "Chemical & Process Engineering", label: "Chemical" },
  { id: "Biotechnology & Life Sciences", label: "Biotech" },
  { id: "Business & Management", label: "Business / MBA" },
  { id: "Commerce & Financial Services", label: "Finance / Commerce" },
  { id: "Arts, Media & Humanities", label: "Arts & Humanities" },
  { id: "Nursing & Allied Health", label: "Nursing & Allied Health" },
];

export const CareerPathwayStudioPage: React.FC = () => {
  const { backendUser } = useAuth();

  const [roles, setRoles] = useState<CareerRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [selectedFamily, setSelectedFamily] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [includeCrossDisciplinary, setIncludeCrossDisciplinary] = useState<boolean>(true);

  // Modals state
  const [inspectedRole, setInspectedRole] = useState<CareerRole | null>(null);
  const [planRoleId, setPlanRoleId] = useState<string | null>(null);

  // Comparison selection (max 2 roles)
  const [compareSelection, setCompareSelection] = useState<string[]>([]);
  const [isComparisonOpen, setIsComparisonOpen] = useState(false);

  const studentBranch = backendUser?.academic?.branch || backendUser?.branch || null;

  const loadRoles = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await careerPathwayApi.getCareerRoles({
        branch: studentBranch || undefined,
        roleFamily: selectedFamily !== "all" ? selectedFamily : undefined,
        search: searchQuery.trim() || undefined,
        includeCrossDisciplinary,
      });
      setRoles(data.roles || []);
    } catch (err: any) {
      setError(err.message || "Failed to load career pathways.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRoles();
  }, [selectedFamily, includeCrossDisciplinary, studentBranch]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadRoles();
  };

  const handleToggleCompare = (roleId: string) => {
    setCompareSelection((prev) => {
      if (prev.includes(roleId)) {
        return prev.filter((id) => id !== roleId);
      }
      if (prev.length < 2) {
        return [...prev, roleId];
      }
      return prev;
    });
  };

  const handleClearCompare = () => {
    setCompareSelection([]);
  };

  return (
    <div className="min-h-screen bg-background text-foreground p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-8">
      {/* Page Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-primary/10 via-card to-background border border-border p-6 sm:p-8">
        <div className="max-w-3xl space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-primary/10 text-primary border border-primary/20">
            <Compass className="w-3.5 h-3.5" />
            Multi-Branch Career Pathway Studio
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground">
            Evidence-Based Career Pathways
          </h1>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Discover career tracks tailored to your academic discipline, compare skill requirements side by side, evaluate your verified learning evidence, and receive practical platform preparation plans.
          </p>
          {studentBranch && (
            <div className="pt-1 flex items-center gap-2 text-xs text-muted-foreground">
              <span>Your academic degree alignment:</span>
              <span className="font-semibold px-2 py-0.5 rounded bg-muted text-foreground uppercase">
                {studentBranch}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="space-y-4">
        {/* Search input + Cross-Disciplinary Toggle */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <form onSubmit={handleSearchSubmit} className="relative w-full sm:max-w-md">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search pathways by title, core skill, or domain..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-xs rounded-xl border border-border bg-card text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </form>

          <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-end">
            <label className="flex items-center gap-2 text-xs text-muted-foreground cursor-pointer select-none">
              <input
                type="checkbox"
                checked={includeCrossDisciplinary}
                onChange={(e) => setIncludeCrossDisciplinary(e.target.checked)}
                className="rounded border-border text-primary focus:ring-primary/50"
              />
              <span>Include Transferable Pathways</span>
            </label>

            <button
              type="button"
              onClick={loadRoles}
              className="p-2 rounded-lg border border-border bg-card text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              title="Refresh catalog"
              aria-label="Refresh catalog"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Discipline Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-2 scrollbar-none border-b border-border">
          {DISCIPLINE_FAMILY_TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setSelectedFamily(tab.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                selectedFamily === tab.id
                  ? "bg-primary text-primary-foreground font-semibold shadow-sm"
                  : "bg-card text-muted-foreground hover:text-foreground hover:bg-muted border border-border"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Floating Comparison Action Bar */}
      {compareSelection.length > 0 && (
        <div className="sticky bottom-6 z-40 p-4 rounded-xl border border-primary/30 bg-card/95 backdrop-blur shadow-2xl flex flex-wrap items-center justify-between gap-4 animate-in slide-in-from-bottom duration-200">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
              <Layers className="w-4 h-4" />
            </div>
            <div>
              <span className="font-semibold text-xs text-foreground block">
                {compareSelection.length} of 2 tracks selected for comparison
              </span>
              <span className="text-[11px] text-muted-foreground">
                {compareSelection.length === 1
                  ? "Select one more track to unlock side-by-side gap analysis."
                  : "Ready to inspect overlapping competencies and readiness deltas."}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleClearCompare}
              className="px-3 py-1.5 rounded-lg text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            >
              Clear Selection
            </button>
            <button
              type="button"
              disabled={compareSelection.length < 2}
              onClick={() => setIsComparisonOpen(true)}
              className={`px-4 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                compareSelection.length === 2
                  ? "bg-primary text-primary-foreground hover:bg-primary/90 shadow-md shadow-primary/20"
                  : "bg-muted text-muted-foreground cursor-not-allowed"
              }`}
            >
              <span>Compare Side-by-Side</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Roles Grid / Content States */}
      {loading ? (
        <div className="py-24 flex flex-col items-center justify-center text-muted-foreground gap-3">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          <span className="text-xs">Loading career pathways catalog...</span>
        </div>
      ) : error ? (
        <div className="p-8 rounded-2xl bg-destructive/10 border border-destructive/20 text-center space-y-3">
          <AlertCircle className="w-8 h-8 text-destructive mx-auto" />
          <p className="text-sm text-destructive font-semibold">{error}</p>
          <button
            type="button"
            onClick={loadRoles}
            className="px-4 py-2 rounded-lg text-xs font-medium bg-destructive text-destructive-foreground hover:bg-destructive/90 transition-colors"
          >
            Try Again
          </button>
        </div>
      ) : roles.length === 0 ? (
        <div className="py-24 text-center space-y-3 border border-dashed border-border rounded-2xl">
          <Compass className="w-10 h-10 text-muted-foreground mx-auto" />
          <h3 className="text-base font-bold text-foreground">No Career Pathways Found</h3>
          <p className="text-xs text-muted-foreground max-w-sm mx-auto">
            No roles matched your search criteria. Try selecting "All Disciplines" or clearing your search keywords.
          </p>
          <button
            type="button"
            onClick={() => {
              setSelectedFamily("all");
              setSearchQuery("");
            }}
            className="px-4 py-2 rounded-lg text-xs font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            Reset All Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {roles.map((role) => (
            <RoleCard
              key={role.roleId}
              role={role}
              isSelectedForCompare={compareSelection.includes(role.roleId)}
              onToggleCompare={handleToggleCompare}
              onInspect={(r) => setInspectedRole(r)}
              onViewPlan={(r) => setPlanRoleId(r.roleId)}
              canCompare={compareSelection.length < 2 || compareSelection.includes(role.roleId)}
            />
          ))}
        </div>
      )}

      {/* Detail Modal */}
      <RoleDetailModal
        role={inspectedRole}
        isOpen={Boolean(inspectedRole)}
        onClose={() => setInspectedRole(null)}
        onOpenPlan={(r) => {
          setInspectedRole(null);
          setPlanRoleId(r.roleId);
        }}
      />

      {/* Side-by-Side Comparison Modal */}
      <RoleComparisonModal
        role1Id={compareSelection[0] || null}
        role2Id={compareSelection[1] || null}
        isOpen={isComparisonOpen}
        onClose={() => setIsComparisonOpen(false)}
        onViewPlan={(roleId) => {
          setIsComparisonOpen(false);
          setPlanRoleId(roleId);
        }}
      />

      {/* Preparation Plan Modal */}
      <PreparationPlanModal
        roleId={planRoleId}
        isOpen={Boolean(planRoleId)}
        onClose={() => setPlanRoleId(null)}
      />
    </div>
  );
};

export default CareerPathwayStudioPage;
