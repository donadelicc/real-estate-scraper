import { NextRequest, NextResponse } from "next/server";
import { getPropertyContent } from "@/lib/firecrawl";
import {
  analyzeCustomPropertyData,
  type CustomSchemaConfig,
} from "@/lib/customLLM";

export interface TestScrapingRequest {
  urls: string[];
  config: CustomSchemaConfig;
}

export interface ScrapingResult {
  url: string;
  data: Record<string, unknown> | null;
  error?: string;
  processingTime: number;
}

export async function POST(request: NextRequest) {
  try {
    const body: TestScrapingRequest = await request.json();
    const { urls, config } = body;

    if (!urls || !Array.isArray(urls) || urls.length === 0) {
      return NextResponse.json(
        { error: "URLs array is required and must not be empty" },
        { status: 400 },
      );
    }

    if (!config || !config.dataFields || config.dataFields.length === 0) {
      return NextResponse.json(
        { error: "Valid configuration with data fields is required" },
        { status: 400 },
      );
    }

    // Check if this is a request for streaming updates
    const isStreamingRequest = request.headers
      .get("accept")
      ?.includes("text/event-stream");

    if (isStreamingRequest) {
      // Return Server-Sent Events stream
      return handleStreamingRequest(urls, config);
    } else {
      // Return traditional JSON response (fallback)
      return handleTraditionalRequest(urls, config);
    }
  } catch (error) {
    console.error("Error in test scraping:", error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to process test scraping",
      },
      { status: 500 },
    );
  }
}

async function handleStreamingRequest(
  urls: string[],
  config: CustomSchemaConfig,
) {
  const urlsToProcess = urls;

  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder();

      // Send initial progress
      controller.enqueue(
        encoder.encode(
          `data: ${JSON.stringify({
            type: "progress",
            current: 0,
            total: urlsToProcess.length,
            currentUrl: "",
            results: [],
          })}\n\n`,
        ),
      );

      const results: ScrapingResult[] = [];

      for (let i = 0; i < urlsToProcess.length; i++) {
        const url = urlsToProcess[i];
        const startTime = Date.now();

        try {
          console.log(
            `Processing URL ${i + 1}/${urlsToProcess.length}: ${url}`,
          );

          // Send progress update
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({
                type: "progress",
                current: i,
                total: urlsToProcess.length,
                currentUrl: url,
                results: [...results],
              })}\n\n`,
            ),
          );

          // Add delay between requests to avoid rate limiting (except for first request)
          if (i > 0) {
            await new Promise((resolve) => setTimeout(resolve, 1000)); // 1 second delay
          }

          // Step 1: Get content from URL
          const contentResponse = await getPropertyContent(url);

          if (!contentResponse.markdown) {
            const result: ScrapingResult = {
              url,
              data: null,
              error: "No content extracted",
              processingTime: Date.now() - startTime,
            };
            results.push(result);

            // Send result update
            controller.enqueue(
              encoder.encode(
                `data: ${JSON.stringify({
                  type: "result",
                  result,
                  current: i + 1,
                  total: urlsToProcess.length,
                  results: [...results],
                })}\n\n`,
              ),
            );
            continue;
          }

          // Step 2: Analyze content with custom LLM
          const extractedData = await analyzeCustomPropertyData(
            contentResponse.markdown,
            config,
          );

          const result: ScrapingResult = {
            url,
            data: extractedData,
            error: undefined,
            processingTime: Date.now() - startTime,
          };
          results.push(result);

          // Send result update
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({
                type: "result",
                result,
                current: i + 1,
                total: urlsToProcess.length,
                results: [...results],
              })}\n\n`,
            ),
          );

          console.log(`Successfully processed URL ${i + 1}: ${url}`);
        } catch (error) {
          console.error(`Error processing URL ${url}:`, error);
          const result: ScrapingResult = {
            url,
            data: null,
            error: error instanceof Error ? error.message : "Unknown error",
            processingTime: Date.now() - startTime,
          };
          results.push(result);

          // Send error result
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({
                type: "result",
                result,
                current: i + 1,
                total: urlsToProcess.length,
                results: [...results],
              })}\n\n`,
            ),
          );
        }
      }

      // Send completion
      const successCount = results.filter((r) => r.data !== null).length;
      const errorCount = results.filter((r) => r.data === null).length;

      controller.enqueue(
        encoder.encode(
          `data: ${JSON.stringify({
            type: "complete",
            current: urlsToProcess.length,
            total: urlsToProcess.length,
            results,
            summary: {
              total: urlsToProcess.length,
              successful: successCount,
              errors: errorCount,
              averageProcessingTime:
                results.reduce((acc, r) => acc + r.processingTime, 0) /
                results.length,
            },
          })}\n\n`,
        ),
      );

      controller.close();
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    },
  });
}

async function handleTraditionalRequest(
  urls: string[],
  config: CustomSchemaConfig,
) {
  console.log(`Starting test scraping for ${urls.length} URLs`);

  const results: ScrapingResult[] = [];

  // Process URLs one by one
  const urlsToProcess = urls;

  for (let i = 0; i < urlsToProcess.length; i++) {
    const url = urlsToProcess[i];
    const startTime = Date.now();

    try {
      console.log(`Processing URL ${i + 1}/${urlsToProcess.length}: ${url}`);

      // Add delay between requests to avoid rate limiting (except for first request)
      if (i > 0) {
        await new Promise((resolve) => setTimeout(resolve, 1000)); // 1 second delay
      }

      // Step 1: Get content from URL
      const contentResponse = await getPropertyContent(url);

      if (!contentResponse.markdown) {
        results.push({
          url,
          data: null,
          error: "No content extracted",
          processingTime: Date.now() - startTime,
        });
        continue;
      }

      // Step 2: Analyze content with custom LLM
      const extractedData = await analyzeCustomPropertyData(
        contentResponse.markdown,
        config,
      );

      results.push({
        url,
        data: extractedData,
        error: undefined,
        processingTime: Date.now() - startTime,
      });

      console.log(`Successfully processed URL ${i + 1}: ${url}`);
    } catch (error) {
      console.error(`Error processing URL ${url}:`, error);
      results.push({
        url,
        data: null,
        error: error instanceof Error ? error.message : "Unknown error",
        processingTime: Date.now() - startTime,
      });
    }
  }

  const successCount = results.filter((r) => r.data !== null).length;
  const errorCount = results.filter((r) => r.data === null).length;

  return NextResponse.json({
    success: true,
    results,
    summary: {
      total: urlsToProcess.length,
      successful: successCount,
      errors: errorCount,
      averageProcessingTime:
        results.reduce((acc, r) => acc + r.processingTime, 0) / results.length,
    },
  });
}
