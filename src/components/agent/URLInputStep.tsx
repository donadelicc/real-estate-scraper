import React, { useState, useEffect } from "react";
import { Globe } from "lucide-react";
import FormField from "@/components/ui/FormField";
import AlertMessage from "@/components/ui/AlertMessage";

interface URLInputStepProps {
  baseUrl: string;
  onUrlChange: (url: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  isAnalyzing: boolean;
  error: string;
  foundLinksCount?: number;
}

export default function URLInputStep({
  baseUrl,
  onUrlChange,
  onSubmit,
  isAnalyzing,
  error,
  foundLinksCount,
}: URLInputStepProps) {
  const [loadingStage, setLoadingStage] = useState(0);

  const loadingMessages = [
    "Analyzing website structure...",
    foundLinksCount ? `Found ${foundLinksCount} links` : "Discovering links...",
    "Categorizing website links...",
  ];

  useEffect(() => {
    if (isAnalyzing) {
      setLoadingStage(0);

      const timer1 = setTimeout(() => {
        setLoadingStage(1);
      }, 1500);

      const timer2 = setTimeout(() => {
        setLoadingStage(2);
      }, 3000);

      return () => {
        clearTimeout(timer1);
        clearTimeout(timer2);
      };
    }
  }, [isAnalyzing]);

  return (
    <div className="space-y-4">
      <div className="text-center">
        <Globe className="w-12 h-12 text-blue-500 mx-auto mb-3" />
        <h2 className="text-2xl font-bold text-gray-800 mb-2">
          Enter Website URL
        </h2>
        <p className="text-gray-600">
          Provide the base URL of the real estate website you want to analyze
        </p>
      </div>

      <form onSubmit={onSubmit} className="space-y-4">
        <FormField
          label="Website URL"
          type="url"
          value={baseUrl}
          onChange={onUrlChange}
          placeholder="https://example.com"
          required
          disabled={isAnalyzing}
        />

        <div className="flex justify-center">
          <button
            type="submit"
            disabled={!baseUrl.trim() || isAnalyzing}
            className={`
              px-6 py-2.5 text-sm min-w-[200px]
              bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700
              text-white font-medium rounded-md shadow-md hover:shadow-lg 
              transition-all duration-200 ease-out hover:-translate-y-[1px]
              disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0
              flex items-center justify-center space-x-2
            `}
          >
            {isAnalyzing && (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            )}
            <span>
              {isAnalyzing ? loadingMessages[loadingStage] : "Analyze Website"}
            </span>
          </button>
        </div>
      </form>

      {/* Sample URL */}
      <div className="bg-gray-50 rounded-md p-3">
        <h3 className="font-medium text-gray-800 mb-2">Try a sample URL:</h3>
        <button
          onClick={() => onUrlChange("https://www.solvilla.es/properties/")}
          disabled={isAnalyzing}
          className="block text-sm text-blue-600 hover:text-blue-800 hover:underline transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          https://www.solvilla.es/properties/
        </button>
      </div>

      {error && <AlertMessage type="error" message={error} />}
    </div>
  );
}
