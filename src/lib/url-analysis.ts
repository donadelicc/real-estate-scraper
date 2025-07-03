import FirecrawlApp from "@mendable/firecrawl-js";
import { ChatOpenAI } from "@langchain/openai";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { z } from "zod";
import { JsonOutputParser } from "@langchain/core/output_parsers";

// Initialize Firecrawl app
const getFirecrawlApp = () => {
  const apiKey = process.env.FIRECRAWL_API_KEY;
  if (!apiKey) {
    throw new Error("FIRECRAWL_API_KEY environment variable is required");
  }
  return new FirecrawlApp({ apiKey });
};

// Types for URL analysis
export type URLCategory = {
  type: string;
  examples: string[];
};

export type URLTypeAnalysis = {
  url_categories: Record<string, URLCategory>;
};

export type URLPattern = {
  regex: string;
};

export type CategoryPatterns = {
  [categoryName: string]: URLPattern;
};

// Request/Response types
export interface URLMappingRequest {
  base_url: string;
}

export interface URLMappingResponse {
  links: string[];
  count: number;
  base_url: string;
}

export interface URLAnalysisRequest {
  urls: string[];
}

export interface URLAnalysisResponse extends URLTypeAnalysis {}

/**
 * Extract ALL URLs from a base URL (comprehensive mapping, not filtered)
 * This is the TypeScript equivalent of the Python get_urls function
 */
export async function getAllUrls(baseUrl: string): Promise<URLMappingResponse> {
  try {
    const app = getFirecrawlApp();

    const response = await app.mapUrl(baseUrl, {
      includeSubdomains: true,
    });

    if (response.success && response.links) {
      return {
        links: response.links,
        count: response.links.length,
        base_url: baseUrl,
      };
    } else {
      return {
        links: [],
        count: 0,
        base_url: baseUrl,
      };
    }
  } catch (error) {
    console.error("Error processing URL:", error);
    throw new Error(
      `Error processing URL: ${error instanceof Error ? error.message : "Unknown error"}`,
    );
  }
}

/**
 * Analyze URLs and categorize them into different types for web scraping purposes
 * Returns URL categories with examples and descriptions
 */
export async function findUrlTypes(urls: string[]): Promise<URLTypeAnalysis> {
  try {
    // Initialize LLM
    const llm = new ChatOpenAI({
      modelName: "gpt-4o-mini",
      temperature: 0,
      openAIApiKey: process.env.OPENAI_API_KEY,
    });

    // Format instructions for JSON output
    const formatInstructions = `Respond only in valid JSON. The JSON object you return should match the following schema:
{ 
  "url_categories": {
    "CATEGORY_NAME": {
      "type": "string",
      "examples": ["string", "string", "string", "string", "string"]
    }
  }
}

Where url_categories is an object with category names as keys, each containing:
- type: Brief description of what kind of data these pages contain
- examples: Array of exactly 5 example URLs from the provided list`;

    // Setup JSON parser
    const parser = new JsonOutputParser<URLTypeAnalysis>();

    // Create prompt template
    const prompt = await ChatPromptTemplate.fromMessages([
      [
        "system",
        `You are a web scraping expert. Analyze URLs and categorize them for web scraping purposes.

Categorize the URLs into these types:
1. **DATA_PAGES**: Individual listings/products/details pages
2. **CATEGORY_PAGES**: Pages listing multiple items/search results
3. **FILTER_PAGES**: URLs with filters/parameters
4. **NAVIGATION_PAGES**: Site navigation/sitemaps
5. **UTILITY_PAGES**: Site functionality pages
6. **OTHER_PAGES**: Other pages that don't fit into the other categories

For each category found in the URLs, provide:
- type: Brief description of what kind of data these pages contain
- examples: Exactly 5 example URLs from the provided list

Only include categories that actually exist in the provided URLs.
{format_instructions}`,
      ],
      ["human", "URLs to analyze:\n{data}"],
    ]).partial({
      format_instructions: formatInstructions,
    });

    // Create chain and analyze data
    const chain = prompt.pipe(llm).pipe(parser);

    // Handle large numbers of URLs by processing in batches
    const BATCH_SIZE = 500; // Process up to 500 URLs at a time
    const MAX_URLS = 2000; // Maximum total URLs to process

    let urlsToAnalyze = urls;
    
    // If we have too many URLs, take a strategic sample
    if (urls.length > MAX_URLS) {
      console.log(`\n=== URL SAMPLING ===`);
      console.log(`Total URLs: ${urls.length}, sampling ${MAX_URLS} for analysis`);
      
      // Take URLs from different parts of the list to get a representative sample
      const step = Math.floor(urls.length / MAX_URLS);
      urlsToAnalyze = urls.filter((_, index) => index % step === 0).slice(0, MAX_URLS);
      
      console.log(`Selected ${urlsToAnalyze.length} URLs for analysis`);
    }

    // Process URLs in batches to avoid token limits
    let allCategories: Record<string, URLCategory> = {};
    
    for (let i = 0; i < urlsToAnalyze.length; i += BATCH_SIZE) {
      const batch = urlsToAnalyze.slice(i, i + BATCH_SIZE);
      const urlData = batch.join('\n');
      
      console.log(`\n=== Processing batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(urlsToAnalyze.length / BATCH_SIZE)} ===`);
      console.log(`URLs in batch: ${batch.length}`);

      try {
        // Get response for this batch
        const batchResponse = await chain.invoke({
          data: urlData,
        });

        // Merge categories from this batch
        if (batchResponse.url_categories) {
          Object.entries(batchResponse.url_categories).forEach(([category, info]) => {
            if (!allCategories[category]) {
              allCategories[category] = {
                type: info.type,
                examples: [...info.examples]
              };
            } else {
              // Merge examples, avoiding duplicates
              const existingExamples = new Set(allCategories[category].examples);
              info.examples.forEach(example => {
                if (!existingExamples.has(example)) {
                  allCategories[category].examples.push(example);
                }
              });
              
              // Keep only up to 5 examples per category
              if (allCategories[category].examples.length > 5) {
                allCategories[category].examples = allCategories[category].examples.slice(0, 5);
              }
            }
          });
        }
      } catch (error) {
        console.error(`Error processing batch ${Math.floor(i / BATCH_SIZE) + 1}:`, error);
        // Continue with other batches
      }
    }

    const response: URLTypeAnalysis = {
      url_categories: allCategories
    };

    console.log("\n=== URL TYPES ANALYSIS RESULT ===");
    console.log(`Total URLs analyzed: ${urlsToAnalyze.length}`);
    console.log(`Categories found: ${Object.keys(allCategories).length}`);
    console.log(JSON.stringify(response, null, 2));

    return response;
  } catch (error) {
    console.error("Error analyzing URL types:", error);
    throw new Error(
      `Failed to analyze URL types: ${error instanceof Error ? error.message : "Unknown error"}`,
    );
  }
}

