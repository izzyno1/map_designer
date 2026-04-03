# Single Draft Map Annotation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Convert the app from route-centric editing into a single-draft map annotator where users create independent POIs and segment polylines, save the only current draft, and export JSON.

**Architecture:** Keep the existing React + Express structure but replace route-scoped data flow with a single draft resource. Backend exposes `GET/PUT /api/v1/draft` and `GET /api/v1/draft/export`; frontend replaces route list/editor with a draft entry page and a draft editor page using map interaction modes for POI creation and segment drawing.

**Tech Stack:** React, Vite, TypeScript, Express, SQLite (`better-sqlite3`), Vitest, Testing Library, Supertest

---

### Task 1: Add Single-Draft Backend Storage And APIs

**Files:**
- Create: `server/services/draft-store.js`
- Modify: `server/db.js`
- Modify: `server/app.js`
- Test: `server/__tests__/app.test.js`

- [ ] **Step 1: Write failing backend tests for draft APIs**

Add tests in `server/__tests__/app.test.js` for:

```js
it("returns default draft from GET /api/v1/draft", async () => {
  const app = createApp({ dbPath: createTempDbPath() });
  const response = await request(app).get("/api/v1/draft");
  expect(response.status).toBe(200);
  expect(response.body).toMatchObject({
    viewport: { center: { lat: expect.any(Number), lng: expect.any(Number) }, zoom: expect.any(Number) },
    pois: [],
    segments: [],
  });
});

it("saves draft by PUT /api/v1/draft", async () => {
  const app = createApp({ dbPath: createTempDbPath() });
  const payload = {
    viewport: { center: { lat: 37.87, lng: 112.55 }, zoom: 12 },
    pois: [{ id: "p1", name: "补给点", remark: "补水", lat: 37.86, lng: 112.54 }],
    segments: [{ id: "s1", name: "赛段A", remark: "测试", points: [{ lat: 37.87, lng: 112.55 }, { lat: 37.88, lng: 112.57 }] }],
  };
  const response = await request(app).put("/api/v1/draft").send(payload);
  expect(response.status).toBe(200);
  expect(response.body).toEqual(payload);
});

it("exports draft as json file", async () => {
  const app = createApp({ dbPath: createTempDbPath() });
  const response = await request(app).get("/api/v1/draft/export");
  expect(response.status).toBe(200);
  expect(response.headers["content-type"]).toContain("application/json");
});
```

- [ ] **Step 2: Run backend tests and confirm failures**

Run:

```bash
cd /Users/a123/Desktop/map_designer
npm run test:run -- server/__tests__/app.test.js
```

Expected: FAIL because `/api/v1/draft` endpoints do not exist.

- [ ] **Step 3: Implement draft persistence in SQLite store**

Add single-draft helpers in `server/db.js`:

```js
db.exec(`
  CREATE TABLE IF NOT EXISTS draft_state (
    id INTEGER PRIMARY KEY CHECK (id = 1),
    payload_json TEXT NOT NULL
  );
`);
```

Expose methods:

```js
getDraft();
saveDraft(payload);
buildDraftExport();
```

Use a default payload:

```js
{
  viewport: { center: { lat: 37.87, lng: 112.55 }, zoom: 10 },
  pois: [],
  segments: [],
}
```

- [ ] **Step 4: Add API validation and route handlers**

In `server/app.js`, add:

```js
app.get("/api/v1/draft", (_req, res) => res.json(store.getDraft()));

app.put("/api/v1/draft", (req, res) => {
  if (!isValidDraftPayload(req.body)) {
    res.status(400).json({ message: "Invalid draft payload" });
    return;
  }
  res.json(store.saveDraft(req.body));
});

app.get("/api/v1/draft/export", (_req, res) => {
  const payload = store.buildDraftExport();
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Content-Disposition", 'attachment; filename="map-annotation-draft.json"');
  res.send(JSON.stringify(payload, null, 2));
});
```

