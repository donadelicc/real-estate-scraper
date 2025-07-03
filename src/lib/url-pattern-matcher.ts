import type { URLCategory, URLPattern } from './url-analysis';

export interface MatchResult {
  matches: boolean;
  matchedBy: string[];
}

export interface CategoryMatch {
  urls: string[];
}

export interface FilterResult {
  filteredUrls: string[];
  categoryMatches: Record<string, CategoryMatch>;
  stats: {
    totalUrls: number;
    filteredUrls: number;
  };
}

export class URLPatternMatcher {
  /**
   * Match URLs using regex patterns
   */
  static matchByRegex(url: string, patterns: string[]): boolean {
    if (!patterns || patterns.length === 0) return false;
    
    return patterns.some(pattern => {
      try {
        const regex = new RegExp(pattern, 'i');
        return regex.test(url);
      } catch (error) {
        console.warn(`Invalid regex pattern: ${pattern}`, error);
        return false;
      }
    });
  }

  /**
   * Match URLs using path patterns with wildcards
   */
  static matchByPath(url: string, pathPatterns: string[]): boolean {
    if (!pathPatterns || pathPatterns.length === 0) return false;
    
    try {
      const urlPath = new URL(url).pathname;
      return pathPatterns.some(pattern => {
        // Convert wildcard pattern to regex
        const regexPattern = pattern
          .replace(/[.*+?^${}()|[\]\\]/g, '\\$&') // Escape special regex chars
          .replace(/\\?\*/g, '.*'); // Convert * to .*
        
        const regex = new RegExp(`^${regexPattern}`, 'i');
        return regex.test(urlPath);
      });
    } catch (error) {
      console.warn(`Error parsing URL: ${url}`, error);
      return false;
    }
  }

  /**
   * Match URLs using keyword indicators
   */
  static matchByIndicators(url: string, indicators: string[]): boolean {
    if (!indicators || indicators.length === 0) return false;
    
    const urlLower = url.toLowerCase();
    return indicators.some(indicator => 
      urlLower.includes(indicator.toLowerCase())
    );
  }

  /**
   * Check if URL is in the examples list
   */
  static matchByExamples(url: string, examples: string[]): boolean {
    if (!examples || examples.length === 0) return false;
    return examples.includes(url);
  }

  /**
   * Match a URL against a category using all available methods
   */
  static matchCategory(url: string, category: URLCategory): MatchResult {
    const matches: string[] = [];

    // Check if URL is in examples
    if (this.matchByExamples(url, category.examples || [])) {
      matches.push('examples');
    }

    return {
      matches: matches.length > 0,
      matchedBy: matches
    };
  }

  /**
   * Match a URL against a pattern using the single regex
   */
  static matchPattern(url: string, pattern: URLPattern): MatchResult {
    const matches: string[] = [];

    // Check the single regex pattern
    if (this.matchByRegex(url, [pattern.regex])) {
      matches.push('regex');
    }

    return {
      matches: matches.length > 0,
      matchedBy: matches
    };
  }

  /**
   * Filter URLs by selected categories with comprehensive pattern matching
   */
  static filterUrlsByCategories(
    allUrls: string[],
    selectedCategories: string[],
    urlAnalysis: { url_categories: Record<string, URLCategory> }
  ): FilterResult {
    const categoryMatches: Record<string, CategoryMatch> = {};
    const matchedUrls = new Set<string>();

    // Initialize category matches
    selectedCategories.forEach(categoryName => {
      categoryMatches[categoryName] = { urls: [] };
    });

    // For each selected category
    selectedCategories.forEach(categoryName => {
      const category = urlAnalysis.url_categories[categoryName];
      if (!category) return;

      // Test each URL against this category
      allUrls.forEach(url => {
        const matchResult = this.matchCategory(url, category);
        
        if (matchResult.matches) {
          categoryMatches[categoryName].urls.push(url);
          matchedUrls.add(url);
        }
      });
    });

    // Convert matched URLs to array
    const filteredUrls = Array.from(matchedUrls);

    return {
      filteredUrls,
      categoryMatches,
      stats: {
        totalUrls: allUrls.length,
        filteredUrls: filteredUrls.length
      }
    };
  }

  /**
   * Filter URLs using generated regex patterns
   */
  static filterUrlsByPatterns(
    allUrls: string[],
    selectedCategories: string[],
    urlPatterns: Record<string, URLPattern>
  ): FilterResult {
    const categoryMatches: Record<string, CategoryMatch> = {};
    const matchedUrls = new Set<string>();

    // Initialize category matches
    selectedCategories.forEach(categoryName => {
      categoryMatches[categoryName] = { urls: [] };
    });

    // For each selected category
    selectedCategories.forEach(categoryName => {
      const pattern = urlPatterns[categoryName];
      if (!pattern) return;

      // Test each URL against this pattern
      allUrls.forEach(url => {
        const matchResult = this.matchPattern(url, pattern);
        
        if (matchResult.matches) {
          categoryMatches[categoryName].urls.push(url);
          matchedUrls.add(url);
        }
      });
    });

    // Convert matched URLs to array
    const filteredUrls = Array.from(matchedUrls);

    return {
      filteredUrls,
      categoryMatches,
      stats: {
        totalUrls: allUrls.length,
        filteredUrls: filteredUrls.length
      }
    };
  }
} 

 