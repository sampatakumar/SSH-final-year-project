import React from "react";
import { Skeleton } from "./Skeleton";

export interface LoadingStateProps {
  message?: string;
  rows?: number;
}

export const LoadingState: React.FC<LoadingStateProps> = ({ message = "Loading data...", rows = 3 }) => {
  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center gap-3">
        <Skeleton height={24} width={180} />
        <span className="text-xs text-[var(--color-text-muted)] font-mono">{message}</span>
      </div>
      {Array.from({ length: rows }).map((_, i) => (
        <Skeleton key={i} height={64} width="100%" />
      ))}
    </div>
  );
};
