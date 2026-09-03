import React, { HTMLAttributes } from "react";

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  elevated?: boolean;
}

export const Card: React.FC<CardProps> = ({ children, elevated = false, className = "", ...props }) => {
  return (
    <div className={`ssh-card ${elevated ? "ssh-card-elevated" : ""} ${className}`} {...props}>
      {children}
    </div>
  );
};
