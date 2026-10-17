import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { LogOut, ShieldAlert, Sparkles, PanelLeftClose, PanelLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/core/auth";
import ThemeToggle from "@/components/ThemeToggle";
import { dashboardLinks } from "@/lib/dashboard-links";

interface DashboardSidebarProps {
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

const DashboardSidebar: React.FC<DashboardSidebarProps> = ({
  isCollapsed = false,
  onToggleCollapse,
}) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { backendUser, signOutUser } = useAuth();

  const handleSignOut = async () => {
    await signOutUser();
    navigate("/");
  };

  const targetRole = backendUser?.targetRole || "Full Stack Developer";

  return (
    <aside
      className={cn(
        "hidden md:flex h-screen sticky top-0 flex-col border-r border-border/40 bg-background shadow-neo-raised z-40 transition-[width] duration-300 ease-in-out shrink-0 select-none",
        isCollapsed ? "w-20" : "w-64"
      )}
      aria-label="Sidebar Navigation"
    >
      {/* Brand Header */}
      <div
        className={cn(
          "flex items-center h-20 border-b border-border/30 transition-all duration-300",
          isCollapsed ? "justify-center px-2" : "justify-between px-4 lg:px-5"
        )}
      >
        <div className="flex items-center gap-3 min-w-0">
          <div
            className="h-10 w-10 rounded-xl bg-background shadow-neo-raised flex items-center justify-center border border-primary/30 shrink-0 cursor-pointer"
            onClick={onToggleCollapse}
            title={isCollapsed ? "Expand sidebar" : undefined}
          >
            <Sparkles className="h-5 w-5 text-primary" />
          </div>
          {!isCollapsed && (
            <div className="flex flex-col min-w-0 overflow-hidden whitespace-nowrap animate-in fade-in duration-200">
              <span className="font-bold text-base tracking-tight text-foreground truncate">
                Smart Skill Hub
              </span>
              <span className="text-[11px] font-medium text-muted-foreground truncate">
                Developer Intelligence
              </span>
            </div>
          )}
        </div>

        {!isCollapsed && onToggleCollapse && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onToggleCollapse}
            className="h-8 w-8 text-muted-foreground hover:text-foreground shrink-0 shadow-neo-raised-sm"
            title="Collapse sidebar (Ctrl+B)"
            aria-label="Collapse navigation sidebar"
            aria-expanded={!isCollapsed}
          >
            <PanelLeftClose className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-3 py-4 space-y-1.5 overflow-y-auto custom-scrollbar">
        {dashboardLinks.map((link) => {
          const isActive = location.pathname === link.to;

          return (
            <NavLink
              key={link.to}
              to={link.to}
              title={isCollapsed ? link.label : undefined}
              className={cn(
                "relative flex items-center rounded-xl text-sm font-medium transition-all duration-150 group",
                isCollapsed
                  ? "justify-center p-2.5 h-11 w-11 mx-auto"
                  : "justify-start gap-3 px-3.5 py-2.5",
                isActive
                  ? "bg-background shadow-neo-pressed text-primary font-semibold border border-primary/20"
                  : "text-muted-foreground hover:text-foreground hover:bg-surface/50"
              )}
            >
              <link.icon
                className={cn(
                  "h-4.5 w-4.5 shrink-0 transition-colors",
                  isActive ? "text-primary" : "text-muted-foreground group-hover:text-foreground"
                )}
              />
              <span
                className={cn(
                  "transition-all duration-200",
                  isCollapsed ? "sr-only" : "inline truncate"
                )}
              >
                {link.label}
              </span>
              {!isCollapsed && link.badge && (
                <span className="ml-auto text-[10px] font-bold px-1.5 py-0.5 rounded bg-primary/10 text-primary border border-primary/20 shrink-0">
                  {link.badge}
                </span>
              )}
            </NavLink>
          );
        })}

        {/* Admin-Only Section (UI visibility; authoritative security enforced by backend ensureAdmin) */}
        {(backendUser?.role === "admin" ||
          backendUser?.email === (import.meta.env.VITE_ADMIN_EMAIL || "sampatakumarsv@gmail.com")) && (
          <div className="pt-2 mt-2 border-t border-border/30">
            {!isCollapsed && (
              <div className="px-3.5 pb-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                Administrator
              </div>
            )}
            <NavLink
              to="/dashboard/admin/analytics"
              title={isCollapsed ? "Admin Analytics" : undefined}
              className={cn(
                "relative flex items-center rounded-xl text-sm font-medium transition-all duration-150 group",
                isCollapsed
                  ? "justify-center p-2.5 h-11 w-11 mx-auto"
                  : "justify-start gap-3 px-3.5 py-2.5",
                location.pathname.startsWith("/dashboard/admin")
                  ? "bg-destructive/10 shadow-neo-pressed text-destructive font-semibold border border-destructive/30"
                  : "text-muted-foreground hover:text-destructive hover:bg-destructive/5"
              )}
            >
              <ShieldAlert
                className={cn(
                  "h-4.5 w-4.5 shrink-0 transition-colors",
                  location.pathname.startsWith("/dashboard/admin")
                    ? "text-destructive"
                    : "text-muted-foreground group-hover:text-destructive"
                )}
              />
              <span
                className={cn(
                  "transition-all duration-200",
                  isCollapsed ? "sr-only" : "inline truncate"
                )}
              >
                Admin Analytics
              </span>
              {!isCollapsed && (
                <span className="ml-auto text-[10px] font-bold px-1.5 py-0.5 rounded bg-destructive/15 text-destructive border border-destructive/30 shrink-0">
                  Admin
                </span>
              )}
            </NavLink>
          </div>
        )}
      </nav>

      {/* User Profile & Sign Out Footer */}
      <div
        className={cn(
          "border border-border/30 bg-background shadow-neo-pressed rounded-2xl mb-4 transition-all duration-300",
          isCollapsed ? "p-2 m-2 flex flex-col items-center gap-2" : "p-3 lg:p-4 m-3 space-y-2.5"
        )}
      >
        <div
          className={cn(
            "flex items-center gap-3",
            isCollapsed ? "justify-center" : "justify-between px-1"
          )}
        >
          <div
            className="h-9 w-9 rounded-full bg-background shadow-neo-raised flex items-center justify-center text-sm font-bold text-primary overflow-hidden shrink-0 border border-primary/20"
            title={backendUser?.displayName || "Signed in user"}
          >
            {backendUser?.photoURL ? (
              <img
                src={backendUser.photoURL}
                alt={backendUser.displayName ?? "User"}
                className="h-full w-full object-cover"
              />
            ) : (
              (backendUser?.displayName ?? "U").slice(0, 1).toUpperCase()
            )}
          </div>

          {!isCollapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-foreground truncate">
                {backendUser?.displayName ?? "Signed in user"}
              </p>
              <p className="text-[11px] text-primary truncate font-medium">
                🎯 {targetRole}
              </p>
            </div>
          )}

          {!isCollapsed && <ThemeToggle className="h-8 w-8 shrink-0" />}
        </div>

        <Button
          variant="outline"
          size="sm"
          className={cn(
            "text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors text-xs shadow-neo-raised-sm",
            isCollapsed ? "h-9 w-9 p-0 justify-center" : "w-full justify-start h-8"
          )}
          onClick={handleSignOut}
          title="Sign out"
          aria-label="Sign out"
        >
          <LogOut className={cn("h-3.5 w-3.5", !isCollapsed && "mr-2")} />
          {!isCollapsed && <span>Sign out</span>}
        </Button>
      </div>
    </aside>
  );
};

export default DashboardSidebar;