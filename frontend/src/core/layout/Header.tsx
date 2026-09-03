import React from "react";
import { Menu, LogOut, User as UserIcon } from "lucide-react";
import { useAuth } from "../auth";

export interface HeaderProps {
  onToggleSidebar: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onToggleSidebar }) => {
  const { backendUser, firebaseUser, signOutUser } = useAuth();

  const displayName = backendUser?.name || firebaseUser?.displayName || "Developer";
  const userAvatar = backendUser?.avatar || firebaseUser?.photoURL;
  const targetRole = backendUser?.targetRole || "Full Stack Developer";

  return (
    <header className="ssh-header">
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleSidebar}
          className="p-2 rounded-lg text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-surface)] lg:hidden"
          aria-label="Toggle navigation sidebar"
        >
          <Menu size={20} />
        </button>
        <div>
          <span className="text-xs uppercase font-mono text-[var(--color-text-muted)] tracking-wider block">
            Target Track
          </span>
          <span className="text-sm font-semibold text-[var(--color-text-primary)]">
            {targetRole}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-4">
        {/* User Badge */}
        <div className="flex items-center gap-2.5 px-3 py-1.5 rounded-lg bg-[var(--color-surface)] border border-[var(--color-border)]">
          {userAvatar ? (
            <img
              src={userAvatar}
              alt={displayName}
              className="w-6 h-6 rounded-full object-cover"
            />
          ) : (
            <div className="w-6 h-6 rounded-full bg-[var(--color-surface-elevated)] flex items-center justify-center text-[var(--color-text-secondary)]">
              <UserIcon size={14} />
            </div>
          )}
          <span className="text-xs font-medium text-[var(--color-text-primary)] hidden sm:inline">
            {displayName}
          </span>
        </div>

        {/* Logout */}
        <button
          onClick={signOutUser}
          className="p-2 rounded-lg text-[var(--color-text-muted)] hover:text-[var(--color-error)] hover:bg-[var(--color-surface)] transition-colors"
          title="Sign out"
          aria-label="Sign out"
        >
          <LogOut size={18} />
        </button>
      </div>
    </header>
  );
};
