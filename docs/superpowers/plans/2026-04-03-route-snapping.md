# Route Snapping Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a one-click route snapping flow that sends the current route geometry to a backend OSRM proxy, previews the snapped geometry in the editor, and lets operators save it only after review.

**Architecture:** Add a focused backend snapping service that converts the existing `RouteGeometry` into an OSRM `bike` route request, validates the response, and returns a normalized geometry with recomputed `distanceKm`. On the frontend, keep snapping separate from persistence: the editor asks the backend for a snapped draft, updates only local geometry draft state, and reuses the existing geometry save flow for database writes.

**Tech Stack:** React, Vite, TypeScript, Express, native Fetch API, Vitest, Testing Library, Supertest

---

### Task 1: Add The Backend Snapping Service

**Files:**
- Create: `server/services/snap-geometry.js`
- Modify: `server/app.js`
- Test: `server/__tests__/app.test.js`

- [ ] **Step 1: Write the failing backend API tests**

Update `server/__tests__/app.test.js` to cover three behaviors:

```js
it("snaps geometry through the upstream routing service", async () => {
  const fetchMock = vi.fn().mockResolvedValue({
    ok: true,
    json: async () => ({
      routes: [
        {
          geometry: {
            coordinates: [
              [112.56, 37.87],
              [112.561, 37.871],
              [112.562, 37.872],
            ],
          },
        },
      ],
    }),
  });
  const app = createApp({ dbPath: createTempDbPath(), fetchImpl: fetchMock });

  const response = await request(app)
    .post("/api/v1/routes/sx-taiyuan-river-loop/snap-geometry")
    .send({
      geometry: {
        type: "LineString",
        coordinates: [
          { lat: 37.87, lng: 112.56, distanceKm: 0 },
          { lat: 37.88, lng: 112.57, distanceKm: 1.2 },
        ],
      },
    });

  expect(response.status).toBe(200);
  expect(response.body.geometry.coordinates.length).toBe(3);
  expect(fetchMock).toHaveBeenCalledTimes(1);
});

it("rejects snap requests with fewer than two points", async () => {
  const app = createApp({ dbPath: createTempDbPath(), fetchImpl: vi.fn() });

  const response = await request(app)
    .post("/api/v1/routes/sx-taiyuan-river-loop/snap-geometry")
    .send({
      geometry: {
        type: "LineString",
        coordinates: [{ lat: 37.87, lng: 112.56, distanceKm: 0 }],
      },
    });

  expect(response.status).toBe(400);
});

it("returns 502 when upstream snapping fails", async () => {
  const app = createApp({
    dbPath: createTempDbPath(),
    fetchImpl: vi.fn().mockResolvedValue({ ok: false, status: 500 }),
  });

  const response = await request(app)
    .post("/api/v1/routes/sx-taiyuan-river-loop/snap-geometry")
    .send({
      geometry: {
        type: "LineString",
        coordinates: [
          { lat: 37.87, lng: 112.56, distanceKm: 0 },
          { lat: 37.88, lng: 112.57, distanceKm: 1.2 },
        ],
      },
    });

  expect(response.status).toBe(502);
});
```

- [ ] **Step 2: Run the backend tests to verify they fail**

Run:

```bash
cd /Users/a123/Desktop/map_designer
npm run test:run -- server/__tests__/app.test.js
```

Expected: FAIL because `createApp` does not yet accept `fetchImpl`, and `/snap-geometry` does not exist.

- [ ] **Step 3: Implement the snapping service**

Create `server/services/snap-geometry.js` with a focused helper:

