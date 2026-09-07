import { render, screen } from "@testing-library/react";

import { Input } from "./input";

describe("Input", () => {
  it("forwards standard input attributes", () => {
    render(<Input aria-label="Email address" placeholder="you@example.com" type="email" />);

    const input = screen.getByRole("textbox", { name: "Email address" });
    expect(input.getAttribute("type")).toBe("email");
    expect(input.getAttribute("placeholder")).toBe("you@example.com");
  });

  it("supports the disabled state", () => {
    render(<Input aria-label="Disabled input" disabled />);

    expect(screen.getByRole("textbox", { name: "Disabled input" }).hasAttribute("disabled")).toBe(
      true,
    );
  });
});
