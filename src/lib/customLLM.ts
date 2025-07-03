import { ChatOpenAI } from "@langchain/openai";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { z } from "zod";
import { JsonOutputParser } from "@langchain/core/output_parsers";

// DataField interface matching the one from the frontend
export interface DataField {
  id: string;
  name: string;
  description: string;
  example: string;
}

// Custom schema configuration
export interface CustomSchemaConfig {
  dataFields: DataField[];
  baseUrl: string;
  selectedCategories: string[];
}

// Type for the extracted data result
export type ExtractedData = Record<string, string | null>;

/**
 * Dynamically create a Zod schema based on user-defined data fields
 */
export function createCustomSchema(dataFields: DataField[]) {
  const schemaObject: Record<string, z.ZodNullable<z.ZodString>> = {};

  dataFields.forEach((field) => {
    if (field.name) {
      schemaObject[field.name] = z
        .string()
        .nullable()
        .describe(field.description);
    }
  });

  return z.object(schemaObject);
}

/**
 * Create format instructions for JSON output based on user-defined data fields
 */
export function createFormatInstructions(dataFields: DataField[]): string {
  const fieldSchema = dataFields
    .filter((field) => field.name)
    .map((field) => `  "${field.name}": "string | null"`)
    .join(",\n");

  return `Respond only in valid JSON. The JSON object you return should match the following schema:
{
${fieldSchema}
}

Where each field should be:
- A string value if the information is found
- null if the information cannot be found or doesn't exist
- Use the exact field names specified above`;
}

/**
 * Create a custom prompt template based on user-defined data fields
 */
export function createCustomPrompt(
  dataFields: DataField[],
): ChatPromptTemplate {
  // Build the field extraction instructions
  const fieldInstructions = dataFields
    .filter((field) => field.name)
    .map(
      (field) =>
        `- ${field.name}: ${field.description} (example: "${field.example}")`,
    )
    .join("\n");

  const systemPrompt = `You are a web scraping expert. Extract property/real estate information and return ONLY a valid JSON object with the exact structure specified.

Extract these fields from the website data:
${fieldInstructions}

{format_instructions}`;

  return ChatPromptTemplate.fromMessages([
    ["system", systemPrompt],
    ["human", "Website data to extract from:\n\n {data}"],
  ]);
}

/**
 * Analyze property data using custom user-defined schema and fields
 */
export async function analyzeCustomPropertyData(
  markdownContent: string,
  config: CustomSchemaConfig,
): Promise<ExtractedData> {
  try {
    // Initialize LLM
    const llm = new ChatOpenAI({
      modelName: "gpt-4o-mini",
      temperature: 0,
      openAIApiKey: process.env.OPENAI_API_KEY,
    });

    // Setup JSON parser with typed output
    const parser = new JsonOutputParser<ExtractedData>();

    // Create dynamic schema and prompt
    const customSchema = createCustomSchema(config.dataFields);
    const customPrompt = createCustomPrompt(config.dataFields);
    const formatInstructions = createFormatInstructions(config.dataFields);

    // Create chain and analyze data
    const promptWithInstructions = await customPrompt.partial({
      format_instructions: formatInstructions,
    });
    const chain = promptWithInstructions.pipe(llm).pipe(parser);

    // Log the actual formatted prompt with real data before sending to model
    console.log("------------CUSTOM PROMPT WITH REAL DATA START------------");
    const formattedMessages = await promptWithInstructions.formatMessages({
      data: markdownContent,
    });

    formattedMessages.forEach((message, index) => {
      console.log(
        `\n--- Message ${index + 1} (${message.constructor.name}) ---`,
      );
      console.log(message.content);
    });
    console.log("------------CUSTOM PROMPT WITH REAL DATA END------------");

    // Get response
    const response = await chain.invoke({
      data: markdownContent,
    });

    console.log("\n=== CUSTOM LLM ANALYSIS RESULT ===");
    console.log(JSON.stringify(response, null, 2));

    // Validate the response against our custom schema
    const validatedResponse = customSchema.parse(response);
    return validatedResponse;
  } catch (error) {
    console.error("Error analyzing custom property data:", error);
    throw new Error(
      `Failed to analyze custom property data: ${error instanceof Error ? error.message : "Unknown error"}`,
    );
  }
}

/**
 * Utility function to create a scraping job configuration
 */
export function createScrapingJobConfig(
  baseUrl: string,
  selectedCategories: string[],
  dataFields: DataField[],
): CustomSchemaConfig {
  return {
    baseUrl,
    selectedCategories,
    dataFields: dataFields.filter((field) => field.name && field.description), // Only include valid fields
  };
}

/**
 * Get field names for CSV header generation
 */
export function getFieldNames(dataFields: DataField[]): string[] {
  return dataFields.filter((field) => field.name).map((field) => field.name);
}

/**
 * Validate scraping configuration
 */
export function validateScrapingConfig(config: CustomSchemaConfig): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (!config.baseUrl) {
    errors.push("Base URL is required");
  }

  if (!config.selectedCategories || config.selectedCategories.length === 0) {
    errors.push("At least one URL category must be selected");
  }

  if (!config.dataFields || config.dataFields.length === 0) {
    errors.push("At least one data field must be defined");
  }

  const validFields = config.dataFields.filter(
    (field) => field.name && field.description,
  );
  if (validFields.length === 0) {
    errors.push("At least one data field must have both name and description");
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}
