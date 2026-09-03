import React, { ReactNode } from "react";
import { Button } from "./Button";

export interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description: string;
  actionText?: string;
  onAction?: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  actionText,
  onAction,
}) => {
  return (
    <div className="ssh-empty-state">
      {icon && <div className="ssh-empty-state-icon text-3xl">{icon}</div>}
      <h4 className="text-base font-semibold text-[var(--color-text-primary)] mb-1">{title}</h4>
      <p className="text-sm text-[var(--color-text-secondary)] max-w-sm mb-4">{description}</p>
      {actionText && onAction && (
        <Button variant="primary" size="sm" onClick={onAction}>
          {actionText}
        </Button>
      )}
    </div>
  );
};
