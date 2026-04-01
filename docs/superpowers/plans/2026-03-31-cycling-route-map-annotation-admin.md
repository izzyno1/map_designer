# Cycling Route Map Annotation Admin Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a desktop-first internal React + Vite + TypeScript admin tool for route listing, map-based POI and segment annotation, and geometry editing with API-first + automatic mock fallback behavior.

**Architecture:** Start from a clean Vite React TypeScript app, then layer in domain types and pure utilities first, API and mock persistence second, and finally the route list and route editor UI. Keep all map, annotation, and save behavior routed through small focused modules so the UI can stay simple while future real segment APIs or offline map work can slot in without rewiring the whole app.

**Tech Stack:** React, Vite, TypeScript, React Router, Leaflet, React Leaflet, Vitest, Testing Library, localStorage fallback, Fetch API

---

### Task 1: Bootstrap The Workspace

**Files:**
- Create: `package.json`
- Create: `tsconfig.json`
- Create: `tsconfig.app.json`
- Create: `tsconfig.node.json`
- Create: `vite.config.ts`
- Create: `vitest.config.ts`
- Create: `index.html`
- Create: `src/main.tsx`
- Create: `src/App.tsx`
- Create: `src/styles/index.css`
- Create: `src/test/setup.ts`
- Create: `.gitignore`

- [ ] **Step 1: Initialize git and scaffold the Vite React TypeScript app**

Run:

```bash
cd /Users/a123/Desktop/map_designer
git init
printf 'y\n' | npm create vite@latest . -- --template react-ts
```

Expected:

```text
Initialized empty Git repository
Scaffolding project in /Users/a123/Desktop/map_designer...
Done. Now run:
  npm install
  npm run dev
```

- [ ] **Step 2: Install runtime and test dependencies**

Run:

```bash
cd /Users/a123/Desktop/map_designer
npm install
npm install react-router-dom leaflet react-leaflet @types/leaflet
npm install -D vitest jsdom @testing-library/react @testing-library/jest-dom @testing-library/user-event
```

Expected:

```text
added <packages> packages
found 0 vulnerabilities
```

- [ ] **Step 3: Configure scripts, Vitest, and the app entry styles**

Update `package.json` to include the test commands and keep the Vite scripts:

```json
{
  "name": "map_designer",
  "private": true,
  "version": "0.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc -b && vite build",
    "preview": "vite preview",
    "test": "vitest",
    "test:run": "vitest run"
  },
  "dependencies": {
    "@types/leaflet": "^1.9.21",
    "leaflet": "^1.9.4",
    "react": "^19.1.0",
    "react-dom": "^19.1.0",
    "react-leaflet": "^5.0.0",
    "react-router-dom": "^7.0.0"
  },
  "devDependencies": {
    "@testing-library/jest-dom": "^6.6.3",
    "@testing-library/react": "^16.2.0",
    "@testing-library/user-event": "^14.6.1",
    "jsdom": "^26.0.0",
    "typescript": "~5.8.3",
    "vite": "^7.0.0",
    "vitest": "^3.1.0"
  }
}
```

Create `vitest.config.ts`:

```ts
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "jsdom",
    setupFiles: ["./src/test/setup.ts"],
    globals: true,
  },
});
```

Create `src/test/setup.ts`:

```ts
import "@testing-library/jest-dom";
```

Replace `src/App.tsx` with:

```tsx
import { Outlet } from "react-router-dom";

export default function App() {
  return <Outlet />;
}
```

Replace `src/main.tsx` with:

```tsx
import React from "react";
import ReactDOM from "react-dom/client";
import { createBrowserRouter, Navigate, RouterProvider } from "react-router-dom";
import App from "./App";
import "./styles/index.css";

function Placeholder() {
  return <div>Loading app shell...</div>;
}

const router = createBrowserRouter([
  {
    path: "/",
    element: <App />,
    children: [
      { index: true, element: <Placeholder /> },
      { path: "routes/:routeId", element: <Placeholder /> },
      { path: "*", element: <Navigate to="/" replace /> },
    ],
  },
]);

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>,
);
```

Replace `src/styles/index.css` with:

```css
:root {
  font-family: "IBM Plex Sans", "Segoe UI", sans-serif;
  color: #17212b;
  background: #edf1f5;
  line-height: 1.5;
  font-weight: 400;
  font-synthesis: none;
  text-rendering: optimizeLegibility;
  -webkit-font-smoothing: antialiased;
  --bg: #edf1f5;
  --panel: #ffffff;
  --panel-muted: #f6f8fb;
  --border: #d8e0e8;
  --text: #17212b;
  --muted: #617182;
  --primary: #1f6feb;
  --success: #1a7f37;
  --danger: #c03221;
  --warning: #a15c00;
}

* {
  box-sizing: border-box;
}

html,
body,
#root {
  margin: 0;
  min-height: 100%;
}

body {
  background: linear-gradient(180deg, #f4f7fb 0%, #e8edf3 100%);
  color: var(--text);
}

button,
input,
select,
textarea {
  font: inherit;
}
```

Create `.gitignore`:

```gitignore
node_modules
dist
.DS_Store
coverage
.superpowers
```

- [ ] **Step 4: Run the initial build command**

Run:

```bash
cd /Users/a123/Desktop/map_designer
npm run build
```

Expected:

```text
vite v<version> building for production...
✓ built in <time>
```

- [ ] **Step 5: Commit**

Run:

```bash
cd /Users/a123/Desktop/map_designer
git add .
git commit -m "chore: bootstrap route annotation admin"
```

### Task 2: Add Types, Mock Data, And Pure Geometry Utilities

**Files:**
- Create: `src/types/route.ts`
- Create: `src/types/annotation.ts`
- Create: `src/mock/routes.ts`
- Create: `src/mock/map-data.ts`
- Create: `src/mock/segments.ts`
- Create: `src/lib/geometry.ts`
- Create: `src/lib/segments.ts`
- Create: `src/lib/constants.ts`
- Create: `src/lib/__tests__/geometry.test.ts`
- Create: `src/lib/__tests__/segments.test.ts`

- [ ] **Step 1: Write the failing geometry and segment tests**

Create `src/lib/__tests__/geometry.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import {
  buildFallbackView,
  clampSegmentIndexes,
  geometryToLatLngTuples,
  latLngTuplesToGeometry,
} from "../geometry";

describe("geometry helpers", () => {
  it("converts route geometry points into leaflet tuples", () => {
    const tuples = geometryToLatLngTuples({
      type: "LineString",
      coordinates: [
        { lat: 37.87, lng: 112.54, distanceKm: 0 },
        { lat: 37.88, lng: 112.55, distanceKm: 1.2 },
      ],
    });

    expect(tuples).toEqual([
      [37.87, 112.54],
      [37.88, 112.55],
    ]);
  });

  it("round-trips tuples back into geometry points while preserving indexes", () => {
    const geometry = latLngTuplesToGeometry([
      [37.87, 112.54],
      [37.88, 112.55],
    ]);

    expect(geometry.type).toBe("LineString");
    expect(geometry.coordinates[0]).toMatchObject({ lat: 37.87, lng: 112.54 });
    expect(geometry.coordinates[1]).toMatchObject({ lat: 37.88, lng: 112.55 });
  });

  it("clamps segment indexes into a safe visible range", () => {
    expect(clampSegmentIndexes(-1, 99, 12)).toEqual({ startIndex: 0, endIndex: 11 });
  });

  it("returns a Shanxi fallback view when geometry is empty", () => {
    expect(buildFallbackView([])).toEqual({
      center: [37.8735, 112.5624],
      zoom: 7,
    });
  });
});
```

