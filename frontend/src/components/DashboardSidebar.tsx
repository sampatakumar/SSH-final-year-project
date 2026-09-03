import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { LogOut, ShieldAlert, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/core/auth";
import ThemeToggle from "@/components/ThemeToggle";
import { dashboardLinks } from "@/lib/dashboard-links";

const DashboardSidebar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { backendUser, signOutUser } = useAuth();

  const handleSignOut = async () => {
    await signOutUser();
    navigate("/");
  };

  const targetRole = backendUser?.targetRole || "Full Stack Developer";

  return (
    <aside className="hidden md:flex w-20 lg:w-64 h-screen sticky top-0 flex-col border-r border-border/40 bg-background shadow-neo-raised z-40">
      {/* Brand Header */}
      <div className="flex items-center justify-center lg:justify-start gap-3 px-4 lg:px-6 h-20 border-b border-border/30">
        <div className="h-10 w-10 rounded-xl bg-background shadow-neo-raised flex items-center justify-center border border-primary/30">
          <Sparkles className="h-5 w-5 text-primary" />
        </div>
        <div className="hidden lg:flex flex-col">
          <span className="font-bold text-base tracking-tight text-foreground">Smart Skill Hub</span>
          <span className="text-[11px] font-medium text-muted-foreground">Developer Intelligence</span>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-3 lg:px-4 py-5 space-y-1.5 overflow-y-auto custom-scrollbar">
        {dashboardLinks.map((link) => {
          const isActive = location.pathname === link.to;

          return (
            <NavLink
              key={link.to}
              to={link.to}
              className={cn(
                "relative flex items-center justify-center lg:justify-start gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 group",
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
              <span className="hidden lg:inline truncate">{link.label}</span>
              {link.badge && (
                <span className="hidden lg:inline-flex ml-auto text-[10px] font-bold px-1.5 py-0.5 rounded bg-primary/10 text-primary border border-primary/20">
                  {link.badge}
                </span>
              )}
            </NavLink>
          );
        })}

        {/* Admin-Only Section */}
        {backendUser?.email === "sampatakumarsv@gmail.com" && (
          <div className="pt-3 mt-3 border-t border-border/30">
            <div className="hidden lg:block px-3.5 pb-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              Administrator
            </div>
            <NavLink
              to="/dashboard/admin/analytics"
              className={cn(
                "relative flex items-center justify-center lg:justify-start gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 group",
                location.pathname.startsWith("/dashboard/admin")
                  ? "bg-destructive/10 shadow-neo-pressed text-destructive font-semibold border border-destructive/30"
                  : "text-muted-foreground hover:text-destructive hover:bg-destructive/5"
              )}
            >
              <ShieldAlert
                className={cn(
                  "h-4.5 w-4.5 shrink-0 transition-colors",
                  location.pathname.startsWith("/dashboard/admin") ? "text-destructive" : "text-muted-foreground group-hover:text-destructive"
                )}
              />
              <span className="hidden lg:inline truncate">Admin Analytics</span>
              <span className="hidden lg:inline-flex ml-auto text-[10px] font-bold px-1.5 py-0.5 rounded bg-destructive/15 text-destructive border border-destructive/30">
                Admin
              </span>
            </NavLink>
          </div>
        )}
      </nav>

      {/* User Profile & Sign Out Footer */}
      <div className="p-3 lg:p-4 border border-border/30 bg-background shadow-neo-pressed m-3 rounded-2xl mb-4">
        <div className="flex items-center justify-center lg:justify-between gap-3 mb-2.5 px-1">
          <div className="h-9 w-9 rounded-full bg-background shadow-neo-raised flex items-center justify-center text-sm font-bold text-primary overflow-hidden shrink-0 border border-primary/20">
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
          <div className="hidden lg:block flex-1 min-w-0">
            <p className="text-xs font-bold text-foreground truncate">
              {backendUser?.displayName ?? "Signed in user"}
            </p>
            <p className="text-[11px] text-primary truncate font-medium">
              🎯 {targetRole}
            </p>
          </div>
          <ThemeToggle className="hidden lg:inline-flex h-8 w-8" />
        </div>

        <Button
          variant="outline"
          size="sm"
          className="w-full justify-center lg:justify-start text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors h-8 text-xs shadow-neo-raised-sm"
          onClick={handleSignOut}
        >
          <LogOut className="h-3.5 w-3.5 lg:mr-2" />
          <span className="hidden lg:inline">Sign out</span>
        </Button>
      </div>
    </aside>
  );
};

export default DashboardSidebar;