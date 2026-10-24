import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { CanonicalTool } from "../modules/tools/types/tools.types";
import { toolsApi } from "../modules/tools/services/tools.api";
import { ToolCard } from "../modules/tools/components/ToolCard";
import { ToolActivityHistoryDrawer } from "../modules/tools/components/ToolActivityHistoryDrawer";
import { useAuth } from "../core/auth/AuthContext";
import {
  Wrench,
  Search,
  Filter,
  RefreshCw,
  AlertCircle,
  Sparkles,
  Layers,
  History,
  GraduationCap,
  SlidersHorizontal,
} from "lucide-react";

const DISCIPLINE_TABS = [
  { id: "All", label: "All Disciplines" },
  { id: "Computer Science & IT", label: "CSE & IT" },
  { id: "Mechanical Engineering", label: "Mechanical" },
  { id: "ECE & EEE", label: "ECE & EEE" },
  { id: "Civil Engineering", label: "Civil" },
  { id: "Chemical Engineering", label: "Chemical" },
  { id: "Biotechnology", label: "Biotechnology" },
  { id: "Business & Management", label: "Business / MBA" },
  { id: "Commerce & Finance", label: "Finance / Commerce" },
  { id: "Arts & Humanities", label: "Arts & Humanities" },
  { id: "Nursing & Allied Health", label: "Nursing & Health" },
  { id: "Cross-Disciplinary / Shared", label: "Shared Cross-Branch" },
];

export const ToolHubPage: React.FC = () => {
  const navigate = useNavigate();
  const { backendUser } = useAuth();

  const [tools, setTools] = useState<CanonicalTool[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [selectedDiscipline, setSelectedDiscipline] = useState<string>("All");
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [categories, setCategories] = useState<string[]>([]);

  // History Drawer state
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);

  const studentBranch = backendUser?.academic?.branch || backendUser?.branch || null;

  const loadCatalog = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await toolsApi.getToolCatalog({
        discipline: selectedDiscipline !== "All" ? selectedDiscipline : undefined,
        category: selectedCategory !== "All" ? selectedCategory : undefined,
        search: searchQuery.trim() || undefined,
      });
      setTools(data.tools || []);
      if (data.availableCategories) {
        setCategories(data.availableCategories);
      }
    } catch (err: any) {
      setError(err.message || "Failed to load academic tools catalog.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCatalog();
  }, [selectedDiscipline, selectedCategory]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadCatalog();
  };

  const handleLaunchTool = (tool: CanonicalTool) => {
    if (tool.isExternalRoute) {
      navigate(tool.route);
    } else {
      navigate(tool.route);
    }
  };

  // Check if tool is recommended for logged-in student's branch
  const isToolRecommended = (tool: CanonicalTool) => {
    if (!studentBranch) return false;
    const norm = studentBranch.toLowerCase();
    return tool.branchSlugs.some((slug) => slug.toLowerCase() === norm || norm.includes(slug.toLowerCase()));
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-2xl border border-border/60 bg-gradient-to-r from-card/80 via-primary/5 to-card/80 p-6 sm:p-8 backdrop-blur-md">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-primary/10 text-primary border border-primary/20">
              <Wrench className="w-3.5 h-3.5" />
              <span>Multi-Branch Academic Tool Hub</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
              Discipline-Specific AI & Analytical Workspaces
            </h1>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Domain-appropriate computational and review tools designed specifically for student engineering,
              clinical study, financial modeling, scientific research, and academic writing.
            </p>

            {studentBranch && (
              <div className="inline-flex items-center gap-2 pt-1 text-xs text-muted-foreground">
                <GraduationCap className="w-4 h-4 text-primary" />
                <span>
                  Your enrolled academic branch: <strong className="text-foreground uppercase">{studentBranch}</strong>
                </span>
              </div>
            )}
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={() => setIsHistoryOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-border bg-card/60 text-foreground hover:bg-muted text-xs font-medium transition-all shadow-sm"
            >
              <History className="w-4 h-4 text-primary" />
              <span>My Tool Activity</span>
            </button>
            <button
              onClick={loadCatalog}
              disabled={loading}
              title="Refresh tools"
              className="p-2.5 rounded-xl border border-border bg-card/60 text-muted-foreground hover:text-foreground transition-all shadow-sm"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            </button>
          </div>
        </div>
      </div>

      {/* Discipline Family Navigation Tabs */}
      <div className="overflow-x-auto pb-1 scrollbar-none">
        <div className="flex gap-2 min-w-max p-1 rounded-xl bg-muted/40 border border-border/60">
          {DISCIPLINE_TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setSelectedDiscipline(tab.id)}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                selectedDiscipline === tab.id
                  ? "bg-card text-foreground shadow-sm border border-border font-semibold"
                  : "text-muted-foreground hover:text-foreground hover:bg-card/40"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Search & Category Filter Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Search Input */}
        <form onSubmit={handleSearchSubmit} className="relative w-full sm:w-96">
          <Search className="w-4 h-4 text-muted-foreground absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by tool name, task, or formula..."
            className="w-full pl-9 pr-4 py-2 rounded-xl bg-card border border-border text-xs focus:ring-1 focus:ring-primary outline-none"
          />
        </form>

        {/* Category Pills */}
        <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
          <span className="text-xs text-muted-foreground flex items-center gap-1 shrink-0">
            <SlidersHorizontal className="w-3.5 h-3.5" />
            Category:
          </span>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-3 py-1.5 rounded-lg bg-card border border-border text-xs text-foreground focus:ring-1 focus:ring-primary outline-none"
          >
            <option value="All">All Categories</option>
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Error Notice */}
      {error && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center gap-3">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Loading Skeleton */}
      {loading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {[1, 2, 3, 4, 5, 6].map((idx) => (
            <div
              key={idx}
              className="h-56 rounded-xl border border-border/40 bg-card/20 animate-pulse p-5 space-y-4"
            >
              <div className="h-4 w-28 bg-muted rounded" />
              <div className="h-6 w-48 bg-muted rounded" />
              <div className="h-12 w-full bg-muted/60 rounded" />
              <div className="h-8 w-full bg-muted/40 rounded" />
            </div>
          ))}
        </div>
      )}

      {/* Tool Grid */}
      {!loading && tools.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {tools.map((tool) => (
            <ToolCard
              key={tool.toolId}
              tool={tool}
              onLaunch={handleLaunchTool}
              isRecommended={isToolRecommended(tool)}
            />
          ))}
        </div>
      )}

      {/* Empty State */}
      {!loading && tools.length === 0 && (
        <div className="py-16 text-center space-y-3 rounded-2xl border border-dashed border-border/80 p-8">
          <Layers className="w-10 h-10 mx-auto text-muted-foreground/40" />
          <h3 className="text-base font-semibold text-foreground">No matching academic tools found</h3>
          <p className="text-xs text-muted-foreground max-w-sm mx-auto">
            Try resetting your discipline or category filter, or search with different keywords.
          </p>
          <button
            onClick={() => {
              setSelectedDiscipline("All");
              setSelectedCategory("All");
              setSearchQuery("");
            }}
            className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-xs font-medium hover:bg-primary/90 transition-all"
          >
            Clear All Filters
          </button>
        </div>
      )}

      {/* Activity Log Drawer */}
      <ToolActivityHistoryDrawer
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
      />
    </div>
  );
};