Create `src/lib/__tests__/segments.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { getSegmentSlice, isSegmentIndexRangeValid } from "../segments";

const coordinates = [
  { lat: 37.87, lng: 112.54, distanceKm: 0 },
  { lat: 37.88, lng: 112.55, distanceKm: 1 },
  { lat: 37.89, lng: 112.56, distanceKm: 2 },
  { lat: 37.9, lng: 112.57, distanceKm: 3 },
];

describe("segment helpers", () => {
  it("extracts a route subsection by start and end index", () => {
    expect(getSegmentSlice(coordinates, 1, 2)).toEqual([
      { lat: 37.88, lng: 112.55, distanceKm: 1 },
      { lat: 37.89, lng: 112.56, distanceKm: 2 },
    ]);
  });

  it("rejects invalid index ranges", () => {
    expect(isSegmentIndexRangeValid(4, 2, 5)).toBe(false);
    expect(isSegmentIndexRangeValid(0, 4, 5)).toBe(true);
  });
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run:

```bash
cd /Users/a123/Desktop/map_designer
npm run test:run -- src/lib/__tests__/geometry.test.ts src/lib/__tests__/segments.test.ts
```

Expected:

```text
FAIL  src/lib/__tests__/geometry.test.ts
FAIL  src/lib/__tests__/segments.test.ts
Error: Failed to resolve import "../geometry"
```

- [ ] **Step 3: Implement the route types, mock data, and pure utilities**

Create `src/types/route.ts`:

```ts
export interface RouteSummary {
  id: string;
  name: string;
  distanceKm?: number;
  updatedAt?: string;
  status?: string;
}

export interface RouteGeometryPoint {
  lat: number;
  lng: number;
  distanceKm?: number;
}

export interface RouteGeometry {
  type: "LineString";
  coordinates: RouteGeometryPoint[];
}

export interface RouteDetail extends RouteSummary {
  description?: string;
  geometry: RouteGeometry;
}

export interface Poi {
  id: string;
  name: string;
  type: "supply" | "coffee" | "repair" | "meetup";
  iconName?: string;
  distanceLabel?: string;
  description?: string;
  tone?: string;
  lat: number;
  lng: number;
}

export interface RouteMapDataResponse {
  routeId: string;
  geometry: RouteGeometry;
  pois: Poi[];
}
```

Create `src/types/annotation.ts`:

```ts
import type { Poi } from "./route";

export interface Segment {
  id: string;
  routeId: string;
  name: string;
  type: "climb" | "flat" | "tempo" | "sprint";
  effort?: string;
  rank?: string;
  best?: string;
  pr?: string;
  likes?: number;
  riders?: number;
  startIndex?: number;
  endIndex?: number;
}

export type SelectedAnnotation =
  | { kind: "poi"; id: string }
  | { kind: "segment"; id: string }
  | { kind: "geometry" }
  | { kind: "new-poi" }
  | { kind: "none" };

export type DraftPoi = Poi & { isNew?: boolean };
```

Create `src/lib/constants.ts`:

```ts
export const SHANXI_FALLBACK_CENTER: [number, number] = [37.8735, 112.5624];
export const SHANXI_FALLBACK_ZOOM = 7;
```

Create `src/lib/geometry.ts`:

```ts
import type { RouteGeometry, RouteGeometryPoint } from "../types/route";
import { SHANXI_FALLBACK_CENTER, SHANXI_FALLBACK_ZOOM } from "./constants";

export function geometryToLatLngTuples(geometry: RouteGeometry): [number, number][] {
  return geometry.coordinates.map((point) => [point.lat, point.lng]);
}

export function latLngTuplesToGeometry(points: [number, number][]): RouteGeometry {
  return {
    type: "LineString",
    coordinates: points.map(([lat, lng], index) => ({
      lat,
      lng,
      distanceKm: index === 0 ? 0 : undefined,
    })),
  };
}

export function clampSegmentIndexes(startIndex: number, endIndex: number, length: number) {
  return {
    startIndex: Math.max(0, Math.min(startIndex, Math.max(length - 1, 0))),
    endIndex: Math.max(0, Math.min(endIndex, Math.max(length - 1, 0))),
  };
}

export function buildFallbackView(points: RouteGeometryPoint[]) {
  if (points.length > 0) {
    return {
      center: [points[0].lat, points[0].lng] as [number, number],
      zoom: 11,
    };
  }

  return {
    center: SHANXI_FALLBACK_CENTER,
    zoom: SHANXI_FALLBACK_ZOOM,
  };
}
```

Create `src/lib/segments.ts`:

```ts
import type { RouteGeometryPoint } from "../types/route";

export function isSegmentIndexRangeValid(startIndex?: number, endIndex?: number, length = 0) {
  if (startIndex === undefined || endIndex === undefined) return false;
  if (startIndex < 0 || endIndex < 0) return false;
  if (startIndex > endIndex) return false;
  return endIndex < length;
}

export function getSegmentSlice(
  coordinates: RouteGeometryPoint[],
  startIndex?: number,
  endIndex?: number,
) {
  if (!isSegmentIndexRangeValid(startIndex, endIndex, coordinates.length)) {
    return [];
  }

  return coordinates.slice(startIndex, endIndex + 1);
}
```

Create `src/mock/routes.ts`:

```ts
import type { RouteDetail, RouteSummary } from "../types/route";

export const mockRouteSummaries: RouteSummary[] = [
  {
    id: "sx-taiyuan-river-loop",
    name: "太原汾河晨骑环线",
    distanceKm: 71.5,
    updatedAt: "2026-03-31T10:00:00Z",
    status: "draft",
  },
  {
    id: "sx-jiexiu-ancient-city",
    name: "介休古城进阶训练线",
    distanceKm: 96.2,
    updatedAt: "2026-03-29T08:30:00Z",
    status: "review",
  },
];

export const mockRouteDetails: Record<string, RouteDetail> = {
  "sx-taiyuan-river-loop": {
    ...mockRouteSummaries[0],
    description: "沿汾河主线展开的城市长距离训练路线。",
    geometry: {
      type: "LineString",
      coordinates: [
        { lat: 37.8735, lng: 112.5624, distanceKm: 0 },
        { lat: 37.8672, lng: 112.5481, distanceKm: 8.2 },
        { lat: 37.8581, lng: 112.534, distanceKm: 16.7 },
        { lat: 37.8451, lng: 112.5202, distanceKm: 28.4 },
        { lat: 37.8512, lng: 112.5383, distanceKm: 71.5 },
      ],
    },
  },
  "sx-jiexiu-ancient-city": {
    ...mockRouteSummaries[1],
    description: "适合节奏骑与赛段维护演示的晋中区域训练线。",
    geometry: {
      type: "LineString",
      coordinates: [
        { lat: 37.0274, lng: 111.9131, distanceKm: 0 },
        { lat: 37.041, lng: 111.9278, distanceKm: 15.4 },
        { lat: 37.0553, lng: 111.9362, distanceKm: 40.1 },
        { lat: 37.0698, lng: 111.9429, distanceKm: 67.8 },
        { lat: 37.0841, lng: 111.955, distanceKm: 96.2 },
      ],
    },
  },
};
```

Create `src/mock/map-data.ts`:

```ts
import type { RouteMapDataResponse } from "../types/route";

