import { NextRequest, NextResponse } from 'next/server'
import { generateRegexPatternsForCategories } from '@/lib/url-analysis'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { selectedCategories, urlAnalysis } = body

    if (!selectedCategories || !urlAnalysis) {
      return NextResponse.json(
        { error: 'Missing required parameters: selectedCategories or urlAnalysis' },
        { status: 400 }
      )
    }

    // Extract examples for selected categories
    const categoryExamples: Record<string, string[]> = {}
    selectedCategories.forEach((category: string) => {
      const categoryInfo = urlAnalysis.url_categories[category]
      if (categoryInfo && categoryInfo.examples) {
        categoryExamples[category] = categoryInfo.examples
      }
    })

    if (Object.keys(categoryExamples).length === 0) {
      return NextResponse.json(
        { error: 'No valid categories with examples found' },
        { status: 400 }
      )
    }

    // Generate regex patterns using the LLM
    const patterns = await generateRegexPatternsForCategories(categoryExamples)

    return NextResponse.json({
      success: true,
      patterns
    })

  } catch (error) {
    console.error('Error generating patterns:', error)
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Failed to generate patterns',
        success: false 
      },
      { status: 500 }
    )
  }
} 