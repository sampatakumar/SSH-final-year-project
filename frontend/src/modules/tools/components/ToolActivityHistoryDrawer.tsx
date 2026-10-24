import React, { useState, useEffect } from "react";
import { ToolActivityRecord } from "../types/tools.types";
import { toolsApi } from "../services/tools.api";
import {
  History,
  X,
  BookmarkCheck,
  Bookmark,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Calendar,
  Layers,
  Sparkles,
} from "lucide-react";

interface ToolActivityHistoryDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectRecord?: (record: ToolActivityRecord) => void;
}

export const ToolActivityHistoryDrawer: React.FC<ToolActivityHistoryDrawerProps> = ({
  isOpen,
  onClose,
  onSelectRecord,
}) => {
  const [records, setRecords] = useState<ToolActivityRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      loadHistory();
    }
  }, [isOpen]);

  const loadHistory = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await toolsApi.getMyToolActivity(30);
      setRecords(data.records || []);
    } catch (err: any) {
      setError(err.message || "Failed to load recent activity.");
    } finally {
      setLoading(false);
    }
  };

  const handleTogglePortfolio = async (record: ToolActivityRecord) => {
    setTogglingId(record._id);
    try {
      const res = await toolsApi.togglePortfolioSave(record._id, {
        isSaved: !record.isSavedToPortfolio,
        headline: `${record.toolDisplayName} Calculation Artifact`,
        summary: `Verified educational activity in ${record.academicDiscipline}.`,
      });
      setRecords((prev) =>
        prev.map((r) =>
          r._id === record._id
            ? { ...r, isSavedToPortfolio: res.isSavedToPortfolio, portfolioMetadata: res.portfolioMetadata }
            : r
        )
      );
    } catch (err: any) {
      alert("Failed to update portfolio: " + err.message);
    } finally {
      setTogglingId(null);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-md h-full bg-card border-l border-border p-6 flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-border">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-primary/10 text-primary">
              <History className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-foreground">Recent Tool Activity</h2>
              <p className="text-xs text-muted-foreground">Your recent calculations and reviews</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content list */}
        <div className="flex-1 overflow-y-auto py-4 space-y-3">
          {loading && (
            <div className="py-12 flex flex-col items-center justify-center text-muted-foreground text-xs gap-2">
              <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              <span>Loading activity log...</span>
            </div>
          )}

          {error && (
            <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {!loading && records.length === 0 && (
            <div className="py-12 text-center text-muted-foreground text-xs space-y-2">
              <Layers className="w-8 h-8 mx-auto text-muted-foreground/40" />
              <p>No tool activities recorded yet.</p>
              <p className="text-[11px] text-muted-foreground/70">
                Execute a calculation or review to save your project artifacts.
              </p>
            </div>
          )}

          {!loading &&
            records.map((rec) => (
              <div
                key={rec._id}
                className="p-3.5 rounded-xl border border-border/60 bg-muted/20 hover:border-border hover:bg-muted/40 transition-all text-xs space-y-2"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h4 className="font-semibold text-foreground text-xs">{rec.toolDisplayName}</h4>
                    <span className="text-[10px] text-muted-foreground flex items-center gap-1 mt-0.5">
                      <Calendar className="w-3 h-3" />
                      {new Date(rec.createdAt).toLocaleDateString()} at{" "}
                      {new Date(rec.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </span>
                  </div>

                  <button
                    onClick={() => handleTogglePortfolio(rec)}
                    disabled={togglingId === rec._id}
                    title={rec.isSavedToPortfolio ? "Remove from Portfolio" : "Save to Portfolio"}
                    className={`p-1.5 rounded-lg border transition-all ${
                      rec.isSavedToPortfolio
                        ? "bg-primary/10 border-primary/30 text-primary hover:bg-primary/20"
                        : "bg-muted/40 border-border/50 text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {rec.isSavedToPortfolio ? (
                      <BookmarkCheck className="w-4 h-4" />
                    ) : (
                      <Bookmark className="w-4 h-4" />
                    )}
                  </button>
                </div>

                <div className="text-[11px] text-muted-foreground flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded bg-muted text-foreground/80 font-mono text-[10px]">
                    {rec.academicDiscipline}
                  </span>
                  <span
                    className={`inline-flex items-center gap-1 ${
                      rec.status === "success" ? "text-emerald-400" : "text-rose-400"
                    }`}
                  >
                    {rec.status === "success" ? (
                      <CheckCircle2 className="w-3 h-3" />
                    ) : (
                      <AlertCircle className="w-3 h-3" />
                    )}
                    {rec.status}
                  </span>
                </div>

                {rec.isSavedToPortfolio && (
                  <div className="pt-1.5 border-t border-border/40 flex items-center gap-1 text-[10px] text-primary">
                    <Sparkles className="w-3 h-3" />
                    <span>Saved to your public portfolio showcase</span>
                  </div>
                )}
              </div>
            ))}
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-border text-[11px] text-muted-foreground flex items-center justify-between">
          <span>{records.length} saved runs</span>
          <button
            onClick={loadHistory}
            className="text-primary hover:underline text-xs"
          >
            Refresh
          </button>
        </div>
      </div>
    </div>
  );
};
