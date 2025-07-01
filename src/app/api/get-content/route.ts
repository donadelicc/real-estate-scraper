import { NextRequest, NextResponse } from "next/server";
import { getPropertyContent } from "@/lib/firecrawl";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { url } = body;

    if (!url) {
      return NextResponse.json({ error: "url is required" }, { status: 400 });
    }

    const result = await getPropertyContent(url);
    return NextResponse.json(result);
  } catch (error) {
    console.error("Error extracting content from URL:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to extract content from URL",
      },
      { status: 500 },
    );
  }
}
