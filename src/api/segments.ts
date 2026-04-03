import { mockSegmentsByRoute } from "../mock/segments";
import type { Segment } from "../types/annotation";
import type { ApiResult } from "./client";
import { requestJson } from "./client";

const STORAGE_KEY = "cycling-route-admin:segments";

function readStore(): Record<string, Segment[]> {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return { ...mockSegmentsByRoute };
  return JSON.parse(raw) as Record<string, Segment[]>;
}

function writeStore(data: Record<string, Segment[]>) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

export async function getSegments(routeId: string): Promise<ApiResult<Segment[]>> {
  try {
    const data = await requestJson<Segment[]>(`/api/v1/routes/${routeId}/segments`);
    return { data, source: "api" };
  } catch {
    const store = readStore();
    return { data: store[routeId] ?? [], source: "mock" };
  }
}

export async function saveSegments(
  routeId: string,
  segments: Segment[],
): Promise<ApiResult<Segment[]>> {
  try {
    const data = await requestJson<Segment[]>(`/api/v1/routes/${routeId}/segments`, {
      method: "PUT",
      body: JSON.stringify({ segments }),
    });
    return { data, source: "api" };
  } catch {
    const store = readStore();
    store[routeId] = segments;
    writeStore(store);
    return { data: segments, source: "mock" };
  }
}