export const mockMapData: Record<string, RouteMapDataResponse> = {
  "sx-taiyuan-river-loop": {
    routeId: "sx-taiyuan-river-loop",
    geometry: {
      type: "LineString",
      coordinates: [
        { lat: 37.8735, lng: 112.5624, distanceKm: 0 },
        { lat: 37.8672, lng: 112.5481, distanceKm: 8.2 },
        { lat: 37.8581, lng: 112.534, distanceKm: 16.7 },
        { lat: 37.8451, lng: 112.5202, distanceKm: 28.4 },
        { lat: 37.8512, lng: 112.5383, distanceKm: 71.5 },
      ],
    },
    pois: [
      {
        id: "poi-1",
        name: "汾河补水点",
        type: "supply",
        iconName: "water",
        distanceLabel: "约 8km",
        description: "河边便利店，适合补水。",
        tone: "轻松补给",
        lat: 37.8672,
        lng: 112.5481,
      },
      {
        id: "poi-2",
        name: "桥头咖啡站",
        type: "coffee",
        iconName: "coffee",
        distanceLabel: "约 28km",
        description: "适合短暂停留。",
        tone: "提神一下",
        lat: 37.8451,
        lng: 112.5202,
      },
    ],
  },
  "sx-jiexiu-ancient-city": {
    routeId: "sx-jiexiu-ancient-city",
    geometry: {
      type: "LineString",
      coordinates: [
        { lat: 37.0274, lng: 111.9131, distanceKm: 0 },
        { lat: 37.041, lng: 111.9278, distanceKm: 15.4 },
        { lat: 37.0553, lng: 111.9362, distanceKm: 40.1 },
        { lat: 37.0698, lng: 111.9429, distanceKm: 67.8 },
        { lat: 37.0841, lng: 111.955, distanceKm: 96.2 },
      ],
    },
    pois: [],
  },
};
```

Create `src/mock/segments.ts`:

```ts
import type { Segment } from "../types/annotation";

export const mockSegmentsByRoute: Record<string, Segment[]> = {
  "sx-taiyuan-river-loop": [
    {
      id: "segment-1",
      routeId: "sx-taiyuan-river-loop",
      name: "汾河节奏段",
      type: "tempo",
      effort: "持续输出",
      rank: "A",
      best: "08:45",
      pr: "09:10",
      likes: 123,
      riders: 58,
      startIndex: 1,
      endIndex: 3,
    },
  ],
  "sx-jiexiu-ancient-city": [],
};
```

- [ ] **Step 4: Run the tests to verify they pass**

Run:

```bash
cd /Users/a123/Desktop/map_designer
npm run test:run -- src/lib/__tests__/geometry.test.ts src/lib/__tests__/segments.test.ts
```

Expected:

```text
✓ src/lib/__tests__/geometry.test.ts
✓ src/lib/__tests__/segments.test.ts
```

- [ ] **Step 5: Commit**

Run:

```bash
cd /Users/a123/Desktop/map_designer
git add src/types src/mock src/lib
git commit -m "feat: add route domain models and geometry helpers"
```

### Task 3: Build API Adapters And Mock Persistence

**Files:**
- Create: `src/api/client.ts`
- Create: `src/api/routes.ts`
- Create: `src/api/pois.ts`
- Create: `src/api/segments.ts`
- Create: `src/api/__tests__/routes.test.ts`
- Create: `src/api/__tests__/segments.test.ts`

- [ ] **Step 1: Write failing tests for API fallback and segment persistence**

Create `src/api/__tests__/routes.test.ts`:

```ts
import { beforeEach, describe, expect, it, vi } from "vitest";
import { getRouteList } from "../routes";

describe("route api fallback", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("returns mock routes when fetch fails", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("network down")));

    const result = await getRouteList();

    expect(result.source).toBe("mock");
    expect(result.data.length).toBeGreaterThan(0);
  });
});
```

Create `src/api/__tests__/segments.test.ts`:

```ts
import { beforeEach, describe, expect, it } from "vitest";
import { getSegments, saveSegments } from "../segments";

describe("segment storage", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("persists segments by route id", async () => {
    await saveSegments("route-1", [
      {
        id: "segment-1",
        routeId: "route-1",
        name: "测试赛段",
        type: "climb",
      },
    ]);

    const result = await getSegments("route-1");
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe("测试赛段");
  });
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run:

```bash
cd /Users/a123/Desktop/map_designer
npm run test:run -- src/api/__tests__/routes.test.ts src/api/__tests__/segments.test.ts
```

Expected:

```text
FAIL  src/api/__tests__/routes.test.ts
FAIL  src/api/__tests__/segments.test.ts
Error: Failed to resolve import "../routes"
```

- [ ] **Step 3: Implement the API client and fallback modules**

Create `src/api/client.ts`:

```ts
export interface ApiResult<T> {
  data: T;
  source: "api" | "mock";
}

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "";

export async function requestJson<T>(path: string, init?: RequestInit) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
    ...init,
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }

  return (await response.json()) as T;
}
```

Create `src/api/routes.ts`:

```ts
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
```

Create `src/api/pois.ts`:

```ts
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
```

Create `src/api/segments.ts`:

```ts
import { mockSegmentsByRoute } from "../mock/segments";
import type { Segment } from "../types/annotation";

const STORAGE_KEY = "cycling-route-admin:segments";

function readStore(): Record<string, Segment[]> {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return { ...mockSegmentsByRoute };
  return JSON.parse(raw) as Record<string, Segment[]>;
}

function writeStore(data: Record<string, Segment[]>) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

// Mock-only API until backend segment endpoints are available.
export async function getSegments(routeId: string): Promise<Segment[]> {
  const store = readStore();
  return store[routeId] ?? [];
}

// Mock-only API until backend segment endpoints are available.
export async function saveSegments(routeId: string, segments: Segment[]): Promise<Segment[]> {
  const store = readStore();
  store[routeId] = segments;
  writeStore(store);
  return segments;
}
```

- [ ] **Step 4: Run the tests to verify they pass**

Run:

```bash
cd /Users/a123/Desktop/map_designer
npm run test:run -- src/api/__tests__/routes.test.ts src/api/__tests__/segments.test.ts
```

Expected:

```text
✓ src/api/__tests__/routes.test.ts
✓ src/api/__tests__/segments.test.ts
```

- [ ] **Step 5: Commit**

Run:

```bash
cd /Users/a123/Desktop/map_designer
git add src/api
git commit -m "feat: add api wrappers and mock persistence"
```

### Task 4: Build Routing, App Shell, And The Route List Page

**Files:**
- Create: `src/app/router.tsx`
- Create: `src/components/AppShell.tsx`
- Create: `src/components/StatusBanner.tsx`
- Create: `src/pages/RouteListPage.tsx`
- Create: `src/pages/__tests__/RouteListPage.test.tsx`
- Modify: `src/main.tsx`
- Modify: `src/App.tsx`
- Modify: `src/styles/index.css`

- [ ] **Step 1: Write the failing route list page test**

Create `src/pages/__tests__/RouteListPage.test.tsx`:

```tsx
import { MemoryRouter } from "react-router-dom";
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import * as routesApi from "../../api/routes";
import { RouteListPage } from "../RouteListPage";

describe("RouteListPage", () => {
  it("renders route cards from the loader", async () => {
    vi.spyOn(routesApi, "getRouteList").mockResolvedValue({
      source: "mock",
      data: [
        {
          id: "route-1",
          name: "测试路线",
          distanceKm: 88.8,
          status: "draft",
        },
      ],
    });

    render(
      <MemoryRouter>
        <RouteListPage />
      </MemoryRouter>,
    );

    expect(await screen.findByText("测试路线")).toBeInTheDocument();
    expect(screen.getByText("88.8 km")).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run:

```bash
cd /Users/a123/Desktop/map_designer
npm run test:run -- src/pages/__tests__/RouteListPage.test.tsx
```

Expected:

```text
FAIL  src/pages/__tests__/RouteListPage.test.tsx
Error: Failed to resolve import "../RouteListPage"
```

- [ ] **Step 3: Implement the app shell, router, and route list page**

Create `src/components/AppShell.tsx`:

```tsx
import { Link } from "react-router-dom";
import type { ReactNode } from "react";

interface AppShellProps {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
  children: ReactNode;
}

export function AppShell({ title, subtitle, actions, children }: AppShellProps) {
  return (
    <div className="app-shell">
      <header className="app-shell__header">
        <div>
          <Link className="app-shell__crumb" to="/">
            骑行路线标注后台
          </Link>
          <h1>{title}</h1>
          {subtitle ? <p>{subtitle}</p> : null}
        </div>
        <div>{actions}</div>
      </header>
      <main className="app-shell__body">{children}</main>
    </div>
  );
}
```

Create `src/components/StatusBanner.tsx`:

```tsx
interface StatusBannerProps {
  tone: "neutral" | "success" | "warning" | "danger";
  children: string;
}

export function StatusBanner({ tone, children }: StatusBannerProps) {
  return <div className={`status-banner status-banner--${tone}`}>{children}</div>;
}
```

Create `src/pages/RouteListPage.tsx`:

```tsx
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getRouteList } from "../api/routes";
import { AppShell } from "../components/AppShell";
import { StatusBanner } from "../components/StatusBanner";
import type { RouteSummary } from "../types/route";

