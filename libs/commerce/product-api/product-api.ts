import { apiClient } from "api-client";

export type CreateProductInput = {
  userId: string;
  title: string;
  description: string;
  brand?: string;
  colour?: string;
  category?: string;
  priceMinor: number;
  currency: "EUR";
};

export function createProduct(input: CreateProductInput) {
  return apiClient.POST("/products", {
    params: { header: { "x-user-id": input.userId } },
    body: {
      title: input.title,
      description: input.description,
      brand: input.brand,
      colour: input.colour,
      category: input.category,
      priceMinor: input.priceMinor,
      currency: input.currency,
    },
  });
}
