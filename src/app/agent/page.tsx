'use client'

import React, { useState } from 'react'
import { ChevronRight, Globe, Search, CheckCircle, AlertCircle, Loader2, Plus, Trash2, FileText, Download, Upload, FileSpreadsheet, Zap, Target, AlertTriangle } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { createScrapingJobConfig } from '@/lib/customLLM'
import { testDataField } from '@/constants/testDataField'
import { URLPatternMatcher, type FilterResult } from '@/lib/url-pattern-matcher'
import type { URLPattern } from '@/lib/url-analysis'
import HTMLThree from '@/components/HTMLThree'

interface URLCategory {
  type: string
  examples: string[]
}

interface URLAnalysis {
  url_categories: Record<string, URLCategory>
}

interface AnalysisResult {
  success: boolean
  base_url: string
  total_urls: number
  url_mapping: {
    links: string[]
    count: number
    base_url: string
  }
  url_analysis: URLAnalysis
}

interface DataField {
  id: string
  name: string
  description: string
  example: string
}

export default function AgentPage() {
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState(1)
  const [baseUrl, setBaseUrl] = useState('')
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null)
  const [selectedCategories, setSelectedCategories] = useState<string[]>([])
  const [filterResult, setFilterResult] = useState<FilterResult | null>(null)
  const [urlPatterns, setUrlPatterns] = useState<Record<string, URLPattern> | null>(null)
  const [isGeneratingPatterns, setIsGeneratingPatterns] = useState(false)
  const [error, setError] = useState('')
  const [dataFields, setDataFields] = useState<DataField[]>([
    { id: '1', name: 'title', description: 'Property title or name', example: 'Beautiful 3-bedroom villa in Costa del Sol' },
    { id: '2', name: 'price', description: 'Property price', example: '€650,000' },
    { id: '3', name: 'address', description: 'Property address or location', example: 'Marbella, Malaga, Spain' },
    { id: '4', name: 'bedrooms', description: 'Number of bedrooms', example: '3' },
    { id: '5', name: 'bathrooms', description: 'Number of bathrooms', example: '2' },
  ])
  const [csvUploadError, setCsvUploadError] = useState('')

  const handleUrlSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!baseUrl.trim()) return

    setIsAnalyzing(true)
    setError('')

    try {
      const response = await fetch('/api/analyze-urls', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ base_url: baseUrl }),
      })

      const data = await response.json()

      if (data.success) {
        setAnalysisResult(data)
        setCurrentStep(2)
      } else {
        setError(data.error || 'Failed to analyze URL')
      }
    } catch (err) {
      setError('Network error. Please try again.')
    } finally {
      setIsAnalyzing(false)
    }
  }

  const handleCategoryToggle = (category: string) => {
    const newCategories = selectedCategories.includes(category) 
      ? selectedCategories.filter(c => c !== category)
      : [...selectedCategories, category]
    
    setSelectedCategories(newCategories)
    
    // Clear previous results when categories change
    setFilterResult(null)
    setUrlPatterns(null)
  }

  const handleFindUrls = async () => {
    if (!analysisResult || selectedCategories.length === 0) return
    
    setIsGeneratingPatterns(true)
    setError('')
    
    try {
      // Step 1: Generate regex patterns for selected categories via API
      const response = await fetch('/api/generate-patterns', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          selectedCategories,
          urlAnalysis: analysisResult.url_analysis
        }),
      })

      const data = await response.json()

      if (!data.success) {
        throw new Error(data.error || 'Failed to generate patterns')
      }

      const generatedPatterns = data.patterns
      setUrlPatterns(generatedPatterns)
      
      // Step 2: Filter URLs using the generated patterns
      const allUrls = analysisResult.url_mapping?.links || []
      const urlFilterResult = URLPatternMatcher.filterUrlsByPatterns(
        allUrls,
        selectedCategories,
        generatedPatterns
      )
      
      setFilterResult(urlFilterResult)
      
      // Debug logging
      console.log('=== URL PATTERN GENERATION & FILTERING ===')
      console.log('Selected categories:', selectedCategories)
      console.log('Generated patterns:', generatedPatterns)
      console.log('Total URLs available:', urlFilterResult.stats.totalUrls)
      console.log('Filtered URLs found:', urlFilterResult.stats.filteredUrls)
      console.log('Category matches:', urlFilterResult.categoryMatches)
      console.log('======================================')
      
    } catch (error) {
      console.error('URL pattern generation error:', error)
      setError(error instanceof Error ? error.message : 'Failed to generate URL patterns')
      setFilterResult(null)
      setUrlPatterns(null)
    } finally {
      setIsGeneratingPatterns(false)
    }
  }

  const handleNext = () => {
    if (currentStep === 2 && selectedCategories.length > 0 && filterResult && filterResult.stats.filteredUrls > 0) {
      setCurrentStep(3)
    } else if (currentStep === 3 && dataFields.length > 0 && analysisResult) {
      // Create scraping job configuration
      const scrapingConfig = createScrapingJobConfig(
        analysisResult.base_url,
        selectedCategories,
        dataFields
      )
      
      // Store configuration in localStorage for the scraping page
      localStorage.setItem('scrapingConfig', JSON.stringify(scrapingConfig))
      localStorage.setItem('analysisResult', JSON.stringify(analysisResult))
      
      // Store the filter result so the scraping page can use pre-filtered URLs
      if (filterResult) {
        localStorage.setItem('filterResult', JSON.stringify(filterResult))
      }
      
      // Store the URL patterns for reference
      if (urlPatterns) {
        localStorage.setItem('urlPatterns', JSON.stringify(urlPatterns))
      }
      
      // Navigate to scraping page
      router.push('/scraping')
    }
  }

  const addDataField = () => {
    const newField: DataField = {
      id: Date.now().toString(),
      name: '',
      description: '',
      example: '',
    }
    setDataFields(prev => [...prev, newField])
  }

  const removeDataField = (id: string) => {
    setDataFields(prev => prev.filter(field => field.id !== id))
  }

  const updateDataField = (id: string, field: keyof DataField, value: string) => {
    setDataFields(prev => 
      prev.map(dataField => 
        dataField.id === id ? { ...dataField, [field]: value } : dataField
      )
    )
  }

  const parseCsvHeaders = (csvContent: string): string[] => {
    const lines = csvContent.trim().split('\n')
    if (lines.length === 0) return []
    
    const firstLine = lines[0]
    
    // Detect separator - check for semicolon first, then comma
    let separator = ','
    if (firstLine.includes(';') && firstLine.split(';').length > firstLine.split(',').length) {
      separator = ';'
    }
    
    // Simple CSV parsing - handles basic cases and quoted fields
    const headers: string[] = []
    let current = ''
    let inQuotes = false
    
    for (let i = 0; i < firstLine.length; i++) {
      const char = firstLine[i]
      
      if (char === '"' && !inQuotes) {
        inQuotes = true
      } else if (char === '"' && inQuotes) {
        inQuotes = false
      } else if (char === separator && !inQuotes) {
        headers.push(current.trim().replace(/^"|"$/g, ''))
        current = ''
      } else {
        current += char
      }
    }
    
    // Don't forget the last field
    if (current) {
      headers.push(current.trim().replace(/^"|"$/g, ''))
    }
    
    return headers.filter(header => header.length > 0)
  }

  const handleCsvUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setCsvUploadError('')

    if (!file.name.toLowerCase().endsWith('.csv')) {
      setCsvUploadError('Please upload a CSV file')
      return
    }

    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const csvContent = e.target?.result as string
        const headers = parseCsvHeaders(csvContent)
        
        if (headers.length === 0) {
          setCsvUploadError('No column headers found in the CSV file')
          return
        }

        // Convert headers to data fields
        const newDataFields: DataField[] = headers.map((header, index) => ({
          id: Date.now().toString() + index,
          name: header,
          description: '',
          example: '',
        }))

        setDataFields(newDataFields)
        setCsvUploadError('')
      } catch (error) {
        setCsvUploadError('Error reading CSV file. Please check the format.')
      }
    }

    reader.onerror = () => {
      setCsvUploadError('Error reading file')
    }

    reader.readAsText(file)
  }

  const loadTestData = () => {
    setDataFields(testDataField)
    setCsvUploadError('')
  }

  const resetFlow = () => {
    setCurrentStep(1)
    setBaseUrl('')
    setAnalysisResult(null)
    setSelectedCategories([])
    setFilterResult(null)
    setUrlPatterns(null)
    setIsGeneratingPatterns(false)
    setError('')
    setCsvUploadError('')
    setDataFields([
      { id: '1', name: 'title', description: 'Property title or name', example: 'Beautiful 3-bedroom villa in Costa del Sol' },
      { id: '2', name: 'price', description: 'Property price', example: '€650,000' },
      { id: '3', name: 'address', description: 'Property address or location', example: 'Marbella, Malaga, Spain' },
      { id: '4', name: 'bedrooms', description: 'Number of bedrooms', example: '3' },
      { id: '5', name: 'bathrooms', description: 'Number of bathrooms', example: '2' },
    ])
  }

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
      <div className="flex items-center justify-center space-x-8 mb-12">
        <div className="flex items-center">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm ${
            currentStep >= 1 ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-500'
          }`}>
            1
          </div>
          <span className={`ml-3 font-medium ${currentStep >= 1 ? 'text-blue-600' : 'text-gray-500'}`}>
            URL Input
          </span>
        </div>
        
        <ChevronRight className="text-gray-400 w-5 h-5" />
        
        <div className="flex items-center">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm ${
            currentStep >= 2 ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-500'
          }`}>
            2
          </div>
          <span className={`ml-3 font-medium ${currentStep >= 2 ? 'text-blue-600' : 'text-gray-500'}`}>
            URL Analysis
          </span>
        </div>
        
        <ChevronRight className="text-gray-400 w-5 h-5" />
        
        <div className="flex items-center">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm ${
            currentStep >= 3 ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-500'
          }`}>
            3
          </div>
          <span className={`ml-3 font-medium ${currentStep >= 3 ? 'text-blue-600' : 'text-gray-500'}`}>
            Data Structure
          </span>
        </div>
      </div>

      {/* Main Content */}
      <div className="bg-white/60 backdrop-blur-xl rounded-2xl shadow-lg ring-1 ring-black/5 p-8">
        
        {/* Step 1: URL Input */}
        {currentStep === 1 && (
          <div className="space-y-6">
            <div className="text-center">
              <Globe className="w-16 h-16 text-blue-500 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-gray-800 mb-2">
                Enter Website URL
              </h2>
              <p className="text-gray-600">
                Provide the base URL of the real estate website you want to analyze
              </p>
            </div>

            <form onSubmit={handleUrlSubmit} className="space-y-4">
              <div>
                <label htmlFor="url" className="block text-sm font-medium text-gray-700 mb-2">
                  Website URL
                </label>
                <input
                  type="url"
                  id="url"
                  placeholder="https://example-real-estate-site.com"
                  value={baseUrl}
                  onChange={(e) => setBaseUrl(e.target.value)}
                  className="w-full p-4 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>

              {error && (
                <div className="flex items-center space-x-2 text-red-600 bg-red-50 p-3 rounded-lg">
                  <AlertCircle className="w-5 h-5 flex-shrink-0" />
                  <span className="text-sm">{error}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={isAnalyzing || !baseUrl.trim()}
                className="w-full bg-gradient-to-r from-blue-500 to-purple-500 text-white py-4 px-6 rounded-xl font-medium hover:from-blue-600 hover:to-purple-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center space-x-2"
              >
                {isAnalyzing ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Analyzing Website...</span>
                  </>
                ) : (
                  <>
                    <Search className="w-5 h-5" />
                    <span>Analyze Website</span>
                  </>
                )}
              </button>
            </form>

            {/* Example URLs */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="font-medium text-gray-800 mb-2">Example URLs:</h3>
              <div className="space-y-1">
                {[
                  'https://www.solvilla.es/properties/',
                  'https://example-realestate.com/listings',
                  'https://property-site.com/search'
                ].map((example, index) => (
                  <button
                    key={index}
                    onClick={() => setBaseUrl(example)}
                    className="block text-sm text-blue-600 hover:text-blue-800 hover:underline"
                  >
                    {example}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Step 2: URL Analysis Results */}
        {currentStep === 2 && analysisResult && (
          <div className="space-y-6">
            <div className="text-center">
              <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-gray-800 mb-2">
                What kind of URLs do you want to retrieve data from?
              </h2>
              <p className="text-gray-600">
                Found <span className="font-semibold text-blue-600">{analysisResult.total_urls}</span> URLs from {analysisResult.base_url}
              </p>
              <p className="text-sm text-gray-500 mt-1">
                Select the types of URLs you want to scrape data from. We'll show you matching URLs as you select.
              </p>
            </div>

            <div className="space-y-3">
              {Object.entries(analysisResult.url_analysis.url_categories).map(([category, info]) => (
                <div
                  key={category}
                  className={`border-2 rounded-lg p-4 cursor-pointer transition-all duration-200 ${
                    selectedCategories.includes(category)
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => handleCategoryToggle(category)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="text-base font-semibold text-gray-800">
                          {category.replace('_', ' ').toUpperCase()}
                        </h3>
                        {selectedCategories.includes(category) && (
                          <CheckCircle className="w-4 h-4 text-blue-500 flex-shrink-0" />
                        )}
                      </div>
                      
                      <div className="space-y-2">
                        <div>
                          <span className="text-xs font-medium text-gray-500">Type:</span>
                          <p className="text-sm text-gray-700">{info.type}</p>
                        </div>
                        
                        <div>
                          <span className="text-xs font-medium text-gray-500">Examples:</span>
                          <div className="space-y-1">
                            {info.examples.slice(0, 2).map((example, index) => (
                              <p key={index} className="text-xs text-blue-600 font-mono bg-blue-50 px-2 py-1 rounded">
                                {example}
                              </p>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Website Structure Tree */}
            <div className="mt-6">
              <HTMLThree
                links={analysisResult.url_mapping.links}
                baseUrl={analysisResult.base_url}
                urlCategories={analysisResult.url_analysis.url_categories}
                selectedCategories={selectedCategories}
                onUrlClick={(url) => console.log('URL clicked:', url)}
              />
            </div>

            {/* Status Messages and Find URLs Section */}
            {selectedCategories.length > 0 && !filterResult && !isGeneratingPatterns && (
              <div className="flex items-center space-x-2 text-blue-600 bg-blue-50 p-3 rounded-lg">
                <Target className="w-5 h-5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium">Ready to find URLs</p>
                  <p className="text-xs text-blue-700">
                    Click "Find URLs of These Types" to generate patterns and locate matching URLs.
                  </p>
                </div>
              </div>
            )}

            {selectedCategories.length > 0 && filterResult && filterResult.stats.filteredUrls === 0 && (
              <div className="flex items-center space-x-2 text-amber-600 bg-amber-50 p-3 rounded-lg">
                <AlertTriangle className="w-5 h-5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium">No URLs matched your selection</p>
                  <p className="text-xs text-amber-700">
                    Try selecting different URL categories or the website structure may be different than expected.
                  </p>
                </div>
              </div>
            )}

            {selectedCategories.length > 0 && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <h4 className="font-medium text-green-800 mb-2">Selected URL Types:</h4>
                <div className="flex flex-wrap gap-2 mb-4">
                  {selectedCategories.map(category => (
                    <span key={category} className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">
                      {category.replace('_', ' ')}
                    </span>
                  ))}
                </div>
                
                {/* Find URLs Button */}
                <button
                  onClick={handleFindUrls}
                  disabled={isGeneratingPatterns}
                  className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white py-3 px-6 rounded-lg font-medium hover:from-purple-600 hover:to-pink-600 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center space-x-2"
                >
                  {isGeneratingPatterns ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Finding URLs...</span>
                    </>
                  ) : (
                    <>
                      <Search className="w-4 h-4" />
                      <span>Find URLs of These Types</span>
                    </>
                  )}
                </button>
              </div>
            )}

            {/* URL Pattern Matching Results */}
            {filterResult && (
              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center">
                    <Target className="w-5 h-5 text-blue-500 mr-2" />
                    <h3 className="text-lg font-semibold text-gray-800">URL Pattern Matching Results</h3>
                  </div>
                  <div className="text-sm text-gray-600">
                    {filterResult.stats.filteredUrls} of {filterResult.stats.totalUrls} URLs matched
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div className="bg-blue-50 rounded-lg p-4">
                    <div className="text-2xl font-bold text-blue-600">{filterResult.stats.filteredUrls}</div>
                    <div className="text-sm text-blue-700">URLs Found</div>
                  </div>
                  <div className="bg-purple-50 rounded-lg p-4">
                    <div className="text-2xl font-bold text-purple-600">
                      {Object.keys(filterResult.categoryMatches).length}
                    </div>
                    <div className="text-sm text-purple-700">Categories</div>
                  </div>
                </div>

                {Object.entries(filterResult.categoryMatches).map(([category, match]) => (
                  <div key={category} className="mb-4 last:mb-0">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium text-gray-800">
                        {category.replace('_', ' ')}
                      </h4>
                      <div className="flex items-center space-x-2">
                        <span className="text-sm text-gray-600">
                          {match.urls.length} URLs
                        </span>
                      </div>
                    </div>
                    
                    <div className="bg-gray-50 rounded-lg p-3">
                      <div className="space-y-1">
                        {match.urls.slice(0, 3).map((url, index) => (
                          <div key={index} className="flex items-center justify-between">
                            <span className="text-xs text-blue-600 font-mono truncate flex-1 mr-2">
                              {url.length > 80 ? `${url.substring(0, 80)}...` : url}
                            </span>
                          </div>
                        ))}
                        {match.urls.length > 3 && (
                          <div className="text-xs text-gray-500 text-center pt-1">
                            +{match.urls.length - 3} more URLs
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}

                {filterResult.stats.filteredUrls === 0 && (
                  <div className="flex items-center space-x-2 text-amber-600 bg-amber-50 p-3 rounded-lg">
                    <AlertTriangle className="w-5 h-5 flex-shrink-0" />
                    <div>
                      <p className="text-sm font-medium">No URLs matched the selected patterns</p>
                      <p className="text-xs text-amber-700">
                        Consider selecting different URL categories or the analysis may need improvement.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Navigation Buttons - Always at the bottom */}
            <div className="flex space-x-4 pt-4">
              <button
                onClick={resetFlow}
                className="flex-1 bg-gray-100 text-gray-700 py-3 px-6 rounded-xl font-medium hover:bg-gray-200 transition-colors duration-200"
              >
                Start Over
              </button>
              
              <button
                onClick={handleNext}
                disabled={selectedCategories.length === 0 || !filterResult || filterResult.stats.filteredUrls === 0}
                className="flex-1 bg-gradient-to-r from-blue-500 to-purple-500 text-white py-3 px-6 rounded-xl font-medium hover:from-blue-600 hover:to-purple-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center space-x-2"
              >
                <span>Next: Define Data Structure</span>
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Data Structure Definition */}
        {currentStep === 3 && (
          <div className="space-y-6">
            <div className="text-center">
              <FileText className="w-16 h-16 text-blue-500 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-gray-800 mb-2">
                Define Data Structure
              </h2>
              <p className="text-gray-600">
                Specify what data fields you want to extract and structure in your CSV
              </p>
              <p className="text-sm text-gray-500 mt-1">
                For each field, provide a name, description, and example data
              </p>
            </div>

            {/* Quick Test Data Button */}
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-2">
                  <Zap className="w-5 h-5 text-yellow-600" />
                  <h3 className="text-sm font-semibold text-yellow-800">Quick Test</h3>
                </div>
              </div>
              
              <p className="text-sm text-yellow-700 mb-3">
                Load pre-configured test data structure with 19 real estate fields to quickly test the scraping functionality.
              </p>
              
              <button
                onClick={loadTestData}
                className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white px-4 py-2 rounded-lg font-medium hover:from-yellow-600 hover:to-orange-600 transition-all duration-200 flex items-center space-x-2"
              >
                <Zap className="w-4 h-4" />
                <span>Load Test Data (19 fields)</span>
              </button>
            </div>

            {/* CSV Upload Section */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-2">
                  <FileSpreadsheet className="w-5 h-5 text-blue-600" />
                  <h3 className="text-sm font-semibold text-blue-800">Upload CSV Template</h3>
                </div>
              </div>
              
              <p className="text-sm text-blue-700 mb-3">
                Upload a CSV file with column headers to automatically populate your data structure. 
                The CSV should contain only the header row with your desired column names.
                Both comma (,) and semicolon (;) separators are supported.
              </p>
              
              <div className="flex items-center space-x-4">
                <label className="flex items-center space-x-2 bg-white border border-blue-300 rounded-lg px-4 py-2 cursor-pointer hover:bg-blue-50 transition-colors duration-200">
                  <Upload className="w-4 h-4 text-blue-600" />
                  <span className="text-sm font-medium text-blue-700">Choose CSV File</span>
                  <input
                    type="file"
                    accept=".csv"
                    onChange={handleCsvUpload}
                    className="hidden"
                  />
                </label>
                
                <div className="text-sm text-blue-600">
                  <div><span className="font-medium">Examples:</span></div>
                  <div>• title,price,address,bedrooms,bathrooms</div>
                  <div>• title;price;address;bedrooms;bathrooms</div>
                </div>
              </div>

              {csvUploadError && (
                <div className="mt-3 flex items-center space-x-2 text-red-600 bg-red-50 p-2 rounded">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span className="text-sm">{csvUploadError}</span>
                </div>
              )}
            </div>

            <div className="flex items-center justify-center">
              <div className="flex items-center space-x-4 text-gray-500">
                <div className="h-px bg-gray-300 w-16"></div>
                <span className="text-sm font-medium">OR</span>
                <div className="h-px bg-gray-300 w-16"></div>
              </div>
            </div>

            <div className="space-y-3">
              {dataFields.map((field, index) => (
                <div key={field.id} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                  <div className="grid grid-cols-12 gap-3 items-end">
                    <div className="col-span-1">
                      <div className="text-sm font-medium text-gray-600 mb-1">#{index + 1}</div>
                      {dataFields.length > 1 && (
                        <button
                          onClick={() => removeDataField(field.id)}
                          className="text-red-500 hover:text-red-700 transition-colors duration-200"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>

                    <div className="col-span-3">
                      <label className="block text-xs font-medium text-gray-600 mb-1">
                        Column Name
                      </label>
                      <input
                        type="text"
                        placeholder="e.g., title, price"
                        value={field.name}
                        onChange={(e) => updateDataField(field.id, 'name', e.target.value)}
                        className="w-full p-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>

                    <div className="col-span-4">
                      <label className="block text-xs font-medium text-gray-600 mb-1">
                        Description
                      </label>
                      <input
                        type="text"
                        placeholder="What this field contains"
                        value={field.description}
                        onChange={(e) => updateDataField(field.id, 'description', e.target.value)}
                        className="w-full p-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>

                    <div className="col-span-4">
                      <label className="block text-xs font-medium text-gray-600 mb-1">
                        Example Data
                      </label>
                      <input
                        type="text"
                        placeholder="Sample data"
                        value={field.example}
                        onChange={(e) => updateDataField(field.id, 'example', e.target.value)}
                        className="w-full p-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                </div>
              ))}

              <button
                onClick={addDataField}
                className="w-full border-2 border-dashed border-gray-300 rounded-lg p-3 text-gray-600 hover:border-blue-500 hover:text-blue-600 transition-all duration-200 flex items-center justify-center space-x-2"
              >
                <Plus className="w-4 h-4" />
                <span className="text-sm">Add Field</span>
              </button>
            </div>

            {/* Excel-like Table Preview */}
            {dataFields.length > 0 && dataFields.some(field => field.name) && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="text-sm font-semibold text-blue-800 mb-3 flex items-center">
                  <Download className="w-4 h-4 mr-2" />
                  Data Preview (Excel Format)
                </h3>
                
                <div className="bg-white rounded border border-gray-300 overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-gray-100 border-b border-gray-300">
                          <th className="w-8 px-2 py-2 text-xs font-medium text-gray-600 border-r border-gray-300">#</th>
                          {dataFields.filter(field => field.name).map((field, index) => (
                            <th 
                              key={field.id}
                              className="px-3 py-2 text-left font-semibold text-gray-800 border-r border-gray-300 min-w-[120px]"
                            >
                              {field.name}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        <tr className="border-b border-gray-200 hover:bg-gray-50">
                          <td className="px-2 py-2 text-xs text-gray-500 border-r border-gray-300 bg-gray-50">1</td>
                          {dataFields.filter(field => field.name).map((field, index) => (
                            <td 
                              key={field.id}
                              className="px-3 py-2 text-gray-700 border-r border-gray-300"
                            >
                              {field.example || <span className="text-gray-400 italic">example data</span>}
                            </td>
                          ))}
                        </tr>
                        <tr className="border-b border-gray-200 hover:bg-gray-50">
                          <td className="px-2 py-2 text-xs text-gray-500 border-r border-gray-300 bg-gray-50">2</td>
                          {dataFields.filter(field => field.name).map((field, index) => (
                            <td 
                              key={field.id}
                              className="px-3 py-2 text-gray-400 border-r border-gray-300 italic"
                            >
                              scraped data...
                            </td>
                          ))}
                        </tr>
                        <tr className="border-b border-gray-200 hover:bg-gray-50">
                          <td className="px-2 py-2 text-xs text-gray-500 border-r border-gray-300 bg-gray-50">3</td>
                          {dataFields.filter(field => field.name).map((field, index) => (
                            <td 
                              key={field.id}
                              className="px-3 py-2 text-gray-400 border-r border-gray-300 italic"
                            >
                              scraped data...
                            </td>
                          ))}
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            <div className="flex space-x-4">
              <button
                onClick={() => setCurrentStep(2)}
                className="flex-1 bg-gray-100 text-gray-700 py-3 px-6 rounded-xl font-medium hover:bg-gray-200 transition-colors duration-200"
              >
                Back: URL Selection
              </button>
              
              <button
                onClick={handleNext}
                disabled={dataFields.length === 0 || !dataFields.some(field => field.name && field.description)}
                className="flex-1 bg-gradient-to-r from-blue-500 to-purple-500 text-white py-3 px-6 rounded-xl font-medium hover:from-blue-600 hover:to-purple-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center space-x-2"
              >
                <span>Start Scraping</span>
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>

            {/* Summary */}
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <h4 className="font-medium text-green-800 mb-2">Summary:</h4>
              <div className="text-sm text-green-700 space-y-1">
                <div>• Website: {analysisResult?.base_url}</div>
                <div>• URL Types: {selectedCategories.length} selected</div>
                <div>• Data Fields: {dataFields.filter(field => field.name).length} defined</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
