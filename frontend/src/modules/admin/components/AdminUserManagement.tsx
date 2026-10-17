import React, { useState, useEffect, useCallback } from "react";
import {
  Users,
  Search,
  Filter,
  Shield,
  ShieldAlert,
  UserCheck,
  GraduationCap,
  Briefcase,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Loader2,
  CheckCircle2,
  XCircle,
  Eye,
  RefreshCw,
  AlertTriangle,
} from "lucide-react";
import { AdminApi, AdminUserItem, AdminUserDetailsResponse } from "@/lib/api";
import { useAuth } from "@/core/auth";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";

const DEFAULT_ADMIN_EMAIL = "sampatakumarsv@gmail.com";

export function AdminUserManagement() {
  const { backendUser, firebaseUser } = useAuth();
  const currentUserId = backendUser?._id;
  const configuredAdminEmail =
    import.meta.env.VITE_ADMIN_EMAIL || DEFAULT_ADMIN_EMAIL;

  const [users, setUsers] = useState<AdminUserItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalUsers, setTotalUsers] = useState(0);

  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  // User detail inspection modal
  const [inspectUserId, setInspectUserId] = useState<string | null>(null);
  const [inspectData, setInspectData] = useState<AdminUserDetailsResponse | null>(null);
  const [inspectLoading, setInspectLoading] = useState(false);

  // Role modification dialog
  const [roleChangeTarget, setRoleChangeTarget] = useState<AdminUserItem | null>(null);
  const [selectedNewRole, setSelectedNewRole] = useState<"student" | "admin">("student");
  const [roleUpdating, setRoleUpdating] = useState(false);

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search.trim());
      setPage(1);
    }, 350);
    return () => clearTimeout(timer);
  }, [search]);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await AdminApi.getUsers({
        page,
        limit: 15,
        search: debouncedSearch || undefined,
        role: roleFilter !== "all" ? roleFilter : undefined,
        status: statusFilter !== "all" ? statusFilter : undefined,
      });

      setUsers(res.users || []);
      setTotalPages(res.pagination?.totalPages || 1);
      setTotalUsers(res.pagination?.total || 0);
    } catch (err: any) {
      toast.error("Failed to load users: " + (err.message || "Unknown error"));
    } finally {
      setLoading(false);
    }
  }, [page, debouncedSearch, roleFilter, statusFilter]);

  useEffect(() => {
    void fetchUsers();
  }, [fetchUsers]);

  // Open user details inspect modal
  const handleInspectUser = async (user: AdminUserItem) => {
    setInspectUserId(user._id);
    setInspectLoading(true);
    try {
      const data = await AdminApi.getUserDetails(user._id);
      setInspectData(data);
    } catch (err: any) {
      toast.error("Failed to load user details: " + (err.message || "Unknown error"));
      setInspectUserId(null);
    } finally {
      setInspectLoading(false);
    }
  };

  // Open role modification confirmation
  const handleOpenRoleDialog = (user: AdminUserItem) => {
    setRoleChangeTarget(user);
    setSelectedNewRole(user.role === "admin" ? "student" : "admin");
  };

  // Execute role change
  const handleConfirmRoleChange = async () => {
    if (!roleChangeTarget) return;

    if (currentUserId && currentUserId === roleChangeTarget._id) {
      toast.error("Privilege Protection: You cannot alter your own administrative role.");
      return;
    }

    if (
      roleChangeTarget.email &&
      roleChangeTarget.email.toLowerCase() === configuredAdminEmail.toLowerCase()
    ) {
      toast.error("Security Guard: The primary system administrator account cannot be modified.");
      return;
    }

    setRoleUpdating(true);
    try {
      await AdminApi.updateUserRole(roleChangeTarget._id, selectedNewRole);
      toast.success(
        `Role updated: ${roleChangeTarget.displayName || roleChangeTarget.email} is now a ${selectedNewRole}.`
      );
      setRoleChangeTarget(null);
      void fetchUsers();
    } catch (err: any) {
      toast.error("Failed to update role: " + (err.message || "Unknown error"));
    } finally {
      setRoleUpdating(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Search and Filter Controls */}
      <Card className="border-border/50 bg-card/40 backdrop-blur">
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="relative w-full md:w-96">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name, email, institution..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 bg-background/50"
              />
            </div>

            <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
              {/* Role Filter */}
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground font-medium">Role:</span>
                <Select
                  value={roleFilter}
                  onValueChange={(val) => {
                    setRoleFilter(val);
                    setPage(1);
                  }}
                >
                  <SelectTrigger className="w-[120px] h-9 text-xs">
                    <SelectValue placeholder="All Roles" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Roles</SelectItem>
                    <SelectItem value="student">Student</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Status Filter */}
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground font-medium">Status:</span>
                <Select
                  value={statusFilter}
                  onValueChange={(val) => {
                    setStatusFilter(val);
                    setPage(1);
                  }}
                >
                  <SelectTrigger className="w-[140px] h-9 text-xs">
                    <SelectValue placeholder="All Statuses" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="onboarded">Onboarded</SelectItem>
                    <SelectItem value="pending_onboarding">Pending Onboarding</SelectItem>
                    <SelectItem value="verified">Email Verified</SelectItem>
                    <SelectItem value="unverified">Unverified</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={() => void fetchUsers()}
                disabled={loading}
                className="h-9 px-3"
              >
                <RefreshCw className={`h-3.5 w-3.5 mr-1.5 ${loading ? "animate-spin" : ""}`} />
                Refresh
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Users Data Table */}
      <Card className="border-border/50 shadow-sm overflow-hidden">
        <CardHeader className="py-4 border-b border-border/50 bg-muted/20">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <Users className="h-4 w-4 text-primary" />
                Platform Registered Users
              </CardTitle>
              <CardDescription className="text-xs mt-0.5">
                Total {totalUsers} user account{totalUsers === 1 ? "" : "s"} found
              </CardDescription>
            </div>
            <div className="text-xs text-muted-foreground font-medium">
              Page {page} of {totalPages}
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center p-12">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : users.length === 0 ? (
            <div className="text-center p-12 text-muted-foreground">
              <Users className="h-10 w-10 mx-auto mb-2 opacity-30" />
              <p className="font-medium text-sm">No users match the search criteria.</p>
              <p className="text-xs text-muted-foreground mt-1">Try clearing filters or search terms.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/30">
                    <TableHead className="font-semibold text-xs">User</TableHead>
                    <TableHead className="font-semibold text-xs">Role</TableHead>
                    <TableHead className="font-semibold text-xs">Academic Program</TableHead>
                    <TableHead className="font-semibold text-xs">Career Target</TableHead>
                    <TableHead className="font-semibold text-xs">Account Status</TableHead>
                    <TableHead className="font-semibold text-xs text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((user) => {
                    const isSelf = currentUserId && currentUserId === user._id;
                    const isPrimaryAdmin =
                      user.email &&
                      user.email.toLowerCase() === configuredAdminEmail.toLowerCase();

                    return (
                      <TableRow key={user._id} className="hover:bg-muted/40 transition-colors">
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center font-bold text-xs text-primary shrink-0">
                              {(user.displayName || user.email).slice(0, 2).toUpperCase()}
                            </div>
                            <div className="flex flex-col min-w-0">
                              <span className="font-medium text-sm truncate">
                                {user.displayName || "Anonymous User"}
                                {isSelf && (
                                  <span className="ml-1.5 text-[10px] bg-primary/10 text-primary font-bold px-1.5 py-0.5 rounded">
                                    You
                                  </span>
                                )}
                              </span>
                              <span className="text-xs text-muted-foreground truncate">
                                {user.email}
                              </span>
                            </div>
                          </div>
                        </TableCell>

                        <TableCell>
                          {user.role === "admin" ? (
                            <Badge variant="destructive" className="text-[10px] font-bold uppercase tracking-wider">
                              <Shield className="w-3 h-3 mr-1" /> Admin
                            </Badge>
                          ) : (
                            <Badge variant="secondary" className="text-[10px] font-semibold">
                              Student
                            </Badge>
                          )}
                        </TableCell>

                        <TableCell>
                          {user.academic?.branchName || user.academic?.degreeName ? (
                            <div className="flex flex-col text-xs">
                              <span className="font-medium text-foreground truncate max-w-[200px]">
                                {user.academic.branchName || user.academic.degreeName}
                              </span>
                              <span className="text-muted-foreground text-[11px] truncate max-w-[200px]">
                                {user.academic.institution || `Semester ${user.academic.currentSemester || 1}`}
                              </span>
                            </div>
                          ) : (
                            <span className="text-xs text-muted-foreground italic">Not set</span>
                          )}
                        </TableCell>

                        <TableCell>
                          {user.targetRole || (user.targetRoles && user.targetRoles[0]) ? (
                            <span className="text-xs font-medium text-primary flex items-center gap-1">
                              <Briefcase className="w-3 h-3" />
                              {user.targetRole || user.targetRoles?.[0]}
                            </span>
                          ) : (
                            <span className="text-xs text-muted-foreground italic">Unspecified</span>
                          )}
                        </TableCell>

                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {user.emailVerified ? (
                              <Badge variant="outline" className="text-[10px] text-emerald-500 border-emerald-500/30 bg-emerald-500/5">
                                Verified
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="text-[10px] text-amber-500 border-amber-500/30 bg-amber-500/5">
                                Unverified
                              </Badge>
                            )}
                            {user.onboardingCompletedAt ? (
                              <Badge variant="outline" className="text-[10px] text-blue-500 border-blue-500/30 bg-blue-500/5">
                                Onboarded
                              </Badge>
                            ) : null}
                          </div>
                        </TableCell>

                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 px-2.5 text-xs text-muted-foreground hover:text-foreground"
                              onClick={() => void handleInspectUser(user)}
                            >
                              <Eye className="w-3.5 h-3.5 mr-1" /> View
                            </Button>

                            <Button
                              variant="outline"
                              size="sm"
                              disabled={isSelf || isPrimaryAdmin}
                              title={
                                isSelf
                                  ? "Cannot modify own role"
                                  : isPrimaryAdmin
                                  ? "Primary system admin account cannot be modified"
                                  : "Change user role"
                              }
                              className="h-8 px-2 text-xs"
                              onClick={() => handleOpenRoleDialog(user)}
                            >
                              Role
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-border/50 bg-muted/10">
              <span className="text-xs text-muted-foreground">
                Showing page {page} of {totalPages}
              </span>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1 || loading}
                  className="h-8 px-2.5"
                >
                  <ChevronLeft className="w-4 h-4 mr-1" /> Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page >= totalPages || loading}
                  className="h-8 px-2.5"
                >
                  Next <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Inspect User Details Dialog */}
      <Dialog open={Boolean(inspectUserId)} onOpenChange={(open) => !open && setInspectUserId(null)}>
        <DialogContent className="max-w-xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold flex items-center gap-2">
              <UserCheck className="w-5 h-5 text-primary" /> User Profile & Activity Details
            </DialogTitle>
            <DialogDescription className="text-xs">
              Direct administrative inspection for profile, academic history, and platform metrics.
            </DialogDescription>
          </DialogHeader>

          {inspectLoading || !inspectData ? (
            <div className="flex items-center justify-center p-8">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div className="space-y-5 py-2 text-xs">
              {/* Basic Profile */}
              <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/40 border border-border/50">
                <div className="w-12 h-12 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center font-bold text-base text-primary">
                  {(inspectData.user.displayName || inspectData.user.email).slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <h4 className="font-semibold text-sm text-foreground">
                    {inspectData.user.displayName || "Anonymous User"}
                  </h4>
                  <p className="text-muted-foreground">{inspectData.user.email}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant={inspectData.user.role === "admin" ? "destructive" : "secondary"}>
                      {inspectData.user.role}
                    </Badge>
                    <span className="text-[11px] text-muted-foreground">
                      Joined {new Date(inspectData.user.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>

              {/* Academic Affiliation */}
              <div className="space-y-2">
                <h5 className="font-semibold text-xs text-foreground flex items-center gap-1.5">
                  <GraduationCap className="w-4 h-4 text-primary" /> Academic Information
                </h5>
                <div className="grid grid-cols-2 gap-2 p-3 rounded-lg bg-muted/20 border border-border/40 text-xs">
                  <div>
                    <span className="text-muted-foreground text-[11px] block">Degree:</span>
                    <span className="font-medium text-foreground">
                      {inspectData.user.academic?.degreeName || "Not specified"}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground text-[11px] block">Branch:</span>
                    <span className="font-medium text-foreground">
                      {inspectData.user.academic?.branchName || "Not specified"}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground text-[11px] block">Semester:</span>
                    <span className="font-medium text-foreground">
                      {inspectData.user.academic?.currentSemester ? `Semester ${inspectData.user.academic.currentSemester}` : "Not set"}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground text-[11px] block">Institution:</span>
                    <span className="font-medium text-foreground truncate block">
                      {inspectData.user.academic?.institution || "Not specified"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Career Goal & Target Roles */}
              <div className="space-y-2">
                <h5 className="font-semibold text-xs text-foreground flex items-center gap-1.5">
                  <Briefcase className="w-4 h-4 text-primary" /> Target Career Pathways
                </h5>
                <div className="p-3 rounded-lg bg-muted/20 border border-border/40 space-y-1.5 text-xs">
                  <div>
                    <span className="text-muted-foreground text-[11px]">Primary Target: </span>
                    <span className="font-semibold text-primary">
                      {inspectData.user.targetRole || "None configured"}
                    </span>
                  </div>
                  {inspectData.user.targetRoles && inspectData.user.targetRoles.length > 0 && (
                    <div className="flex flex-wrap gap-1 pt-1">
                      {inspectData.user.targetRoles.map((r: string, idx: number) => (
                        <Badge key={idx} variant="outline" className="text-[10px]">
                          {r}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Activity & Performance Metrics */}
              <div className="space-y-2">
                <h5 className="font-semibold text-xs text-foreground">Activity & Empirical Stats</h5>
                <div className="grid grid-cols-3 gap-2">
                  <div className="p-2.5 rounded-lg bg-muted/30 border border-border/40 text-center">
                    <span className="text-[10px] text-muted-foreground block">Projects</span>
                    <span className="font-bold text-base text-foreground">
                      {inspectData.stats.projectsCount}
                    </span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-muted/30 border border-border/40 text-center">
                    <span className="text-[10px] text-muted-foreground block">Coding Submissions</span>
                    <span className="font-bold text-base text-foreground">
                      {inspectData.stats.submissionsCount}
                    </span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-muted/30 border border-border/40 text-center">
                    <span className="text-[10px] text-muted-foreground block">Skills Evaluated</span>
                    <span className="font-bold text-base text-foreground">
                      {inspectData.stats.skillsEvaluated}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setInspectUserId(null)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Role Change Confirmation Dialog */}
      <Dialog open={Boolean(roleChangeTarget)} onOpenChange={(open) => !open && setRoleChangeTarget(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base font-bold flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-amber-500" /> Confirm Administrative Role Change
            </DialogTitle>
            <DialogDescription className="text-xs">
              Updating a user's role grants or revokes administrative capabilities across the entire Smart Skill Hub.
            </DialogDescription>
          </DialogHeader>

          {roleChangeTarget && (
            <div className="space-y-4 py-2 text-xs">
              <div className="p-3 rounded-lg bg-muted/30 border border-border/50">
                <p className="font-medium text-foreground">
                  User: <span className="font-bold">{roleChangeTarget.displayName || roleChangeTarget.email}</span>
                </p>
                <p className="text-muted-foreground mt-0.5">Current Role: {roleChangeTarget.role}</p>
              </div>

              <div className="space-y-1.5">
                <label className="font-semibold text-foreground">Assign New Role:</label>
                <Select
                  value={selectedNewRole}
                  onValueChange={(val: "student" | "admin") => setSelectedNewRole(val)}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="student">Student (Standard User)</SelectItem>
                    <SelectItem value="admin">Administrator (Elevated Access)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {selectedNewRole === "admin" && (
                <div className="p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 text-[11px] flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>
                    Granting admin privileges provides access to user management, catalog maintenance, and platform analytics.
                  </span>
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setRoleChangeTarget(null)}
              disabled={roleUpdating}
            >
              Cancel
            </Button>
            <Button
              variant="default"
              size="sm"
              onClick={() => void handleConfirmRoleChange()}
              disabled={roleUpdating}
              className="bg-primary text-primary-foreground"
            >
              {roleUpdating ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" /> : null}
              Confirm Role Change
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