export function RouteListPage() {
  const [routes, setRoutes] = useState<RouteSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [source, setSource] = useState<"api" | "mock">("mock");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      try {
        const result = await getRouteList();
        setRoutes(result.data);
        setSource(result.source);
      } catch (err) {
        setError(err instanceof Error ? err.message : "加载路线失败");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <AppShell title="路线列表" subtitle="选择一条路线进入地图标注编辑器">
      <section className="route-list-page">
        <StatusBanner tone={source === "api" ? "success" : "warning"}>
          {source === "api" ? "Connected to API" : "Fallback mock mode"}
        </StatusBanner>
        {error ? <StatusBanner tone="danger">{error}</StatusBanner> : null}
        {loading ? <div className="panel">正在加载路线...</div> : null}
        {!loading ? (
          <div className="route-grid">
            {routes.map((route) => (
              <Link key={route.id} className="route-card" to={`/routes/${route.id}`}>
                <div className="route-card__title">{route.name}</div>
                <div className="route-card__meta">{route.distanceKm?.toFixed(1)} km</div>
                <div className="route-card__meta">状态：{route.status ?? "unknown"}</div>
              </Link>
            ))}
          </div>
        ) : null}
      </section>
    </AppShell>
  );
}
```

Create `src/app/router.tsx`:

```tsx
import { createBrowserRouter, Navigate } from "react-router-dom";
import App from "../App";
import { RouteEditorPage } from "../pages/RouteEditorPage";
import { RouteListPage } from "../pages/RouteListPage";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <App />,
    children: [
      { index: true, element: <RouteListPage /> },
      { path: "routes/:routeId", element: <RouteEditorPage /> },
      { path: "*", element: <Navigate to="/" replace /> },
    ],
  },
]);
```

Replace `src/App.tsx` with:

```tsx
import { Outlet } from "react-router-dom";

export default function App() {
  return <Outlet />;
}
```

Replace `src/main.tsx` with:

```tsx
import React from "react";
import ReactDOM from "react-dom/client";
import { RouterProvider } from "react-router-dom";
import { router } from "./app/router";
import "./styles/index.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>,
);
```

Create a temporary `src/pages/RouteEditorPage.tsx` placeholder:

```tsx
import { AppShell } from "../components/AppShell";

export function RouteEditorPage() {
  return (
    <AppShell title="路线编辑器" subtitle="编辑器骨架将在后续任务中完成">
      <div className="panel">Loading editor...</div>
    </AppShell>
  );
}
```

Append to `src/styles/index.css`:

```css
.app-shell {
  min-height: 100vh;
  padding: 24px;
}

.app-shell__header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 16px;
  margin-bottom: 24px;
}

.app-shell__header h1 {
  margin: 8px 0 4px;
  font-size: 28px;
}

.app-shell__header p {
  margin: 0;
  color: var(--muted);
}

.app-shell__crumb {
  color: var(--primary);
  text-decoration: none;
  font-size: 14px;
  font-weight: 600;
}

.panel,
.route-card,
.status-banner {
  border: 1px solid var(--border);
  border-radius: 16px;
  background: var(--panel);
}

.panel {
  padding: 16px;
}

.status-banner {
  padding: 12px 14px;
  margin-bottom: 12px;
}

.status-banner--success {
  border-color: #b7dfbf;
  background: #eff9f0;
  color: var(--success);
}

.status-banner--warning {
  border-color: #e4d0a0;
  background: #fff7e8;
  color: var(--warning);
}

.status-banner--danger {
  border-color: #efc0ba;
  background: #fff1ef;
  color: var(--danger);
}

.status-banner--neutral {
  border-color: var(--border);
  background: #f8fafc;
  color: var(--text);
}

.route-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 16px;
}

.route-card {
  display: block;
  padding: 18px;
  color: inherit;
  text-decoration: none;
}

.route-card__title {
  font-size: 18px;
  font-weight: 700;
  margin-bottom: 8px;
}