- [ ] **Step 5: Re-run backend tests and confirm pass**

Run:

```bash
cd /Users/a123/Desktop/map_designer
npm run test:run -- server/__tests__/app.test.js
```

Expected: PASS for all backend tests, including new draft API coverage.

- [ ] **Step 6: Commit backend draft API changes**

```bash
cd /Users/a123/Desktop/map_designer
git add server/db.js server/app.js server/__tests__/app.test.js server/services/draft-store.js
git commit -m "feat: add single-draft annotation backend api"
```

### Task 2: Replace Route-Centric Frontend Types And API Layer

**Files:**
- Create: `src/types/draft.ts`
- Create: `src/api/draft.ts`
- Modify: `src/types/annotation.ts`
- Test: `src/api/__tests__/draft.test.ts`

- [ ] **Step 1: Write failing API layer tests**

Create `src/api/__tests__/draft.test.ts`:

```ts
it("loads draft from /api/v1/draft", async () => {
  global.fetch = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ pois: [], segments: [], viewport: { center: { lat: 0, lng: 0 }, zoom: 3 } }) }) as never;
  const result = await getDraft();
  expect(result.data.pois).toEqual([]);
});
```

Also test `saveDraft` and `downloadDraftExport`.

- [ ] **Step 2: Run API tests and confirm failure**

```bash
cd /Users/a123/Desktop/map_designer
npm run test:run -- src/api/__tests__/draft.test.ts
```

Expected: FAIL because `src/api/draft.ts` does not exist.

- [ ] **Step 3: Add draft types and API methods**

Create `src/types/draft.ts`:

```ts
export type DraftViewport = { center: { lat: number; lng: number }; zoom: number };
export type DraftPoi = { id: string; name: string; remark?: string; lat: number; lng: number };
export type DraftSegment = { id: string; name: string; remark?: string; points: Array<{ lat: number; lng: number }> };
export type AnnotationDraft = { viewport: DraftViewport; pois: DraftPoi[]; segments: DraftSegment[] };
```

Create `src/api/draft.ts`:

```ts
export async function getDraft(): Promise<ApiResult<AnnotationDraft>> { /* GET /api/v1/draft */ }
export async function saveDraft(payload: AnnotationDraft): Promise<ApiResult<AnnotationDraft>> { /* PUT /api/v1/draft */ }
export async function downloadDraftExport(filename = "map-annotation-draft"): Promise<void> { /* GET /api/v1/draft/export */ }
```

- [ ] **Step 4: Update shared annotation types to remove route coupling**

In `src/types/annotation.ts`, remove `routeId`, `startIndex`, `endIndex`, and route geometry selection kinds.

- [ ] **Step 5: Re-run tests and confirm pass**

```bash
cd /Users/a123/Desktop/map_designer
npm run test:run -- src/api/__tests__/draft.test.ts src/api/__tests__/routes.test.ts
```

Expected: new draft API tests PASS; old route API tests either removed or updated.

- [ ] **Step 6: Commit type/API refactor**

```bash
cd /Users/a123/Desktop/map_designer
git add src/types/draft.ts src/api/draft.ts src/types/annotation.ts src/api/__tests__/draft.test.ts
git commit -m "refactor: add draft api and independent annotation types"
```

### Task 3: Replace Route List With Single Draft Entry + Draft Page Routing

**Files:**
- Create: `src/pages/DraftEntryPage.tsx`
- Create: `src/pages/DraftEditorPage.tsx`
- Create: `src/hooks/useDraftAnnotationData.ts`
- Modify: `src/app/router.tsx`
- Modify: `src/pages/__tests__/RouteListPage.test.tsx`
- Create: `src/pages/__tests__/DraftEntryPage.test.tsx`
- Create: `src/pages/__tests__/DraftEditorPage.test.tsx`

- [ ] **Step 1: Write failing route/page tests**

