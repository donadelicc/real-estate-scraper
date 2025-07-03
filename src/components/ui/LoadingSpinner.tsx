import React from "react";

interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg";
  color?: "blue" | "green" | "white";
  className?: string;
}

export default function LoadingSpinner({
  size = "md",
  color = "blue",
  className = "",
}: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: "w-3 h-3 border-2",
    md: "w-5 h-5 border-2",
    lg: "w-6 h-6 border-2",
  };

  const colorClasses = {
    blue: "border-blue-500 border-t-transparent",
    green: "border-green-500 border-t-transparent",
    white: "border-white border-t-transparent",
  };

  return (
    <div
      className={`${sizeClasses[size]} ${colorClasses[color]} rounded-full animate-spin ${className}`}
    />
  );
}
