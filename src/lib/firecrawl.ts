import FirecrawlApp from "@mendable/firecrawl-js";

// Initialize Firecrawl app
const getFirecrawlApp = () => {
  const apiKey = process.env.FIRECRAWL_API_KEY;
  if (!apiKey) {
    throw new Error("FIRECRAWL_API_KEY environment variable is required");
  }
  return new FirecrawlApp({ apiKey });
};

// Request/Response types
export interface URLRequest {
  base_url: string;
}

export interface URLResponse {
  urls: string[];
  count: number;
}

export interface ContentRequest {
  url: string;
}

export interface ContentResponse {
  markdown: string;
}

/**
 * Extract property URLs from a base URL that match the /sv{digits} pattern.
 */
export async function getPropertyUrls(baseUrl: string): Promise<URLResponse> {
  try {
    const app = getFirecrawlApp();

    const response = await app.mapUrl(baseUrl, {
      includeSubdomains: true,
    });

    if (response.success && response.links) {
      const filteredLinks: string[] = [];
      // Pattern to match URLs ending with /sv followed by digits
      const propertyPattern = /\/sv\d+\/?$/i;

      for (const url of response.links) {
        // Clean URL by removing query params and fragments
        const cleanUrl = url.split("?")[0].split("#")[0].trim();

        if (propertyPattern.test(cleanUrl)) {
          filteredLinks.push(url);
        }
      }

      return {
        urls: filteredLinks,
        count: filteredLinks.length,
      };
    } else {
      return {
        urls: [],
        count: 0,
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
 * Utility function to delay execution
 */
async function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Scrape content from a property URL and return as markdown.
 * Includes retry logic for rate limiting (429 errors).
 */
export async function getPropertyContent(
  url: string,
): Promise<ContentResponse> {
  const maxRetries = 3;
  const baseDelay = 2000; // 2 seconds

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const app = getFirecrawlApp();

      const response = await app.scrapeUrl(url, {
        formats: ["markdown"],
        onlyMainContent: true,
        excludeTags: ["img", "form"],
      });

      if (response.success && response.markdown) {
        return {
          markdown: response.markdown,
        };
      } else {
        throw new Error("Failed to extract markdown content");
      }
    } catch (error: unknown) {
      // Check if it's a rate limit error (429)
      const errorObj = error as { statusCode?: number; message?: string };
      const isRateLimit =
        errorObj?.statusCode === 429 ||
        errorObj?.message?.includes("429") ||
        errorObj?.message?.includes("Too Many Requests");

      if (isRateLimit && attempt < maxRetries) {
        const delayMs = baseDelay * Math.pow(2, attempt - 1); // Exponential backoff
        console.log(
          `Rate limit hit for ${url}. Retrying in ${delayMs}ms... (attempt ${attempt}/${maxRetries})`,
        );
        await delay(delayMs);
        continue;
      }

      // If it's not a rate limit error, or we've exhausted retries, throw the error
      console.error("Error scraping content:", error);
      throw new Error(
        `Error scraping content: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }

  // This should never be reached, but TypeScript needs it
  throw new Error("Failed to scrape content after all retries");
}