```js
const DEFAULT_OSRM_BASE_URL = process.env.OSRM_BASE_URL ?? "https://router.project-osrm.org";

function haversineKm(a, b) {
  const toRad = (value) => (value * Math.PI) / 180;
  const earthRadiusKm = 6371;
  const latDelta = toRad(b.lat - a.lat);
  const lngDelta = toRad(b.lng - a.lng);
  const startLat = toRad(a.lat);
  const endLat = toRad(b.lat);

  const inner =
    Math.sin(latDelta / 2) ** 2 +
    Math.cos(startLat) * Math.cos(endLat) * Math.sin(lngDelta / 2) ** 2;

  return 2 * earthRadiusKm * Math.asin(Math.sqrt(inner));
}

function withDistanceKm(points) {
  let total = 0;
  return points.map((point, index) => {
    if (index > 0) total += haversineKm(points[index - 1], point);
    return {
      ...point,
      distanceKm: Number(total.toFixed(3)),
    };
  });
}

export async function snapGeometry(geometry, { fetchImpl = fetch, osrmBaseUrl = DEFAULT_OSRM_BASE_URL } = {}) {
  if (!geometry || geometry.type !== "LineString" || geometry.coordinates.length < 2) {
    throw new Error("INVALID_GEOMETRY");
  }

  const coordinates = geometry.coordinates.map((point) => `${point.lng},${point.lat}`).join(";");
  const url = `${osrmBaseUrl}/route/v1/bike/${coordinates}?overview=full&geometries=geojson`;
  const response = await fetchImpl(url);

  if (!response.ok) {
    throw new Error("UPSTREAM_FAILED");
  }

  const payload = await response.json();
  const snappedCoordinates = payload?.routes?.[0]?.geometry?.coordinates;
  if (!Array.isArray(snappedCoordinates) || snappedCoordinates.length < 2) {
    throw new Error("INVALID_UPSTREAM_RESPONSE");
  }

  return {
    type: "LineString",
    coordinates: withDistanceKm(
      snappedCoordinates.map(([lng, lat]) => ({ lat, lng })),
    ),
  };
}
```

- [ ] **Step 4: Wire the new route into the Express app**

Update `server/app.js` so `createApp` accepts `fetchImpl`, then add the new route:

```js
import { snapGeometry } from "./services/snap-geometry.js";

export function createApp({ dbPath = DEFAULT_DB_PATH, fetchImpl = fetch } = {}) {
  const app = express();
  const store = createStore({ dbPath });

  app.post("/api/v1/routes/:routeId/snap-geometry", async (request, response) => {
    const route = store.getRoute(request.params.routeId);
    if (!route) {
      response.status(404).json({ message: "Route not found" });
      return;
    }

    try {
      const geometry = await snapGeometry(request.body?.geometry, { fetchImpl });
      response.json({ geometry });
    } catch (error) {
      if (error instanceof Error && error.message === "INVALID_GEOMETRY") {
        response.status(400).json({ message: "Invalid geometry payload" });
        return;
      }

      response.status(502).json({ message: "Snap service unavailable" });
    }
  });

  return app;
}
```

- [ ] **Step 5: Run the backend tests to verify they pass**

Run:

```bash
cd /Users/a123/Desktop/map_designer
npm run test:run -- server/__tests__/app.test.js
```

Expected: PASS with all backend API tests green.

- [ ] **Step 6: Commit**

Run:

```bash
cd /Users/a123/Desktop/map_designer
git add server/app.js server/services/snap-geometry.js server/__tests__/app.test.js
git commit -m "feat: add backend route snapping service"
```

### Task 2: Add Frontend Snapping API, State, And Buttons

**Files:**
- Modify: `src/api/routes.ts`
- Modify: `src/hooks/useRouteEditorData.ts`
- Modify: `src/pages/RouteEditorPage.tsx`
- Modify: `src/components/GeometryEditorPanel.tsx`
- Modify: `src/styles/index.css`
- Test: `src/pages/__tests__/RouteEditorPage.test.tsx`
- Test: `src/hooks/__tests__/useRouteEditorData.test.tsx`

- [ ] **Step 1: Write the failing frontend tests**

Add a page-level test in `src/pages/__tests__/RouteEditorPage.test.tsx` that expects both buttons:

```tsx
it("renders snap buttons in toolbar and geometry panel", () => {
  vi.spyOn(routeEditorHook, "useRouteEditorData").mockReturnValue({
    route: { id: "route-1", name: "测试路线", geometry: { type: "LineString", coordinates: [{ lat: 1, lng: 2 }, { lat: 3, lng: 4 }] } },
    mapData: { routeId: "route-1", geometry: { type: "LineString", coordinates: [{ lat: 1, lng: 2 }, { lat: 3, lng: 4 }] }, pois: [] },
    segments: [],
    selected: { kind: "none" },
    selectedPoi: null,
    selectedSegment: null,
    draftPoi: null,
    source: "api",
    loading: false,
    saving: false,
    snapping: false,
    message: null,
    snapGeometryDraft: vi.fn(),
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
  } as never);

  render(...);

  expect(screen.getAllByRole("button", { name: "一键贴路" })).toHaveLength(2);
});
```

