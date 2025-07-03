import React from "react";
import LoadingSpinner from "./LoadingSpinner";

interface GradientButtonProps {
  onClick: () => void;
  children: React.ReactNode;
  disabled?: boolean;
  loading?: boolean;
  size?: "sm" | "md" | "lg";
  variant?: "primary" | "secondary" | "success";
  className?: string;
}

export default function GradientButton({
  onClick,
  children,
  disabled = false,
  loading = false,
  size = "md",
  variant = "primary",
  className = "",
}: GradientButtonProps) {
  const sizeClasses = {
    sm: "px-3 py-1.5 text-sm",
    md: "px-4 py-2 text-sm",
    lg: "px-5 py-2.5 text-base",
  };

  const variantClasses = {
    primary:
      "bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700",
    secondary:
      "bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-700 hover:to-gray-800",
    success:
      "bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700",
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled || loading}
      className={`
        ${sizeClasses[size]} 
        ${variantClasses[variant]}
        text-white font-medium rounded-md shadow-md hover:shadow-lg 
        transition-all duration-200 ease-out hover:-translate-y-[1px]
        disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0
        flex items-center justify-center space-x-2
        ${className}
      `}
    >
      {loading && <LoadingSpinner size="sm" color="white" />}
      <span>{children}</span>
    </button>
  );
}
