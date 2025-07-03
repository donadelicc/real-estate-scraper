import React from "react";
import { Globe, Target, Database } from "lucide-react";
import Card from "@/components/ui/Card";

interface AnalysisResult {
  total_urls: number;
  base_url: string;
  url_analysis: {
    url_categories: Record<
      string,
      {
        pattern: string;
        examples: string[];
        type: string;
      }
    >;
  };
}

interface ScrapingConfig {
  baseUrl: string;
  selectedCategories: string[];
  dataFields: Array<{
    id: string;
    name: string;
    description: string;
    example: string;
  }>;
}

interface FilterResult {
  stats: {
    totalUrls: number;
    filteredUrls: number;
  };
  categoryMatches: Record<string, { urls: string[] }>;
}

interface ConfigurationOverviewProps {
  scrapingConfig: ScrapingConfig;
  analysisResult: AnalysisResult;
  filterResult: FilterResult | null;
}

export default function ConfigurationOverview({
  scrapingConfig,
  analysisResult,
  filterResult,
}: ConfigurationOverviewProps) {
  return (
    <div className="mb-8">
      <Card className="space-y-6">
        <div
          className={`grid grid-cols-1 ${filterResult ? "lg:grid-cols-3" : "lg:grid-cols-2"} gap-6`}
        >
          {/* Website & URL Info */}
          <div className="space-y-4">
            <div>
              <h3 className="font-semibold text-gray-700 mb-3 flex items-center">
                <Globe className="w-5 h-5 text-blue-500 mr-2" />
                Website Information
              </h3>
              <div className="space-y-3">
                <div>
                  <label className="text-sm font-medium text-gray-500">
                    Target URL
                  </label>
                  <p className="text-sm text-gray-800 font-mono bg-gray-50 p-3 rounded border mt-1">
                    {scrapingConfig.baseUrl}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">
                    Total URLs Found
                  </label>
                  <p className="text-2xl font-bold text-blue-600 mt-1">
                    {analysisResult.total_urls}
                  </p>
                </div>
              </div>
            </div>

            <div>
              <h3 className="font-semibold text-gray-700 mb-3 flex items-center">
                <Target className="w-5 h-5 text-purple-500 mr-2" />
                Selected URL Types ({scrapingConfig.selectedCategories.length})
              </h3>
              <div className="space-y-3">
                {scrapingConfig.selectedCategories.map((category) => {
                  const categoryInfo =
                    analysisResult.url_analysis.url_categories[category];
                  return (
                    <div key={category} className="bg-gray-50 rounded p-3">
                      <p className="text-sm font-medium text-gray-800">
                        {category.replace("_", " ").toUpperCase()}
                      </p>
                      <p className="text-sm text-gray-500 mt-1">
                        {categoryInfo?.type}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Data Structure */}
          <div>
            <h3 className="font-semibold text-gray-700 mb-3 flex items-center">
              <Database className="w-5 h-5 text-green-500 mr-2" />
              Data Fields ({scrapingConfig.dataFields.length})
            </h3>
            <div className="bg-gray-50 rounded border max-h-80 overflow-y-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-100 border-b">
                    <th className="px-4 py-3 text-left font-medium text-gray-700">
                      Field
                    </th>
                    <th className="px-4 py-3 text-left font-medium text-gray-700">
                      Description
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {scrapingConfig.dataFields.map((field) => (
                    <tr key={field.id} className="border-b border-gray-200">
                      <td className="px-4 py-3 font-medium text-gray-800">
                        {field.name}
                      </td>
                      <td className="px-4 py-3 text-gray-600">
                        {field.description}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* URL Pattern Matching */}
          {filterResult && (
            <div>
              <h3 className="font-semibold text-gray-700 mb-2 flex items-center">
                <Target className="w-4 h-4 text-blue-500 mr-1" />
                URL Pattern Matching
              </h3>

              <div className="space-y-3">
                <div className="bg-blue-50 rounded-md p-3 text-center">
                  <div className="text-2xl font-bold text-blue-600">
                    {filterResult.stats.filteredUrls}
                  </div>
                  <div className="text-sm text-blue-700">URLs Found</div>
                </div>

                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-2">
                    Sample URLs:
                  </h4>
                  <div className="space-y-1">
                    {Object.values(filterResult.categoryMatches)
                      .flatMap((match) => match.urls)
                      .slice(0, 3)
                      .map((url, index) => (
                        <div
                          key={index}
                          className="text-xs text-blue-600 font-mono bg-blue-50 p-2 rounded truncate"
                        >
                          {url.length > 40 ? `${url.substring(0, 40)}...` : url}
                        </div>
                      ))}
                    {filterResult.stats.filteredUrls > 3 && (
                      <div className="text-xs text-gray-500 text-center pt-1">
                        +{filterResult.stats.filteredUrls - 3} more URLs
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
