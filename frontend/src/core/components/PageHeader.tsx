import React, { ReactNode } from "react";

export interface PageHeaderProps {
  title: string;
  description?: string;
  actions?: ReactNode;
}

export const PageHeader: React.FC<PageHeaderProps> = ({ title, description, actions }) => {
  return (
    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6 pb-4 border-b border-[var(--color-border)]">
      <div>
        <h1 className="text-xl md:text-2xl font-bold text-[var(--color-text-primary)] tracking-tight">
          {title}
        </h1>
        {description && (
          <p className="text-sm text-[var(--color-text-secondary)] mt-1">{description}</p>
        )}
      </div>
      {actions && <div className="flex items-center gap-3">{actions}</div>}
    </div>
  );
};
