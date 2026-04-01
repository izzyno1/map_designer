import React from "react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import * as routeApi from "../../api/routes";
import * as segmentApi from "../../api/segments";
import { RouteEditorPage } from "../RouteEditorPage";

void React;

describe("RouteEditorPage", () => {
  it("renders the sidebar groups after loading data", async () => {
    vi.spyOn(routeApi, "getRouteDetail").mockResolvedValue({
      source: "mock",
      data: {
        id: "route-1",
        name: "测试路线",
        description: "desc",
        geometry: { type: "LineString", coordinates: [] },
      },
    } as never);
    vi.spyOn(routeApi, "getRouteMapData").mockResolvedValue({
      source: "mock",
      data: {
        routeId: "route-1",
        geometry: { type: "LineString", coordinates: [] },
        pois: [],
      },
    } as never);
    vi.spyOn(segmentApi, "getSegments").mockResolvedValue([]);

    render(
      <MemoryRouter initialEntries={["/routes/route-1"]}>
        <Routes>
          <Route path="/routes/:routeId" element={<RouteEditorPage />} />
        </Routes>
      </MemoryRouter>,
    );

    expect(await screen.findByText("标注列表")).toBeInTheDocument();
    expect(screen.getByText("赛段")).toBeInTheDocument();
    expect(screen.getAllByRole("heading", { name: "Geometry" })).toHaveLength(2);
  });
});
