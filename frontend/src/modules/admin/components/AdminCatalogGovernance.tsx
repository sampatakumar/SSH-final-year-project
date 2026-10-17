import React, { useState, useEffect, useCallback } from "react";
import {
  Layers,
  CheckCircle2,
  AlertTriangle,
  ShieldAlert,
  Trash2,
  RefreshCw,
  Loader2,
  Info,
  BookOpen,
  GitFork,
  Briefcase,
  AlertCircle,
} from "lucide-react";
import { AdminApi, CatalogIntegrityReport } from "@/lib/api";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "sonner";

export function AdminCatalogGovernance() {
  const [report, setReport] = useState<CatalogIntegrityReport | null>(null);
  const [loading, setLoading] = useState(true);

  // Deletion confirmation
  const [deleteTarget, setDeleteTarget] = useState<{
    type: "degree" | "branch" | "career-role";
    slug: string;
    name: string;
  } | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchIntegrityReport = useCallback(async () => {
    setLoading(true);
    try {
      const data = await AdminApi.getCatalogIntegrity();
      setReport(data);
    } catch (err: any) {
      toast.error("Failed to load catalog integrity report: " + (err.message || "Unknown error"));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchIntegrityReport();
  }, [fetchIntegrityReport]);

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;

    setDeleting(true);
    try {
      let res;
      if (deleteTarget.type === "degree") {
        res = await AdminApi.safeDeleteDegree(deleteTarget.slug);
      } else if (deleteTarget.type === "branch") {
        res = await AdminApi.safeDeleteBranch(deleteTarget.slug);
      } else {
        res = await AdminApi.safeDeleteCareerRole(deleteTarget.slug);
      }

      toast.success(res.message || "Catalog item processed successfully.");
      setDeleteTarget(null);
      void fetchIntegrityReport();
    } catch (err: any) {
      toast.error("Action failed: " + (err.message || "Unknown error"));
    } finally {
      setDeleting(false);
    }
  };

  if (loading && !report) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Catalog Health Summary Banner */}
      <Card
        className={`border-border/50 ${
          report?.status === "healthy"
            ? "bg-emerald-500/5 border-emerald-500/30"
            : "bg-amber-500/5 border-amber-500/30"
        }`}
      >
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                  report?.status === "healthy"
                    ? "bg-emerald-500/10 text-emerald-500"
                    : "bg-amber-500/10 text-amber-500"
                }`}
              >
                {report?.status === "healthy" ? (
                  <CheckCircle2 className="w-5 h-5" />
                ) : (
                  <AlertTriangle className="w-5 h-5" />
                )}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-base text-foreground">
                    Catalog Integrity Status:{" "}
                    {report?.status === "healthy" ? "All Systems Healthy" : "Attention Recommended"}
                  </h3>
                  <Badge
                    variant={report?.status === "healthy" ? "outline" : "destructive"}
                    className="text-[10px] uppercase font-bold"
                  >
                    {report?.issuesCount === 0 ? "Zero Issues" : `${report?.issuesCount} Issues Detected`}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Automated referential integrity scanning across Academic Degrees, Branches, Career Roles, and Benchmarks.
                </p>
              </div>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => void fetchIntegrityReport()}
              disabled={loading}
              className="h-8 text-xs shrink-0"
            >
              <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${loading ? "animate-spin" : ""}`} />
              Re-Scan Catalog
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Totals Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <Card className="p-3 border-border/50 bg-card/40 backdrop-blur text-center">
          <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider block">
            Degrees
          </span>
          <span className="text-xl font-bold text-foreground">
            {report?.totals.degreesCount ?? 0}
          </span>
        </Card>

        <Card className="p-3 border-border/50 bg-card/40 backdrop-blur text-center">
          <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider block">
            Branches
          </span>
          <span className="text-xl font-bold text-foreground">
            {report?.totals.branchesCount ?? 0}
          </span>
        </Card>

        <Card className="p-3 border-border/50 bg-card/40 backdrop-blur text-center">
          <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider block">
            Career Roles
          </span>
          <span className="text-xl font-bold text-foreground">
            {report?.totals.careerRolesCount ?? 0}
          </span>
        </Card>

        <Card className="p-3 border-border/50 bg-card/40 backdrop-blur text-center">
          <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider block">
            Mappings
          </span>
          <span className="text-xl font-bold text-foreground">
            {report?.totals.mappingsCount ?? 0}
          </span>
        </Card>

        <Card className="p-3 border-border/50 bg-emerald-500/5 border-emerald-500/20 text-center">
          <span className="text-[10px] text-emerald-600 dark:text-emerald-400 uppercase font-bold tracking-wider block">
            Validated
          </span>
          <span className="text-xl font-bold text-emerald-600 dark:text-emerald-400">
            {report?.totals.validatedBenchmarksCount ?? 0}
          </span>
        </Card>

        <Card className="p-3 border-border/50 bg-amber-500/5 border-amber-500/20 text-center">
          <span className="text-[10px] text-amber-600 dark:text-amber-400 uppercase font-bold tracking-wider block">
            Pending Benchmark
          </span>
          <span className="text-xl font-bold text-amber-600 dark:text-amber-400">
            {report?.totals.pendingBenchmarksCount ?? 0}
          </span>
        </Card>
      </div>

      {/* Discrepancy Alerts (If any) */}
      {report && report.issuesCount > 0 && (
        <div className="space-y-3">
          {report.orphanDegreeReferences.length > 0 && (
            <Card className="border-amber-500/40 bg-amber-500/5 p-4 text-xs">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-amber-600 dark:text-amber-400">
                    Orphan Degree References in Branches ({report.orphanDegreeReferences.length})
                  </h4>
                  <ul className="list-disc list-inside mt-1 space-y-1 text-muted-foreground">
                    {report.orphanDegreeReferences.map((ref, idx) => (
                      <li key={idx}>
                        Branch <span className="font-medium text-foreground">{ref.branchName}</span> ({ref.branchSlug}) references non-existent degree slug(s):{" "}
                        <span className="font-mono text-destructive">{ref.invalidDegreeSlugs.join(", ")}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </Card>
          )}

          {report.invalidMappings.length > 0 && (
            <Card className="border-destructive/40 bg-destructive/5 p-4 text-xs">
              <div className="flex items-start gap-2">
                <ShieldAlert className="w-4 h-4 text-destructive shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-destructive">
                    Invalid Branch-Role Mappings ({report.invalidMappings.length})
                  </h4>
                  <ul className="list-disc list-inside mt-1 space-y-1 text-muted-foreground">
                    {report.invalidMappings.map((m, idx) => (
                      <li key={idx}>
                        Mapping references non-existent {!m.branchExists && `branch "${m.branchSlug}"`}
                        {!m.branchExists && !m.roleExists && " and "}
                        {!m.roleExists && `career role "${m.roleSlug}"`}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </Card>
          )}
        </div>
      )}

      {/* Career Roles Benchmark Readiness Table */}
      <Card className="border-border/50 shadow-sm overflow-hidden">
        <CardHeader className="py-4 border-b border-border/50 bg-muted/20">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <Briefcase className="h-4 w-4 text-primary" />
                Career Role Benchmark Fidelity
              </CardTitle>
              <CardDescription className="text-xs mt-0.5">
                Truthful audit of validated empirical benchmark coverage vs unbenchmarked career paths.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/30">
                  <TableHead className="font-semibold text-xs">Career Role</TableHead>
                  <TableHead className="font-semibold text-xs">Slug</TableHead>
                  <TableHead className="font-semibold text-xs">Category</TableHead>
                  <TableHead className="font-semibold text-xs">Benchmark Fidelity</TableHead>
                  <TableHead className="font-semibold text-xs text-right">Governance</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {/* Pending Benchmark Roles First for visibility */}
                {report?.pendingBenchmarkRoles.map((role) => (
                  <TableRow key={role.slug} className="hover:bg-muted/40 transition-colors">
                    <TableCell className="font-medium text-xs text-foreground">
                      {role.title}
                    </TableCell>
                    <TableCell className="font-mono text-[11px] text-muted-foreground">
                      {role.slug}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {role.category || "General"}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-[10px] text-amber-500 border-amber-500/30 bg-amber-500/5">
                        <AlertTriangle className="w-3 h-3 mr-1" /> Benchmark Pending
                      </Badge>
                      <span className="text-[11px] text-muted-foreground block mt-0.5">
                        Core taxonomy evaluated without artificial fallback
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 px-2 text-xs text-destructive hover:bg-destructive/10"
                        onClick={() =>
                          setDeleteTarget({
                            type: "career-role",
                            slug: role.slug,
                            name: role.title,
                          })
                        }
                      >
                        <Trash2 className="w-3.5 h-3.5 mr-1" /> Safe Remove
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}

                {/* Validated benchmark roles */}
                <TableRow className="bg-muted/10">
                  <TableCell colSpan={5} className="py-2 px-4 text-xs font-semibold text-muted-foreground">
                    Validated Empirical Benchmark Roles ({report?.totals.validatedBenchmarksCount || 0} pathways calibrated)
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Safe Deletion / Deactivation Confirmation Dialog */}
      <Dialog open={Boolean(deleteTarget)} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base font-bold flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-destructive" /> Safe Catalog Record Removal
            </DialogTitle>
            <DialogDescription className="text-xs">
              Referential integrity guard will check if any active student or mapped relationship references this entry.
            </DialogDescription>
          </DialogHeader>

          {deleteTarget && (
            <div className="space-y-3 py-2 text-xs">
              <div className="p-3 rounded-lg bg-muted/40 border border-border/50">
                <p className="font-medium text-foreground">
                  Target: <span className="font-bold">{deleteTarget.name}</span>
                </p>
                <p className="text-muted-foreground text-[11px] font-mono mt-0.5">
                  Type: {deleteTarget.type} | Slug: {deleteTarget.slug}
                </p>
              </div>

              <div className="p-3 rounded-lg bg-muted/20 border border-border/40 text-muted-foreground text-[11px] space-y-1">
                <div className="flex items-center gap-1.5 font-semibold text-foreground">
                  <Info className="w-4 h-4 text-primary" /> Referential Preservation Policy
                </div>
                <p>
                  If this item is actively referenced by registered students or academic programs, it will be{" "}
                  <span className="font-semibold text-foreground">soft-deactivated</span> rather than deleted, preserving historical learner pathways.
                </p>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setDeleteTarget(null)}
              disabled={deleting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => void handleConfirmDelete()}
              disabled={deleting}
            >
              {deleting ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" /> : null}
              Confirm Safe Action
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
