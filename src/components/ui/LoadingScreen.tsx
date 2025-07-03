import React from "react";
import LoadingSpinner from "./LoadingSpinner";

interface LoadingScreenProps {
  message?: string;
  className?: string;
}

export default function LoadingScreen({
  message = "Loading...",
  className = "",
}: LoadingScreenProps) {
  return (
    <div
      className={`min-h-screen flex items-center justify-center ${className}`}
    >
      <div className="text-center">
        <LoadingSpinner size="lg" className="mx-auto mb-4" />
        <p className="text-gray-600">{message}</p>
      </div>
    </div>
  );
}