Add a hook-level test in `src/hooks/__tests__/useRouteEditorData.test.tsx`:

```tsx
it("updates geometry draft after a successful snap", async () => {
  vi.spyOn(routeApi, "getRouteDetail").mockResolvedValue(buildRouteDetail("route-a", geometry));
  vi.spyOn(routeApi, "getRouteMapData").mockResolvedValue(buildMapData("route-a", geometry, []));
  vi.spyOn(segmentApi, "getSegments").mockResolvedValue({ source: "mock", data: [] });
  vi.spyOn(routeApi, "snapRouteGeometry").mockResolvedValue({
    source: "api",
    data: {
      geometry: {
        type: "LineString",
        coordinates: [
          { lat: 11, lng: 21, distanceKm: 0 },
          { lat: 12, lng: 22, distanceKm: 1.1 },
        ],
      },
    },
  });

  const { result } = renderHook(() => useRouteEditorData("route-a"));
  await waitFor(() => expect(result.current.loading).toBe(false));

  await act(async () => {
    await result.current.snapGeometryDraft(geometry);
  });

  expect(result.current.message).toBe("已生成道路贴合结果，请确认后保存");
});
```

- [ ] **Step 2: Run the frontend tests to verify they fail**

Run:

```bash
cd /Users/a123/Desktop/map_designer
npm run test:run -- src/pages/__tests__/RouteEditorPage.test.tsx src/hooks/__tests__/useRouteEditorData.test.tsx
```

Expected: FAIL because `snapRouteGeometry`, `snapping`, and `snapGeometryDraft` do not exist yet.

- [ ] **Step 3: Add the frontend snapping API**

Update `src/api/routes.ts`:

```ts
export async function snapRouteGeometry(
  routeId: string,
  geometry: RouteMapDataResponse["geometry"],
): Promise<ApiResult<{ geometry: RouteMapDataResponse["geometry"] }>> {
  const data = await requestJson<{ geometry: RouteMapDataResponse["geometry"] }>(
    `/api/v1/routes/${routeId}/snap-geometry`,
    {
      method: "POST",
      body: JSON.stringify({ geometry }),
    },
  );

  return { data, source: "api" };
}
```

- [ ] **Step 4: Add snapping state to the editor hook**

Update `src/hooks/useRouteEditorData.ts` to track the in-flight request and message handling:

```ts
const [snapping, setSnapping] = useState(false);

async function snapGeometryDraft(geometry: RouteGeometry) {
  if (!routeId || geometry.coordinates.length < 2) {
    setMessage("至少需要两个坐标点");
    return null;
  }

  setSnapping(true);
  try {
    const result = await snapRouteGeometry(routeId, geometry);
    setMessage("已生成道路贴合结果，请确认后保存");
    return result.data.geometry;
  } catch {
    setMessage("道路贴合失败，请稍后重试");
    return null;
  } finally {
    setSnapping(false);
  }
}

return {
  ...,
  snapping,
  snapGeometryDraft,
};
```

- [ ] **Step 5: Wire the buttons into the page and geometry panel**

Update `src/pages/RouteEditorPage.tsx` so the toolbar gets a new button and uses the current draft:

```tsx
async function handleSnapGeometry() {
  if (!geometryDraft || geometryDraft.coordinates.length < 2) {
    editor.setMessage("至少需要两个坐标点");
    return;
  }

  const snapped = await editor.snapGeometryDraft(geometryDraft);
  if (snapped) {
    updateGeometryDraft(snapped);
  }
}

<button
  type="button"
  className="toolbar-button"
  onClick={() => void handleSnapGeometry()}
  disabled={!geometryDraft || editor.loading || editor.snapping || geometryDraft.coordinates.length < 2}
>
  {editor.snapping ? "贴路中..." : "一键贴路"}
</button>
```

