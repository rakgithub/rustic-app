import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { AddProduct } from "./add-product";

describe("AddProduct", () => {
  it("renders the product form", () => {
    render(<AddProduct />);

    expect(screen.getByRole("heading", { name: "Add a product" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Save product" })).toBeTruthy();
    expect(screen.getByRole("combobox", { name: "Category" })).toBeTruthy();
  });
});
