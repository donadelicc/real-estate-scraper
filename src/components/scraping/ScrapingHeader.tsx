import React from "react";
import { ArrowLeft, Settings } from "lucide-react";

interface ScrapingHeaderProps {
  baseUrl: string;
  onBack: () => void;
}

export default function ScrapingHeader({
  baseUrl,
  onBack,
}: ScrapingHeaderProps) {
  return (
    <div className="flex items-center justify-between mb-8">
      <div className="flex items-center space-x-4">
        <button
          onClick={onBack}
          className="text-blue-600 hover:text-blue-800 transition-colors duration-200"
        >
          <ArrowLeft className="w-6 h-6" />
        </button>
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Scraping Job Overview
          </h1>
          <p className="text-gray-600 mt-1">
            Ready to extract data from {baseUrl}
          </p>
        </div>
      </div>

      <div className="flex space-x-3">
        <button
          onClick={onBack}
          className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors duration-200 flex items-center space-x-2"
        >
          <Settings className="w-4 h-4" />
          <span>Edit Configuration</span>
        </button>
      </div>
    </div>
  );
}
