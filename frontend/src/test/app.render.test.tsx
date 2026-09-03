import { describe, it, expect, vi } from "vitest";
import React from "react";
import { render } from "@testing-library/react";
import App from "../App";

describe("App Root Integration Test", () => {
  it("renders App component tree without ReferenceError or crashing", () => {
    const { container } = render(<App />);
    expect(container).toBeDefined();
    expect(document.body).toBeInTheDocument();
  });
});
