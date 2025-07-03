import React from "react";

interface ProgressBarProps {
  current: number;
  total: number;
  currentLabel?: string;
  className?: string;
  color?: "blue" | "green" | "purple";
}

export default function ProgressBar({
  current,
  total,
  currentLabel,
  className = "",
  color = "green",
}: ProgressBarProps) {
  const percentage = Math.round((current / total) * 100);

  const colorClasses = {
    blue: "bg-blue-500",
    green: "bg-green-500",
    purple: "bg-purple-500",
  };

  return (
    <div className={`space-y-1 ${className}`}>
      <div className="w-full bg-gray-200 rounded-sm h-1.5">
        <div
          className={`${colorClasses[color]} h-1.5 rounded-sm transition-all duration-500`}
          style={{ width: `${percentage}%` }}
        />
      </div>
      <div className="flex justify-between text-xs text-gray-600">
        <span>{currentLabel || `${current}/${total}`}</span>
        <span>{percentage}% Complete</span>
      </div>
    </div>
  );
}
