import { render, screen } from "@testing-library/react";

import { Card } from "./card";

describe("Card", () => {
  it("renders its content in a section landmark", () => {
    render(<Card aria-label="Order summary">Order summary</Card>);

    expect(screen.getByRole("region", { name: "Order summary" }).textContent).toBe("Order summary");
  });
});
