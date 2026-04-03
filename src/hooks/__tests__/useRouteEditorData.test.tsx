import { act, renderHook, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import * as poiApi from "../../api/pois";
import * as routeApi from "../../api/routes";
import * as segmentApi from "../../api/segments";
import { useRouteEditorData } from "../useRouteEditorData";
import type { RouteGeometry } from "../../types/route";

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((nextResolve) => {
    resolve = nextResolve;
  });

  return { promise, resolve };
}

function buildRouteDetail(routeId: string, geometry: { type: "LineString"; coordinates: Array<{ lat: number; lng: number; distanceKm?: number }> }) {
  return {
    source: "mock" as const,
    data: {
      id: routeId,
      name: `路线 ${routeId}`,
      description: `desc-${routeId}`,
      geometry,
    },
  };
}

function buildMapData(routeId: string, geometry: { type: "LineString"; coordinates: Array<{ lat: number; lng: number; distanceKm?: number }> }, pois: Array<{ id: string; name: string; type: "supply"; lat: number; lng: number }>) {
  return {
    source: "mock" as const,
    data: {
      routeId,
      geometry,
      pois,
    },
  };
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe("useRouteEditorData", () => {
  it.each([
    {
      name: "savePoiDraft",
      mockSave: () => {
        const resolveValue = {
          source: "mock" as const,
          data: {
            id: "poi-a-new",
            name: "A 新 POI",
            type: "supply" as const,
            lat: 10,
            lng: 20,
          },
        };
        const pending = deferred<typeof resolveValue>();
        vi.spyOn(poiApi, "createPoi").mockReturnValue(pending.promise);
        return { pending, resolveValue };
      },
      invokeSave: (editor: ReturnType<typeof useRouteEditorData>) =>
        editor.savePoiDraft({
          id: "draft-poi",
          isNew: true,
          name: "A 新 POI",
          type: "supply",
          lat: 10,
          lng: 20,
        }),
      assertUnchanged: (editor: ReturnType<typeof useRouteEditorData>) => {
        expect(editor.mapData?.routeId).toBe("route-b");
        expect(editor.mapData?.pois).toEqual([
          { id: "poi-b-1", name: "B POI", type: "supply", lat: 30, lng: 40 },
        ]);
        expect(editor.selected).toEqual({ kind: "none" });
        expect(editor.message).toBeNull();
      },
    },
    {
      name: "saveSegmentList",
      mockSave: () => {
        const resolveValue = {
          source: "mock" as const,
          data: [
            {
              id: "segment-a-1",
              routeId: "route-a",
              name: "A 赛段",
              type: "tempo" as const,
              startIndex: 1,
              endIndex: 2,
            },
          ],
        };
        const pending = deferred<typeof resolveValue>();
        vi.spyOn(segmentApi, "saveSegments").mockReturnValue(pending.promise);
        return { pending, resolveValue };
      },
      invokeSave: (editor: ReturnType<typeof useRouteEditorData>) =>
        editor.saveSegmentList([
          {
            id: "segment-a-1",
            routeId: "route-a",
            name: "A 赛段",
            type: "tempo",
            startIndex: 1,
            endIndex: 2,
          },
        ]),
      assertUnchanged: (editor: ReturnType<typeof useRouteEditorData>) => {
        expect(editor.segments).toEqual([
          {
            id: "segment-b-1",
            routeId: "route-b",
            name: "B 赛段",
            type: "flat",
            startIndex: 0,
            endIndex: 1,
          },
        ]);
        expect(editor.selected).toEqual({ kind: "none" });
        expect(editor.message).toBeNull();
      },
    },
    {
      name: "saveGeometry",
      mockSave: () => {
        const resolveValue = {
          source: "mock" as const,
          data: {
            id: "route-a",
            name: "路线 route-a",
            description: "desc-route-a",
            geometry: {
              type: "LineString" as const,
              coordinates: [
                { lat: 10, lng: 20, distanceKm: 0 },
                { lat: 11, lng: 21, distanceKm: 12 },
              ],
            },
          },
        };
        const pending = deferred<typeof resolveValue>();
        vi.spyOn(routeApi, "updateRouteGeometry").mockReturnValue(pending.promise);
        return { pending, resolveValue };
      },
      invokeSave: (editor: ReturnType<typeof useRouteEditorData>) =>
        editor.saveGeometry({
          type: "LineString",
          coordinates: [
            { lat: 10, lng: 20, distanceKm: 0 },
            { lat: 11, lng: 21, distanceKm: 12 },
          ],
        }),
      assertUnchanged: (editor: ReturnType<typeof useRouteEditorData>) => {
        expect(editor.route?.id).toBe("route-b");
        expect(editor.mapData?.routeId).toBe("route-b");
        expect(editor.mapData?.geometry).toEqual({
          type: "LineString",
          coordinates: [
            { lat: 30, lng: 40, distanceKm: 0 },
            { lat: 31, lng: 41, distanceKm: 8 },
          ],
        });
        expect(editor.message).toBeNull();
      },
    },
  ])("ignores stale $name responses after the user switches routes", async ({ mockSave, invokeSave, assertUnchanged }) => {
    const routeAGeometry = {
      type: "LineString" as const,
      coordinates: [
        { lat: 10, lng: 20, distanceKm: 0 },
        { lat: 10.5, lng: 20.5, distanceKm: 6 },
      ],
    };
    const routeBGeometry = {
      type: "LineString" as const,
      coordinates: [
        { lat: 30, lng: 40, distanceKm: 0 },
        { lat: 31, lng: 41, distanceKm: 8 },
      ],
    };

    vi.spyOn(routeApi, "getRouteDetail").mockImplementation(async (routeId) =>
      routeId === "route-a"
        ? buildRouteDetail("route-a", routeAGeometry)
        : buildRouteDetail("route-b", routeBGeometry),
    );
    vi.spyOn(routeApi, "getRouteMapData").mockImplementation(async (routeId) =>
      routeId === "route-a"
        ? buildMapData("route-a", routeAGeometry, [
            { id: "poi-a-1", name: "A POI", type: "supply", lat: 10, lng: 20 },
          ])
        : buildMapData("route-b", routeBGeometry, [
            { id: "poi-b-1", name: "B POI", type: "supply", lat: 30, lng: 40 },
          ]),
    );
    vi.spyOn(segmentApi, "getSegments").mockImplementation(async (routeId) =>
      routeId === "route-a"
        ? {
            source: "mock" as const,
            data: [
              {
                id: "segment-a-1",
                routeId: "route-a",
                name: "A 赛段",
                type: "tempo",
                startIndex: 0,
                endIndex: 1,
              },
            ],
          }
        : {
            source: "mock" as const,
            data: [
              {
                id: "segment-b-1",
                routeId: "route-b",
                name: "B 赛段",
                type: "flat",
                startIndex: 0,
                endIndex: 1,
              },
            ],
          },
    );

    const { pending, resolveValue } = mockSave();
    const { result, rerender } = renderHook(
      ({ routeId }) => useRouteEditorData(routeId),
      { initialProps: { routeId: "route-a" } },
    );

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
      expect(result.current.route?.id).toBe("route-a");
    });

    await act(async () => {
      void invokeSave(result.current);
    });

    expect(result.current.saving).toBe(true);

    rerender({ routeId: "route-b" });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
      expect(result.current.route?.id).toBe("route-b");
    });

    await act(async () => {
      pending.resolve(resolveValue as never);
    });

    await waitFor(() => {
      assertUnchanged(result.current);
      expect(result.current.saving).toBe(false);
    });
  });

  it("shows backend save message after saving segments through api", async () => {
    const geometry = {
      type: "LineString" as const,
      coordinates: [
        { lat: 10, lng: 20, distanceKm: 0 },
        { lat: 11, lng: 21, distanceKm: 12 },
      ],
    };

    vi.spyOn(routeApi, "getRouteDetail").mockResolvedValue(buildRouteDetail("route-a", geometry));
    vi.spyOn(routeApi, "getRouteMapData").mockResolvedValue(buildMapData("route-a", geometry, []));
    vi.spyOn(segmentApi, "getSegments").mockResolvedValue({
      source: "mock",
      data: [],
    });
    vi.spyOn(segmentApi, "saveSegments").mockResolvedValue({
      source: "api",
      data: [
        {
          id: "segment-a-1",
          routeId: "route-a",
          name: "A 赛段",
          type: "tempo",
          startIndex: 0,
          endIndex: 1,
        },
      ],
    });

    const { result } = renderHook(() => useRouteEditorData("route-a"));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    await act(async () => {
      await result.current.saveSegmentList([
        {
          id: "segment-a-1",
          routeId: "route-a",
          name: "A 赛段",
          type: "tempo",
          startIndex: 0,
          endIndex: 1,
        },
      ]);
    });

    expect(result.current.message).toBe("赛段已保存到后端");
  });

  it("keeps the newest same-route geometry save when responses return out of order", async () => {
    const initialGeometry = {
      type: "LineString" as const,
      coordinates: [
        { lat: 10, lng: 20, distanceKm: 0 },
        { lat: 10.5, lng: 20.5, distanceKm: 6 },
      ],
    };
    const firstSubmittedGeometry = {
      type: "LineString" as const,
      coordinates: [
        { lat: 11, lng: 21, distanceKm: 0 },
        { lat: 11.5, lng: 21.5, distanceKm: 6 },
      ],
    };
    const secondSubmittedGeometry = {
      type: "LineString" as const,
      coordinates: [
        { lat: 12, lng: 22, distanceKm: 0 },
        { lat: 12.5, lng: 22.5, distanceKm: 6 },
      ],
    };
    const firstSavedGeometry = {
      type: "LineString" as const,
      coordinates: [
        { lat: 11.1, lng: 21.1, distanceKm: 0 },
        { lat: 11.6, lng: 21.6, distanceKm: 6.2 },
      ],
    };
    const secondSavedGeometry = {
      type: "LineString" as const,
      coordinates: [
        { lat: 12.1, lng: 22.1, distanceKm: 0 },
        { lat: 12.6, lng: 22.6, distanceKm: 6.4 },
      ],
    };
    const firstPending = deferred<{
      source: "api";
      data: {
        id: string;
        name: string;
        description: string;
        geometry: typeof firstSavedGeometry;
      };
    }>();
    const secondPending = deferred<{
      source: "api";
      data: {
        id: string;
        name: string;
        description: string;
        geometry: typeof secondSavedGeometry;
      };
    }>();

    vi.spyOn(routeApi, "getRouteDetail").mockResolvedValue(
      buildRouteDetail("route-a", initialGeometry),
    );
    vi.spyOn(routeApi, "getRouteMapData").mockResolvedValue(
      buildMapData("route-a", initialGeometry, []),
    );
    vi.spyOn(segmentApi, "getSegments").mockResolvedValue({
      source: "mock",
      data: [],
    });
    vi.spyOn(routeApi, "updateRouteGeometry")
      .mockReturnValueOnce(firstPending.promise as never)
      .mockReturnValueOnce(secondPending.promise as never);

    const { result } = renderHook(() => useRouteEditorData("route-a"));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    let firstSavePromise!: Promise<RouteGeometry | null>;
    let secondSavePromise!: Promise<RouteGeometry | null>;

    await act(async () => {
      firstSavePromise = result.current.saveGeometry(firstSubmittedGeometry);
      secondSavePromise = result.current.saveGeometry(secondSubmittedGeometry);
    });

    expect(routeApi.updateRouteGeometry).toHaveBeenNthCalledWith(
      1,
      "route-a",
      firstSubmittedGeometry,
    );
    expect(routeApi.updateRouteGeometry).toHaveBeenNthCalledWith(
      2,
      "route-a",
      secondSubmittedGeometry,
    );

    await act(async () => {
      secondPending.resolve({
        source: "api",
        data: {
          id: "route-a",
          name: "路线 route-a",
          description: "desc-route-a",
          geometry: secondSavedGeometry,
        },
      });
      await secondSavePromise;
    });

    await waitFor(() => {
      expect(result.current.route?.geometry).toEqual(secondSavedGeometry);
      expect(result.current.mapData?.geometry).toEqual(secondSavedGeometry);
    });

    await act(async () => {
      firstPending.resolve({
        source: "api",
        data: {
          id: "route-a",
          name: "路线 route-a",
          description: "desc-route-a",
          geometry: firstSavedGeometry,
        },
      });
      await firstSavePromise;
    });

    expect(result.current.route?.geometry).toEqual(secondSavedGeometry);
    expect(result.current.mapData?.geometry).toEqual(secondSavedGeometry);
  });

  it("uses the server normalized geometry after saving", async () => {
    const submittedGeometry = {
      type: "LineString" as const,
      coordinates: [
        { lat: 10, lng: 20, distanceKm: 0 },
        { lat: 10.5, lng: 20.5, distanceKm: 6 },
      ],
    };
    const normalizedGeometry = {
      type: "LineString" as const,
      coordinates: [
        { lat: 10.01, lng: 20.01, distanceKm: 0 },
        { lat: 10.51, lng: 20.51, distanceKm: 5.5 },
      ],
    };

    vi.spyOn(routeApi, "getRouteDetail").mockResolvedValue(
      buildRouteDetail("route-a", submittedGeometry),
    );
    vi.spyOn(routeApi, "getRouteMapData").mockResolvedValue(
      buildMapData("route-a", submittedGeometry, []),
    );
    vi.spyOn(segmentApi, "getSegments").mockResolvedValue({
      source: "mock",
      data: [],
    });
    vi.spyOn(routeApi, "updateRouteGeometry").mockResolvedValue({
      source: "api",
      data: {
        id: "route-a",
        name: "路线 route-a",
        description: "desc-route-a",
        geometry: normalizedGeometry,
      },
    } as never);

    const { result } = renderHook(() => useRouteEditorData("route-a"));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    await act(async () => {
      await result.current.saveGeometry(submittedGeometry);
    });

    expect(result.current.route?.geometry).toEqual(normalizedGeometry);
    expect(result.current.mapData?.geometry).toEqual(normalizedGeometry);
  });

  it("snaps the current geometry draft, updates snapping state, and returns the snapped geometry", async () => {
    const geometry = {
      type: "LineString" as const,
      coordinates: [
        { lat: 10, lng: 20, distanceKm: 0 },
        { lat: 11, lng: 21, distanceKm: 12 },
      ],
    };
    const snappedGeometry = {
      type: "LineString" as const,
      coordinates: [
        { lat: 10.1, lng: 20.1, distanceKm: 0 },
        { lat: 11.1, lng: 21.1, distanceKm: 12.5 },
      ],
    };
    const pending = deferred<{ source: "api"; data: typeof snappedGeometry }>();

    vi.spyOn(routeApi as any, "snapRouteGeometry").mockReturnValue(pending.promise);
    vi.spyOn(routeApi, "getRouteDetail").mockResolvedValue(buildRouteDetail("route-a", geometry));
    vi.spyOn(routeApi, "getRouteMapData").mockResolvedValue(buildMapData("route-a", geometry, []));
    vi.spyOn(segmentApi, "getSegments").mockResolvedValue({
      source: "mock",
      data: [],
    });

    const { result } = renderHook(() => useRouteEditorData("route-a"));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    let snapPromise: Promise<typeof snappedGeometry | null> | undefined;

    act(() => {
      snapPromise = (result.current as any).snapGeometryDraft(geometry);
    });

    await waitFor(() => {
      expect((result.current as any).snapping).toBe(true);
    });

    expect((routeApi as any).snapRouteGeometry).toHaveBeenCalledWith("route-a", geometry);

    await act(async () => {
      pending.resolve({ source: "api", data: snappedGeometry });
    });

    await expect(snapPromise).resolves.toEqual(snappedGeometry);

    await waitFor(() => {
      expect((result.current as any).snapping).toBe(false);
    });

    expect(result.current.message).toBe("已生成道路贴合结果，请确认后保存");
  });

  it("shows a snap failure message when the snap request rejects", async () => {
    const geometry = {
      type: "LineString" as const,
      coordinates: [
        { lat: 10, lng: 20, distanceKm: 0 },
        { lat: 11, lng: 21, distanceKm: 12 },
      ],
    };

    vi.spyOn(routeApi as any, "snapRouteGeometry").mockRejectedValue(new Error("boom"));
    vi.spyOn(routeApi, "getRouteDetail").mockResolvedValue(buildRouteDetail("route-a", geometry));
    vi.spyOn(routeApi, "getRouteMapData").mockResolvedValue(buildMapData("route-a", geometry, []));
    vi.spyOn(segmentApi, "getSegments").mockResolvedValue({
      source: "mock",
      data: [],
    });

    const { result } = renderHook(() => useRouteEditorData("route-a"));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    let snapPromise: Promise<typeof geometry | null> | undefined;

    act(() => {
      snapPromise = (result.current as any).snapGeometryDraft(geometry);
    });

    await act(async () => {
      await snapPromise;
    });

    await expect(snapPromise).resolves.toBeNull();

    await waitFor(() => {
      expect((result.current as any).snapping).toBe(false);
    });

    expect(result.current.message).toBe("道路贴合失败，请稍后重试");
  });
});
