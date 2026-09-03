import React from "react";
import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  FileText,
  Github,
  Code2,
  BrainCircuit,
  Target,
  Compass,
  Settings,
  X,
} from "lucide-react";

export interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const navItems = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard, end: true },
  { to: "/dashboard/resumes", label: "Resume", icon: FileText },
  { to: "/dashboard/github", label: "GitHub Intelligence", icon: Github },
  { to: "/dashboard/coding", label: "Coding Assessment", icon: Code2 },
  { to: "/dashboard/skills", label: "Skill Profile", icon: BrainCircuit },
  { to: "/dashboard/gaps", label: "Skill Gaps", icon: Target },
  { to: "/dashboard/roadmap", label: "Learning Roadmap", icon: Compass },
  { to: "/dashboard/settings", label: "Settings", icon: Settings },
];

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-30 lg:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      <aside className={`ssh-sidebar ${isOpen ? "open" : ""}`} aria-label="Main Navigation">
        {/* Brand Header */}
        <div className="h-[var(--header-height)] px-6 flex items-center justify-between border-b border-[var(--color-border)]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[var(--color-primary)] flex items-center justify-center font-bold text-white shadow-lg shadow-indigo-500/20">
              SSH
            </div>
            <div>
              <span className="font-bold text-sm text-[var(--color-text-primary)] tracking-tight block">
                Smart Skill Hub
              </span>
              <span className="text-[10px] uppercase font-mono tracking-wider text-[var(--color-text-muted)] block">
                Developer Intelligence
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded text-[var(--color-text-secondary)] hover:text-white lg:hidden"
            aria-label="Close navigation sidebar"
          >
            <X size={18} />
          </button>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                onClick={onClose}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? "bg-[var(--color-primary)]/10 text-[var(--color-primary-hover)] border border-[var(--color-primary)]/20"
                      : "text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-surface)] border border-transparent"
                  }`
                }
              >
                <Icon size={18} className="shrink-0" />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </nav>

        {/* Footer Badge */}
        <div className="p-4 border-t border-[var(--color-border)] bg-[var(--color-surface)]/30">
          <div className="text-[11px] text-[var(--color-text-muted)] font-mono flex items-center justify-between">
            <span>Unified Monolith</span>
            <span className="text-[var(--color-success)] font-semibold">v1.0.0</span>
          </div>
        </div>
      </aside>
    </>
  );
};