/**
 * Generate a single regex pattern for each selected URL category based on examples
 * This function takes category examples and generates one precise regex pattern per category
 */
export async function generateRegexPatternsForCategories(
  categoryExamples: Record<string, string[]>
): Promise<CategoryPatterns> {
  try {
    // Initialize LLM
    const llm = new ChatOpenAI({
      modelName: "gpt-4o-mini",
      temperature: 0,
      openAIApiKey: process.env.OPENAI_API_KEY,
    });

    // Format instructions for JSON output
    const formatInstructions = `Respond only in valid JSON. The JSON object you return should match the following schema:
{
  "CATEGORY_NAME": {
    "regex": "string"
  }
}

Where each category has a single regex pattern that matches the provided examples.`;

    // Setup JSON parser
    const parser = new JsonOutputParser<CategoryPatterns>();

    // Prepare category data for analysis
    const categoryData = Object.entries(categoryExamples)
      .map(([category, examples]) => `${category}:\n${examples.join('\n')}`)
      .join('\n\n');

    // Create prompt template
    const prompt = await ChatPromptTemplate.fromMessages([
      [
        "system",
        `You are a regex expert. Generate a single, precise JavaScript regex pattern for each URL category based on the provided examples.

For each category, analyze the example URLs and create ONE regex pattern that:
1. Matches ALL the provided examples for that category
2. Is specific enough to avoid false matches
3. Uses proper JavaScript regex escaping (double backslashes for literal backslashes)
4. Focuses on the unique patterns in the URLs (paths, IDs, structures)

Return a single regex string for each category.
{format_instructions}`,
      ],
      ["human", "Category examples to analyze:\n{data}"],
    ]).partial({
      format_instructions: formatInstructions,
    });

    // Create chain and analyze data
    const chain = prompt.pipe(llm).pipe(parser);

    // Get response
    const response = await chain.invoke({
      data: categoryData,
    });

    console.log("\n=== REGEX PATTERNS GENERATION RESULT ===");
    console.log(JSON.stringify(response, null, 2));

    return response;
  } catch (error) {
    console.error("Error generating regex patterns:", error);
    throw new Error(
      `Failed to generate regex patterns: ${error instanceof Error ? error.message : "Unknown error"}`,
    );
  }
}

/**
 * Complete URL analysis workflow: map URLs and analyze patterns
 */
export async function performCompleteUrlAnalysis(baseUrl: string): Promise<{
  mapping: URLMappingResponse;
  analysis: URLTypeAnalysis;
}> {
  try {
    // Step 1: Get all URLs from the base URL
    const mapping = await getAllUrls(baseUrl);

    // Step 2: Analyze the URL types
    const analysis = await findUrlTypes(mapping.links);

    return {
      mapping,
      analysis,
    };
  } catch (error) {
    console.error("Error in complete URL analysis:", error);
    throw new Error(
      `Complete URL analysis failed: ${error instanceof Error ? error.message : "Unknown error"}`,
    );
  }
} 