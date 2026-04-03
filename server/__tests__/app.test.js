// @vitest-environment node

import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import request from "supertest";
import { afterEach, describe, expect, it, vi } from "vitest";

import { createApp } from "../app.js";
import { MAX_SNAP_WAYPOINTS } from "../services/snap-geometry.js";

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

  it("rejects invalid geometry updates with 400", async () => {
    const app = createApp({ dbPath: createTempDbPath() });

    const response = await request(app)
      .patch("/api/v1/routes/sx-taiyuan-river-loop/geometry")
      .send({
        geometry: {
          type: "LineString",
          coordinates: [
            { lat: 37.87, lng: 112.56, distanceKm: 0 },
            { lat: "bad", lng: 112.565, distanceKm: 1.2 },
          ],
        },
      });

    expect(response.status).toBe(400);
    expect(response.body).toMatchObject({
      message: "Invalid geometry payload",
    });
  });

  it("allows long geometry updates to be saved", async () => {
    const app = createApp({ dbPath: createTempDbPath() });
    const coordinates = Array.from({ length: MAX_SNAP_WAYPOINTS + 1 }, (_, index) => ({
      lat: 37.87 + index * 0.001,
      lng: 112.56 + index * 0.001,
      distanceKm: index,
    }));

    const response = await request(app)
      .patch("/api/v1/routes/sx-taiyuan-river-loop/geometry")
      .send({
        geometry: {
          type: "LineString",
          coordinates,
        },
      });

    expect(response.status).toBe(200);
    expect(response.body.geometry.coordinates).toHaveLength(MAX_SNAP_WAYPOINTS + 1);
  });

  it("rejects invalid poi name updates with 400", async () => {
    const app = createApp({ dbPath: createTempDbPath() });

    const response = await request(app)
      .patch("/api/v1/routes/sx-taiyuan-river-loop/pois/poi-1")
      .send({
        name: "",
      });

    expect(response.status).toBe(400);
    expect(response.body).toMatchObject({
      message: "Invalid poi payload",
    });
  });

  it("rejects invalid poi creates with 400", async () => {
    const app = createApp({ dbPath: createTempDbPath() });

    const response = await request(app)
      .post("/api/v1/routes/sx-taiyuan-river-loop/pois")
      .send({
        name: "   ",
        lat: 91,
        lng: 112.57,
      });

    expect(response.status).toBe(400);
    expect(response.body).toMatchObject({
      message: "Invalid poi payload",
    });
  });

  it("rejects invalid poi coordinate updates with 400", async () => {
    const app = createApp({ dbPath: createTempDbPath() });

    const response = await request(app)
      .patch("/api/v1/routes/sx-taiyuan-river-loop/pois/poi-1")
      .send({
        lat: 91,
        lng: 112.55,
      });

    expect(response.status).toBe(400);
    expect(response.body).toMatchObject({
      message: "Invalid poi payload",
    });
  });
});

