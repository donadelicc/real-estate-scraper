"use client";

import React, { useState } from "react";
import { ChevronRight, ChevronLeft, Play } from "lucide-react";
import { useRouter } from "next/navigation";
import { createScrapingJobConfig } from "@/lib/customLLM";
import { testDataField } from "@/constants/testDataField";
import {
  URLPatternMatcher,
  type FilterResult,
} from "@/lib/url-pattern-matcher";
import type { URLPattern } from "@/lib/url-analysis";

import Card from "@/components/ui/Card";
import StepIndicator from "@/components/ui/StepIndicator";
import GradientButton from "@/components/ui/GradientButton";
import URLInputStep from "@/components/agent/URLInputStep";
import CategorySelectionStep from "@/components/agent/CategorySelectionStep";
import FindLinksStep from "@/components/agent/FindLinksStep";
import DataStructureStep from "@/components/agent/DataStructureStep";

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

interface DataField {
  id: string;
  name: string;
  description: string;
  example: string;
}

const STEPS = [
  { id: 1, title: "URL Input" },
  { id: 2, title: "URL Analysis" },
  { id: 3, title: "Find Links" },
  { id: 4, title: "Data Structure" },
];

export default function AgentPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [baseUrl, setBaseUrl] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(
    null,
  );
  const [foundLinksCount, setFoundLinksCount] = useState<number | undefined>(
    undefined,
  );
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [filterResult, setFilterResult] = useState<FilterResult | null>(null);
  const [urlPatterns, setUrlPatterns] = useState<Record<
    string,
    URLPattern
  > | null>(null);
  const [isGeneratingPatterns, setIsGeneratingPatterns] = useState(false);
  const [error, setError] = useState("");
  const [dataFields, setDataFields] = useState<DataField[]>([
    {
      id: "1",
      name: "title",
      description: "Property title or name",
      example: "Beautiful 3-bedroom villa in Costa del Sol",
    },
    {
      id: "2",
      name: "price",
      description: "Property price",
      example: "€650,000",
    },
    {
      id: "3",
      name: "address",
      description: "Property address or location",
      example: "Marbella, Malaga, Spain",
    },
    {
      id: "4",
      name: "bedrooms",
      description: "Number of bedrooms",
      example: "3",
    },
    {
      id: "5",
      name: "bathrooms",
      description: "Number of bathrooms",
      example: "2",
    },
  ]);
  const [csvUploadError, setCsvUploadError] = useState("");

  const handleUrlSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!baseUrl.trim()) return;

    setIsAnalyzing(true);
    setError("");
    setFoundLinksCount(undefined);

    try {
      const response = await fetch("/api/analyze-urls", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ base_url: baseUrl }),
      });

      const data = await response.json();

      if (data.success) {
        setFoundLinksCount(data.total_urls);
        setAnalysisResult(data);
        // Small delay to show the real number before moving to next step
        setTimeout(() => {
          setCurrentStep(2);
        }, 1000);
      } else {
        setError(data.error || "Failed to analyze URL");
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleCategoryToggle = (category: string) => {
    const newCategories = selectedCategories.includes(category)
      ? selectedCategories.filter((c) => c !== category)
      : [...selectedCategories, category];

    setSelectedCategories(newCategories);

    // Clear previous results when categories change
    setFilterResult(null);
    setUrlPatterns(null);
  };

  const handleFindUrls = async () => {
    if (!analysisResult || selectedCategories.length === 0) return;

    setIsGeneratingPatterns(true);
    setError("");

    try {
      // Step 1: Generate regex patterns for selected categories via API
      const response = await fetch("/api/generate-patterns", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          selectedCategories,
          urlAnalysis: analysisResult.url_analysis,
        }),
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || "Failed to generate patterns");
      }

      const generatedPatterns = data.patterns;
      setUrlPatterns(generatedPatterns);

      // Step 2: Filter URLs using the generated patterns
      const allUrls = analysisResult.url_mapping?.links || [];
      const urlFilterResult = URLPatternMatcher.filterUrlsByPatterns(
        allUrls,
        selectedCategories,
        generatedPatterns,
      );

      setFilterResult(urlFilterResult);
    } catch (error) {
      console.error("URL pattern generation error:", error);
      setError(
        error instanceof Error
          ? error.message
          : "Failed to generate URL patterns",
      );
      setFilterResult(null);
      setUrlPatterns(null);
    } finally {
      setIsGeneratingPatterns(false);
    }
  };

  const handleNext = () => {
    if (currentStep === 2 && selectedCategories.length > 0) {
      setCurrentStep(3);
    } else if (
      currentStep === 3 &&
      filterResult &&
      filterResult.stats.filteredUrls > 0
    ) {
      setCurrentStep(4);
    } else if (currentStep === 4 && dataFields.length > 0 && analysisResult) {
      // Validate that at least one field has both name and description
      const validFields = dataFields.filter(
        (field) => field.name && field.description,
      );

      if (validFields.length === 0) {
        setError(
          "Please ensure at least one data field has both a name and description filled out.",
        );
        return;
      }

      // Create scraping job configuration
      const scrapingConfig = createScrapingJobConfig(
        analysisResult.base_url,
        selectedCategories,
        dataFields,
      );

      // Validate the scraping config has valid fields
      if (
        !scrapingConfig.dataFields ||
        scrapingConfig.dataFields.length === 0
      ) {
        setError(
          "No valid data fields found. Please ensure at least one field has both name and description.",
        );
        return;
      }

      try {
        // Store configuration in localStorage for the scraping page
        localStorage.setItem("scrapingConfig", JSON.stringify(scrapingConfig));
        localStorage.setItem("analysisResult", JSON.stringify(analysisResult));

        // Store the filter result so the scraping page can use pre-filtered URLs
        if (filterResult) {
          localStorage.setItem("filterResult", JSON.stringify(filterResult));
        }

        // Store the URL patterns for reference
        if (urlPatterns) {
          localStorage.setItem("urlPatterns", JSON.stringify(urlPatterns));
        }

        // Navigate to scraping page
        router.push("/scraping");
      } catch (error) {
        console.error("Error storing configuration:", error);
        setError("Failed to save configuration. Please try again.");
      }
    }
  };

  const addDataField = () => {
    const newField: DataField = {
      id: Date.now().toString(),
      name: "",
      description: "",
      example: "",
    };
    setDataFields((prev) => [...prev, newField]);

    // Clear error when user adds a field
    if (error) {
      setError("");
    }
  };

  const removeDataField = (id: string) => {
    setDataFields((prev) => prev.filter((field) => field.id !== id));
  };

  const updateDataField = (
    id: string,
    field: keyof DataField,
    value: string,
  ) => {
    setDataFields((prev) =>
      prev.map((dataField) =>
        dataField.id === id ? { ...dataField, [field]: value } : dataField,
      ),
    );

    // Clear error when user starts editing fields
    if (error) {
      setError("");
    }
  };

  const parseCsvHeaders = (csvContent: string): string[] => {
    const lines = csvContent.trim().split("\n");
    if (lines.length === 0) return [];

    const firstLine = lines[0];

    // Detect separator - check for semicolon first, then comma
    let separator = ",";
    if (
      firstLine.includes(";") &&
      firstLine.split(";").length > firstLine.split(",").length
    ) {
      separator = ";";
    }

    // Simple CSV parsing - handles basic cases and quoted fields
    const headers: string[] = [];
    let current = "";
    let inQuotes = false;

    for (let i = 0; i < firstLine.length; i++) {
      const char = firstLine[i];

      if (char === '"' && !inQuotes) {
        inQuotes = true;
      } else if (char === '"' && inQuotes) {
        inQuotes = false;
      } else if (char === separator && !inQuotes) {
        headers.push(current.trim().replace(/^"|"$/g, ""));
        current = "";
      } else {
        current += char;
      }
    }

    // Don't forget the last field
    if (current) {
      headers.push(current.trim().replace(/^"|"$/g, ""));
    }

    return headers.filter((header) => header.length > 0);
  };

  const handleCsvUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setCsvUploadError("");

    if (!file.name.toLowerCase().endsWith(".csv")) {
      setCsvUploadError("Please upload a CSV file");
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const csvContent = e.target?.result as string;
        const headers = parseCsvHeaders(csvContent);

        if (headers.length === 0) {
          setCsvUploadError("No column headers found in the CSV file");
          return;
        }

        // Convert headers to data fields
        const newDataFields: DataField[] = headers.map((header, index) => ({
          id: Date.now().toString() + index,
          name: header,
          description: "",
          example: "",
        }));

        setDataFields(newDataFields);
        setCsvUploadError("");
      } catch {
        setCsvUploadError("Error reading CSV file. Please check the format.");
      }
    };

    reader.onerror = () => {
      setCsvUploadError("Error reading file");
    };

    reader.readAsText(file);
  };

  const loadTestData = () => {
    setDataFields(testDataField);
    setCsvUploadError("");
    setError("");
  };

  const resetFlow = () => {
    setCurrentStep(1);
    setBaseUrl("");
    setAnalysisResult(null);
    setFoundLinksCount(undefined);
    setSelectedCategories([]);
    setFilterResult(null);
    setUrlPatterns(null);
    setIsGeneratingPatterns(false);
    setError("");
    setCsvUploadError("");
    setDataFields([
      {
        id: "1",
        name: "title",
        description: "Property title or name",
        example: "Beautiful 3-bedroom villa in Costa del Sol",
      },
      {
        id: "2",
        name: "price",
        description: "Property price",
        example: "€650,000",
      },
      {
        id: "3",
        name: "address",
        description: "Property address or location",
        example: "Marbella, Malaga, Spain",
      },
      {
        id: "4",
        name: "bedrooms",
        description: "Number of bedrooms",
        example: "3",
      },
      {
        id: "5",
        name: "bathrooms",
        description: "Number of bathrooms",
        example: "2",
      },
    ]);
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="relative inline-block">
          <div className="absolute -top-4 -left-4 w-24 h-24 bg-blue-500/10 rounded-full blur-2xl"></div>
          <div className="absolute -bottom-4 -right-4 w-24 h-24 bg-purple-500/10 rounded-full blur-2xl"></div>
          <div className="relative">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
              Real Estate Scraping Agent
            </h1>
            <p className="text-gray-600 text-lg">
              Step-by-step guide to analyze and scrape real estate websites
            </p>
          </div>
        </div>
      </div>

      {/* Progress Steps */}
      <StepIndicator
        steps={STEPS}
        currentStep={currentStep}
        className="mb-12"
      />

      {/* Main Content */}
      <Card variant="glass" padding="lg">
        {/* Step 1: URL Input */}
        {currentStep === 1 && (
          <URLInputStep
            baseUrl={baseUrl}
            onUrlChange={setBaseUrl}
            onSubmit={handleUrlSubmit}
            isAnalyzing={isAnalyzing}
            error={error}
            foundLinksCount={foundLinksCount}
          />
        )}

        {/* Step 2: URL Analysis Results */}
        {currentStep === 2 && analysisResult && (
          <CategorySelectionStep
            analysisResult={analysisResult}
            selectedCategories={selectedCategories}
            onCategoryToggle={handleCategoryToggle}
            error={error}
          />
        )}

        {/* Step 3: Find Links */}
        {currentStep === 3 && analysisResult && (
          <FindLinksStep
            analysisResult={analysisResult}
            selectedCategories={selectedCategories}
            onFindUrls={handleFindUrls}
            isGeneratingPatterns={isGeneratingPatterns}
            filterResult={filterResult}
            error={error}
          />
        )}

        {/* Step 4: Data Structure Definition */}
        {currentStep === 4 && (
          <DataStructureStep
            dataFields={dataFields}
            onAddField={addDataField}
            onRemoveField={removeDataField}
            onUpdateField={updateDataField}
            onLoadTestData={loadTestData}
            onCsvUpload={handleCsvUpload}
            csvUploadError={csvUploadError}
            error={error}
          />
        )}

        {/* Navigation Buttons */}
        <div className="flex justify-center space-x-3 pt-4 mt-4 border-t border-gray-200">
          {currentStep > 1 && (
            <GradientButton
              onClick={() => setCurrentStep(currentStep - 1)}
              variant="secondary"
              size="sm"
              className="w-10 h-10 p-0"
            >
              <ChevronLeft className="w-4 h-4" />
            </GradientButton>
          )}

          {currentStep === 1 && (
            <GradientButton
              onClick={resetFlow}
              variant="secondary"
              size="sm"
              className="w-10 h-10 p-0"
            >
              <ChevronLeft className="w-4 h-4" />
            </GradientButton>
          )}

          {currentStep < 4 && (
            <GradientButton
              onClick={handleNext}
              disabled={
                (currentStep === 2 && selectedCategories.length === 0) ||
                (currentStep === 3 &&
                  (!filterResult || filterResult.stats.filteredUrls === 0))
              }
              size="sm"
              className="w-10 h-10 p-0"
            >
              <ChevronRight className="w-4 h-4" />
            </GradientButton>
          )}

          {currentStep === 4 && (
            <GradientButton
              onClick={handleNext}
              disabled={
                dataFields.length === 0 ||
                !dataFields.some((field) => field.name && field.description) ||
                !analysisResult
              }
              variant="success"
              size="sm"
              className="w-10 h-10 p-0"
            >
              <Play className="w-4 h-4" />
            </GradientButton>
          )}
        </div>
      </Card>
    </div>
  );
}