Add tests asserting:

```ts
expect(router).toMatchRoute("/", "DraftEntryPage");
expect(router).toMatchRoute("/draft", "DraftEditorPage");
```

Add UI test for entry button text `新建标注` and click navigation to `/draft`.

- [ ] **Step 2: Run page tests and confirm failures**

```bash
cd /Users/a123/Desktop/map_designer
npm run test:run -- src/pages/__tests__/DraftEntryPage.test.tsx src/pages/__tests__/DraftEditorPage.test.tsx
```

Expected: FAIL because page/hook files do not exist and router still points to route pages.

- [ ] **Step 3: Implement entry page and router migration**

Create `DraftEntryPage` with one clear CTA and concise subtitle.

Update `src/app/router.tsx`:

```tsx
{ index: true, element: <DraftEntryPage /> },
{ path: "draft", element: <DraftEditorPage /> },
{ path: "routes/:routeId", element: <Navigate to="/draft" replace /> },
```

- [ ] **Step 4: Implement draft hook and editor shell**

Create `useDraftAnnotationData.ts` for:

```ts
loadDraft()
saveCurrentDraft()
exportDraft()
selectPoi()
selectSegment()
startCreatePoiMode()
startSegmentDrawMode()
```

Render three-column shell in `DraftEditorPage`.

- [ ] **Step 5: Re-run page tests and confirm pass**

```bash
cd /Users/a123/Desktop/map_designer
npm run test:run -- src/pages/__tests__/DraftEntryPage.test.tsx src/pages/__tests__/DraftEditorPage.test.tsx
```

Expected: PASS for new navigation and baseline editor render.

- [ ] **Step 6: Commit routing/page migration**

```bash
cd /Users/a123/Desktop/map_designer
git add src/pages/DraftEntryPage.tsx src/pages/DraftEditorPage.tsx src/hooks/useDraftAnnotationData.ts src/app/router.tsx src/pages/__tests__/DraftEntryPage.test.tsx src/pages/__tests__/DraftEditorPage.test.tsx
git commit -m "feat: switch app entry to single draft annotation flow"
```

### Task 4: Implement Independent POI + Segment Drawing Interactions

**Files:**
- Modify: `src/components/MapCanvas.tsx`
- Modify: `src/components/AnnotationSidebar.tsx`
- Modify: `src/components/PoiEditorPanel.tsx`
- Modify: `src/components/SegmentEditorPanel.tsx`
- Modify: `src/pages/DraftEditorPage.tsx`
- Modify: `src/styles/index.css`
- Test: `src/components/__tests__/PoiEditorPanel.test.tsx`
- Test: `src/components/__tests__/SegmentEditorPanel.test.tsx`
- Test: `src/pages/__tests__/DraftEditorPage.test.tsx`

- [ ] **Step 1: Add failing tests for draw/finish/delete flows**

Add tests for:

```ts
it("creates poi from map click while poi mode is active");
it("creates segment after clicking multiple points and finishing draw mode");
it("deletes selected poi");
it("deletes selected segment");
```

- [ ] **Step 2: Run component/page tests and confirm failures**

```bash
cd /Users/a123/Desktop/map_designer
npm run test:run -- src/components/__tests__/PoiEditorPanel.test.tsx src/components/__tests__/SegmentEditorPanel.test.tsx src/pages/__tests__/DraftEditorPage.test.tsx
```

Expected: FAIL due to missing mode state and delete behaviors.

- [ ] **Step 3: Add map interaction modes**

In `DraftEditorPage` + `MapCanvas`:

```ts
type InteractionMode = "browse" | "create-poi" | "draw-segment";
```

Implement behavior:

- map click in `create-poi` => create one POI + select + switch to `browse`
- map click in `draw-segment` => append point to in-progress segment path
- `完成赛段` button finalizes only when point count >= 2

- [ ] **Step 4: Update panels/sidebar for independent entities**

