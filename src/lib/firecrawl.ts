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
 * Scrape content from a property URL and return as markdown.
 */
export async function getPropertyContent(
  url: string,
): Promise<ContentResponse> {
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
  } catch (error) {
    console.error("Error scraping content:", error);
    throw new Error(
      `Error scraping content: ${error instanceof Error ? error.message : "Unknown error"}`,
    );
  }
}
