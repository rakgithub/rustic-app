import { render, screen } from "@testing-library/react";

import { Button } from "./button";

describe("Button", () => {
  it("uses a non-submitting button type by default", () => {
    render(<Button>Save</Button>);

    expect(screen.getByRole("button", { name: "Save" }).getAttribute("type")).toBe("button");
  });

  it("allows an explicit button type and disabled state", () => {
    render(
      <Button disabled type="submit" variant="secondary">
        Submit
      </Button>,
    );

    const button = screen.getByRole("button", { name: "Submit" });
    expect(button.getAttribute("type")).toBe("submit");
    expect(button.hasAttribute("disabled")).toBe(true);
    expect(button.getAttribute("data-variant")).toBe("secondary");
  });
});
