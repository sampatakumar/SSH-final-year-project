import React, { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { PracticalLab, PracticalLabAttempt } from "../modules/labs/types/practicalLab.types";
import { practicalLabApi } from "../modules/labs/services/practicalLab.api";
import { LabCard } from "../modules/labs/components/LabCard";
import { LabWorkspace } from "../modules/labs/components/LabWorkspace";
import { LabHistoryView } from "../modules/labs/components/LabHistoryView";
import { useAuth } from "../core/auth/AuthContext";
import {
  FlaskConical,
  Search,
  Filter,
  History,
  Grid,
  AlertCircle,
  RefreshCw,
  Sparkles,
} from "lucide-react";

const DISCIPLINE_FILTERS = [
  { id: "all", label: "All Disciplines" },
  { id: "cse", label: "CSE / IT" },
  { id: "mech", label: "Mechanical" },
  { id: "ece", label: "ECE / EEE" },
  { id: "civil", label: "Civil" },
  { id: "chem", label: "Chemical" },
  { id: "biotech", label: "Biotech" },
  { id: "business", label: "Business / MBA" },
  { id: "finance", label: "Finance / B.Com" },
  { id: "arts", label: "Arts / Humanities" },
  { id: "nursing", label: "Nursing / Health" },
];

export const PracticalLabsPage: React.FC = () => {
  const { firebaseUser, backendUser } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();

  const [activeTab, setActiveTab] = useState<"catalog" | "history">("catalog");
  const [selectedBranch, setSelectedBranch] = useState<string>("all");
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");

  const [labs, setLabs] = useState<PracticalLab[]>([]);
  const [attempts, setAttempts] = useState<PracticalLabAttempt[]>([]);
  const [activeLab, setActiveLab] = useState<PracticalLab | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Sync token helper
  const getToken = async () => {
    if (!firebaseUser) return undefined;
    return await firebaseUser.getIdToken();
  };

  // Fetch labs catalog
  const loadLabs = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = await getToken();
      const res = await practicalLabApi.fetchLabCatalog(token, {
        branch: selectedBranch !== "all" ? selectedBranch : undefined,
        difficulty: selectedDifficulty !== "all" ? selectedDifficulty : undefined,
        search: searchQuery.trim() || undefined,
      });
      setLabs(res.labs || []);

      // If URL param `labId` is present, automatically open the workspace
      const urlLabId = searchParams.get("labId");
      if (urlLabId) {
        const found = (res.labs || []).find((l) => l.labId === urlLabId);
        if (found) {
          setActiveLab(found);
        } else {
          // Attempt to fetch single directly
          try {
            const single = await practicalLabApi.fetchLabById(urlLabId, token);
            setActiveLab(single);
          } catch {
            // Lab not found
          }
        }
      }
    } catch (err: any) {
      setError(err.message || "Failed to load practical labs catalog.");
    } finally {
      setLoading(false);
    }
  };

  // Fetch attempt history
  const loadHistory = async () => {
    if (!firebaseUser) return;
    try {
      const token = await getToken();
      const history = await practicalLabApi.fetchUserLabHistory(token);
      setAttempts(history || []);
    } catch (err) {
      // Non-blocking history fetch error
    }
  };

  useEffect(() => {
    loadLabs();
    loadHistory();
  }, [selectedBranch, selectedDifficulty, searchQuery]);

  const handleSelectLab = (labId: string) => {
    const found = labs.find((l) => l.labId === labId);
    if (found) {
      setActiveLab(found);
      setSearchParams({ labId });
    }
  };

  const handleBackToCatalog = () => {
    setActiveLab(null);
    setSearchParams({});
    loadHistory();
  };

  const handleAttemptCompleted = (newAttempt: PracticalLabAttempt) => {
    setAttempts((prev) => [newAttempt, ...prev]);
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl space-y-6">
      {/* Active Lab Workspace View */}
      {activeLab ? (
        <LabWorkspace
          lab={activeLab}
          token={firebaseUser ? undefined : undefined} // Handled by apiRequest internal token
          onBack={handleBackToCatalog}
          onAttemptCompleted={handleAttemptCompleted}
        />
      ) : (
        <>
          {/* Page Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border pb-6">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary mb-2">
                <FlaskConical className="h-3.5 w-3.5" />
                <span>Phase 46 • Practical Learning Framework</span>
              </div>
              <h1 className="text-3xl font-bold tracking-tight text-foreground">
                Branch-Aware Practical Labs
              </h1>
              <p className="mt-1 text-sm text-muted-foreground max-w-2xl">
                Engage in interactive discipline-specific calculations, engineering trade-offs, and clinical reasoning. Verified outcomes feed directly into your personalized skill evidence.
              </p>
            </div>

            {/* Navigation Tabs */}
            <div className="flex items-center rounded-lg border border-border bg-muted p-1">
              <button
                onClick={() => setActiveTab("catalog")}
                className={`inline-flex items-center gap-2 rounded-md px-3.5 py-1.5 text-xs font-semibold transition-colors ${
                  activeTab === "catalog"
                    ? "bg-card text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Grid className="h-3.5 w-3.5" />
                <span>Catalog ({labs.length})</span>
              </button>
              <button
                onClick={() => {
                  setActiveTab("history");
                  loadHistory();
                }}
                className={`inline-flex items-center gap-2 rounded-md px-3.5 py-1.5 text-xs font-semibold transition-colors ${
                  activeTab === "history"
                    ? "bg-card text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <History className="h-3.5 w-3.5" />
                <span>My Attempts ({attempts.length})</span>
              </button>
            </div>
          </div>

          {/* Catalog Tab Content */}
          {activeTab === "catalog" ? (
            <div className="space-y-6">
              {/* Discipline Filter Scrollable Pill Bar */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-2 scrollbar-none">
                {DISCIPLINE_FILTERS.map((f) => (
                  <button
                    key={f.id}
                    onClick={() => setSelectedBranch(f.id)}
                    className={`whitespace-nowrap rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                      selectedBranch === f.id
                        ? "bg-primary text-primary-foreground shadow-sm"
                        : "border border-border bg-card text-muted-foreground hover:bg-muted hover:text-foreground"
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>

              {/* Filters & Search Row */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="relative w-full sm:w-80">
                  <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  <input
                    type="text"
                    placeholder="Search by skill, topic, or formula..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full rounded-lg border border-border bg-background pl-9 pr-4 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-medium">
                    <Filter className="h-3.5 w-3.5" />
                    <span>Difficulty:</span>
                  </div>
                  <select
                    value={selectedDifficulty}
                    onChange={(e) => setSelectedDifficulty(e.target.value)}
                    className="rounded-lg border border-border bg-card px-3 py-1.5 text-xs text-foreground focus:border-primary focus:outline-none"
                  >
                    <option value="all">All Difficulties</option>
                    <option value="Beginner">Beginner</option>
                    <option value="Intermediate">Intermediate</option>
                    <option value="Advanced">Advanced</option>
                  </select>
                </div>
              </div>

              {/* Error Banner */}
              {error && (
                <div className="rounded-lg border border-rose-500/20 bg-rose-500/10 p-4 text-xs text-rose-600 dark:text-rose-400 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="h-4 w-4" />
                    <span>{error}</span>
                  </div>
                  <button
                    onClick={loadLabs}
                    className="inline-flex items-center gap-1 rounded bg-card px-2 py-1 text-xs font-semibold hover:bg-muted"
                  >
                    <RefreshCw className="h-3 w-3" />
                    <span>Retry</span>
                  </button>
                </div>
              )}

              {/* Loading State */}
              {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {[1, 2, 3, 4, 5, 6].map((n) => (
                    <div
                      key={n}
                      className="h-64 rounded-xl border border-border/60 bg-muted/30 animate-pulse p-6"
                    />
                  ))}
                </div>
              ) : labs.length === 0 ? (
                <div className="rounded-xl border border-dashed border-border p-12 text-center">
                  <FlaskConical className="mx-auto h-12 w-12 text-muted-foreground/40 mb-3" />
                  <h3 className="text-base font-semibold text-foreground">No Practical Labs Found</h3>
                  <p className="mt-1 text-xs text-muted-foreground max-w-sm mx-auto">
                    No active practical labs match your selected discipline or search criteria. Try selecting "All Disciplines" or clearing your query.
                  </p>
                  <button
                    onClick={() => {
                      setSelectedBranch("all");
                      setSelectedDifficulty("all");
                      setSearchQuery("");
                    }}
                    className="mt-4 rounded-lg border border-border bg-card px-3.5 py-1.5 text-xs font-semibold text-foreground hover:bg-muted"
                  >
                    Reset Filters
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {labs.map((lab) => (
                    <LabCard key={lab.labId} lab={lab} onSelect={handleSelectLab} />
                  ))}
                </div>
              )}
            </div>
          ) : (
            /* History Tab Content */
            <div className="space-y-4">
              <LabHistoryView
                attempts={attempts}
                onSelectAttempt={(attempt) => {
                  handleSelectLab(attempt.labId);
                }}
                onExploreLabs={() => setActiveTab("catalog")}
              />
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default PracticalLabsPage;
