import React from "react";

export interface ProgressBarProps {
  value: number;
  max?: number;
  variant?: "primary" | "success" | "warning" | "error";
  className?: string;
  showLabel?: boolean;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  value,
  max = 100,
  variant = "primary",
  className = "",
  showLabel = false,
}) => {
  const percentage = Math.min(100, Math.max(0, (value / max) * 100));

  return (
    <div className={`w-full ${className}`}>
      {showLabel && (
        <div className="flex justify-between text-xs text-[var(--color-text-secondary)] mb-1 font-mono">
          <span>{Math.round(percentage)}%</span>
        </div>
      )}
      <div className="ssh-progress-container" role="progressbar" aria-valuenow={value} aria-valuemin={0} aria-valuemax={max}>
        <div
          className={`ssh-progress-fill ${variant !== "primary" ? variant : ""}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
};
