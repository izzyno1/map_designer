import React from "react";
import {
  MemoryRouter,
  Route,
  Routes,
  useNavigate,
} from "react-router-dom";
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import * as routeApi from "../../api/routes";
import * as segmentApi from "../../api/segments";
import * as routeEditorHook from "../../hooks/useRouteEditorData";
import { RouteEditorPage } from "../RouteEditorPage";

void React;

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((nextResolve) => {
    resolve = nextResolve;
  });

  return { promise, resolve };
}

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
  const snapPointLimit = 50;

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
    vi.spyOn(segmentApi, "getSegments").mockResolvedValue({
      source: "mock",
      data: [],
    });

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
      snapping: false,
      message: null,
      setDraftPoi: vi.fn(),
      setMessage: vi.fn(),
      setSelected: vi.fn(),
      savePoiDraft: vi.fn(),
      saveSegmentList: vi.fn(),
      saveGeometry: vi.fn(),
      snapGeometryDraft: vi.fn(),
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

    const latInput = screen.getByLabelText("路线坐标 0 纬度");
    fireEvent.change(latInput, { target: { value: "9" } });
    expect(screen.getByLabelText("路线坐标 0 纬度")).toHaveValue("9");

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

    expect(screen.getByLabelText("路线坐标 0 纬度")).toHaveValue("9");
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
          snapping: false,
          message: null,
          setDraftPoi: vi.fn(),
          setMessage: vi.fn(),
          setSelected: vi.fn(),
          savePoiDraft: vi.fn(),
          saveSegmentList: vi.fn(),
          saveGeometry: vi.fn(),
          snapGeometryDraft: vi.fn(),
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
        snapping: false,
        message: null,
        setDraftPoi: vi.fn(),
        setMessage: vi.fn(),
        setSelected: vi.fn(),
        savePoiDraft: vi.fn(),
        saveSegmentList: vi.fn(),
        saveGeometry: vi.fn(),
        snapGeometryDraft: vi.fn(),
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

    fireEvent.change(screen.getByLabelText("路线坐标 0 纬度"), { target: { value: "9" } });
    expect(screen.getByLabelText("路线坐标 0 纬度")).toHaveValue("9");

    fireEvent.click(screen.getByRole("button", { name: "切换路线" }));

    expect(screen.getByText("当前没有路线坐标数据。")).toBeInTheDocument();

    routeTwoLoaded = true;
    view.rerender(
      <MemoryRouter initialEntries={["/routes/route-2"]}>
        <NavigationHarness />
      </MemoryRouter>,
    );

    expect(screen.getByLabelText("路线坐标 0 纬度")).toHaveValue("7");
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
      snapping: false,
      message: null,
      setDraftPoi: vi.fn(),
      setMessage: vi.fn(),
      setSelected: vi.fn(),
      savePoiDraft: vi.fn(),
      saveSegmentList: vi.fn(),
      saveGeometry: vi.fn(),
      snapGeometryDraft: vi.fn(),
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

  it("triggers json export for the current route", async () => {
    const user = userEvent.setup();

    vi.spyOn(routeApi, "downloadRouteExport").mockResolvedValue(undefined);
    vi.spyOn(routeEditorHook, "useRouteEditorData").mockReturnValue({
      route: {
        id: "route-1",
        name: "测试路线",
        description: "desc",
        geometry: { type: "LineString", coordinates: [] },
      },
      mapData: {
        routeId: "route-1",
        geometry: { type: "LineString", coordinates: [] },
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
      snapping: false,
      message: null,
      setDraftPoi: vi.fn(),
      setMessage: vi.fn(),
      setSelected: vi.fn(),
      savePoiDraft: vi.fn(),
      saveSegmentList: vi.fn(),
      saveGeometry: vi.fn(),
      snapGeometryDraft: vi.fn(),
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

    await user.click(screen.getByRole("button", { name: "导出 JSON" }));

    expect(routeApi.downloadRouteExport).toHaveBeenCalledWith("route-1", "测试路线");
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
      snapping: false,
      message: null,
      setDraftPoi: vi.fn(),
      setMessage: vi.fn(),
      setSelected: vi.fn(),
      savePoiDraft: vi.fn(),
      saveSegmentList: vi.fn(),
      saveGeometry: vi.fn(),
      snapGeometryDraft: vi.fn(),
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

  it("shows one-click snap buttons in the toolbar and geometry panel", async () => {
    const user = userEvent.setup();
    const geometry = {
      type: "LineString" as const,
      coordinates: [
        { lat: 0, lng: 0, distanceKm: 0 },
        { lat: 0, lng: 0.01, distanceKm: 5 },
      ],
    };
    const snapGeometryDraft = vi.fn().mockResolvedValue({
      type: "LineString" as const,
      coordinates: [
        { lat: 0.001, lng: 0.001, distanceKm: 0 },
        { lat: 0.002, lng: 0.012, distanceKm: 5.5 },
      ],
    });

    const saveGeometry = vi.fn();

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
      segments: [],
      selected: { kind: "geometry" },
      selectedPoi: null,
      selectedSegment: null,
      draftPoi: null,
      source: "mock",
      loading: false,
      saving: false,
      snapping: false,
      message: null,
      setDraftPoi: vi.fn(),
      setMessage: vi.fn(),
      setSelected: vi.fn(),
      savePoiDraft: vi.fn(),
      saveSegmentList: vi.fn(),
      saveGeometry,
      snapGeometryDraft,
      startCreatePoi: vi.fn(),
      selectPoi: vi.fn(),
      selectSegment: vi.fn(),
      selectGeometry: vi.fn(),
    } as never);

    render(
      <MemoryRouter initialEntries={["/routes/route-1"]}>
        <Routes>
          <Route path="/routes/:routeId" element={<RouteEditorPage />} />
        </Routes>
      </MemoryRouter>,
    );

    const snapButtons = screen.getAllByRole("button", { name: "一键贴路" });
    expect(snapButtons).toHaveLength(2);

    await user.click(snapButtons[0]);

    expect(snapGeometryDraft).toHaveBeenCalledWith(geometry);
    expect(saveGeometry).not.toHaveBeenCalled();
  });

  it("switches to the server-normalized geometry after saving", async () => {
    const user = userEvent.setup();
    const initialGeometry = {
      type: "LineString" as const,
      coordinates: [
        { lat: 1, lng: 2, distanceKm: 0 },
        { lat: 3, lng: 4, distanceKm: 12 },
      ],
    };
    const normalizedGeometry = {
      type: "LineString" as const,
      coordinates: [
        { lat: 10, lng: 20, distanceKm: 0 },
        { lat: 30, lng: 40, distanceKm: 12 },
      ],
    };
    const saveSegmentList = vi.fn().mockResolvedValue(undefined);
    const saveGeometry = vi.fn().mockResolvedValue(normalizedGeometry);

    let editorState = {
      route: {
        id: "route-1",
        name: "测试路线",
        description: "desc",
        geometry: initialGeometry,
      },
      mapData: {
        routeId: "route-1",
        geometry: initialGeometry,
        pois: [],
      },
      segments: [],
      selected: { kind: "geometry" as const },
      selectedPoi: null,
      selectedSegment: null,
      draftPoi: null,
      source: "mock" as const,
      loading: false,
      saving: false,
      snapping: false,
      message: null,
      setDraftPoi: vi.fn(),
      setMessage: vi.fn(),
      setSelected: vi.fn(),
      savePoiDraft: vi.fn(),
      saveSegmentList,
      saveGeometry,
      snapGeometryDraft: vi.fn(),
      startCreatePoi: vi.fn(),
      selectPoi: vi.fn(),
      selectSegment: vi.fn(),
      selectGeometry: vi.fn(),
    } as ReturnType<typeof routeEditorHook.useRouteEditorData>;

    vi.spyOn(routeEditorHook, "useRouteEditorData").mockImplementation(
      () => editorState,
    );

    render(
      <MemoryRouter initialEntries={["/routes/route-1"]}>
        <Routes>
          <Route path="/routes/:routeId" element={<RouteEditorPage />} />
        </Routes>
      </MemoryRouter>,
    );

    fireEvent.change(screen.getByLabelText("路线坐标 0 纬度"), {
      target: { value: "9" },
    });
    expect(screen.getByLabelText("路线坐标 0 纬度")).toHaveValue("9");

    await user.click(screen.getByRole("button", { name: "保存路线坐标" }));

    expect(saveSegmentList).toHaveBeenCalledWith([]);
    expect(saveGeometry).toHaveBeenCalledTimes(1);
    await waitFor(() => {
      expect(screen.getByLabelText("路线坐标 0 纬度")).toHaveValue("10");
    });
  });

  it("disables one-click snap when there are fewer than two points", () => {
    const geometry = {
      type: "LineString" as const,
      coordinates: [{ lat: 0, lng: 0, distanceKm: 0 }],
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
      segments: [],
      selected: { kind: "geometry" },
      selectedPoi: null,
      selectedSegment: null,
      draftPoi: null,
      source: "mock",
      loading: false,
      saving: false,
      snapping: false,
      message: null,
      setDraftPoi: vi.fn(),
      setMessage: vi.fn(),
      setSelected: vi.fn(),
      savePoiDraft: vi.fn(),
      saveSegmentList: vi.fn(),
      saveGeometry: vi.fn(),
      snapGeometryDraft: vi.fn(),
      startCreatePoi: vi.fn(),
      selectPoi: vi.fn(),
      selectSegment: vi.fn(),
      selectGeometry: vi.fn(),
    } as never);

    render(
      <MemoryRouter initialEntries={["/routes/route-1"]}>
        <Routes>
          <Route path="/routes/:routeId" element={<RouteEditorPage />} />
        </Routes>
      </MemoryRouter>,
    );

    const snapButtons = screen.getAllByRole("button", { name: "一键贴路" });
    expect(snapButtons).toHaveLength(2);
    for (const button of snapButtons) {
      expect(button).toBeDisabled();
    }
    expect(screen.getByText("至少需要两个坐标点")).toBeInTheDocument();
  });

  it("disables one-click snap and shows a hint when geometry exceeds the snap limit", () => {
    const geometry = {
      type: "LineString" as const,
      coordinates: Array.from({ length: snapPointLimit + 1 }, (_, index) => ({
        lat: index,
        lng: index + 0.1,
        distanceKm: index,
      })),
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
      segments: [],
      selected: { kind: "geometry" },
      selectedPoi: null,
      selectedSegment: null,
      draftPoi: null,
      source: "mock",
      loading: false,
      saving: false,
      snapping: false,
      message: null,
      setDraftPoi: vi.fn(),
      setMessage: vi.fn(),
      setSelected: vi.fn(),
      savePoiDraft: vi.fn(),
      saveSegmentList: vi.fn(),
      saveGeometry: vi.fn(),
      snapGeometryDraft: vi.fn(),
      startCreatePoi: vi.fn(),
      selectPoi: vi.fn(),
      selectSegment: vi.fn(),
      selectGeometry: vi.fn(),
    } as never);

    render(
      <MemoryRouter initialEntries={["/routes/route-1"]}>
        <Routes>
          <Route path="/routes/:routeId" element={<RouteEditorPage />} />
        </Routes>
      </MemoryRouter>,
    );

    const snapButtons = screen.getAllByRole("button", { name: "一键贴路" });
    expect(snapButtons).toHaveLength(2);
    for (const button of snapButtons) {
      expect(button).toBeDisabled();
    }
    expect(
      screen.getAllByText(`贴路最多支持 ${snapPointLimit} 个坐标点，请先删减路线坐标。`),
    ).toHaveLength(2);
  });

  it("reconciles snapped geometry so segment indexes follow point-count changes", async () => {
    const user = userEvent.setup();
    const geometry = {
      type: "LineString" as const,
      coordinates: [
        { lat: 0, lng: 0, distanceKm: 0 },
        { lat: 0, lng: 0.01, distanceKm: 5 },
        { lat: 0, lng: 0.02, distanceKm: 10 },
      ],
    };
    const snappedGeometry = {
      type: "LineString" as const,
      coordinates: [
        { lat: 0.001, lng: 0.001, distanceKm: 0 },
        { lat: 0, lng: 0, distanceKm: 0 },
        { lat: 0, lng: 0.01, distanceKm: 5 },
        { lat: 0, lng: 0.02, distanceKm: 10 },
      ],
    };
    const snapGeometryDraft = vi.fn().mockResolvedValue(snappedGeometry);

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
      snapping: false,
      message: null,
      setDraftPoi: vi.fn(),
      setMessage: vi.fn(),
      setSelected: vi.fn(),
      savePoiDraft: vi.fn(),
      saveSegmentList: vi.fn(),
      saveGeometry: vi.fn(),
      snapGeometryDraft,
      startCreatePoi: vi.fn(),
      selectPoi: vi.fn(),
      selectSegment: vi.fn(),
      selectGeometry: vi.fn(),
    } as never);

    render(
      <MemoryRouter initialEntries={["/routes/route-1"]}>
        <Routes>
          <Route path="/routes/:routeId" element={<RouteEditorPage />} />
        </Routes>
      </MemoryRouter>,
    );

    await user.click(screen.getAllByRole("button", { name: "一键贴路" })[0]);

    expect(snapGeometryDraft).toHaveBeenCalledWith(geometry);
    await waitFor(() => {
      expect(screen.getByLabelText("起点索引")).toHaveValue(2);
      expect(screen.getByLabelText("终点索引")).toHaveValue(3);
    });
  });

  it("ignores intermediate numeric input states while editing geometry", async () => {
    const user = userEvent.setup();
    const geometry = {
      type: "LineString" as const,
      coordinates: [
        { lat: 1, lng: 2, distanceKm: 0 },
        { lat: 3, lng: 4, distanceKm: 12 },
      ],
    };
    const saveGeometry = vi.fn();

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
      segments: [],
      selected: { kind: "none" },
      selectedPoi: null,
      selectedSegment: null,
      draftPoi: null,
      source: "mock",
      loading: false,
      saving: false,
      snapping: false,
      message: null,
      setDraftPoi: vi.fn(),
      setMessage: vi.fn(),
      setSelected: vi.fn(),
      savePoiDraft: vi.fn(),
      saveSegmentList: vi.fn(),
      saveGeometry,
      snapGeometryDraft: vi.fn(),
      startCreatePoi: vi.fn(),
      selectPoi: vi.fn(),
      selectSegment: vi.fn(),
      selectGeometry: vi.fn(),
    } as never);

    render(
      <MemoryRouter initialEntries={["/routes/route-1"]}>
        <Routes>
          <Route path="/routes/:routeId" element={<RouteEditorPage />} />
        </Routes>
      </MemoryRouter>,
    );

    const latInput = screen.getByLabelText("路线坐标 0 纬度");
    fireEvent.change(latInput, { target: { value: "-" } });
    expect(latInput).toHaveValue("-");
    fireEvent.blur(latInput);
    expect(latInput).toHaveValue("1");

    await user.click(screen.getByRole("button", { name: "保存路线坐标" }));

    expect(saveGeometry).toHaveBeenCalledWith(geometry);
  });

  it("allows typing negative geometry coordinates", async () => {
    const user = userEvent.setup();
    const geometry = {
      type: "LineString" as const,
      coordinates: [
        { lat: 1, lng: 2, distanceKm: 0 },
        { lat: 3, lng: 4, distanceKm: 12 },
      ],
    };
    const saveGeometry = vi.fn();

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
      segments: [],
      selected: { kind: "none" },
      selectedPoi: null,
      selectedSegment: null,
      draftPoi: null,
      source: "mock",
      loading: false,
      saving: false,
      snapping: false,
      message: null,
      setDraftPoi: vi.fn(),
      setMessage: vi.fn(),
      setSelected: vi.fn(),
      savePoiDraft: vi.fn(),
      saveSegmentList: vi.fn(),
      saveGeometry,
      snapGeometryDraft: vi.fn(),
      startCreatePoi: vi.fn(),
      selectPoi: vi.fn(),
      selectSegment: vi.fn(),
      selectGeometry: vi.fn(),
    } as never);

    render(
      <MemoryRouter initialEntries={["/routes/route-1"]}>
        <Routes>
          <Route path="/routes/:routeId" element={<RouteEditorPage />} />
        </Routes>
      </MemoryRouter>,
    );

    const latInput = screen.getByLabelText("路线坐标 0 纬度");
    await user.clear(latInput);
    await user.type(latInput, "-3");
    expect(latInput).toHaveValue("-3");

    await user.click(screen.getByRole("button", { name: "保存路线坐标" }));

    expect(saveGeometry).toHaveBeenCalledWith({
      type: "LineString",
      coordinates: [
        expect.objectContaining({ lat: -3, lng: 2 }),
        expect.objectContaining({ lat: 3, lng: 4 }),
      ],
    });
  });

  it("keeps an edited geometry draft when an in-flight snap resolves", async () => {
    const user = userEvent.setup();
    const geometry = {
      type: "LineString" as const,
      coordinates: [
        { lat: 1, lng: 2, distanceKm: 0 },
        { lat: 3, lng: 4, distanceKm: 12 },
      ],
    };
    const pending = deferred<{
      type: "LineString";
      coordinates: Array<{ lat: number; lng: number; distanceKm?: number }>;
    }>();
    const snapGeometryDraft = vi.fn().mockReturnValue(pending.promise);
    const snappedGeometry = {
      type: "LineString" as const,
      coordinates: [
        { lat: 10, lng: 20, distanceKm: 0 },
        { lat: 30, lng: 40, distanceKm: 12 },
        { lat: 50, lng: 60, distanceKm: 20 },
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
      segments: [],
      selected: { kind: "geometry" },
      selectedPoi: null,
      selectedSegment: null,
      draftPoi: null,
      source: "mock",
      loading: false,
      saving: false,
      snapping: false,
      message: null,
      setDraftPoi: vi.fn(),
      setMessage: vi.fn(),
      setSelected: vi.fn(),
      savePoiDraft: vi.fn(),
      saveSegmentList: vi.fn(),
      saveGeometry: vi.fn(),
      snapGeometryDraft,
      startCreatePoi: vi.fn(),
      selectPoi: vi.fn(),
      selectSegment: vi.fn(),
      selectGeometry: vi.fn(),
    } as never);

    render(
      <MemoryRouter initialEntries={["/routes/route-1"]}>
        <Routes>
          <Route path="/routes/:routeId" element={<RouteEditorPage />} />
        </Routes>
      </MemoryRouter>,
    );

    const latInput = screen.getByLabelText("路线坐标 0 纬度");
    await user.click(screen.getAllByRole("button", { name: "一键贴路" })[0]);
    await user.clear(latInput);
    await user.type(latInput, "9");

    expect(latInput).toHaveValue("9");

    await act(async () => {
      pending.resolve(snappedGeometry);
    });

    expect(screen.getByLabelText("路线坐标 0 纬度")).toHaveValue("9");
    expect(snapGeometryDraft).toHaveBeenCalledWith(geometry);
  });
});
