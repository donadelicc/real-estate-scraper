import { ChatOpenAI } from "@langchain/openai";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { z } from "zod";
import { JsonOutputParser } from "@langchain/core/output_parsers";

// Property Schema using Zod (equivalent to Pydantic)
// Transform null to undefined to maintain consistency with existing frontend
const nullToUndefined = <T>(schema: z.ZodType<T>) =>
  schema.transform((val) => (val === null ? undefined : val));

export const PropertySchema = z.object({
  // Basic property info
  reference_number: nullToUndefined(z.string().nullable())
    .optional()
    .describe("Property reference number"),
  price: nullToUndefined(z.number().nullable())
    .optional()
    .describe("The price of the property in euros"),

  // Size measurements
  built_size: nullToUndefined(z.number().nullable())
    .optional()
    .describe("Built/living area in square meters"),
  living_area: nullToUndefined(z.number().nullable())
    .optional()
    .describe("Living area in square meters"),

  // Room counts
  bedrooms: nullToUndefined(z.number().nullable())
    .optional()
    .describe("Number of bedrooms"),
  bathrooms: nullToUndefined(z.number().nullable())
    .optional()
    .describe("Number of bathrooms"),
  en_suite: nullToUndefined(z.number().nullable())
    .optional()
    .describe("Number of en-suite bathrooms"),
  floors: nullToUndefined(z.number().nullable())
    .optional()
    .describe("Number of floors"),

  // Size measurements
  terrace_size: nullToUndefined(z.number().nullable())
    .optional()
    .describe("Terrace size in square meters"),
  plot_size: nullToUndefined(z.number().nullable())
    .optional()
    .describe("Plot size in square meters"),

  // Features (boolean or descriptive)
  pool: nullToUndefined(z.string().nullable())
    .optional()
    .describe("Pool information (Private/Communal/None)"),
  garden: nullToUndefined(z.string().nullable())
    .optional()
    .describe("Garden information (Private/Communal/None)"),
  parking: nullToUndefined(z.string().nullable())
    .optional()
    .describe("Parking information (Private/Communal/None)"),

  // Property classification
  property_type: nullToUndefined(z.string().nullable())
    .optional()
    .describe("Type of property (Villa/Townhouse/Apartment/etc)"),
  standard: nullToUndefined(z.string().nullable())
    .optional()
    .describe("Property standard (Normal/Premium/Rehab)"),

  // Location and status
  area: nullToUndefined(z.string().nullable())
    .optional()
    .describe("Area/location of the property"),
  status: nullToUndefined(z.string().nullable())
    .optional()
    .describe("Property status (For sale/Sold/etc)"),

  link: nullToUndefined(z.string().nullable())
    .optional()
    .describe("Link to the property website"),
  source: nullToUndefined(z.string().nullable())
    .optional()
    .describe("Source of the property data"),
});

export type Property = z.infer<typeof PropertySchema>;

/**
 * Analyze property data from markdown content using LLM and return structured Property object.
 *
 * @param markdownContent - The markdown content scraped from the property website
 * @returns Property object containing extracted property information
 */
export async function analyzePropertyData(
  markdownContent: string,
): Promise<Property> {
  try {
    // Initialize LLM
    const llm = new ChatOpenAI({
      modelName: "gpt-4o-mini",
      temperature: 0,
      openAIApiKey: process.env.OPENAI_API_KEY,
    });

    // Setup JSON parser
    const parser = new JsonOutputParser();

    // Create prompt template
    const prompt = ChatPromptTemplate.fromMessages([
      [
        "system",
        `You are a real estate expert. Extract property information and return ONLY a valid JSON object with the exact structure specified.

Extract these fields from the property data:
- reference_number: Property reference (like SV2171) 
- price: Price in euros (number only, no currency)
- built_size: Built area in square meters (number only)
- living_area: Living area in square meters (number only)
- bedrooms: Number of bedrooms (number only)
- bathrooms: Number of bathrooms (number only)
- en_suite: Number of en-suite bathrooms (number only)
- floors: Number of floors (number only)
- terrace_size: Terrace size in square meters (number only)
- plot_size: Plot size in square meters (number only)
- pool: Pool type ("Private", "Communal", or null)
- garden: Garden type ("Private", "Communal", or null)
- parking: Parking type ("Private", "Communal", or null)
- property_type: Type like "Villa", "Townhouse", "Apartment"
- standard: Standard level like "Normal", "Premium", "Rehab"
- area: Location/area name
- status: Status like "For sale", "Sold"
- link: Property website URL
- source: Source website domain

Return a valid JSON object with these fields. Do not wrap in markdown code blocks.`,
      ],
      ["human", "Property website data: {data}"],
    ]);

    // Create chain and analyze data
    const chain = prompt.pipe(llm).pipe(parser);

    // Get response
    const response = await chain.invoke({
      data: markdownContent,
    });

    console.log("\n=== LLM ANALYSIS RESULT ===");
    console.log(JSON.stringify(response, null, 2));

    // Validate the response against our schema
    const validatedResponse = PropertySchema.parse(response);
    return validatedResponse;
  } catch (error) {
    console.error("Error analyzing property data:", error);
    throw new Error(
      `Failed to analyze property data: ${error instanceof Error ? error.message : "Unknown error"}`,
    );
  }
}
