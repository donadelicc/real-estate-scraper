import { NextRequest, NextResponse } from "next/server";
import { getPropertyUrls } from "@/lib/firecrawl";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { base_url } = body;

    if (!base_url) {
      return NextResponse.json(
        { error: "base_url is required" },
        { status: 400 },
      );
    }

    const result = await getPropertyUrls(base_url);
    return NextResponse.json(result);
  } catch (error) {
    console.error("Error extracting property URLs:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to extract property URLs",
      },
      { status: 500 },
    );
  }
}
