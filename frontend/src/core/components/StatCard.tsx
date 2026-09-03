import React, { ReactNode } from "react";
import { Card } from "./Card";

export interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: ReactNode;
  trend?: string;
  trendPositive?: boolean;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtitle,
  icon,
  trend,
  trendPositive,
}) => {
  return (
    <Card>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs uppercase font-mono tracking-wider text-[var(--color-text-muted)] mb-1">
            {title}
          </p>
          <h3 className="text-2xl font-bold text-[var(--color-text-primary)] tracking-tight">
            {value}
          </h3>
          {subtitle && (
            <p className="text-xs text-[var(--color-text-secondary)] mt-1">{subtitle}</p>
          )}
          {trend && (
            <span
              className={`inline-block text-xs mt-2 font-medium ${
                trendPositive ? "text-[var(--color-success)]" : "text-[var(--color-text-muted)]"
              }`}
            >
              {trend}
            </span>
          )}
        </div>
        {icon && (
          <div className="p-2.5 rounded-lg bg-[var(--color-surface-elevated)] border border-[var(--color-border)] text-[var(--color-primary-hover)]">
            {icon}
          </div>
        )}
      </div>
    </Card>
  );
};
