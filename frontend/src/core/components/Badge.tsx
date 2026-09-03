import React, { HTMLAttributes } from "react";

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: "primary" | "success" | "warning" | "error" | "neutral";
}

export const Badge: React.FC<BadgeProps> = ({ children, variant = "neutral", className = "", ...props }) => {
  const variantClass = `ssh-badge-${variant}`;
  return (
    <span className={`ssh-badge ${variantClass} ${className}`} {...props}>
      {children}
    </span>
  );
};
