import React from "react";
import { CheckCircle, XCircle, AlertCircle, Clock } from "lucide-react";

interface StatusBadgeProps {
  status: "success" | "error" | "warning" | "pending";
  text?: string;
  size?: "sm" | "md" | "lg";
  showIcon?: boolean;
  className?: string;
}

export default function StatusBadge({
  status,
  text,
  size = "md",
  showIcon = true,
  className = "",
}: StatusBadgeProps) {
  const statusConfig = {
    success: {
      icon: CheckCircle,
      colorClasses: "bg-green-50 text-green-600 border-green-200",
      iconColor: "text-green-500",
    },
    error: {
      icon: XCircle,
      colorClasses: "bg-red-50 text-red-600 border-red-200",
      iconColor: "text-red-500",
    },
    warning: {
      icon: AlertCircle,
      colorClasses: "bg-amber-50 text-amber-600 border-amber-200",
      iconColor: "text-amber-500",
    },
    pending: {
      icon: Clock,
      colorClasses: "bg-blue-50 text-blue-600 border-blue-200",
      iconColor: "text-blue-500",
    },
  };

  const sizeClasses = {
    sm: "px-1.5 py-0.5 text-xs",
    md: "px-2 py-1 text-sm",
    lg: "px-2.5 py-1.5 text-sm",
  };

  const iconSizes = {
    sm: "w-3 h-3",
    md: "w-4 h-4",
    lg: "w-4 h-4",
  };

  const config = statusConfig[status];
  const Icon = config.icon;

  return (
    <div
      className={`
      inline-flex items-center space-x-1.5 rounded-md border font-medium
      ${config.colorClasses} ${sizeClasses[size]} ${className}
    `}
    >
      {showIcon && (
        <Icon className={`${iconSizes[size]} ${config.iconColor}`} />
      )}
      {text && <span>{text}</span>}
    </div>
  );
}
