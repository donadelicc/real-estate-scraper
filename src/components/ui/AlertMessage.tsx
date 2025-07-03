import React from "react";
import { CheckCircle, XCircle, AlertCircle, Info } from "lucide-react";

interface AlertMessageProps {
  type: "success" | "error" | "warning" | "info";
  message: string;
  className?: string;
  onClose?: () => void;
}

export default function AlertMessage({
  type,
  message,
  className = "",
  onClose,
}: AlertMessageProps) {
  const alertConfig = {
    success: {
      icon: CheckCircle,
      colorClasses: "bg-green-50 text-green-700 border-green-200",
      iconColor: "text-green-500",
    },
    error: {
      icon: XCircle,
      colorClasses: "bg-red-50 text-red-700 border-red-200",
      iconColor: "text-red-500",
    },
    warning: {
      icon: AlertCircle,
      colorClasses: "bg-amber-50 text-amber-700 border-amber-200",
      iconColor: "text-amber-500",
    },
    info: {
      icon: Info,
      colorClasses: "bg-blue-50 text-blue-700 border-blue-200",
      iconColor: "text-blue-500",
    },
  };

  const config = alertConfig[type];
  const Icon = config.icon;

  return (
    <div
      className={`
      flex items-center space-x-2 p-3 rounded-md border
      ${config.colorClasses} ${className}
    `}
    >
      <Icon className={`w-4 h-4 flex-shrink-0 ${config.iconColor}`} />
      <span className="text-sm flex-1">{message}</span>
      {onClose && (
        <button
          onClick={onClose}
          className="text-gray-500 hover:text-gray-700 ml-2"
        >
          <XCircle className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}
