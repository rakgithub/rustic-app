import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ProductCheckout } from "./product-checkout";

describe("ProductCheckout", () => {
  it("renders the checkout form", () => {
    render(<ProductCheckout />);

    expect(screen.getByRole("heading", { name: "Checkout" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Buy item" })).toBeTruthy();
  });
});
