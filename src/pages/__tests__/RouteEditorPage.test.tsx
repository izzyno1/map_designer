import React from "react";
import {
  MemoryRouter,
  Route,
  Routes,
  useNavigate,
} from "react-router-dom";
import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import * as routeApi from "../../api/routes";
import * as segmentApi from "../../api/segments";
import * as routeEditorHook from "../../hooks/useRouteEditorData";
import { RouteEditorPage } from "../RouteEditorPage";

void React;

function NavigationHarness() {
  const navigate = useNavigate();

  return (
    <>
      <button type="button" onClick={() => navigate("/routes/route-2")}>
        切换路线
      </button>
      <Routes>
        <Route path="/routes/:routeId" element={<RouteEditorPage />} />
      </Routes>
    </>
  );
}

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

  it("does not hydrate geometry draft from the previous route while switching routes", async () => {
    const routeOneGeometry = {
      type: "LineString" as const,
      coordinates: [{ lat: 1, lng: 2 }],
    };
    const routeTwoGeometry = {
      type: "LineString" as const,
      coordinates: [{ lat: 7, lng: 8 }],
    };

    let routeTwoLoaded = false;

    vi.spyOn(routeEditorHook, "useRouteEditorData").mockImplementation((routeId) => {
      if (routeId === "route-1") {
        return {
          route: {
            id: "route-1",
            name: "路线 1",
            description: "desc-1",
            geometry: routeOneGeometry,
          },
          mapData: {
            routeId: "route-1",
            geometry: routeOneGeometry,
            pois: [],
          },
          segments: [],
          selected: { kind: "none" },
          selectedPoi: null,
          selectedSegment: null,
          draftPoi: null,
          source: "mock",
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
        };
      }

      return {
        route: {
          id: "route-2",
          name: "路线 2",
          description: "desc-2",
          geometry: routeTwoGeometry,
        },
        mapData: routeTwoLoaded
          ? {
              routeId: "route-2",
              geometry: routeTwoGeometry,
              pois: [],
            }
          : {
              routeId: "route-1",
              geometry: routeOneGeometry,
              pois: [],
            },
        segments: [],
        selected: { kind: "none" },
        selectedPoi: null,
        selectedSegment: null,
        draftPoi: null,
        source: "mock",
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
      };
    });

    const view = render(
      <MemoryRouter initialEntries={["/routes/route-1"]}>
        <NavigationHarness />
      </MemoryRouter>,
    );

    fireEvent.change(screen.getAllByRole("spinbutton")[0], { target: { value: "9" } });
    expect(screen.getAllByRole("spinbutton")[0]).toHaveValue(9);

    fireEvent.click(screen.getByRole("button", { name: "切换路线" }));

    expect(screen.getByText("当前没有 geometry 数据。")).toBeInTheDocument();

    routeTwoLoaded = true;
    view.rerender(
      <MemoryRouter initialEntries={["/routes/route-2"]}>
        <NavigationHarness />
      </MemoryRouter>,
    );

    expect(screen.getAllByRole("spinbutton")[0]).toHaveValue(7);
  });
});
