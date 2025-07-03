interface DataField {
  id: string;
  name: string;
  description: string;
  example: string;
}

export const testDataField: DataField[] = [
  {
    id: "1",
    name: "reference_number",
    description: "Property reference (like SV2171)",
    example: "SV2171",
  },
  {
    id: "2",
    name: "price",
    description: "Price in euros (number only, no currency)",
    example: "650000",
  },
  {
    id: "3",
    name: "built_size",
    description: "Built area in square meters (number only)",
    example: "180",
  },
  {
    id: "4",
    name: "living_area",
    description: "Living area in square meters (number only)",
    example: "150",
  },
  {
    id: "5",
    name: "bedrooms",
    description: "Number of bedrooms (number only)",
    example: "3",
  },
  {
    id: "6",
    name: "bathrooms",
    description: "Number of bathrooms (number only)",
    example: "2",
  },
  {
    id: "7",
    name: "en_suite",
    description: "Number of en-suite bathrooms (number only)",
    example: "1",
  },
  {
    id: "8",
    name: "floors",
    description: "Number of floors (number only)",
    example: "2",
  },
  {
    id: "9",
    name: "terrace_size",
    description: "Terrace size in square meters (number only)",
    example: "25",
  },
  {
    id: "10",
    name: "plot_size",
    description: "Plot size in square meters (number only)",
    example: "500",
  },
  {
    id: "11",
    name: "pool",
    description: 'Pool type ("Private", "Communal", or null)',
    example: "Private",
  },
  {
    id: "12",
    name: "garden",
    description: 'Garden type ("Private", "Communal", or null)',
    example: "Private",
  },
  {
    id: "13",
    name: "parking",
    description: 'Parking type ("Private", "Communal", or null)',
    example: "Private",
  },
  {
    id: "14",
    name: "property_type",
    description: 'Type like "Villa", "Townhouse", "Apartment"',
    example: "Villa",
  },
  {
    id: "15",
    name: "standard",
    description: 'Standard level like "Normal", "Premium", "Rehab"',
    example: "Premium",
  },
  {
    id: "16",
    name: "area",
    description: "Location/area name",
    example: "Marbella",
  },
  {
    id: "17",
    name: "status",
    description: 'Status like "For sale", "Sold"',
    example: "For sale",
  },
  {
    id: "18",
    name: "link",
    description: "Property website URL",
    example: "https://example.com/property/123",
  },
  {
    id: "19",
    name: "source",
    description: "Source website domain",
    example: "example.com",
  },
];
