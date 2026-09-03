import React, { HTMLAttributes } from "react";

export interface SkeletonProps extends HTMLAttributes<HTMLDivElement> {
  height?: string | number;
  width?: string | number;
  circle?: boolean;
}

export const Skeleton: React.FC<SkeletonProps> = ({
  height = "20px",
  width = "100%",
  circle = false,
  className = "",
  style,
  ...props
}) => {
  return (
    <div
      className={`ssh-skeleton ${circle ? "rounded-full" : ""} ${className}`}
      style={{
        height: typeof height === "number" ? `${height}px` : height,
        width: typeof width === "number" ? `${width}px` : width,
        ...style,
      }}
      {...props}
    />
  );
};