.route-card__meta {
  color: var(--muted);
  font-size: 14px;
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run:

```bash
cd /Users/a123/Desktop/map_designer
npm run test:run -- src/pages/__tests__/RouteListPage.test.tsx
```

Expected:

```text
✓ src/pages/__tests__/RouteListPage.test.tsx
```

- [ ] **Step 5: Commit**

Run:

```bash
cd /Users/a123/Desktop/map_designer
git add src/app src/components src/pages src/styles src/main.tsx src/App.tsx
git commit -m "feat: add app shell and route list page"
```

### Task 5: Build Route Editor State, Sidebar, And Right Panels

**Files:**
- Create: `src/hooks/useRouteEditorData.ts`
- Create: `src/components/AnnotationSidebar.tsx`
- Create: `src/components/PoiEditorPanel.tsx`
- Create: `src/components/SegmentEditorPanel.tsx`
- Create: `src/components/GeometryEditorPanel.tsx`
- Create: `src/pages/__tests__/RouteEditorPage.test.tsx`
- Modify: `src/pages/RouteEditorPage.tsx`
- Modify: `src/styles/index.css`

- [ ] **Step 1: Write the failing editor page test**

Create `src/pages/__tests__/RouteEditorPage.test.tsx`:

```tsx
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import * as routeApi from "../../api/routes";
import * as segmentApi from "../../api/segments";
import { RouteEditorPage } from "../RouteEditorPage";

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
    expect(screen.getByText("Geometry")).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run:

```bash
cd /Users/a123/Desktop/map_designer
npm run test:run -- src/pages/__tests__/RouteEditorPage.test.tsx
```

Expected:

```text
FAIL  src/pages/__tests__/RouteEditorPage.test.tsx
Unable to find an element with the text: 标注列表
```

- [ ] **Step 3: Implement the editor data hook, sidebar, and right-side panels**

Create `src/hooks/useRouteEditorData.ts`:

```ts
import { useEffect, useMemo, useState } from "react";
import { getRouteDetail, getRouteMapData, updateRouteGeometry } from "../api/routes";
import { createPoi, updatePoi } from "../api/pois";
import { getSegments, saveSegments } from "../api/segments";
import type { DraftPoi, Segment, SelectedAnnotation } from "../types/annotation";
import type { Poi, RouteDetail, RouteGeometry, RouteMapDataResponse } from "../types/route";

export function useRouteEditorData(routeId: string) {
  const [route, setRoute] = useState<RouteDetail | null>(null);
  const [mapData, setMapData] = useState<RouteMapDataResponse | null>(null);
  const [segments, setSegments] = useState<Segment[]>([]);
  const [selected, setSelected] = useState<SelectedAnnotation>({ kind: "none" });
  const [draftPoi, setDraftPoi] = useState<DraftPoi | null>(null);
  const [source, setSource] = useState<"api" | "mock">("mock");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      setLoading(true);
      const [detailResult, mapResult, segmentResult] = await Promise.all([
        getRouteDetail(routeId),
        getRouteMapData(routeId),
        getSegments(routeId),
      ]);
      setRoute(detailResult.data);
      setMapData(mapResult.data);
      setSegments(segmentResult);
      setSource(detailResult.source === "api" && mapResult.source === "api" ? "api" : "mock");
      setLoading(false);
    })();
  }, [routeId]);

  const selectedPoi = useMemo(() => {
    if (selected.kind !== "poi" || !mapData) return null;
    return mapData.pois.find((item) => item.id === selected.id) ?? null;
  }, [mapData, selected]);

  const selectedSegment = useMemo(() => {
    if (selected.kind !== "segment") return null;
    return segments.find((item) => item.id === selected.id) ?? null;
  }, [segments, selected]);

  async function savePoiDraft(input: DraftPoi) {
    if (!mapData) return;
    setSaving(true);
    const result = input.isNew
      ? await createPoi(routeId, {
          name: input.name,
          type: input.type,
          iconName: input.iconName,
          distanceLabel: input.distanceLabel,
          description: input.description,
          tone: input.tone,
          lat: input.lat,
          lng: input.lng,
        })
      : await updatePoi(routeId, input.id, input);

    setMapData({
      ...mapData,
      pois: input.isNew
        ? [...mapData.pois, result.data]
        : mapData.pois.map((poi) => (poi.id === result.data.id ? result.data : poi)),
    });
    setSelected({ kind: "poi", id: result.data.id });
    setDraftPoi(null);
    setMessage(result.source === "api" ? "POI 已保存到后端" : "POI 已保存到 mock 数据");
    setSaving(false);
  }

  async function saveSegmentList(nextSegments: Segment[]) {
    setSaving(true);
    await saveSegments(routeId, nextSegments);
    setSegments(nextSegments);
    setMessage("赛段已保存到本地 mock 存储");
    setSaving(false);
  }

  async function saveGeometry(geometry: RouteGeometry) {
    setSaving(true);
    const result = await updateRouteGeometry(routeId, geometry);
    setRoute(result.data);
    if (mapData) {
      setMapData({ ...mapData, geometry });
    }
    setMessage(result.source === "api" ? "Geometry 已保存到后端" : "Geometry 已保存到 mock 数据");
    setSaving(false);
  }

  function startCreatePoi(lat: number, lng: number) {
    setDraftPoi({
      id: "draft-poi",
      isNew: true,
      name: "",
      type: "supply",
      iconName: "",
      distanceLabel: "",
      description: "",
      tone: "",
      lat,
      lng,
    });
    setSelected({ kind: "new-poi" });
  }

  function selectPoi(poiId: string) {
    setSelected({ kind: "poi", id: poiId });
    setDraftPoi(null);
  }

  function selectSegment(segmentId: string) {
    setSelected({ kind: "segment", id: segmentId });
    setDraftPoi(null);
  }

  function selectGeometry() {
    setSelected({ kind: "geometry" });
    setDraftPoi(null);
  }

  return {
    route,
    mapData,
    segments,
    selected,
    selectedPoi,
    selectedSegment,
    draftPoi,
    source,
    loading,
    saving,
    message,
    setDraftPoi,
    setMessage,
    setSelected,
    startCreatePoi,
    selectPoi,
    selectSegment,
    selectGeometry,
    savePoiDraft,
    saveSegmentList,
    saveGeometry,
  };
}
```

Create `src/components/AnnotationSidebar.tsx`:

```tsx
import type { Poi } from "../types/route";
import type { Segment, SelectedAnnotation } from "../types/annotation";

interface AnnotationSidebarProps {
  routeName?: string;
  routeDescription?: string;
  pois: Poi[];
  segments: Segment[];
  selected: SelectedAnnotation;
  onSelectPoi: (poiId: string) => void;
  onSelectSegment: (segmentId: string) => void;
  onSelectGeometry: () => void;
}

export function AnnotationSidebar({
  routeName,
  routeDescription,
  pois,
  segments,
  selected,
  onSelectPoi,
  onSelectSegment,
  onSelectGeometry,
}: AnnotationSidebarProps) {
  return (
    <aside className="editor-sidebar panel">
      <div className="editor-sidebar__route">
        <h2>{routeName ?? "路线加载中"}</h2>
        <p>{routeDescription ?? "正在读取路线基础信息。"}</p>
      </div>

      <div className="editor-sidebar__section">
        <div className="editor-sidebar__section-header">标注列表</div>
        {pois.map((poi) => (
          <button
            key={poi.id}
            className={selected.kind === "poi" && selected.id === poi.id ? "list-item is-active" : "list-item"}
            onClick={() => onSelectPoi(poi.id)}
            type="button"
          >
            <strong>{poi.name}</strong>
            <span>{poi.type}</span>
          </button>
        ))}
      </div>

      <div className="editor-sidebar__section">
        <div className="editor-sidebar__section-header">赛段</div>
        {segments.map((segment) => (
          <button
            key={segment.id}
            className={
              selected.kind === "segment" && selected.id === segment.id ? "list-item is-active" : "list-item"
            }
            onClick={() => onSelectSegment(segment.id)}
            type="button"
          >
            <strong>{segment.name}</strong>
            <span>{segment.type}</span>
          </button>
        ))}
      </div>

      <div className="editor-sidebar__section">
        <div className="editor-sidebar__section-header">Geometry</div>
        <button className={selected.kind === "geometry" ? "list-item is-active" : "list-item"} onClick={onSelectGeometry} type="button">
          <strong>编辑路线坐标</strong>
          <span>拖拽节点或右侧手动编辑</span>
        </button>
      </div>
    </aside>
  );
}
```

Create `src/components/PoiEditorPanel.tsx`:

```tsx
import type { DraftPoi, SelectedAnnotation } from "../types/annotation";
import type { Poi } from "../types/route";

interface PoiEditorPanelProps {
  selected: SelectedAnnotation;
  selectedPoi: Poi | null;
  draftPoi: DraftPoi | null;
  onChange: (value: DraftPoi) => void;
  onSave: (value: DraftPoi) => void;
}

export function PoiEditorPanel({ selected, selectedPoi, draftPoi, onChange, onSave }: PoiEditorPanelProps) {
  const value = draftPoi ?? (selectedPoi ? { ...selectedPoi } : null);

  if (!(selected.kind === "poi" || selected.kind === "new-poi") || !value) {
    return <div className="panel">点击地图新增补给点，或从左侧列表选择已有 POI。</div>;
  }

  return (
    <div className="panel form-panel">
      <h3>{value.isNew ? "新增补给点" : "编辑补给点"}</h3>
      <label>
        名称
        <input value={value.name} onChange={(e) => onChange({ ...value, name: e.target.value })} />
      </label>
      <label>
        类型
        <select value={value.type} onChange={(e) => onChange({ ...value, type: e.target.value as DraftPoi["type"] })}>
          <option value="supply">补给</option>
          <option value="coffee">咖啡</option>
          <option value="repair">修车</option>
          <option value="meetup">集合</option>
        </select>
      </label>
      <label>
        图标名
        <input value={value.iconName ?? ""} onChange={(e) => onChange({ ...value, iconName: e.target.value })} />
      </label>
      <label>
        距离文案
        <input value={value.distanceLabel ?? ""} onChange={(e) => onChange({ ...value, distanceLabel: e.target.value })} />
      </label>
      <label>
        描述
        <textarea value={value.description ?? ""} onChange={(e) => onChange({ ...value, description: e.target.value })} />
      </label>
      <label>
        备注 tone
        <input value={value.tone ?? ""} onChange={(e) => onChange({ ...value, tone: e.target.value })} />
      </label>
      <button onClick={() => onSave(value)} type="button">
        保存 POI
      </button>
      <button type="button" disabled>
        删除按钮（未启用）
      </button>
    </div>
  );
}
```

Create `src/components/SegmentEditorPanel.tsx`:

```tsx
import type { Segment, SelectedAnnotation } from "../types/annotation";

