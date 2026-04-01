import { mockMapData } from "../mock/map-data";
import { mockRouteDetails, mockRouteSummaries } from "../mock/routes";
import type { RouteDetail, RouteMapDataResponse, RouteSummary } from "../types/route";
import type { ApiResult } from "./client";
import { requestJson } from "./client";

export async function getRouteList(): Promise<ApiResult<RouteSummary[]>> {
  try {
    const data = await requestJson<RouteSummary[]>("/api/v1/routes");
    return { data, source: "api" };
  } catch {
    return { data: mockRouteSummaries, source: "mock" };
  }
}

export async function getRouteDetail(routeId: string): Promise<ApiResult<RouteDetail>> {
  try {
    const data = await requestJson<RouteDetail>(`/api/v1/routes/${routeId}`);
    return { data, source: "api" };
  } catch {
    return { data: mockRouteDetails[routeId], source: "mock" };
  }
}

export async function getRouteMapData(routeId: string): Promise<ApiResult<RouteMapDataResponse>> {
  try {
    const data = await requestJson<RouteMapDataResponse>(`/api/v1/routes/${routeId}/map-data`);
    return { data, source: "api" };
  } catch {
    return { data: mockMapData[routeId], source: "mock" };
  }
}

export async function updateRouteGeometry(routeId: string, geometry: RouteMapDataResponse["geometry"]) {
  try {
    const data = await requestJson<RouteDetail>(`/api/v1/routes/${routeId}/geometry`, {
      method: "PATCH",
      body: JSON.stringify({ geometry }),
    });
    return { data, source: "api" as const };
  } catch {
    mockRouteDetails[routeId] = { ...mockRouteDetails[routeId], geometry };
    mockMapData[routeId] = { ...mockMapData[routeId], geometry };
    return { data: mockRouteDetails[routeId], source: "mock" as const };
  }
}
