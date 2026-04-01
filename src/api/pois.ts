import { mockMapData } from "../mock/map-data";
import type { Poi } from "../types/route";
import { requestJson } from "./client";

export async function createPoi(routeId: string, payload: Omit<Poi, "id">) {
  try {
    const data = await requestJson<Poi>(`/api/v1/routes/${routeId}/pois`, {
      method: "POST",
      body: JSON.stringify(payload),
    });
    return { data, source: "api" as const };
  } catch {
    const data: Poi = {
      ...payload,
      id: crypto.randomUUID(),
    };
    mockMapData[routeId].pois = [...mockMapData[routeId].pois, data];
    return { data, source: "mock" as const };
  }
}

export async function updatePoi(routeId: string, poiId: string, payload: Partial<Poi>) {
  try {
    const data = await requestJson<Poi>(`/api/v1/routes/${routeId}/pois/${poiId}`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    });
    return { data, source: "api" as const };
  } catch {
    const current = mockMapData[routeId].pois.find((item) => item.id === poiId)!;
    const next = { ...current, ...payload };
    mockMapData[routeId].pois = mockMapData[routeId].pois.map((item) =>
      item.id === poiId ? next : item,
    );
    return { data: next, source: "mock" as const };
  }
}