interface SegmentEditorPanelProps {
  selected: SelectedAnnotation;
  segments: Segment[];
  onSelect: (segmentId: string) => void;
  onChange: (segments: Segment[]) => void;
}

export function SegmentEditorPanel({ selected, segments, onSelect, onChange }: SegmentEditorPanelProps) {
  const selectedSegment =
    selected.kind === "segment" ? segments.find((segment) => segment.id === selected.id) ?? null : null;

  function upsertSegment(next: Segment) {
    const existing = segments.some((segment) => segment.id === next.id);
    onChange(existing ? segments.map((segment) => (segment.id === next.id ? next : segment)) : [...segments, next]);
  }

  return (
    <div className="panel form-panel">
      <h3>赛段管理</h3>
      <button
        type="button"
        onClick={() => {
          const next: Segment = {
            id: crypto.randomUUID(),
            routeId: segments[0]?.routeId ?? "",
            name: "新赛段",
            type: "tempo",
            effort: "",
            rank: "",
            best: "",
            pr: "",
            likes: 0,
            riders: 0,
            startIndex: 0,
            endIndex: 1,
          };
          upsertSegment(next);
          onSelect(next.id);
        }}
      >
        新增赛段
      </button>
      {selectedSegment ? (
        <>
          <label>
            名称
            <input value={selectedSegment.name} onChange={(e) => upsertSegment({ ...selectedSegment, name: e.target.value })} />
          </label>
          <label>
            类型
            <select value={selectedSegment.type} onChange={(e) => upsertSegment({ ...selectedSegment, type: e.target.value as Segment["type"] })}>
              <option value="climb">爬坡</option>
              <option value="flat">平路</option>
              <option value="tempo">节奏</option>
              <option value="sprint">冲刺</option>
            </select>
          </label>
          <label>
            effort
            <input value={selectedSegment.effort ?? ""} onChange={(e) => upsertSegment({ ...selectedSegment, effort: e.target.value })} />
          </label>
          <label>
            起点索引
            <input
              type="number"
              value={selectedSegment.startIndex ?? 0}
              onChange={(e) => upsertSegment({ ...selectedSegment, startIndex: Number(e.target.value) })}
            />
          </label>
          <label>
            终点索引
            <input
              type="number"
              value={selectedSegment.endIndex ?? 0}
              onChange={(e) => upsertSegment({ ...selectedSegment, endIndex: Number(e.target.value) })}
            />
          </label>
        </>
      ) : (
        <p>从左侧选择一个赛段，或先新建赛段。</p>
      )}
    </div>
  );
}
```

Create `src/components/GeometryEditorPanel.tsx`:

```tsx
import type { RouteGeometry } from "../types/route";

interface GeometryEditorPanelProps {
  geometry: RouteGeometry | null;
  onChange: (value: RouteGeometry) => void;
  onSave: (value: RouteGeometry) => void;
}

export function GeometryEditorPanel({ geometry, onChange, onSave }: GeometryEditorPanelProps) {
  if (!geometry) {
    return <div className="panel">当前没有 geometry 数据。</div>;
  }

  return (
    <div className="panel form-panel">
      <h3>Geometry</h3>
      <div className="geometry-list">
        {geometry.coordinates.map((point, index) => (
          <div key={`${point.lat}-${point.lng}-${index}`} className="geometry-row">
            <span>#{index}</span>
            <input
              value={point.lat}
              type="number"
              step="0.0001"
              onChange={(e) => {
                const next = structuredClone(geometry);
                next.coordinates[index].lat = Number(e.target.value);
                onChange(next);
              }}
            />
            <input
              value={point.lng}
              type="number"
              step="0.0001"
              onChange={(e) => {
                const next = structuredClone(geometry);
                next.coordinates[index].lng = Number(e.target.value);
                onChange(next);
              }}
            />
          </div>
        ))}
      </div>
      <button type="button" onClick={() => onSave(geometry)}>
        保存 Geometry
      </button>
    </div>
  );
}
```

Replace `src/pages/RouteEditorPage.tsx` with:

```tsx
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { AppShell } from "../components/AppShell";
import { AnnotationSidebar } from "../components/AnnotationSidebar";
import { GeometryEditorPanel } from "../components/GeometryEditorPanel";
import { PoiEditorPanel } from "../components/PoiEditorPanel";
import { SegmentEditorPanel } from "../components/SegmentEditorPanel";
import { StatusBanner } from "../components/StatusBanner";
import { useRouteEditorData } from "../hooks/useRouteEditorData";
import type { RouteGeometry } from "../types/route";

