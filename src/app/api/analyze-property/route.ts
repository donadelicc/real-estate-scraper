import { NextRequest, NextResponse } from "next/server";
import { analyzePropertyData } from "@/lib/llm";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { markdown_content } = body;

    if (!markdown_content) {
      return NextResponse.json(
        { error: "markdown_content is required" },
        { status: 400 },
      );
    }

    const result = await analyzePropertyData(markdown_content);
    return NextResponse.json(result);
  } catch (error) {
    console.error("Error analyzing property data:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to analyze property data",
      },
      { status: 500 },
    );
  }
}
