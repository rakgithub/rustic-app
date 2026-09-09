import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ProductList } from "./product-list";

describe("ProductList", () => {
  it("starts in a loading state", () => {
    render(<ProductList />);

    expect(screen.getByText("Loading products…")).toBeTruthy();
  });
});
