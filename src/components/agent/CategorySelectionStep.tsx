import React, { useState } from "react";
import { Search, Check, ChevronDown, ChevronRight } from "lucide-react";
import Card from "@/components/ui/Card";
import StatusBadge from "@/components/ui/StatusBadge";
import AlertMessage from "@/components/ui/AlertMessage";
import HTMLThree from "@/components/HTMLThree";

interface URLCategory {
  type: string;
  examples: string[];
}

interface URLAnalysis {
  url_categories: Record<string, URLCategory>;
}

interface AnalysisResult {
  success: boolean;
  base_url: string;
  total_urls: number;
  url_mapping: {
    links: string[];
    count: number;
    base_url: string;
  };
  url_analysis: URLAnalysis;
}

interface CategorySelectionStepProps {
  analysisResult: AnalysisResult;
  selectedCategories: string[];
  onCategoryToggle: (category: string) => void;
  error: string;
}

export default function CategorySelectionStep({
  analysisResult,
  selectedCategories,
  onCategoryToggle,
  error,
}: CategorySelectionStepProps) {
  const categories = Object.entries(analysisResult.url_analysis.url_categories);
  const [isTreeExpanded, setIsTreeExpanded] = useState(false);

  return (
    <div className="space-y-4">
      <div className="text-center">
        <Search className="w-12 h-12 text-blue-500 mx-auto mb-3" />
        <h2 className="text-2xl font-bold text-gray-800 mb-2">
          URL Analysis Complete
        </h2>
        <p className="text-gray-600">
          Found {analysisResult.total_urls} URLs. Select the types of pages you
          want to scrape.
        </p>
      </div>

      <Card className="space-y-3">
        <h3 className="text-lg font-semibold text-gray-800 mb-3">
          Available URL Categories ({categories.length})
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
          {categories.map(([category, details]) => {
            const isSelected = selectedCategories.includes(category);
            return (
              <div
                key={category}
                onClick={() => onCategoryToggle(category)}
                className={`
                  border-2 rounded-md p-3 cursor-pointer transition-all duration-200 hover:shadow-md
                  ${
                    isSelected
                      ? "border-blue-500 bg-blue-50"
                      : "border-gray-200 hover:border-gray-300"
                  }
                `}
              >
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium text-gray-800 text-sm">
                    {category.replace("_", " ").toUpperCase()}
                  </h4>
                  {isSelected && (
                    <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
                      <Check className="w-3 h-3 text-white" />
                    </div>
                  )}
                </div>

                <p className="text-xs text-gray-600 mb-2">{details.type}</p>

                <div className="space-y-1">
                  {details.examples.slice(0, 1).map((example, index) => (
                    <div
                      key={index}
                      className="text-xs text-blue-600 font-mono bg-blue-50 p-1 rounded truncate"
                    >
                      {example.length > 50
                        ? `${example.substring(0, 50)}...`
                        : example}
                    </div>
                  ))}
                  {details.examples.length > 1 && (
                    <div className="text-xs text-gray-500">
                      +{details.examples.length - 1} more examples
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      {selectedCategories.length > 0 && (
        <Card className="space-y-3">
          <h3 className="text-lg font-semibold text-gray-800">
            Selected Categories ({selectedCategories.length})
          </h3>

          <div className="flex flex-wrap gap-2">
            {selectedCategories.map((category) => (
              <StatusBadge
                key={category}
                status="success"
                text={category.replace("_", " ").toUpperCase()}
                size="sm"
              />
            ))}
          </div>
        </Card>
      )}

      {/* URL Tree Visualization - Collapsible */}
      <Card className="space-y-3">
        <div
          className="flex items-center justify-between cursor-pointer hover:bg-gray-50 p-2 -m-2 rounded-md transition-colors"
          onClick={() => setIsTreeExpanded(!isTreeExpanded)}
        >
          <div className="flex items-center space-x-2">
            {isTreeExpanded ? (
              <ChevronDown className="w-5 h-5 text-gray-500" />
            ) : (
              <ChevronRight className="w-5 h-5 text-gray-500" />
            )}
            <h3 className="text-lg font-semibold text-gray-800">
              Website Structure
            </h3>
          </div>
          <div className="text-sm text-gray-500">
            {analysisResult.total_urls} total URLs
          </div>
        </div>

        {isTreeExpanded && (
          <div className="max-h-96 overflow-y-auto border rounded-md bg-gray-50 transition-all duration-300">
            <HTMLThree
              links={analysisResult.url_mapping.links}
              baseUrl={analysisResult.base_url}
              urlCategories={analysisResult.url_analysis.url_categories}
              selectedCategories={selectedCategories}
            />
          </div>
        )}
      </Card>

      {error && <AlertMessage type="error" message={error} />}
    </div>
  );
}
