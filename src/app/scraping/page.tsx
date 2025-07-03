"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import type { CustomSchemaConfig } from "@/lib/customLLM";
import type { FilterResult } from "@/lib/url-pattern-matcher";
import LoadingScreen from "@/components/ui/LoadingScreen";
import AlertMessage from "@/components/ui/AlertMessage";
import ScrapingHeader from "@/components/scraping/ScrapingHeader";
import ConfigurationOverview from "@/components/scraping/ConfigurationOverview";
import TestControls from "@/components/scraping/TestControls";
import TestResultsSection from "@/components/scraping/TestResultsSection";

interface AnalysisResult {
  success: boolean;
  base_url: string;
  total_urls: number;
  url_mapping: {
    links: string[];
    count: number;
    base_url: string;
  };
  url_analysis: {
    url_categories: Record<
      string,
      {
        pattern: string;
        examples: string[];
        type: string;
        regex_patterns?: string[];
        path_patterns?: string[];
        url_indicators?: string[];
        priority?: number;
      }
    >;
  };
}

interface ScrapingResult {
  url: string;
  data: Record<string, unknown> | null;
  error?: string;
  processingTime: number;
}

interface TestProgress {
  current: number;
  total: number;
  currentUrl: string;
  results: ScrapingResult[];
  isComplete: boolean;
  error?: string;
}

export default function ScrapingPage() {
  const router = useRouter();
  const [scrapingConfig, setScrapingConfig] =
    useState<CustomSchemaConfig | null>(null);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(
    null,
  );
  const [isLoading, setIsLoading] = useState(true);
  const [isTesting, setIsTesting] = useState(false);
  const [testProgress, setTestProgress] = useState<TestProgress | null>(null);
  const [filterResult, setFilterResult] = useState<FilterResult | null>(null);
  const [urlTestLimit, setUrlTestLimit] = useState(5);

  useEffect(() => {
    // Load configuration from localStorage
    const savedConfig = localStorage.getItem("scrapingConfig");
    const savedAnalysis = localStorage.getItem("analysisResult");
    const savedFilterResult = localStorage.getItem("filterResult");

    if (savedConfig && savedAnalysis) {
      setScrapingConfig(JSON.parse(savedConfig));
      setAnalysisResult(JSON.parse(savedAnalysis));

      // Load pre-filtered URLs if available
      if (savedFilterResult) {
        setFilterResult(JSON.parse(savedFilterResult));
      }
    } else {
      // Redirect to agent page if no configuration found
      router.push("/agent");
      return;
    }

    setIsLoading(false);
  }, [router]);

  const handleTestDataRetrieval = async () => {
    if (!scrapingConfig || !filterResult) return;

    setIsTesting(true);
    setTestProgress({
      current: 0,
      total: urlTestLimit,
      currentUrl: "",
      results: [],
      isComplete: false,
    });

    try {
      // Use pre-filtered URLs from the configuration step
      const testUrls = filterResult.filteredUrls.slice(0, urlTestLimit);

      if (testUrls.length === 0) {
        throw new Error(
          "No URLs found to test - please go back and select different URL categories",
        );
      }

      // Use fetch with streaming for real-time updates
      const response = await fetch("/api/test-scraping", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "text/event-stream",
        },
        body: JSON.stringify({
          urls: testUrls,
          config: scrapingConfig,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      if (!response.body) {
        throw new Error("No response body");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();

        if (done) {
          break;
        }

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            try {
              const data = JSON.parse(line.substring(6));

              switch (data.type) {
                case "progress":
                  setTestProgress((prev) =>
                    prev
                      ? {
                          ...prev,
                          current: data.current,
                          total: data.total,
                          currentUrl: data.currentUrl,
                          results: data.results,
                        }
                      : null,
                  );
                  break;

                case "result":
                  setTestProgress((prev) =>
                    prev
                      ? {
                          ...prev,
                          current: data.current,
                          total: data.total,
                          currentUrl: "",
                          results: data.results,
                        }
                      : null,
                  );
                  break;

                case "complete":
                  setTestProgress((prev) =>
                    prev
                      ? {
                          ...prev,
                          current: data.current,
                          total: data.total,
                          currentUrl: "",
                          results: data.results,
                          isComplete: true,
                        }
                      : null,
                  );
                  setIsTesting(false);
                  break;
              }
            } catch (e) {
              console.error("Error parsing SSE data:", e);
            }
          }
        }
      }
    } catch (error) {
      console.error("Test scraping error:", error);
      setTestProgress((prev) =>
        prev
          ? {
              ...prev,
              error: error instanceof Error ? error.message : "Unknown error",
              isComplete: true,
            }
          : null,
      );
      setIsTesting(false);
    }
  };

  const handleBackToAgent = () => {
    router.push("/agent");
  };

  if (isLoading) {
    return <LoadingScreen message="Loading scraping configuration..." />;
  }

  if (!scrapingConfig || !analysisResult) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <AlertMessage
            type="error"
            message="No scraping configuration found"
            className="mb-4"
          />
          <button
            onClick={handleBackToAgent}
            className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600"
          >
            Back to Setup
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <ScrapingHeader
        baseUrl={scrapingConfig.baseUrl}
        onBack={handleBackToAgent}
      />

      <ConfigurationOverview
        scrapingConfig={scrapingConfig}
        analysisResult={analysisResult}
        filterResult={filterResult}
      />

      <TestControls
        onTest={handleTestDataRetrieval}
        isTesting={isTesting}
        hasUrls={!!filterResult && filterResult.stats.filteredUrls > 0}
        urlsCount={filterResult?.stats.filteredUrls || 0}
        urlTestLimit={urlTestLimit}
        onUrlTestLimitChange={setUrlTestLimit}
      />

      <TestResultsSection
        isTesting={isTesting}
        testProgress={testProgress}
        scrapingConfig={scrapingConfig}
      />
    </div>
  );
}
