import React from "react";

interface CardProps {
  children: React.ReactNode;
  className?: string;
  padding?: "sm" | "md" | "lg";
  variant?: "default" | "glass" | "elevated";
}

export default function Card({
  children,
  className = "",
  padding = "md",
  variant = "default",
}: CardProps) {
  const paddingClasses = {
    sm: "p-3",
    md: "p-4",
    lg: "p-5",
  };

  const variantClasses = {
    default: "bg-white rounded-lg shadow-md ring-1 ring-black/5",
    glass:
      "bg-white/80 backdrop-blur-xl rounded-xl shadow-md ring-1 ring-black/5",
    elevated: "bg-white rounded-lg shadow-lg ring-1 ring-black/5",
  };

  return (
    <div
      className={`${variantClasses[variant]} ${paddingClasses[padding]} ${className}`}
    >
      {children}
    </div>
  );
}
