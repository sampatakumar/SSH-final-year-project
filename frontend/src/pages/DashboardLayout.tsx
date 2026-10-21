import React, { useState, useEffect } from "react";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import DashboardSidebar from "@/components/DashboardSidebar";
import ThemeToggle from "@/components/ThemeToggle";
import NotificationBell from "@/components/notifications/NotificationBell";
import { LogOut, ShieldAlert, Sparkles, PanelLeft, Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { dashboardLinks } from "@/lib/dashboard-links";
import { useAuth } from "@/core/auth";
import { Button } from "@/components/ui/button";
import ErrorBoundary from "@/components/ErrorBoundary";

const DashboardLayout: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { backendUser, signOutUser } = useAuth();

  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("ssh_sidebar_collapsed") === "true";
    }
    return false;
  });

  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState<boolean>(false);

  const toggleSidebar = () => {
    setIsSidebarCollapsed((prev) => {
      const next = !prev;
      if (typeof window !== "undefined") {
        localStorage.setItem("ssh_sidebar_collapsed", String(next));
      }
      return next;
    });
  };

  // Keyboard shortcut Ctrl+B / Cmd+B to toggle sidebar
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "b") {
        e.preventDefault();
        toggleSidebar();
      }
      if (e.key === "Escape" && isMobileDrawerOpen) {
        setIsMobileDrawerOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isMobileDrawerOpen]);

  // Close mobile drawer on route change
  useEffect(() => {
    setIsMobileDrawerOpen(false);
  }, [location.pathname]);

  const handleSignOut = async () => {
    await signOutUser();
    navigate("/");
  };

  const isMentorPage = location.pathname.startsWith("/dashboard/mentor");

  const targetRole = backendUser?.targetRole || "Full Stack Developer";
  const isAdmin =
    backendUser?.role === "admin" ||
    backendUser?.email === (import.meta.env.VITE_ADMIN_EMAIL || "sampatakumarsv@gmail.com");

  return (
    <div className="flex h-screen min-w-0 bg-background selection:bg-primary/20 selection:text-primary relative overflow-hidden">
      {/* Subtle Background Glow */}
      <div className="fixed top-[-20%] left-[-10%] w-[50%] h-[50%] bg-primary/5 rounded-full blur-[140px] -z-10 pointer-events-none" />
      <div className="fixed bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-accent/5 rounded-full blur-[140px] -z-10 pointer-events-none" />

      {/* Responsive Mobile Header */}
      <div className="md:hidden fixed top-0 inset-x-0 z-50 border-b border-border/40 bg-background shadow-neo-raised">
        <div className="h-14 px-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsMobileDrawerOpen(true)}
              aria-label="Open navigation menu"
              className="h-8 w-8 -ml-1 text-muted-foreground hover:text-foreground"
            >
              <Menu className="h-5 w-5" />
            </Button>
            <div className="h-8 w-8 rounded-xl bg-background shadow-neo-raised flex items-center justify-center border border-primary/20">
              <Sparkles className="h-4 w-4 text-primary" />
            </div>
            <span className="text-sm font-bold tracking-tight text-foreground">Smart Skill Hub</span>
          </div>
          <div className="flex items-center gap-2">
            <NotificationBell />
            <ThemeToggle className="h-8 w-8" />
            <Button
              variant="outline"
              size="icon"
              onClick={handleSignOut}
              className="h-8 w-8 text-muted-foreground hover:text-destructive transition-colors shadow-neo-raised-sm"
              title="Sign out"
              aria-label="Sign out"
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Quick mobile horizontal pill nav */}
        <nav className="px-3 pb-3 flex gap-2 overflow-x-auto no-scrollbar">
          {[
            ...dashboardLinks,
            ...(isAdmin
              ? [{ to: "/dashboard/admin/analytics", icon: ShieldAlert, label: "Admin Analytics" }]
              : []),
          ].map((link) => {
            const isActive = location.pathname === link.to;

            return (
              <NavLink
                key={link.to}
                to={link.to}
                className={cn(
                  "shrink-0 rounded-full px-3.5 py-1.5 text-xs font-medium border transition-all duration-150",
                  isActive
                    ? "border-primary/40 bg-background shadow-neo-pressed text-primary font-semibold"
                    : "border-border/40 bg-background shadow-neo-raised-sm text-muted-foreground"
                )}
              >
                {link.label}
              </NavLink>
            );
          })}
        </nav>
      </div>

      {/* Off-Canvas Mobile Drawer */}
      {isMobileDrawerOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black/60 backdrop-blur-xs z-50 transition-opacity animate-in fade-in"
          onClick={() => setIsMobileDrawerOpen(false)}
          aria-hidden="true"
        />
      )}
      <div
        className={cn(
          "md:hidden fixed inset-y-0 left-0 z-50 w-72 bg-background border-r border-border/40 shadow-2xl transition-transform duration-300 ease-in-out flex flex-col",
          isMobileDrawerOpen ? "translate-x-0" : "-translate-x-full"
        )}
        aria-label="Mobile Navigation Drawer"
      >
        <div className="h-16 px-4 border-b border-border/30 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-xl bg-background shadow-neo-raised flex items-center justify-center border border-primary/30">
              <Sparkles className="h-4 w-4 text-primary" />
            </div>
            <div>
              <span className="font-bold text-sm text-foreground block">Smart Skill Hub</span>
              <span className="text-[10px] text-muted-foreground font-medium block">Developer Intelligence</span>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsMobileDrawerOpen(false)}
            className="h-8 w-8 text-muted-foreground hover:text-foreground"
            aria-label="Close navigation menu"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1.5 overflow-y-auto custom-scrollbar">
          {dashboardLinks.map((link) => {
            const isActive = location.pathname === link.to;

            return (
              <NavLink
                key={link.to}
                to={link.to}
                onClick={() => setIsMobileDrawerOpen(false)}
                className={cn(
                  "flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all duration-150",
                  isActive
                    ? "bg-background shadow-neo-pressed text-primary font-semibold border border-primary/20"
                    : "text-muted-foreground hover:text-foreground hover:bg-surface/50"
                )}
              >
                <link.icon className={cn("h-4.5 w-4.5 shrink-0", isActive ? "text-primary" : "text-muted-foreground")} />
                <span>{link.label}</span>
                {link.badge && (
                  <span className="ml-auto text-[10px] font-bold px-1.5 py-0.5 rounded bg-primary/10 text-primary border border-primary/20">
                    {link.badge}
                  </span>
                )}
              </NavLink>
            );
          })}

          {isAdmin && (
            <div className="pt-2 mt-2 border-t border-border/30">
              <div className="px-3.5 pb-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                Administrator
              </div>
              <NavLink
                to="/dashboard/admin/analytics"
                onClick={() => setIsMobileDrawerOpen(false)}
                className={cn(
                  "flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all duration-150",
                  location.pathname.startsWith("/dashboard/admin")
                    ? "bg-destructive/10 shadow-neo-pressed text-destructive font-semibold border border-destructive/30"
                    : "text-muted-foreground hover:text-destructive hover:bg-destructive/5"
                )}
              >
                <ShieldAlert className="h-4.5 w-4.5 shrink-0 text-destructive" />
                <span>Admin Analytics</span>
                <span className="ml-auto text-[10px] font-bold px-1.5 py-0.5 rounded bg-destructive/15 text-destructive border border-destructive/30">
                  Admin
                </span>
              </NavLink>
            </div>
          )}
        </nav>

        {/* User Profile in Mobile Drawer */}
        <div className="p-3 m-3 border border-border/30 bg-background shadow-neo-pressed rounded-2xl shrink-0">
          <div className="flex items-center gap-3 mb-2 px-1">
            <div className="h-8 w-8 rounded-full bg-background shadow-neo-raised flex items-center justify-center text-xs font-bold text-primary overflow-hidden shrink-0 border border-primary/20">
              {backendUser?.photoURL ? (
                <img src={backendUser.photoURL} alt={backendUser.displayName ?? "User"} className="h-full w-full object-cover" />
              ) : (
                (backendUser?.displayName ?? "U").slice(0, 1).toUpperCase()
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-foreground truncate">{backendUser?.displayName ?? "Signed in user"}</p>
              <p className="text-[10px] text-primary truncate font-medium">🎯 {targetRole}</p>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="w-full justify-start text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors h-8 text-xs shadow-neo-raised-sm"
            onClick={handleSignOut}
          >
            <LogOut className="h-3.5 w-3.5 mr-2" />
            <span>Sign out</span>
          </Button>
        </div>
      </div>

      {/* Desktop Sidebar Navigation */}
      <DashboardSidebar
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={toggleSidebar}
      />

      {/* Main Content Area */}
      <main className="flex-1 h-full min-w-0 overflow-y-auto overflow-x-hidden relative pt-[7.25rem] md:pt-0 flex flex-col">
        {/* Desktop Header with Sidebar Toggle */}
        <header className="hidden md:flex items-center justify-between px-4 lg:px-6 py-3 border-b border-border/30 bg-background/80 backdrop-blur-md sticky top-0 z-30 shrink-0">
          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleSidebar}
              aria-label={isSidebarCollapsed ? "Expand navigation sidebar" : "Collapse navigation sidebar"}
              aria-expanded={!isSidebarCollapsed}
              className="h-8 w-8 text-muted-foreground hover:text-foreground shadow-neo-raised-sm"
              title={isSidebarCollapsed ? "Expand sidebar (Ctrl+B)" : "Collapse sidebar (Ctrl+B)"}
            >
              <PanelLeft className="h-4 w-4" />
            </Button>

            <div className="flex items-center gap-2">
              <span className="font-semibold text-foreground">Dashboard</span>
              {location.pathname !== "/dashboard" && (
                <>
                  <span>/</span>
                  <span className="capitalize text-primary font-medium">
                    {location.pathname.replace("/dashboard/", "").replace(/-/g, " ")}
                  </span>
                </>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <NotificationBell />
            <ThemeToggle className="h-9 w-9" />
          </div>
        </header>

        {/* Content Container - Expands to full width for Smart Mentor */}
        <div
          className={cn(
            "flex-1 flex flex-col w-full min-w-0",
            isMentorPage
              ? "p-3 sm:p-4 md:p-5 lg:p-6 max-w-full"
              : "p-4 md:p-6 lg:p-8 max-w-7xl mx-auto min-h-full"
          )}
        >
          <ErrorBoundary>
            <Outlet />
          </ErrorBoundary>
        </div>
      </main>
    </div>
  );
};

export default DashboardLayout;