export function RouteEditorPage() {
  const { routeId = "" } = useParams();
  const editor = useRouteEditorData(routeId);
  const [geometryDraft, setGeometryDraft] = useState<RouteGeometry | null>(null);

  useEffect(() => {
    setGeometryDraft(editor.mapData?.geometry ?? null);
  }, [editor.mapData]);

  return (
    <AppShell title={editor.route?.name ?? "路线编辑器"} subtitle="左侧列表，中间地图，右侧属性编辑">
      <div className="editor-page">
        <div className="editor-page__status">
          <StatusBanner tone={editor.source === "api" ? "success" : "warning"}>
            {editor.source === "api" ? "Connected to API" : "Fallback mock mode"}
          </StatusBanner>
          {editor.message ? <StatusBanner tone="neutral">{editor.message}</StatusBanner> : null}
        </div>

        {editor.loading ? (
          <div className="panel">正在加载路线编辑器...</div>
        ) : (
          <div className="editor-layout">
            <AnnotationSidebar
              routeName={editor.route?.name}
              routeDescription={editor.route?.description}
              pois={editor.mapData?.pois ?? []}
              segments={editor.segments}
              selected={editor.selected}
              onSelectPoi={editor.selectPoi}
              onSelectSegment={editor.selectSegment}
              onSelectGeometry={editor.selectGeometry}
            />

            <div className="panel editor-map-placeholder">地图画布将在下个任务中接入 Leaflet。</div>

            <div className="editor-panel-stack">
              <PoiEditorPanel
                selected={editor.selected}
                selectedPoi={editor.selectedPoi}
                draftPoi={editor.draftPoi}
                onChange={editor.setDraftPoi}
                onSave={editor.savePoiDraft}
              />
              <SegmentEditorPanel
                selected={editor.selected}
                segments={editor.segments}
                onSelect={editor.selectSegment}
                onChange={editor.saveSegmentList}
              />
              <GeometryEditorPanel
                geometry={geometryDraft}
                onChange={setGeometryDraft}
                onSave={editor.saveGeometry}
              />
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
```

Append to `src/styles/index.css`:

```css
.editor-page__status {
  display: grid;
  gap: 12px;
  margin-bottom: 16px;
}

.editor-layout {
  display: grid;
  grid-template-columns: 320px minmax(520px, 1fr) 360px;
  gap: 16px;
  align-items: start;
}

.editor-sidebar {
  display: grid;
  gap: 16px;
}

.editor-sidebar__route h2 {
  margin: 0 0 6px;
}

.editor-sidebar__route p {
  margin: 0;
  color: var(--muted);
}

.editor-sidebar__section {
  display: grid;
  gap: 8px;
}

.editor-sidebar__section-header {
  font-size: 13px;
  font-weight: 700;
  color: var(--muted);
  text-transform: uppercase;
}

.list-item {
  width: 100%;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 12px;
  border: 1px solid var(--border);
  border-radius: 12px;
  background: var(--panel-muted);
  cursor: pointer;
}

.list-item.is-active {
  border-color: var(--primary);
  background: #edf4ff;
}

.editor-map-placeholder {
  min-height: 720px;
  display: grid;
  place-items: center;
  color: var(--muted);
}

.editor-panel-stack {
  display: grid;
  gap: 16px;
}

.form-panel {
  display: grid;
  gap: 10px;
}

.form-panel label {
  display: grid;
  gap: 6px;
  font-size: 14px;
}

.form-panel input,
.form-panel select,
.form-panel textarea {
  width: 100%;
  border: 1px solid var(--border);
  border-radius: 10px;
  padding: 10px 12px;
  background: #fff;
}

.geometry-list {
  display: grid;
  gap: 8px;
  max-height: 360px;
  overflow: auto;
}

.geometry-row {
  display: grid;
  grid-template-columns: 48px 1fr 1fr;
  gap: 8px;
  align-items: center;
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run:

```bash
cd /Users/a123/Desktop/map_designer
npm run test:run -- src/pages/__tests__/RouteEditorPage.test.tsx
```

Expected:

```text
✓ src/pages/__tests__/RouteEditorPage.test.tsx
```

- [ ] **Step 5: Commit**

Run:

```bash
cd /Users/a123/Desktop/map_designer
git add src/hooks src/components src/pages src/styles
git commit -m "feat: add route editor sidebar and forms"
```

### Task 6: Integrate Leaflet Map, POI Creation, Segment Highlighting, And Geometry Editing

**Files:**
- Create: `src/components/MapCanvas.tsx`
- Create: `src/lib/leaflet-icons.ts`
- Create: `src/lib/__tests__/map-state.test.ts`
- Modify: `src/pages/RouteEditorPage.tsx`
- Modify: `src/styles/index.css`

- [ ] **Step 1: Write the failing map-state test**

Create `src/lib/__tests__/map-state.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { getSegmentSlice } from "../segments";
import { geometryToLatLngTuples } from "../geometry";

describe("map state helpers", () => {
  it("creates polyline tuples for the full route and highlighted segment", () => {
    const geometry = {
      type: "LineString" as const,
      coordinates: [
        { lat: 37.87, lng: 112.54 },
        { lat: 37.88, lng: 112.55 },
        { lat: 37.89, lng: 112.56 },
      ],
    };

    expect(geometryToLatLngTuples(geometry)).toEqual([
      [37.87, 112.54],
      [37.88, 112.55],
      [37.89, 112.56],
    ]);
    expect(getSegmentSlice(geometry.coordinates, 1, 2)).toHaveLength(2);
  });
});
```

- [ ] **Step 2: Run the test to verify it passes before UI wiring**

Run:

```bash
cd /Users/a123/Desktop/map_designer
npm run test:run -- src/lib/__tests__/map-state.test.ts
```

Expected:

```text
✓ src/lib/__tests__/map-state.test.ts
```

- [ ] **Step 3: Implement the Leaflet map canvas and wire it into the editor**

Create `src/lib/leaflet-icons.ts`:

```ts
import L from "leaflet";
import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";

export const defaultLeafletIcon = L.icon({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

export const geometryHandleIcon = L.divIcon({
  className: "geometry-handle-icon",
  html: "<span></span>",
  iconSize: [16, 16],
  iconAnchor: [8, 8],
});
```

Create `src/components/MapCanvas.tsx`:

```tsx
import { useMemo } from "react";
import { MapContainer, Marker, Polyline, TileLayer, useMapEvents } from "react-leaflet";
import L from "leaflet";
import type { Segment, SelectedAnnotation } from "../types/annotation";
import type { Poi, RouteGeometry } from "../types/route";
import { buildFallbackView, geometryToLatLngTuples } from "../lib/geometry";
import { getSegmentSlice } from "../lib/segments";
import { defaultLeafletIcon, geometryHandleIcon } from "../lib/leaflet-icons";

L.Marker.prototype.options.icon = defaultLeafletIcon;

interface MapCanvasProps {
  geometry: RouteGeometry | null;
  pois: Poi[];
  segments: Segment[];
  selected: SelectedAnnotation;
  onMapClick: (lat: number, lng: number) => void;
  onPoiClick: (poiId: string) => void;
  onSegmentClick: (segmentId: string) => void;
  onGeometryChange: (geometry: RouteGeometry) => void;
}

function ClickCapture({ onMapClick }: { onMapClick: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(event) {
      onMapClick(event.latlng.lat, event.latlng.lng);
    },
  });

  return null;
}

export function MapCanvas({
  geometry,
  pois,
  segments,
  selected,
  onMapClick,
  onPoiClick,
  onSegmentClick,
  onGeometryChange,
}: MapCanvasProps) {
  const points = geometry?.coordinates ?? [];
  const tuples = geometry ? geometryToLatLngTuples(geometry) : [];
  const fallback = buildFallbackView(points);

  const highlightedSegment = useMemo(() => {
    if (selected.kind !== "segment") return [];
    const segment = segments.find((item) => item.id === selected.id);
    if (!segment || !geometry) return [];
    return getSegmentSlice(geometry.coordinates, segment.startIndex, segment.endIndex).map((point) => [
      point.lat,
      point.lng,
    ]) as [number, number][];
  }, [geometry, segments, selected]);

  return (
    <div className="map-canvas panel">
      <MapContainer center={fallback.center} zoom={fallback.zoom} className="map-canvas__map">
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <ClickCapture onMapClick={onMapClick} />
        {tuples.length > 1 ? <Polyline positions={tuples} pathOptions={{ color: "#1f6feb", weight: 5 }} /> : null}
        {highlightedSegment.length > 1 ? (
          <Polyline positions={highlightedSegment} pathOptions={{ color: "#f76707", weight: 7 }} eventHandlers={{
            click: () => {
              if (selected.kind === "segment") onSegmentClick(selected.id);
            },
          }} />
        ) : null}
        {pois.map((poi) => (
          <Marker
            key={poi.id}
            position={[poi.lat, poi.lng]}
            eventHandlers={{ click: () => onPoiClick(poi.id) }}
          />
        ))}
        {selected.kind === "geometry"
          ? points.map((point, index) => (
              <Marker
                key={`${point.lat}-${point.lng}-${index}`}
                position={[point.lat, point.lng]}
                draggable
                icon={geometryHandleIcon}
                eventHandlers={{
                  dragend: (event) => {
                    const next = structuredClone(geometry);
                    if (!next) return;
                    const latlng = event.target.getLatLng();
                    next.coordinates[index].lat = latlng.lat;
                    next.coordinates[index].lng = latlng.lng;
                    onGeometryChange(next);
                  },
                  click: () => {
                    const next = structuredClone(geometry);
                    if (!next) return;
                    next.coordinates.splice(index + 1, 0, {
                      lat: point.lat + 0.002,
                      lng: point.lng + 0.002,
                      distanceKm: point.distanceKm,
                    });
                    onGeometryChange(next);
                  },
                }}
              ></Marker>
            ))
          : null}
      </MapContainer>
      <div className="map-canvas__hint">
        点击地图可新增 POI；切换到 Geometry 后可拖拽节点改线，也可点击节点在其后插入新点，再用右侧面板继续调整坐标。
      </div>
    </div>
  );
}
```

Replace the center column in `src/pages/RouteEditorPage.tsx`:

```tsx
import { MapCanvas } from "../components/MapCanvas";
```

And replace:

```tsx
<div className="panel editor-map-placeholder">地图画布将在下个任务中接入 Leaflet。</div>
```

With:

```tsx
<MapCanvas
  geometry={geometryDraft}
  pois={editor.mapData?.pois ?? []}
  segments={editor.segments}
  selected={editor.selected}
  onMapClick={editor.startCreatePoi}
  onPoiClick={editor.selectPoi}
  onSegmentClick={editor.selectSegment}
  onGeometryChange={setGeometryDraft}
/>
```

Append to `src/styles/index.css`:

```css
.map-canvas {
  padding: 0;
  overflow: hidden;
}

.map-canvas__map {
  height: 720px;
  width: 100%;
}

.map-canvas__hint {
  padding: 10px 14px;
  border-top: 1px solid var(--border);
  font-size: 13px;
  color: var(--muted);
  background: #fafbfd;
}

.geometry-handle-icon {
  display: grid;
  place-items: center;
}

.geometry-handle-icon span {
  width: 16px;
  height: 16px;
  display: block;
  border-radius: 999px;
  background: #c03221;
  border: 2px solid #fff;
  box-shadow: 0 2px 6px rgba(23, 33, 43, 0.25);
}
```

- [ ] **Step 4: Run focused tests and the production build**

Run:

```bash
cd /Users/a123/Desktop/map_designer
npm run test:run -- src/lib/__tests__/map-state.test.ts src/pages/__tests__/RouteEditorPage.test.tsx
npm run build
```

Expected:

```text
✓ src/lib/__tests__/map-state.test.ts
✓ src/pages/__tests__/RouteEditorPage.test.tsx
vite v<version> building for production...
✓ built in <time>
```

- [ ] **Step 5: Commit**

Run:

```bash
cd /Users/a123/Desktop/map_designer
git add src/components/MapCanvas.tsx src/lib/leaflet-icons.ts src/pages/RouteEditorPage.tsx src/styles/index.css
git commit -m "feat: add leaflet map editing canvas"
```

### Task 7: Polish Geometry Controls, README, And Final Verification

**Files:**
- Create: `README.md`
- Modify: `src/components/GeometryEditorPanel.tsx`
- Modify: `src/components/SegmentEditorPanel.tsx`
- Modify: `src/pages/RouteEditorPage.tsx`
- Modify: `src/styles/index.css`

- [ ] **Step 1: Improve geometry controls for insert and delete actions**

Update `src/components/GeometryEditorPanel.tsx` to support insert and delete buttons per row:

```tsx
import type { RouteGeometry } from "../types/route";

interface GeometryEditorPanelProps {
  geometry: RouteGeometry | null;
  onChange: (value: RouteGeometry) => void;
  onSave: (value: RouteGeometry) => void;
}

export function GeometryEditorPanel({ geometry, onChange, onSave }: GeometryEditorPanelProps) {
  if (!geometry) {
    return <div className="panel">当前没有 geometry 数据。</div>;
  }

  return (
    <div className="panel form-panel">
      <h3>Geometry</h3>
      <div className="geometry-list">
        {geometry.coordinates.map((point, index) => (
          <div key={`${point.lat}-${point.lng}-${index}`} className="geometry-row geometry-row--wide">
            <span>#{index}</span>
            <input
              value={point.lat}
              type="number"
              step="0.0001"
              onChange={(e) => {
                const next = structuredClone(geometry);
                next.coordinates[index].lat = Number(e.target.value);
                onChange(next);
              }}
            />
            <input
              value={point.lng}
              type="number"
              step="0.0001"
              onChange={(e) => {
                const next = structuredClone(geometry);
                next.coordinates[index].lng = Number(e.target.value);
                onChange(next);
              }}
            />
            <button
              type="button"
              onClick={() => {
                const next = structuredClone(geometry);
                next.coordinates.splice(index + 1, 0, {
                  lat: point.lat + 0.002,
                  lng: point.lng + 0.002,
                  distanceKm: point.distanceKm,
                });
                onChange(next);
              }}
            >
              插入
            </button>
            <button
              type="button"
              disabled={geometry.coordinates.length <= 2}
              onClick={() => {
                const next = structuredClone(geometry);
                next.coordinates.splice(index, 1);
                onChange(next);
              }}
            >
              删除
            </button>
          </div>
        ))}
      </div>
      <button type="button" onClick={() => onSave(geometry)}>
        保存 Geometry
      </button>
    </div>
  );
}
```

- [ ] **Step 2: Add route editor save-state polish and segment metadata fields**

Update the selected segment editing portion in `src/components/SegmentEditorPanel.tsx`:

```tsx
          <label>
            rank
            <input value={selectedSegment.rank ?? ""} onChange={(e) => upsertSegment({ ...selectedSegment, rank: e.target.value })} />
          </label>
          <label>
            best
            <input value={selectedSegment.best ?? ""} onChange={(e) => upsertSegment({ ...selectedSegment, best: e.target.value })} />
          </label>
          <label>
            pr
            <input value={selectedSegment.pr ?? ""} onChange={(e) => upsertSegment({ ...selectedSegment, pr: e.target.value })} />
          </label>
          <label>
            likes
            <input
              type="number"
              value={selectedSegment.likes ?? 0}
              onChange={(e) => upsertSegment({ ...selectedSegment, likes: Number(e.target.value) })}
            />
          </label>
          <label>
            riders
            <input
              type="number"
              value={selectedSegment.riders ?? 0}
              onChange={(e) => upsertSegment({ ...selectedSegment, riders: Number(e.target.value) })}
            />
          </label>
```

Update the `AppShell` usage in `src/pages/RouteEditorPage.tsx` to expose save state:

```tsx
    <AppShell
      title={editor.route?.name ?? "路线编辑器"}
      subtitle="左侧列表，中间地图，右侧属性编辑"
      actions={<div className="toolbar-chip">{editor.saving ? "Saving..." : "Ready"}</div>}
    >
```

Append to `src/styles/index.css`:

```css
.toolbar-chip {
  padding: 10px 14px;
  border-radius: 999px;
  background: #17212b;
  color: #fff;
  font-size: 13px;
  font-weight: 700;
}

.geometry-row--wide {
  grid-template-columns: 48px 1fr 1fr auto auto;
}
```

- [ ] **Step 3: Write the README with startup, API, mock, and Shanxi scope notes**

Create `README.md`:

```md
# 骑行路线地图标注后台 MVP

一个供内部编辑和运营使用的骑行路线地图标注工具，支持路线列表、POI 标注、赛段维护、geometry 编辑，以及 API 失败后的自动 mock fallback。

## 启动方式

```bash
npm install
npm run dev
```

默认开发地址：

```text
http://localhost:5173
```

## 环境变量

创建 `.env.local`：

```bash
VITE_API_BASE_URL=http://localhost:3000
```

如果不提供或后端不可用，前端会自动使用 mock fallback。

## 当前真实接口

- `GET /api/v1/routes`
- `GET /api/v1/routes/{route_id}`
- `GET /api/v1/routes/{route_id}/map-data`
- `PATCH /api/v1/routes/{route_id}/geometry`
- `POST /api/v1/routes/{route_id}/pois`
- `PATCH /api/v1/routes/{route_id}/pois/{poi_id}`

## 当前 mock / fallback

- 路线列表：请求失败后回退到 `src/mock/routes.ts`
- 路线地图数据：请求失败后回退到 `src/mock/map-data.ts`
- 赛段：当前为 `localStorage` mock，代码位于 `src/api/segments.ts`
- Geometry 保存：后端失败时写回 mock 数据

## 关于山西 `.osm.pbf`

项目参考文件：

- `/Users/a123/Downloads/shanxi-260331.osm.pbf`

当前 MVP 不在前端解析该文件。它仅用于界定项目区域范围和未来离线地图扩展方向。当前底图仍然使用在线 OpenStreetMap 瓦片。

## 已知限制

- POI 删除按钮当前为未启用状态
- 赛段没有真实后端接口
- Geometry 编辑为 MVP 级别，不包含撤销重做和复杂吸附
```

- [ ] **Step 4: Run the full verification suite**

Run:

```bash
cd /Users/a123/Desktop/map_designer
npm run test:run
npm run build
```

Expected:

```text
✓ all tests passed
vite v<version> building for production...
✓ built in <time>
```

- [ ] **Step 5: Commit**

Run:

```bash
cd /Users/a123/Desktop/map_designer
git add README.md src/components src/pages src/styles
git commit -m "docs: finalize admin tool mvp workflow"
```
