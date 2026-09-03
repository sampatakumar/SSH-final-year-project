import React from "react";
import {
  Home,
  History,
  Bookmark,
  ListVideo,
  MapPin,
  Flame,
} from "lucide-react";
import { NavLink, Link } from "react-router-dom";

export interface EduTubeSidebarProps {
  activeView?: "home" | "explore" | "learning";
  onSelectView?: (view: "home" | "explore" | "learning") => void;
}

export const EduTubeSidebar: React.FC<EduTubeSidebarProps> = () => {
  const navLinks = [
    { to: "/dashboard/edutube", label: "EduTube Home", icon: Home, end: true },
    { to: "/dashboard/edutube/history", label: "Watch History", icon: History },
    { to: "/dashboard/edutube/saved", label: "Saved Videos", icon: Bookmark },
    { to: "/dashboard/edutube/playlists", label: "My Playlists", icon: ListVideo },
  ];

  return (
    <aside className="w-full lg:w-56 shrink-0 space-y-6">
      {/* Primary Navigation */}
      <div className="p-2 bg-surface/60 border border-border/40 rounded-2xl shadow-neo-raised space-y-1">
        {navLinks.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) =>
              `w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition-all duration-150 ${
                isActive
                  ? "bg-background text-primary shadow-neo-pressed border border-primary/20"
                  : "text-muted-foreground hover:text-foreground hover:bg-surface/80"
              }`
            }
          >
            <item.icon className="h-4 w-4 shrink-0" />
            <span>{item.label}</span>
          </NavLink>
        ))}
      </div>

      {/* Skill Hub Learning Roadmap Connection */}
      <div className="p-3 bg-primary/5 border border-primary/20 rounded-2xl space-y-2 text-xs">
        <div className="flex items-center gap-1.5 font-bold text-primary">
          <MapPin className="h-3.5 w-3.5" />
          <span>Skill Gap Integration</span>
        </div>
        <p className="text-[11px] text-muted-foreground leading-relaxed">
          Targeted video courses matched directly to your evaluated skill profile.
        </p>
        <Link
          to="/dashboard/roadmap"
          className="inline-flex items-center gap-1 text-[11px] font-bold text-primary hover:underline pt-1"
        >
          <span>View Learning Roadmap →</span>
        </Link>
      </div>
    </aside>
  );
};
