import React, { ButtonHTMLAttributes } from "react";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "danger";
  size?: "sm" | "md" | "lg";
  loading?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = "primary",
  size = "md",
  loading = false,
  className = "",
  disabled,
  ...props
}) => {
  const variantClass =
    variant === "primary"
      ? "ssh-btn-primary"
      : variant === "secondary"
      ? "ssh-btn-secondary"
      : variant === "outline"
      ? "ssh-btn-outline"
      : "ssh-btn-error";

  const sizeClass = size === "sm" ? "ssh-btn-sm" : size === "lg" ? "ssh-btn-lg" : "";

  return (
    <button
      className={`ssh-btn ${variantClass} ${sizeClass} ${className}`}
      disabled={disabled || loading}
      {...props}
    >
      {loading && <span className="ssh-spinner" aria-hidden="true" />}
      {children}
    </button>
  );
};
