import React from "react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import * as routeApi from "../../api/routes";
import * as segmentApi from "../../api/segments";
import * as routeEditorHook from "../../hooks/useRouteEditorData";
import { RouteEditorPage } from "../RouteEditorPage";

void React;

afterEach(() => {
  vi.restoreAllMocks();
});

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

  it("preserves in-progress geometry edits when unrelated map data updates", () => {
    const geometry = {
      type: "LineString" as const,
      coordinates: [{ lat: 1, lng: 2 }],
    };

    let editorState = {
      route: {
        id: "route-1",
        name: "测试路线",
        description: "desc",
        geometry,
      },
      mapData: {
        routeId: "route-1",
        geometry,
        pois: [],
      },
      segments: [],
      selected: { kind: "none" as const },
      selectedPoi: null,
      selectedSegment: null,
      draftPoi: null,
      source: "mock" as const,
      loading: false,
      saving: false,
      message: null,
      setDraftPoi: vi.fn(),
      setMessage: vi.fn(),
      setSelected: vi.fn(),
      savePoiDraft: vi.fn(),
      saveSegmentList: vi.fn(),
      saveGeometry: vi.fn(),
      startCreatePoi: vi.fn(),
      selectPoi: vi.fn(),
      selectSegment: vi.fn(),
      selectGeometry: vi.fn(),
    } as ReturnType<typeof routeEditorHook.useRouteEditorData>;

    vi.spyOn(routeEditorHook, "useRouteEditorData").mockImplementation(
      () => editorState,
    );

    const view = render(
      <MemoryRouter initialEntries={["/routes/route-1"]}>
        <Routes>
          <Route path="/routes/:routeId" element={<RouteEditorPage />} />
        </Routes>
      </MemoryRouter>,
    );

    const [latInput] = screen.getAllByRole("spinbutton");
    fireEvent.change(latInput, { target: { value: "9" } });
    expect(screen.getAllByRole("spinbutton")[0]).toHaveValue(9);

    editorState = {
      ...editorState,
      mapData: {
        routeId: "route-1",
        geometry,
        pois: [
          {
            id: "poi-1",
            name: "新 POI",
            type: "supply",
            lat: 1,
            lng: 2,
          },
        ],
      },
    };

    view.rerender(
      <MemoryRouter initialEntries={["/routes/route-1"]}>
        <Routes>
          <Route path="/routes/:routeId" element={<RouteEditorPage />} />
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getAllByRole("spinbutton")[0]).toHaveValue(9);
  });
});