`AnnotationSidebar` shows only POI and segment lists.

`PoiEditorPanel` fields:
- `name`
- read-only coordinates
- `remark`
- delete action

`SegmentEditorPanel` fields:
- `name`
- `remark`
- read-only point count
- delete action

- [ ] **Step 5: Re-run interaction tests and confirm pass**

```bash
cd /Users/a123/Desktop/map_designer
npm run test:run -- src/components/__tests__/PoiEditorPanel.test.tsx src/components/__tests__/SegmentEditorPanel.test.tsx src/pages/__tests__/DraftEditorPage.test.tsx
```

Expected: PASS for create/select/edit/delete + segment draw completion rules.

- [ ] **Step 6: Commit interaction migration**

```bash
cd /Users/a123/Desktop/map_designer
git add src/components/MapCanvas.tsx src/components/AnnotationSidebar.tsx src/components/PoiEditorPanel.tsx src/components/SegmentEditorPanel.tsx src/pages/DraftEditorPage.tsx src/styles/index.css
git commit -m "feat: implement independent poi and segment drawing interactions"
```

### Task 5: Remove Route-Specific UI/Docs Paths And Run Full Verification

**Files:**
- Modify: `src/pages/RouteEditorPage.tsx`
- Modify: `src/pages/RouteListPage.tsx`
- Modify: `src/hooks/useRouteEditorData.ts`
- Modify: `src/api/routes.ts`
- Modify: `README.md`
- Test: `src/App.test.tsx`

- [ ] **Step 1: Write failing cleanup tests**

Update tests to assert:

- App no longer shows route list cards by default
- Legacy `/routes/:routeId` redirects to `/draft`
- Draft-first language appears in homepage and README snippets used in tests

- [ ] **Step 2: Run affected tests and confirm failures**

```bash
cd /Users/a123/Desktop/map_designer
npm run test:run -- src/App.test.tsx src/pages/__tests__/RouteListPage.test.tsx src/pages/__tests__/RouteEditorPage.test.tsx
```

Expected: FAIL while legacy pages are still active.

- [ ] **Step 3: Remove or convert legacy route artifacts**

Convert legacy route pages/hooks to wrappers or remove usages from router and imports.

Update `README.md` sections:

- start flow: homepage -> `新建标注`
- data model: single draft + independent POI/segments
- backend API: `/api/v1/draft*`

- [ ] **Step 4: Run full verification**

```bash
cd /Users/a123/Desktop/map_designer
npm run test:run
npm run build
```

Expected: all tests PASS, production build PASS.

- [ ] **Step 5: Commit final cleanup**

```bash
cd /Users/a123/Desktop/map_designer
git add src README.md
git commit -m "refactor: finalize single draft map annotation experience"
```

### Task 6: Smoke Test Local Runtime Before Handoff

**Files:**
- Modify: none
- Test: runtime only

- [ ] **Step 1: Start API and frontend in local dev mode**

```bash
cd /Users/a123/Desktop/map_designer
PORT=3000 DB_PATH=/tmp/map-designer-single-draft.sqlite npm run start:api
```

In another terminal:

```bash
cd /Users/a123/Desktop/map_designer
npm run dev -- --host 127.0.0.1 --port 5173
```

- [ ] **Step 2: Verify the core user journey**

1. Open `http://127.0.0.1:5173`
2. Click `新建标注`
3. Click `新增标注点` then place one point
4. Click `新增赛段`, place 2+ points, click `完成赛段`
5. Edit names/remarks, click `保存标注`
6. Click `导出 JSON` and confirm file download

- [ ] **Step 3: Record verification notes for handoff**

Document:

- passed flows
- any limitations (e.g. no segment point editing in panel)
- exact commands used

- [ ] **Step 4: Commit verification notes if docs were updated**

```bash
cd /Users/a123/Desktop/map_designer
git add README.md
git commit -m "docs: add single draft smoke test notes"
```
