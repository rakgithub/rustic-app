import { render, screen } from "@testing-library/react";

import FeatureAuth from "./feature-auth";

describe("FeatureAuth", () => {
  it("shows the sign-in page by default", () => {
    window.localStorage.clear();

    render(<FeatureAuth />);

    expect(screen.getByRole("heading", { name: "Welcome back" })).toBeVisible();
    expect(screen.getByRole("button", { name: "Sign in" })).toBeVisible();
  });

  it("shows editable account details for the update account route", () => {
    render(<FeatureAuth view="details" />);

    expect(screen.getByRole("heading", { name: "Account details" })).toBeVisible();
    expect(screen.getByRole("button", { name: "Save account details" })).toBeVisible();
  });
});
