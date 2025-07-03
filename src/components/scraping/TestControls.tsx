import React from "react";
import { Play } from "lucide-react";
import GradientButton from "@/components/ui/GradientButton";
import Card from "@/components/ui/Card";

interface TestControlsProps {
  onTest: () => void;
  isTesting: boolean;
  hasUrls: boolean;
  urlsCount: number;
  urlTestLimit: number;
  onUrlTestLimitChange: (limit: number) => void;
}

export default function TestControls({
  onTest,
  isTesting,
  hasUrls,
  urlsCount,
  urlTestLimit,
  onUrlTestLimitChange,
}: TestControlsProps) {
  return (
    <Card className="mb-8">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <h2 className="text-xl font-semibold text-gray-800">Test Scraping</h2>
          <div className="flex items-center space-x-3">
            <label className="text-sm text-gray-700 font-medium">
              Test URLs:
            </label>
            <input
              type="number"
              min="1"
              max={urlsCount}
              value={urlTestLimit}
              onChange={(e) =>
                onUrlTestLimitChange(
                  Math.max(
                    1,
                    Math.min(urlsCount, parseInt(e.target.value) || 1),
                  ),
                )
              }
              className="w-20 px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={isTesting}
            />
            <span className="text-sm text-gray-500">
              of {urlsCount} available
            </span>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          {!hasUrls && (
            <div className="text-sm text-amber-600 bg-amber-50 px-3 py-2 rounded-lg">
              No URLs available for testing. Please go back and select different
              URL categories.
            </div>
          )}

          <GradientButton
            onClick={onTest}
            disabled={isTesting || !hasUrls}
            loading={isTesting}
            variant="success"
            size="lg"
          >
            <Play className="w-4 h-4" />
            Test Data Retrieval
          </GradientButton>
        </div>
      </div>
    </Card>
  );
}
