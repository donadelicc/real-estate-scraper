'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Globe, Database, Play, Settings, FileText, Target, Download, CheckCircle, XCircle, Clock, AlertTriangle } from 'lucide-react'
import type { CustomSchemaConfig } from '@/lib/customLLM'
import { URLPatternMatcher, type FilterResult } from '@/lib/url-pattern-matcher'

interface AnalysisResult {
  success: boolean
  base_url: string
  total_urls: number
  url_mapping: {
    links: string[]
    count: number
    base_url: string
  }
  url_analysis: {
    url_categories: Record<string, {
      pattern: string
      examples: string[]
      type: string
      regex_patterns?: string[]
      path_patterns?: string[]
      url_indicators?: string[]
      priority?: number
    }>
  }
}

interface ScrapingResult {
  url: string
  data: Record<string, any> | null
  error?: string
  processingTime: number
}

interface TestProgress {
  current: number
  total: number
  currentUrl: string
  results: ScrapingResult[]
  isComplete: boolean
  error?: string
}

export default function ScrapingPage() {
  const router = useRouter()
  const [scrapingConfig, setScrapingConfig] = useState<CustomSchemaConfig | null>(null)
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isTesting, setIsTesting] = useState(false)
  const [testProgress, setTestProgress] = useState<TestProgress | null>(null)
  const [filterResult, setFilterResult] = useState<FilterResult | null>(null)

  useEffect(() => {
    // Load configuration from localStorage
    const savedConfig = localStorage.getItem('scrapingConfig')
    const savedAnalysis = localStorage.getItem('analysisResult')
    const savedFilterResult = localStorage.getItem('filterResult')
    
    if (savedConfig && savedAnalysis) {
      setScrapingConfig(JSON.parse(savedConfig))
      setAnalysisResult(JSON.parse(savedAnalysis))
      
      // Load pre-filtered URLs if available
      if (savedFilterResult) {
        setFilterResult(JSON.parse(savedFilterResult))
      }
    } else {
      // Redirect to agent page if no configuration found
      router.push('/agent')
      return
    }
    
    setIsLoading(false)
  }, [router])

  const handleTestDataRetrieval = async () => {
    if (!scrapingConfig || !filterResult) return
    
    setIsTesting(true)
    setTestProgress({
      current: 0,
      total: 5,
      currentUrl: '',
      results: [],
      isComplete: false
    })

    try {
      // Use pre-filtered URLs from the configuration step
      const testUrls = filterResult.filteredUrls.slice(0, 5)
      
      // Debug logging
      console.log('=== USING PRE-FILTERED URLs ===')
      console.log('Selected categories:', scrapingConfig.selectedCategories)
      console.log('Total URLs available:', filterResult.stats.totalUrls)
      console.log('Filtered URLs found:', filterResult.stats.filteredUrls)
      console.log('Test URLs to process:', testUrls)
      console.log('Category matches:', filterResult.categoryMatches)
      console.log('========================')

      if (testUrls.length === 0) {
        throw new Error('No URLs found to test - please go back and select different URL categories')
      }

      // Use fetch with streaming for real-time updates
      const response = await fetch('/api/test-scraping', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'text/event-stream',
        },
        body: JSON.stringify({
          urls: testUrls,
          config: scrapingConfig
        }),
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      if (!response.body) {
        throw new Error('No response body')
      }

      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ''

      while (true) {
        const { done, value } = await reader.read()
        
        if (done) {
          break
        }

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n\n')
        buffer = lines.pop() || ''

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.substring(6))
              
              switch (data.type) {
                case 'progress':
                  setTestProgress(prev => prev ? {
                    ...prev,
                    current: data.current,
                    total: data.total,
                    currentUrl: data.currentUrl,
                    results: data.results
                  } : null)
                  break
                
                case 'result':
                  setTestProgress(prev => prev ? {
                    ...prev,
                    current: data.current,
                    total: data.total,
                    currentUrl: '',
                    results: data.results
                  } : null)
                  break
                
                case 'complete':
                  setTestProgress(prev => prev ? {
                    ...prev,
                    current: data.current,
                    total: data.total,
                    currentUrl: '',
                    results: data.results,
                    isComplete: true
                  } : null)
                  setIsTesting(false)
                  break
              }
            } catch (e) {
              console.error('Error parsing SSE data:', e)
            }
          }
        }
      }

    } catch (error) {
      console.error('Test scraping error:', error)
      setTestProgress(prev => prev ? {
        ...prev,
        error: error instanceof Error ? error.message : 'Unknown error',
        isComplete: true
      } : null)
      setIsTesting(false)
    }
  }

  const handleBackToAgent = () => {
    router.push('/agent')
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading scraping configuration...</p>
        </div>
      </div>
    )
  }

  if (!scrapingConfig || !analysisResult) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 mb-4">No scraping configuration found</p>
          <button
            onClick={handleBackToAgent}
            className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600"
          >
            Back to Setup
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center space-x-4">
          <button
            onClick={handleBackToAgent}
            className="text-blue-600 hover:text-blue-800 transition-colors duration-200"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Scraping Job Overview
            </h1>
            <p className="text-gray-600 mt-1">
              Ready to extract data from {scrapingConfig.baseUrl}
            </p>
          </div>
        </div>
        
        <div className="flex space-x-3">
          <button
            onClick={handleBackToAgent}
            className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors duration-200 flex items-center space-x-2"
          >
            <Settings className="w-4 h-4" />
            <span>Edit Configuration</span>
          </button>
          
          <button
            onClick={handleTestDataRetrieval}
            disabled={isTesting || !filterResult || filterResult.stats.filteredUrls === 0}
            className="bg-gradient-to-r from-green-500 to-green-600 text-white px-6 py-2 rounded-lg hover:from-green-600 hover:to-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center space-x-2"
          >
            {isTesting ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Testing...</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4" />
                <span>Test Data Retrieval</span>
              </>
            )}
          </button>
          
          {(!filterResult || filterResult.stats.filteredUrls === 0) && (
            <div className="text-sm text-amber-600 bg-amber-50 px-3 py-2 rounded-lg">
              No URLs available for testing. Please go back and select different URL categories.
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Configuration Overview */}
        <div className="lg:col-span-2 space-y-6">
          {/* Combined Overview */}
          <div className="bg-white rounded-xl shadow-lg ring-1 ring-black/5 p-6">  
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Website & URL Info */}
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold text-gray-700 mb-2 flex items-center">
                    <Globe className="w-4 h-4 text-blue-500 mr-1" />
                    Website Information
                  </h3>
                  <div className="space-y-2">
                    <div>
                      <label className="text-xs font-medium text-gray-500">Target URL</label>
                      <p className="text-sm text-gray-800 font-mono bg-gray-50 p-2 rounded border">
                        {scrapingConfig.baseUrl}
                      </p>
                    </div>
                    <div>
                      <label className="text-xs font-medium text-gray-500">Total URLs Found</label>
                      <p className="text-lg font-bold text-blue-600">{analysisResult.total_urls}</p>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold text-gray-700 mb-2 flex items-center">
                    <Target className="w-4 h-4 text-purple-500 mr-1" />
                    Selected URL Types ({scrapingConfig.selectedCategories.length})
                  </h3>
                  <div className="space-y-2">
                    {scrapingConfig.selectedCategories.map(category => {
                      const categoryInfo = analysisResult.url_analysis.url_categories[category]
                      return (
                        <div key={category} className="bg-gray-50 rounded p-2">
                          <p className="text-sm font-medium text-gray-800">
                            {category.replace('_', ' ').toUpperCase()}
                          </p>
                          <p className="text-xs text-gray-500">{categoryInfo?.type}</p>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>

              {/* Data Structure */}
              <div>
                <h3 className="font-semibold text-gray-700 mb-2 flex items-center">
                  <Database className="w-4 h-4 text-green-500 mr-1" />
                  Data Fields ({scrapingConfig.dataFields.length})
                </h3>
                <div className="bg-gray-50 rounded border max-h-64 overflow-y-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="bg-gray-100 border-b">
                        <th className="px-2 py-1 text-left font-medium text-gray-700">Field</th>
                        <th className="px-2 py-1 text-left font-medium text-gray-700">Description</th>
                      </tr>
                    </thead>
                    <tbody>
                      {scrapingConfig.dataFields.map((field, index) => (
                        <tr key={field.id} className="border-b border-gray-200">
                          <td className="px-2 py-1 font-medium text-gray-800">
                            {field.name}
                          </td>
                          <td className="px-2 py-1 text-gray-600">
                            {field.description}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* URL Pattern Matching Results */}
        {filterResult && (
          <div className="bg-white rounded-xl shadow-lg ring-1 ring-black/5 p-6">
            <div className="flex items-center mb-4">
              <Target className="w-5 h-5 text-blue-500 mr-2" />
              <h3 className="text-lg font-semibold text-gray-800">URL Pattern Matching</h3>
            </div>
            
            <div className="space-y-4">
              <div className="bg-blue-50 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-blue-600">{filterResult.stats.filteredUrls}</div>
                <div className="text-sm text-blue-700">URLs Found</div>
              </div>

              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-2">Sample URLs:</h4>
                <div className="space-y-1">
                  {Object.values(filterResult.categoryMatches).flatMap(match => match.urls).slice(0, 3).map((url, index) => (
                    <div key={index} className="text-xs text-blue-600 font-mono bg-blue-50 p-2 rounded truncate">
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



      {/* Test Results Section */}
      {(isTesting || testProgress) && (
        <div className="mt-8">
          <div className="bg-white rounded-xl shadow-lg ring-1 ring-black/5 p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center">
                <Play className="w-5 h-5 text-green-500 mr-2" />
                <h2 className="text-xl font-semibold text-gray-800">Test Scraping Results</h2>
              </div>
              
              {testProgress && (
                <div className="flex items-center space-x-4">
                  <div className="text-sm text-gray-600">
                    Progress: {testProgress.current}/{testProgress.total}
                  </div>
                  {isTesting && !testProgress.isComplete && (
                    <div className="flex items-center space-x-2">
                      <div className="w-4 h-4 border-2 border-green-500 border-t-transparent rounded-full animate-spin"></div>
                      <span className="text-sm text-green-600">
                        {testProgress.currentUrl ? 'Processing...' : 'Starting...'}
                      </span>
                    </div>
                  )}
                  {testProgress.isComplete && (
                    <div className="flex items-center space-x-2">
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      <span className="text-sm text-green-600">Complete!</span>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Progress Bar */}
            {testProgress && (
              <div className="mb-6">
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-green-500 h-2 rounded-full transition-all duration-500"
                    style={{ width: `${(testProgress.current / testProgress.total) * 100}%` }}
                  ></div>
                </div>
                <div className="flex justify-between text-xs text-gray-600 mt-2">
                  <span>
                    {testProgress.currentUrl ? (
                      <span>
                        Processing: <span className="font-mono text-blue-600">{testProgress.currentUrl.length > 50 ? `${testProgress.currentUrl.substring(0, 50)}...` : testProgress.currentUrl}</span>
                      </span>
                    ) : (
                      testProgress.isComplete ? 'Complete!' : 'Processing URLs...'
                    )}
                  </span>
                  <span>{Math.round((testProgress.current / testProgress.total) * 100)}% Complete</span>
                </div>
              </div>
            )}

            {/* Error Display */}
            {testProgress?.error && (
              <div className="mb-6 flex items-center space-x-2 text-red-600 bg-red-50 p-3 rounded-lg">
                <XCircle className="w-5 h-5 flex-shrink-0" />
                <span className="text-sm">{testProgress.error}</span>
              </div>
            )}

            {/* Results Table */}
            {testProgress && testProgress.results.length > 0 && (
              <div className="border border-gray-300 rounded-lg overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-gray-100 border-b border-gray-300">
                        <th className="w-8 px-3 py-2 text-xs font-medium text-gray-600 border-r border-gray-300">#</th>
                        <th className="px-3 py-2 text-left font-semibold text-gray-800 border-r border-gray-300 min-w-[200px]">
                          URL
                        </th>
                        <th className="w-16 px-3 py-2 text-center font-semibold text-gray-800 border-r border-gray-300">
                          Status
                        </th>
                        {scrapingConfig && scrapingConfig.dataFields.map((field) => (
                          <th 
                            key={field.id}
                            className="px-3 py-2 text-left font-semibold text-gray-800 border-r border-gray-300 min-w-[120px]"
                          >
                            {field.name}
                          </th>
                        ))}
                        <th className="px-3 py-2 text-center font-semibold text-gray-800 min-w-[80px]">
                          Time (ms)
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {testProgress.results.map((result, index) => (
                        <tr key={index} className="border-b border-gray-200 hover:bg-gray-50">
                          <td className="px-3 py-2 text-xs text-gray-500 border-r border-gray-300 bg-gray-50 text-center">
                            {index + 1}
                          </td>
                          <td className="px-3 py-2 text-xs text-blue-600 border-r border-gray-300 font-mono">
                            <a 
                              href={result.url} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="hover:underline"
                              title={result.url}
                            >
                              {result.url.length > 50 ? `${result.url.substring(0, 50)}...` : result.url}
                            </a>
                          </td>
                          <td className="px-3 py-2 border-r border-gray-300 text-center">
                                                         {result.data ? (
                               <CheckCircle className="w-4 h-4 text-green-500 mx-auto" />
                             ) : (
                               <XCircle className="w-4 h-4 text-red-500 mx-auto" />
                             )}
                          </td>
                          {scrapingConfig && scrapingConfig.dataFields.map((field) => (
                            <td 
                              key={field.id}
                              className="px-3 py-2 text-gray-700 border-r border-gray-300"
                            >
                              {result.data ? (
                                <span className="text-sm">
                                  {result.data[field.name] || <span className="text-gray-400 italic">-</span>}
                                </span>
                              ) : (
                                <span className="text-gray-400 italic text-xs">Error</span>
                              )}
                            </td>
                          ))}
                          <td className="px-3 py-2 text-gray-500 text-center text-xs">
                            {result.processingTime}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Summary */}
            {testProgress && testProgress.isComplete && (
              <div className="mt-4 flex items-center justify-between">
                <div className="flex items-center space-x-4 text-sm">
                  <div className="flex items-center space-x-1">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <span className="text-gray-600">
                      {testProgress.results.filter(r => r.data !== null).length} successful
                    </span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <XCircle className="w-4 h-4 text-red-500" />
                    <span className="text-gray-600">
                      {testProgress.results.filter(r => r.data === null).length} failed
                    </span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Clock className="w-4 h-4 text-blue-500" />
                    <span className="text-gray-600">
                      Avg: {Math.round(testProgress.results.reduce((acc, r) => acc + r.processingTime, 0) / testProgress.results.length)}ms
                    </span>
                  </div>
                </div>
                
                {testProgress.results.filter(r => r.data !== null).length > 0 && (
                  <button className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors duration-200 text-sm">
                    Export Test Results
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
} 