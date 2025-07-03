import { NextRequest, NextResponse } from "next/server";
import { performCompleteUrlAnalysis, findUrlTypes } from "@/lib/url-analysis";
import type { URLAnalysisRequest } from "@/lib/url-analysis";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Handle two types of requests:
    // 1. Complete analysis from base URL
    // 2. Analysis of provided URLs

    if (body.base_url) {
      // Complete analysis workflow
      const { base_url } = body;

      if (!base_url) {
        return NextResponse.json(
          { error: "base_url is required" },
          { status: 400 },
        );
      }

      console.log(`Starting complete URL analysis for: ${base_url}`);
      const result = await performCompleteUrlAnalysis(base_url);

      return NextResponse.json({
        success: true,
        base_url: base_url,
        total_urls: result.mapping.count,
        url_mapping: result.mapping,
        url_analysis: result.analysis,
      });
    } else if (body.urls) {
      // Analysis of provided URLs only
      const { urls }: URLAnalysisRequest = body;

      if (!urls || !Array.isArray(urls) || urls.length === 0) {
        return NextResponse.json(
          { error: "urls array is required and must not be empty" },
          { status: 400 },
        );
      }

      console.log(`Analyzing ${urls.length} provided URLs`);
      const analysis = await findUrlTypes(urls);

      return NextResponse.json({
        success: true,
        total_urls: urls.length,
        url_analysis: analysis,
      });
    } else {
      return NextResponse.json(
        { error: "Either base_url or urls array is required" },
        { status: 400 },
      );
    }
  } catch (error) {
    console.error("Error in URL analysis:", error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error ? error.message : "Failed to analyze URLs",
      },
      { status: 500 },
    );
  }
}
