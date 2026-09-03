import React from "react";
import { Button } from "./Button";
import { Card } from "./Card";

export interface ErrorStateProps {
  title?: string;
  message: string;
  onRetry?: () => void;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  title = "Something went wrong",
  message,
  onRetry,
}) => {
  return (
    <Card className="border-[var(--color-error)] bg-[rgba(239,68,68,0.05)] text-center py-8">
      <div className="text-xl font-semibold text-[var(--color-error)] mb-2">{title}</div>
      <p className="text-sm text-[var(--color-text-secondary)] max-w-md mx-auto mb-4">{message}</p>
      {onRetry && (
        <Button variant="secondary" size="sm" onClick={onRetry}>
          Try Again
        </Button>
      )}
    </Card>
  );
};
