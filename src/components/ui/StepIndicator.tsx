import React from "react";
import { ChevronRight } from "lucide-react";

interface Step {
  id: number;
  title: string;
  completed?: boolean;
}

interface StepIndicatorProps {
  steps: Step[];
  currentStep: number;
  className?: string;
}

export default function StepIndicator({
  steps,
  currentStep,
  className = "",
}: StepIndicatorProps) {
  return (
    <div className={`flex items-center justify-center space-x-4 ${className}`}>
      {steps.map((step, index) => (
        <React.Fragment key={step.id}>
          <div className="flex items-center">
            <div
              className={`w-8 h-8 rounded-md flex items-center justify-center font-medium text-sm ${
                currentStep >= step.id
                  ? "bg-blue-500 text-white"
                  : "bg-gray-200 text-gray-500"
              }`}
            >
              {step.id}
            </div>
            <span
              className={`ml-2 font-medium text-sm ${
                currentStep >= step.id ? "text-blue-600" : "text-gray-500"
              }`}
            >
              {step.title}
            </span>
          </div>
          {index < steps.length - 1 && (
            <ChevronRight className="text-gray-400 w-4 h-4" />
          )}
        </React.Fragment>
      ))}
    </div>
  );
}
