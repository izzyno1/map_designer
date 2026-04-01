import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { GeometryEditorPanel } from "../GeometryEditorPanel";

void React;

describe("GeometryEditorPanel", () => {
  it("inserts a new point after the clicked row", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();

    render(
      <GeometryEditorPanel
        geometry={{
          type: "LineString",
          coordinates: [
            { lat: 1, lng: 2, distanceKm: 11 },
            { lat: 3, lng: 4, distanceKm: 22 },
            { lat: 5, lng: 6, distanceKm: 33 },
          ],
        }}
        onChange={onChange}
        onSave={vi.fn()}
      />,
    );

    const firstRow = screen.getAllByRole("button", { name: "插入" })[0];
    await user.click(firstRow);

    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange.mock.calls[0][0].coordinates).toEqual([
      { lat: 1, lng: 2, distanceKm: 11 },
      { lat: 1.002, lng: 2.002, distanceKm: 11 },
      { lat: 3, lng: 4, distanceKm: 22 },
      { lat: 5, lng: 6, distanceKm: 33 },
    ]);
  });

  it("deletes the clicked row", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();

    render(
      <GeometryEditorPanel
        geometry={{
          type: "LineString",
          coordinates: [
            { lat: 1, lng: 2, distanceKm: 11 },
            { lat: 3, lng: 4, distanceKm: 22 },
            { lat: 5, lng: 6, distanceKm: 33 },
          ],
        }}
        onChange={onChange}
        onSave={vi.fn()}
      />,
    );

    await user.click(screen.getAllByRole("button", { name: "删除" })[1]);

    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange.mock.calls[0][0].coordinates).toEqual([
      { lat: 1, lng: 2, distanceKm: 11 },
      { lat: 5, lng: 6, distanceKm: 33 },
    ]);
  });

  it("disables delete when there are two or fewer points", () => {
    render(
      <GeometryEditorPanel
        geometry={{
          type: "LineString",
          coordinates: [
            { lat: 1, lng: 2, distanceKm: 11 },
            { lat: 3, lng: 4, distanceKm: 22 },
          ],
        }}
        onChange={vi.fn()}
        onSave={vi.fn()}
      />,
    );

    for (const button of screen.getAllByRole("button", { name: "删除" })) {
      expect(button).toBeDisabled();
    }
  });
});
