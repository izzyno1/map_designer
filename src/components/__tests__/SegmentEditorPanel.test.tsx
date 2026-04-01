import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
import { SegmentEditorPanel } from "../SegmentEditorPanel";

void React;

describe("SegmentEditorPanel", () => {
  it("uses the current route id when creating the first segment", async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    const onChange = vi.fn();

    render(
      <MemoryRouter initialEntries={["/routes/route-1"]}>
        <Routes>
          <Route
            path="/routes/:routeId"
            element={
              <SegmentEditorPanel
                selected={{ kind: "none" }}
                segments={[]}
                onSelect={onSelect}
                onChange={onChange}
              />
            }
          />
        </Routes>
      </MemoryRouter>,
    );

    await user.click(screen.getByRole("button", { name: "新增赛段" }));

    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange.mock.calls[0][0][0]).toMatchObject({
      routeId: "route-1",
      name: "新赛段",
      type: "tempo",
    });
    expect(onSelect).toHaveBeenCalledTimes(1);
  });
});
