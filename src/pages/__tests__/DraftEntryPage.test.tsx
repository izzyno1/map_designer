import React from "react";
import { MemoryRouter } from "react-router-dom";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { DraftEntryPage } from "../DraftEntryPage";

void React;

describe("DraftEntryPage", () => {
  it("renders create button to draft editor", () => {
    render(
      <MemoryRouter>
        <DraftEntryPage />
      </MemoryRouter>,
    );

    const button = screen.getByRole("link", { name: "新建标注" });
    expect(button).toBeInTheDocument();
    expect(button).toHaveAttribute("href", "/draft");
  });
});
