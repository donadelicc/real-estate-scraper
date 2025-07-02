"use client";

import { useState } from "react";

interface URLResponse {
  urls: string[];
  count: number;
}

interface ContentResponse {
  markdown: string;
}

interface Property {
  // Backend API fields
  reference_number?: string;
  price?: number;
  built_size?: number;
  living_area?: number;
  bedrooms?: number;
  bathrooms?: number;
  en_suite?: number;
  floors?: number;
  terrace_size?: number;
  plot_size?: number;
  pool?: string;
  garden?: string;
  parking?: string;
  property_type?: string;
  standard?: string;
  area?: string;
  status?: string;
  link?: string;
  source?: string;

  // Frontend tracking
  url?: string; // URL used to scrape this property
}

export default function Home() {
  const [urls, setUrls] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [urlCount, setUrlCount] = useState(0);

  // Updated state for multiple properties
  const [selectedUrl, setSelectedUrl] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStep, setProcessingStep] = useState("");
  const [processedProperties, setProcessedProperties] = useState<Property[]>(
    [],
  );

  const baseUrl = "https://www.solvilla.es/properties/";

  const fetchPropertyUrls = async () => {
    try {
      setIsLoading(true);
      setError("");
      setUrls([]);
      setProcessedProperties([]);
      setSelectedUrl("");

      const response = await fetch("/api/get-urls", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ base_url: baseUrl }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data: URLResponse = await response.json();
      setUrls(data.urls);
      setUrlCount(data.count);
    } catch (error) {
      console.error("Error fetching URLs:", error);
      setError(
        "Failed to fetch property URLs. Make sure the API is running on port 8000.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  const processProperty = async (url: string) => {
    try {
      setIsProcessing(true);
      setSelectedUrl(url);
      setError("");

      // Step 1: Extract content
      setProcessingStep("Extracting content from URL...");
      const contentResponse = await fetch("/api/get-content", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ url }),
      });

      if (!contentResponse.ok) {
        throw new Error(`Failed to extract content: ${contentResponse.status}`);
      }

      const contentData: ContentResponse = await contentResponse.json();

      // Step 2: Analyze property data
      setProcessingStep("Converting to structured data...");
      const analyzeResponse = await fetch("/api/analyze-property", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ markdown_content: contentData.markdown }),
      });

      if (!analyzeResponse.ok) {
        throw new Error(
          `Failed to analyze property: ${analyzeResponse.status}`,
        );
      }

      const propertyData: Property = await analyzeResponse.json();

      // Add URL to property data
      const propertyWithUrl = { ...propertyData, url };

      // Add to processed properties list
      setProcessedProperties((prev) => {
        // Check if property already exists (by URL) and replace it
        const existingIndex = prev.findIndex((p) => p.url === url);
        if (existingIndex >= 0) {
          const updated = [...prev];
          updated[existingIndex] = propertyWithUrl;
          return updated;
        }
        return [...prev, propertyWithUrl];
      });

      setProcessingStep("Complete!");
    } catch (error) {
      console.error("Error processing property:", error);
      setError("Failed to process property. Please try again.");
    } finally {
      setIsProcessing(false);
      setProcessingStep("");
    }
  };

  return (
    <div className="relative min-h-screen from-slate-50 to-slate-100">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
        <div className="relative">
          {/* Decorative elements */}
          <div className="absolute -top-4 -left-4 w-72 h-72 bg-blue-500/5 rounded-full blur-3xl"></div>
          <div className="absolute -bottom-4 -right-4 w-72 h-72 bg-purple-500/5 rounded-full blur-3xl"></div>

          {/* Main content */}
          <div className="relative bg-white/80 backdrop-blur-xl rounded-3xl shadow-lg ring-1 ring-black/5 p-8 sm:p-12">
            <div className="text-center space-y-8 max-w-6xl mx-auto">
              {/* Header section */}
              <div className="space-y-4">
                <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent pb-1">
                  Real Estate Scraper
                </h1>
              </div>

              {/* Demo section */}
              <div className="space-y-6">
                {/* Step 1: Extract URLs */}
                <div className="bg-slate-50 rounded-xl p-6 border border-slate-200">
                  <h3 className="text-lg font-semibold text-slate-700 mb-4">
                    Step 1: Extract Property URLs
                  </h3>
                  <div className="space-y-4">
                    <div className="text-left">
                      <label className="block text-sm font-medium text-slate-600 mb-2">
                        Base URL:
                      </label>
                      <div className="bg-white rounded-lg border border-slate-200 p-3">
                        <code className="text-sm text-slate-700 font-mono">
                          {baseUrl}
                        </code>
                      </div>
                    </div>

                    <button
                      onClick={fetchPropertyUrls}
                      disabled={isLoading}
                      className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-4 rounded-xl font-semibold text-lg shadow-lg hover:shadow-xl transition-all duration-300 ease-out hover:-translate-y-[1px] disabled:opacity-70 disabled:hover:translate-y-0"
                    >
                      {isLoading ? (
                        <div className="flex items-center justify-center space-x-2">
                          <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                          <span>Extracting URLs...</span>
                        </div>
                      ) : (
                        "Extract Property URLs"
                      )}
                    </button>
                  </div>
                </div>

                {/* Error display */}
                {error && (
                  <div className="bg-red-50 border border-red-200 rounded-xl p-6">
                    <div className="flex items-center space-x-2">
                      <div className="w-5 h-5 text-red-500">
                        <svg fill="currentColor" viewBox="0 0 20 20">
                          <path
                            fillRule="evenodd"
                            d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </div>
                      <p className="text-red-700 font-medium">Error</p>
                    </div>
                    <p className="text-red-600 mt-2">{error}</p>
                  </div>
                )}

                {/* Step 2: Select URL and Process */}
                {urls.length > 0 && (
                  <div className="bg-slate-50 rounded-xl p-6 border border-slate-200">
                    <h3 className="text-lg font-semibold text-slate-700 mb-4">
                      Step 2: Select URL to Process
                    </h3>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between mb-4">
                        <span className="text-sm font-medium text-slate-600">
                          Property URLs Found
                        </span>
                        <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
                          {urlCount} URLs
                        </span>
                      </div>

                      <div className="max-h-96 overflow-y-auto space-y-2">
                        {urls.map((url, index) => {
                          const isProcessed = processedProperties.some(
                            (p) => p.url === url,
                          );
                          return (
                            <div
                              key={index}
                              className={`bg-white rounded-lg border p-3 hover:bg-slate-50 transition-colors duration-200 ${
                                isProcessed
                                  ? "border-green-300 bg-green-50"
                                  : "border-slate-200"
                              }`}
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-mono text-slate-700 truncate">
                                    {url}
                                  </p>
                                  {isProcessed && (
                                    <span className="text-xs text-green-600 font-medium">
                                      ✓ Processed
                                    </span>
                                  )}
                                </div>
                                <div className="flex space-x-2 ml-3">
                                  <button
                                    onClick={() => window.open(url, "_blank")}
                                    className="text-slate-500 hover:text-slate-700 text-sm font-medium"
                                  >
                                    View
                                  </button>
                                  <button
                                    onClick={() => processProperty(url)}
                                    disabled={isProcessing}
                                    className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors duration-200 disabled:opacity-50 ${
                                      isProcessed
                                        ? "bg-green-600 text-white hover:bg-green-700"
                                        : "bg-gradient-to-r from-green-600 to-green-700 text-white hover:from-green-700 hover:to-green-800"
                                    }`}
                                  >
                                    {isProcessed ? "Re-process" : "Process"}
                                  </button>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}

                {/* Processing Status */}
                {isProcessing && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6">
                    <div className="flex items-center space-x-2 mb-4">
                      <div className="w-5 h-5 border-2 border-yellow-600/30 border-t-yellow-600 rounded-full animate-spin"></div>
                      <h3 className="text-lg font-semibold text-yellow-800">
                        Processing Property
                      </h3>
                    </div>
                    <div className="space-y-2">
                      <p className="text-sm text-yellow-700 font-medium">
                        Selected URL:
                      </p>
                      <p className="text-sm font-mono bg-white rounded p-2 text-slate-700 break-all">
                        {selectedUrl}
                      </p>
                      <p className="text-sm text-yellow-700">
                        {processingStep}
                      </p>
                    </div>
                  </div>
                )}

                {/* DataFrame Display */}
                {processedProperties.length > 0 && (
                  <div className="bg-slate-50 rounded-xl p-6 border border-slate-200">
                    <div className="mb-4">
                      <h3 className="text-lg font-semibold text-slate-700">
                        🐼 Properties DataFrame ({processedProperties.length}{" "}
                        properties)
                      </h3>
                    </div>

                    <div className="bg-white rounded-lg border border-slate-300 overflow-hidden">
                      <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-slate-200 text-xs">
                          <thead className="bg-slate-800 text-white">
                            <tr>
                              <th className="px-2 py-1 text-left text-xs font-mono font-medium uppercase tracking-wider border-r border-slate-600">
                                Index
                              </th>
                              <th className="px-2 py-1 text-left text-xs font-mono font-medium uppercase tracking-wider border-r border-slate-600">
                                reference_number
                              </th>
                              <th className="px-2 py-1 text-left text-xs font-mono font-medium uppercase tracking-wider border-r border-slate-600">
                                price
                              </th>
                              <th className="px-2 py-1 text-left text-xs font-mono font-medium uppercase tracking-wider border-r border-slate-600">
                                built_size
                              </th>
                              <th className="px-2 py-1 text-left text-xs font-mono font-medium uppercase tracking-wider border-r border-slate-600">
                                living_area
                              </th>
                              <th className="px-2 py-1 text-left text-xs font-mono font-medium uppercase tracking-wider border-r border-slate-600">
                                bedrooms
                              </th>
                              <th className="px-2 py-1 text-left text-xs font-mono font-medium uppercase tracking-wider border-r border-slate-600">
                                bathrooms
                              </th>
                              <th className="px-2 py-1 text-left text-xs font-mono font-medium uppercase tracking-wider border-r border-slate-600">
                                en_suite
                              </th>
                              <th className="px-2 py-1 text-left text-xs font-mono font-medium uppercase tracking-wider border-r border-slate-600">
                                floors
                              </th>
                              <th className="px-2 py-1 text-left text-xs font-mono font-medium uppercase tracking-wider border-r border-slate-600">
                                terrace_size
                              </th>
                              <th className="px-2 py-1 text-left text-xs font-mono font-medium uppercase tracking-wider border-r border-slate-600">
                                plot_size
                              </th>
                              <th className="px-2 py-1 text-left text-xs font-mono font-medium uppercase tracking-wider border-r border-slate-600">
                                pool
                              </th>
                              <th className="px-2 py-1 text-left text-xs font-mono font-medium uppercase tracking-wider border-r border-slate-600">
                                garden
                              </th>
                              <th className="px-2 py-1 text-left text-xs font-mono font-medium uppercase tracking-wider border-r border-slate-600">
                                parking
                              </th>
                              <th className="px-2 py-1 text-left text-xs font-mono font-medium uppercase tracking-wider border-r border-slate-600">
                                property_type
                              </th>
                              <th className="px-2 py-1 text-left text-xs font-mono font-medium uppercase tracking-wider border-r border-slate-600">
                                standard
                              </th>
                              <th className="px-2 py-1 text-left text-xs font-mono font-medium uppercase tracking-wider border-r border-slate-600">
                                area
                              </th>
                              <th className="px-2 py-1 text-left text-xs font-mono font-medium uppercase tracking-wider border-r border-slate-600">
                                status
                              </th>
                              <th className="px-2 py-1 text-left text-xs font-mono font-medium uppercase tracking-wider border-r border-slate-600">
                                link
                              </th>
                              <th className="px-2 py-1 text-left text-xs font-mono font-medium uppercase tracking-wider">
                                source
                              </th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-slate-200">
                            {processedProperties.map((property, index) => (
                              <tr key={index} className="hover:bg-slate-50">
                                <td className="px-2 py-1 whitespace-nowrap text-xs font-mono text-blue-600 font-medium border-r border-slate-200">
                                  {index}
                                </td>
                                <td className="px-2 py-1 text-xs text-slate-900 border-r border-slate-200 max-w-24">
                                  <div className="truncate font-medium">
                                    {property.reference_number || "NaN"}
                                  </div>
                                </td>
                                <td className="px-2 py-1 whitespace-nowrap text-xs font-mono text-slate-900 border-r border-slate-200">
                                  <span className="font-semibold text-green-700">
                                    {property.price || "NaN"}
                                  </span>
                                </td>
                                <td className="px-2 py-1 whitespace-nowrap text-xs font-mono text-slate-900 border-r border-slate-200 text-center">
                                  {property.built_size || "NaN"}
                                </td>
                                <td className="px-2 py-1 whitespace-nowrap text-xs font-mono text-slate-900 border-r border-slate-200 text-center">
                                  {property.living_area || "NaN"}
                                </td>
                                <td className="px-2 py-1 whitespace-nowrap text-xs font-mono text-slate-900 border-r border-slate-200 text-center">
                                  {property.bedrooms || "NaN"}
                                </td>
                                <td className="px-2 py-1 whitespace-nowrap text-xs font-mono text-slate-900 border-r border-slate-200 text-center">
                                  {property.bathrooms || "NaN"}
                                </td>
                                <td className="px-2 py-1 whitespace-nowrap text-xs font-mono text-slate-900 border-r border-slate-200 text-center">
                                  {property.en_suite || "NaN"}
                                </td>
                                <td className="px-2 py-1 whitespace-nowrap text-xs font-mono text-slate-900 border-r border-slate-200 text-center">
                                  {property.floors || "NaN"}
                                </td>
                                <td className="px-2 py-1 whitespace-nowrap text-xs font-mono text-slate-900 border-r border-slate-200 text-center">
                                  {property.terrace_size || "NaN"}
                                </td>
                                <td className="px-2 py-1 whitespace-nowrap text-xs font-mono text-slate-900 border-r border-slate-200 text-center">
                                  {property.plot_size || "NaN"}
                                </td>
                                <td className="px-2 py-1 whitespace-nowrap text-xs text-slate-900 border-r border-slate-200">
                                  {property.pool || "NaN"}
                                </td>
                                <td className="px-2 py-1 whitespace-nowrap text-xs text-slate-900 border-r border-slate-200">
                                  {property.garden || "NaN"}
                                </td>
                                <td className="px-2 py-1 whitespace-nowrap text-xs text-slate-900 border-r border-slate-200">
                                  {property.parking || "NaN"}
                                </td>
                                <td className="px-2 py-1 text-xs text-slate-900 border-r border-slate-200 max-w-24">
                                  <div className="truncate">
                                    {property.property_type || "NaN"}
                                  </div>
                                </td>
                                <td className="px-2 py-1 whitespace-nowrap text-xs text-slate-900 border-r border-slate-200">
                                  {property.standard || "NaN"}
                                </td>
                                <td className="px-2 py-1 text-xs text-slate-900 border-r border-slate-200 max-w-24">
                                  <div className="truncate">
                                    {property.area || "NaN"}
                                  </div>
                                </td>
                                <td className="px-2 py-1 whitespace-nowrap text-xs text-slate-900 border-r border-slate-200">
                                  {property.status || "NaN"}
                                </td>
                                <td className="px-2 py-1 text-xs text-slate-900 border-r border-slate-200 max-w-24">
                                  <div className="truncate">
                                    {property.link || "NaN"}
                                  </div>
                                </td>
                                <td className="px-2 py-1 text-xs text-slate-900 max-w-24">
                                  <div className="truncate">
                                    {property.source || "NaN"}
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    <div className="mt-4 text-sm text-slate-600 font-mono bg-slate-100 rounded p-3">
                      <p>
                        Shape: ({processedProperties.length}, 20) | Memory
                        usage: ~{(processedProperties.length * 1.2).toFixed(1)}
                        KB
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
