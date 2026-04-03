import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import * as draftApi from "../../api/draft";
import * as snapApi from "../../api/snap";
import { useDraftAnnotationData } from "../useDraftAnnotationData";

const initialDraft = {
  viewport: {
    center: { lat: 37.87, lng: 112.55 },
    zoom: 12,
  },
  pois: [],
  segments: [],
};

describe("useDraftAnnotationData", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.spyOn(snapApi, "snapPath").mockImplementation(async (points) => points);
  });

  it("loads draft on mount", async () => {
    vi.spyOn(draftApi, "getDraft").mockResolvedValue({
      source: "mock",
      data: initialDraft,
    });

    const { result } = renderHook(() => useDraftAnnotationData());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.draft).toEqual(initialDraft);
  });

  it("creates poi from map click in create-poi mode", async () => {
    vi.spyOn(draftApi, "getDraft").mockResolvedValue({
      source: "mock",
      data: initialDraft,
    });

    const { result } = renderHook(() => useDraftAnnotationData());

    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      result.current.startCreatePoiMode();
    });
    await act(async () => {
      result.current.onMapClick(37.86, 112.54);
    });

    expect(result.current.draft?.pois).toHaveLength(1);
    expect(result.current.selection.kind).toBe("poi");
    expect(result.current.mode).toBe("browse");
  });

  it("creates segment from multi-point draw flow", async () => {
    vi.spyOn(draftApi, "getDraft").mockResolvedValue({
      source: "mock",
      data: initialDraft,
    });

    const { result } = renderHook(() => useDraftAnnotationData());

    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      result.current.startSegmentDrawMode();
    });
    await act(async () => {
      result.current.onMapClick(37.87, 112.55);
      result.current.onMapClick(37.88, 112.57);
    });
    await act(async () => {
      result.current.finishSegmentDrawMode();
    });

    expect(result.current.draft?.segments).toHaveLength(1);
    expect(result.current.draft?.segments[0].points).toHaveLength(2);
    expect(result.current.selection.kind).toBe("segment");
    expect(result.current.mode).toBe("browse");
  });

  it("calls snap api when finishing a segment", async () => {
    vi.spyOn(draftApi, "getDraft").mockResolvedValue({
      source: "mock",
      data: initialDraft,
    });
    const snapSpy = vi.spyOn(snapApi, "snapPath").mockResolvedValue([
      { lat: 37.8701, lng: 112.5501 },
      { lat: 37.8802, lng: 112.5702 },
    ]);

    const { result } = renderHook(() => useDraftAnnotationData());

    await waitFor(() => expect(result.current.loading).toBe(false));
    await act(async () => {
      result.current.startSegmentDrawMode();
    });
    await act(async () => {
      result.current.onMapClick(37.87, 112.55);
      result.current.onMapClick(37.88, 112.57);
    });
    await act(async () => {
      await result.current.finishSegmentDrawMode();
    });

    expect(snapSpy).toHaveBeenCalledTimes(1);
    expect(result.current.draft?.segments[0].points).toEqual([
      { lat: 37.8701, lng: 112.5501 },
      { lat: 37.8802, lng: 112.5702 },
    ]);
  });
});
