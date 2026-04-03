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

describe("single draft api", () => {
  it("returns default draft payload", async () => {
    const app = createApp({ dbPath: createTempDbPath() });

    const response = await request(app).get("/api/v1/draft");
    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({
      viewport: {
        center: {
          lat: expect.any(Number),
          lng: expect.any(Number),
        },
        zoom: expect.any(Number),
      },
      pois: [],
      segments: [],
    });
  });

  it("saves and reloads draft payload", async () => {
    const app = createApp({ dbPath: createTempDbPath() });
    const payload = {
      viewport: {
        center: {
          lat: 37.87,
          lng: 112.55,
        },
        zoom: 12,
      },
      pois: [
        {
          id: "poi-a",
          name: "补给点 A",
          remark: "桥边补水",
          lat: 37.86,
          lng: 112.54,
        },
      ],
      segments: [
        {
          id: "segment-a",
          name: "赛段 A",
          remark: "节奏段",
          points: [
            { lat: 37.87, lng: 112.55 },
            { lat: 37.88, lng: 112.57 },
          ],
        },
      ],
    };

    const saveResponse = await request(app).put("/api/v1/draft").send(payload);
    expect(saveResponse.status).toBe(200);
    expect(saveResponse.body).toEqual(payload);

    const loadResponse = await request(app).get("/api/v1/draft");
    expect(loadResponse.status).toBe(200);
    expect(loadResponse.body).toEqual(payload);
  });

  it("rejects invalid draft payload", async () => {
    const app = createApp({ dbPath: createTempDbPath() });

    const response = await request(app).put("/api/v1/draft").send({
      viewport: { center: { lat: 37.87, lng: 112.55 }, zoom: 12 },
      pois: [{ id: "poi-a", name: "", lat: 37.86, lng: 112.54 }],
      segments: [],
    });

    expect(response.status).toBe(400);
    expect(response.body).toMatchObject({
      message: "Invalid draft payload",
    });
  });

  it("exports draft json payload", async () => {
    const app = createApp({ dbPath: createTempDbPath() });

    const response = await request(app).get("/api/v1/draft/export");
    expect(response.status).toBe(200);
    expect(response.headers["content-type"]).toContain("application/json");
    expect(response.headers["content-disposition"]).toContain("attachment");
    expect(response.body).toMatchObject({
      viewport: {
        center: {
          lat: expect.any(Number),
          lng: expect.any(Number),
        },
        zoom: expect.any(Number),
      },
      pois: expect.any(Array),
      segments: expect.any(Array),
    });
  });
});

describe("snap path api", () => {
  it("snaps multi-point path and returns road-aligned points", async () => {
    const fetchImpl = async () => ({
      ok: true,
      json: async () => ({
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
      }),
    });

    const app = createApp({ dbPath: createTempDbPath(), fetchImpl });

    const response = await request(app).post("/api/v1/snap-path").send({
      points: [
        { lat: 37.8737, lng: 112.5621 },
        { lat: 37.8676, lng: 112.5484 },
      ],
    });

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      points: [
        { lat: 37.8735, lng: 112.5624 },
        { lat: 37.8711, lng: 112.5581 },
        { lat: 37.8672, lng: 112.5481 },
      ],
    });
  });

  it("rejects invalid snap points payload", async () => {
    const app = createApp({ dbPath: createTempDbPath() });

    const response = await request(app).post("/api/v1/snap-path").send({
      points: [{ lat: 37.8737, lng: 112.5621 }],
    });

    expect(response.status).toBe(400);
    expect(response.body.message).toContain("Invalid points payload");
  });

  it("returns 502 when upstream snap fails", async () => {
    const fetchImpl = async () => ({
      ok: false,
      status: 503,
      json: async () => ({}),
    });
    const app = createApp({ dbPath: createTempDbPath(), fetchImpl });

    const response = await request(app).post("/api/v1/snap-path").send({
      points: [
        { lat: 37.8737, lng: 112.5621 },
        { lat: 37.8676, lng: 112.5484 },
      ],
    });

    expect(response.status).toBe(502);
    expect(response.body).toMatchObject({
      message: "Failed to snap path",
    });
  });
});
