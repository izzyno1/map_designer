import { mockMapData } from "../mock/map-data";
import { mockRouteDetails, mockRouteSummaries } from "../mock/routes";
import type {
  RouteDetail,
  RouteGeometry,
  RouteMapDataResponse,
  RouteSummary,
} from "../types/route";
import type { ApiResult } from "./client";
import { buildApiUrl, requestJson } from "./client";

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

export async function snapRouteGeometry(
  routeId: string,
  geometry: RouteGeometry,
): Promise<ApiResult<RouteGeometry>> {
  const data = await requestJson<{ geometry: RouteGeometry }>(
    `/api/v1/routes/${routeId}/snap-geometry`,
    {
      method: "POST",
      body: JSON.stringify({ geometry }),
    },
  );

  return { data: data.geometry, source: "api" };
}

export async function downloadRouteExport(routeId: string, routeName: string) {
  const response = await fetch(buildApiUrl(`/api/v1/routes/${routeId}/export`));
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }

  const blob = await response.blob();
  const url = window.URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  const safeName = routeName.replace(/[^\p{L}\p{N}_-]+/gu, "-");
  anchor.href = url;
  anchor.download = `${safeName || routeId}.json`;
  document.body.append(anchor);
  anchor.click();
  anchor.remove();
  window.URL.revokeObjectURL(url);
}
