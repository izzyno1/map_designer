import React from "react";
import {
  MemoryRouter,
  Route,
  Routes,
  useNavigate,
} from "react-router-dom";
import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
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
    expect(screen.getAllByRole("heading", { name: "路线坐标" })).toHaveLength(2);
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

    expect(screen.getByText("当前没有路线坐标数据。")).toBeInTheDocument();

    routeTwoLoaded = true;
    view.rerender(
      <MemoryRouter initialEntries={["/routes/route-2"]}>
        <NavigationHarness />
      </MemoryRouter>,
    );

    expect(screen.getAllByRole("spinbutton")[0]).toHaveValue(7);
  });

  it("shows the current saving state in the app shell actions", () => {
    let editorState = {
      route: {
        id: "route-1",
        name: "测试路线",
        description: "desc",
        geometry: { type: "LineString" as const, coordinates: [] },
      },
      mapData: {
        routeId: "route-1",
        geometry: { type: "LineString" as const, coordinates: [] },
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

    expect(screen.getByText("可编辑")).toBeInTheDocument();

    editorState = {
      ...editorState,
      saving: true,
    };

    view.rerender(
      <MemoryRouter initialEntries={["/routes/route-1"]}>
        <Routes>
          <Route path="/routes/:routeId" element={<RouteEditorPage />} />
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getByText("保存中...")).toBeInTheDocument();
  });

  it("keeps the segment draft in sync when geometry insertion shifts indexes", async () => {
    const user = userEvent.setup();
    const geometry = {
      type: "LineString" as const,
      coordinates: [
        { lat: 0, lng: 0, distanceKm: 0 },
        { lat: 0, lng: 0.01, distanceKm: 5 },
        { lat: 0, lng: 0.02, distanceKm: 10 },
      ],
    };

    vi.spyOn(routeEditorHook, "useRouteEditorData").mockReturnValue({
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
      segments: [
        {
          id: "segment-1",
          routeId: "route-1",
          name: "赛段 1",
          type: "tempo",
          startIndex: 1,
          endIndex: 2,
        },
      ],
      selected: { kind: "segment", id: "segment-1" },
      selectedPoi: null,
      selectedSegment: {
        id: "segment-1",
        routeId: "route-1",
        name: "赛段 1",
        type: "tempo",
        startIndex: 1,
        endIndex: 2,
      },
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
    });

    render(
      <MemoryRouter initialEntries={["/routes/route-1"]}>
        <Routes>
          <Route path="/routes/:routeId" element={<RouteEditorPage />} />
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getByLabelText("起点索引")).toHaveValue(1);
    expect(screen.getByLabelText("终点索引")).toHaveValue(2);

    await user.click(screen.getAllByRole("button", { name: "插入" })[0]);

    expect(screen.getByLabelText("起点索引")).toHaveValue(2);
    expect(screen.getByLabelText("终点索引")).toHaveValue(3);
  });
});