Update `src/components/GeometryEditorPanel.tsx`:

```tsx
interface GeometryEditorPanelProps {
  geometry: RouteGeometry | null;
  snapping: boolean;
  onSnap: (geometry: RouteGeometry) => void;
  onChange: (next: RouteGeometry) => void;
  onSave: (geometry: RouteGeometry) => void;
}

<button
  type="button"
  onClick={() => onSnap(geometry)}
  disabled={snapping || geometry.coordinates.length < 2}
>
  {snapping ? "贴路中..." : "一键贴路"}
</button>
```

Add any minimal CSS in `src/styles/index.css` needed to keep the toolbar/buttons readable.

- [ ] **Step 6: Run the frontend tests to verify they pass**

Run:

```bash
cd /Users/a123/Desktop/map_designer
npm run test:run -- src/pages/__tests__/RouteEditorPage.test.tsx src/hooks/__tests__/useRouteEditorData.test.tsx
```

Expected: PASS with the new snapping state and button behavior covered.

- [ ] **Step 7: Commit**

Run:

```bash
cd /Users/a123/Desktop/map_designer
git add src/api/routes.ts src/hooks/useRouteEditorData.ts src/pages/RouteEditorPage.tsx src/components/GeometryEditorPanel.tsx src/styles/index.css src/pages/__tests__/RouteEditorPage.test.tsx src/hooks/__tests__/useRouteEditorData.test.tsx
git commit -m "feat: add route snapping controls"
```

### Task 3: Finish Verification And Documentation

**Files:**
- Modify: `README.md`
- Test: `server/__tests__/app.test.js`
- Test: `src/pages/__tests__/RouteEditorPage.test.tsx`
- Test: `src/hooks/__tests__/useRouteEditorData.test.tsx`

- [ ] **Step 1: Update the README for snapping**

Add a short section to `README.md` documenting:

```md
## 一键贴路

- 前端通过 `POST /api/v1/routes/:routeId/snap-geometry` 请求道路贴合
- 后端默认调用在线 OSRM 服务
- 可通过 `OSRM_BASE_URL` 覆盖上游地址
- 贴路结果只更新当前页面草稿，仍需点击“保存路线坐标”才会写库
```

- [ ] **Step 2: Run the full test suite**

Run:

```bash
cd /Users/a123/Desktop/map_designer
npm run test:run
```

Expected: PASS with all existing and new tests green.

- [ ] **Step 3: Run the production build**

Run:

```bash
cd /Users/a123/Desktop/map_designer
npm run build
```

Expected:

```text
vite v<version> building client environment for production...
✓ built in <time>
```

- [ ] **Step 4: Smoke-test the backend endpoint locally**

Run the API in one terminal:

```bash
cd /Users/a123/Desktop/map_designer
PORT=3000 npm run start:api
```

Then in another terminal:

```bash
curl -X POST http://127.0.0.1:3000/api/v1/routes/sx-taiyuan-river-loop/snap-geometry \
  -H 'Content-Type: application/json' \
  -d '{
    "geometry": {
      "type": "LineString",
      "coordinates": [
        { "lat": 37.87, "lng": 112.56, "distanceKm": 0 },
        { "lat": 37.88, "lng": 112.57, "distanceKm": 1.2 }
      ]
    }
  }'
```

Expected: a JSON response with a longer `coordinates` array than the input and recalculated `distanceKm`.

- [ ] **Step 5: Commit**

Run:

```bash
cd /Users/a123/Desktop/map_designer
git add README.md
git commit -m "docs: document route snapping flow"
```

## Self-Review

- Spec coverage:
  - backend `/snap-geometry` endpoint: Task 1
  - OSRM proxy module and `OSRM_BASE_URL`: Task 1 and Task 3
  - toolbar + geometry panel entry points: Task 2
  - draft-only preview and explicit save: Task 2
  - 400/404/502 handling and no mock snapping fallback: Task 1 and Task 2
  - tests for success and failure paths: Tasks 1 and 2
- Placeholder scan:
  - No `TODO`, `TBD`, or implied “handle later” steps remain
- Type consistency:
  - route snapping response shape is consistently `{ geometry }`
  - hook additions are consistently named `snapping` and `snapGeometryDraft`