describe("route snap geometry api", () => {
  function createFetchResponse(body, { ok = true, status = 200 } = {}) {
    return {
      ok,
      status,
      json: async () => body,
    };
  }

  function createValidGeometry() {
    return {
      type: "LineString",
      coordinates: [
        { lat: 37.8737, lng: 112.5621, distanceKm: 0 },
        { lat: 37.8676, lng: 112.5484, distanceKm: 8.1 },
      ],
    };
  }

  function createValidSnapPoint(index = 0) {
    return {
      lat: 37.8737 + index * 0.001,
      lng: 112.5621 + index * 0.001,
      distanceKm: index,
    };
  }

  it("snaps route geometry and returns updated geometry", async () => {
    const fetchImpl = async () =>
      createFetchResponse({
        routes: [
          {
            geometry: {
              type: "LineString",
              coordinates: [
                [112.5624, 37.8735],
                [112.5581, 37.8711],
                [112.5481, 37.8672],
              ],
            },
          },
        ],
      });
    const app = createApp({ dbPath: createTempDbPath(), fetchImpl });

    const response = await request(app)
      .post("/api/v1/routes/sx-taiyuan-river-loop/snap-geometry")
      .send({
        geometry: createValidGeometry(),
      });

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({
      geometry: {
        type: "LineString",
        coordinates: [
          { lat: 37.8735, lng: 112.5624, distanceKm: 0 },
          expect.objectContaining({
            lat: 37.8711,
            lng: 112.5581,
            distanceKm: expect.any(Number),
          }),
          expect.objectContaining({
            lat: 37.8672,
            lng: 112.5481,
            distanceKm: expect.any(Number),
          }),
        ],
      },
    });
    expect(response.body.geometry.coordinates[0].distanceKm).toBe(0);
    expect(response.body.geometry.coordinates[2].distanceKm).toBeGreaterThan(
      response.body.geometry.coordinates[1].distanceKm,
    );
  });

  it("rejects invalid geometry payloads with 400", async () => {
    let fetchCalls = 0;
    const fetchImpl = async () =>
      {
        fetchCalls += 1;
        return createFetchResponse({
          routes: [
            {
              geometry: {
                type: "LineString",
                coordinates: [
                  [112.5624, 37.8735],
                  [112.5581, 37.8711],
                ],
              },
            },
          ],
        });
      };
    const app = createApp({ dbPath: createTempDbPath(), fetchImpl });

    const response = await request(app)
      .post("/api/v1/routes/sx-taiyuan-river-loop/snap-geometry")
      .send({
        geometry: {
          type: "LineString",
          coordinates: [
            { lat: 37.8737, lng: 112.5621, distanceKm: 0 },
            { lat: "bad", lng: 112.5484, distanceKm: 8.1 },
          ],
        },
      });

    expect(response.status).toBe(400);
    expect(response.body).toMatchObject({
      message: "Invalid geometry payload",
    });
    expect(fetchCalls).toBe(0);
  });

  it("returns 502 when the upstream geometry structure is invalid", async () => {
    const logSpy = vi.spyOn(console, "info").mockImplementation(() => {});
    const fetchImpl = async () =>
      createFetchResponse({
        routes: [
          {
            geometry: {
              type: "LineString",
              coordinates: [
                [112.5624, 37.8735],
                [112.5581, "bad"],
              ],
            },
          },
        ],
      });
    const app = createApp({ dbPath: createTempDbPath(), fetchImpl });

    const response = await request(app)
      .post("/api/v1/routes/sx-taiyuan-river-loop/snap-geometry")
      .send({
        geometry: createValidGeometry(),
      });

    expect(response.status).toBe(502);
    expect(response.body).toMatchObject({
      message: "Failed to snap route geometry",
    });
    expect(logSpy).toHaveBeenCalled();
    logSpy.mockRestore();
  });

  it("uses OSRM_BASE_URL when building the upstream request", async () => {
    const previousBaseUrl = process.env.OSRM_BASE_URL;
    const fetchCalls = [];
    process.env.OSRM_BASE_URL = "https://osrm.internal.example";

    try {
      const fetchImpl = async (url) => {
        fetchCalls.push(url);
        return createFetchResponse({
          routes: [
            {
              geometry: {
                type: "LineString",
                coordinates: [
                  [112.5624, 37.8735],
                  [112.5581, 37.8711],
                ],
              },
            },
          ],
        });
      };
      const app = createApp({ dbPath: createTempDbPath(), fetchImpl });

      const response = await request(app)
        .post("/api/v1/routes/sx-taiyuan-river-loop/snap-geometry")
        .send({
          geometry: createValidGeometry(),
        });

      expect(response.status).toBe(200);
      expect(fetchCalls).toHaveLength(1);
      expect(fetchCalls[0]).toBe(
        "https://osrm.internal.example/route/v1/bike/112.5621,37.8737;112.5484,37.8676?overview=full&geometries=geojson",
      );
    } finally {
      if (previousBaseUrl === undefined) {
        delete process.env.OSRM_BASE_URL;
      } else {
        process.env.OSRM_BASE_URL = previousBaseUrl;
      }
    }
  });

  it("rejects out-of-range snap geometry coordinates with 400", async () => {
    let fetchCalls = 0;
    const fetchImpl = async () => {
      fetchCalls += 1;
      return createFetchResponse({
        routes: [
          {
            geometry: {
              type: "LineString",
              coordinates: [
                [112.5624, 37.8735],
                [112.5581, 37.8711],
              ],
            },
          },
        ],
      });
    };
    const app = createApp({ dbPath: createTempDbPath(), fetchImpl });

    const response = await request(app)
      .post("/api/v1/routes/sx-taiyuan-river-loop/snap-geometry")
      .send({
        geometry: {
          type: "LineString",
          coordinates: [
            { lat: 37.8737, lng: 112.5621, distanceKm: 0 },
            { lat: 91, lng: 112.5484, distanceKm: 8.1 },
          ],
        },
      });

    expect(response.status).toBe(400);
    expect(response.body).toMatchObject({
      message: "Invalid geometry payload",
    });
    expect(fetchCalls).toBe(0);
  });

  it("rejects snap geometry requests above the waypoint limit with 400", async () => {
    let fetchCalls = 0;
    const fetchImpl = async () => {
      fetchCalls += 1;
      return createFetchResponse({
        routes: [
          {
            geometry: {
              type: "LineString",
              coordinates: [
                [112.5624, 37.8735],
                [112.5581, 37.8711],
              ],
            },
          },
        ],
      });
    };
    const app = createApp({ dbPath: createTempDbPath(), fetchImpl });

    const response = await request(app)
      .post("/api/v1/routes/sx-taiyuan-river-loop/snap-geometry")
      .send({
        geometry: {
          type: "LineString",
          coordinates: Array.from({ length: MAX_SNAP_WAYPOINTS + 1 }, (_, index) =>
            createValidSnapPoint(index),
          ),
        },
      });

    expect(response.status).toBe(400);
    expect(response.body).toMatchObject({
      message: "Invalid geometry payload",
    });
    expect(fetchCalls).toBe(0);
  });
});
