// @vitest-environment node

import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import request from "supertest";
import { afterEach, describe, expect, it } from "vitest";

import { createApp } from "../app.js";

const tempDirs = [];

function createTempDbPath() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "map-designer-server-"));
  tempDirs.push(dir);
  return path.join(dir, "app.db");
}

afterEach(() => {
  while (tempDirs.length) {
    fs.rmSync(tempDirs.pop(), { recursive: true, force: true });
  }
});

describe("route annotation api", () => {
  it("returns seeded route list and route map data", async () => {
    const app = createApp({ dbPath: createTempDbPath() });

    const routesResponse = await request(app).get("/api/v1/routes");
    expect(routesResponse.status).toBe(200);
    expect(routesResponse.body.length).toBeGreaterThan(0);
    expect(routesResponse.body[0]).toMatchObject({
      id: "sx-taiyuan-river-loop",
      name: "太原汾河晨骑环线",
    });

    const mapDataResponse = await request(app).get("/api/v1/routes/sx-taiyuan-river-loop/map-data");
    expect(mapDataResponse.status).toBe(200);
    expect(mapDataResponse.body).toMatchObject({
      routeId: "sx-taiyuan-river-loop",
    });
    expect(mapDataResponse.body.pois.length).toBeGreaterThan(0);
  });

  it("persists poi segment and geometry changes, then exports custom json", async () => {
    const app = createApp({ dbPath: createTempDbPath() });

    const poiResponse = await request(app)
      .post("/api/v1/routes/sx-taiyuan-river-loop/pois")
      .send({
        name: "桥下集合点",
        type: "supply",
        description: "方便临时集合",
        lat: 37.88,
        lng: 112.57,
      });

    expect(poiResponse.status).toBe(201);
    expect(poiResponse.body).toMatchObject({
      name: "桥下集合点",
      description: "方便临时集合",
      lat: 37.88,
      lng: 112.57,
    });

    const segmentsResponse = await request(app)
      .put("/api/v1/routes/sx-taiyuan-river-loop/segments")
      .send({
        segments: [
          {
            id: "segment-export-1",
            routeId: "sx-taiyuan-river-loop",
            name: "导出测试赛段",
            type: "tempo",
            startIndex: 1,
            endIndex: 3,
            effort: "保持稳定节奏",
            rank: "",
            best: "",
            pr: "",
            likes: 0,
            riders: 0,
          },
        ],
      });

    expect(segmentsResponse.status).toBe(200);
    expect(segmentsResponse.body).toHaveLength(1);

    const geometryResponse = await request(app)
      .patch("/api/v1/routes/sx-taiyuan-river-loop/geometry")
      .send({
        geometry: {
          type: "LineString",
          coordinates: [
            { lat: 37.87, lng: 112.56, distanceKm: 0 },
            { lat: 37.875, lng: 112.565, distanceKm: 1.2 },
          ],
        },
      });

    expect(geometryResponse.status).toBe(200);
    expect(geometryResponse.body.geometry.coordinates).toHaveLength(2);

    const exportResponse = await request(app).get("/api/v1/routes/sx-taiyuan-river-loop/export");
    expect(exportResponse.status).toBe(200);
    expect(exportResponse.headers["content-type"]).toContain("application/json");
    expect(exportResponse.headers["content-disposition"]).toContain("attachment");
    expect(exportResponse.body).toMatchObject({
      route: {
        id: "sx-taiyuan-river-loop",
        name: "太原汾河晨骑环线",
        geometry: {
          type: "LineString",
          coordinates: [
            { lat: 37.87, lng: 112.56, distanceKm: 0 },
            { lat: 37.875, lng: 112.565, distanceKm: 1.2 },
          ],
        },
      },
      pois: expect.arrayContaining([
        expect.objectContaining({
          name: "桥下集合点",
          remark: "方便临时集合",
        }),
      ]),
      segments: [
        expect.objectContaining({
          id: "segment-export-1",
          name: "导出测试赛段",
          remark: "保持稳定节奏",
          startIndex: 1,
          endIndex: 3,
        }),
      ],
      meta: expect.objectContaining({
        version: 1,
      }),
    });
  });
});
