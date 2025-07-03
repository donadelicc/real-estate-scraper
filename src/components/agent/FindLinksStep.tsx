import React, { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import Card from "@/components/ui/Card";
import GradientButton from "@/components/ui/GradientButton";
import HTMLThree from "@/components/HTMLThree";
import { StatusBadge } from "@/components/ui";
import type { FilterResult } from "@/lib/url-pattern-matcher";

interface URLCategory {
  type: string;
  examples: string[];
}

interface AnalysisResult {
  base_url: string;
  total_urls: number;
  url_mapping: {
    links: string[];
    count: number;
    base_url: string;
  };
  url_analysis: {
    url_categories: Record<string, URLCategory>;
  };
}

interface FindLinksStepProps {
  selectedCategories: string[];
  onFindUrls: () => void;
  isGeneratingPatterns: boolean;
  filterResult: FilterResult | null;
  analysisResult: AnalysisResult | null;
  error: string;
}

export default function FindLinksStep({
  selectedCategories,
  onFindUrls,
  isGeneratingPatterns,
  filterResult,
  error,
}: FindLinksStepProps) {
  const [isTreeExpanded, setIsTreeExpanded] = useState(false);

  const selectedCategoryNames = selectedCategories
    .map((cat) => cat.split("/").pop() || cat)
    .join(", ");

  const getDisplaySamples = (urls: string[], maxCount: number = 5) => {
    return urls.slice(0, maxCount);
  };

  return (
    <div className="space-y-4">
      <div className="text-center">
        <div className="w-12 h-12 bg-blue-500 rounded-md flex items-center justify-center mx-auto mb-3">
          <span className="text-white font-bold text-lg">🔗</span>
        </div>
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Find Links</h2>
        <p className="text-gray-600">
          Generate URL patterns and find matching links
        </p>
      </div>

      {/* Selected Categories Summary */}
      <Card className="space-y-3">
        <h3 className="text-lg font-semibold text-gray-800">
          Selected Categories
        </h3>
        <div className="flex flex-wrap gap-2">
          {selectedCategories.map((category) => (
            <StatusBadge
              key={category}
              status="success"
              size="sm"
              text={category.split("/").pop() || category}
            />
          ))}
        </div>
        <p className="text-sm text-gray-600">
          {selectedCategories.length} category
          {selectedCategories.length !== 1 ? "s" : ""} selected:{" "}
          {selectedCategoryNames}
        </p>
      </Card>

      {/* Find URLs */}
      <Card className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-800">
            URL Pattern Matching
          </h3>
          <GradientButton
            onClick={onFindUrls}
            disabled={isGeneratingPatterns || selectedCategories.length === 0}
            size="sm"
          >
            {isGeneratingPatterns ? "Generating Patterns..." : "Find URLs"}
          </GradientButton>
        </div>

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-md">
            <p className="text-red-800 text-sm">{error}</p>
          </div>
        )}

        {filterResult && (
          <div className="space-y-3">
            <div className="bg-green-50 border border-green-200 rounded-md p-3">
              <p className="text-green-800 font-medium">
                Found {filterResult.stats.filteredUrls} matching URLs
              </p>
              <p className="text-green-600 text-sm">
                {filterResult.stats.totalUrls} total URLs analyzed
              </p>
            </div>

            {/* Sample URLs */}
            <div className="space-y-2">
              <h4 className="font-medium text-gray-800">Sample URLs:</h4>
              <div className="space-y-1">
                {getDisplaySamples(filterResult.filteredUrls).map(
                  (url, index) => (
                    <div
                      key={index}
                      className="text-sm text-gray-600 bg-gray-50 p-2 rounded border"
                    >
                      {url}
                    </div>
                  ),
                )}
                {filterResult.filteredUrls.length > 5 && (
                  <p className="text-xs text-gray-500">
                    ... and {filterResult.filteredUrls.length - 5} more URLs
                  </p>
                )}
              </div>
            </div>
          </div>
        )}
      </Card>

      {/* Website Structure (Collapsible) */}
      <Card className="space-y-3">
        <button
          onClick={() => setIsTreeExpanded(!isTreeExpanded)}
          className="w-full flex items-center justify-between p-2 hover:bg-gray-50 rounded"
        >
          <h3 className="text-lg font-semibold text-gray-800">
            Website Structure
          </h3>
          {isTreeExpanded ? (
            <ChevronUp className="w-5 h-5 text-gray-500" />
          ) : (
            <ChevronDown className="w-5 h-5 text-gray-500" />
          )}
        </button>

        {isTreeExpanded && (
          <div className="border-t pt-3">
            <HTMLThree links={[]} baseUrl="" />
          </div>
        )}
      </Card>
    </div>
  );
}
