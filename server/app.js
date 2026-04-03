import express from "express";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createStore } from "./db.js";
import { isValidRouteGeometry, isValidSnapGeometry, snapGeometry } from "./services/snap-geometry.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DEFAULT_DB_PATH = path.resolve(__dirname, "../data/map-designer.sqlite");

function isFiniteNumber(value) {
  return typeof value === "number" && Number.isFinite(value);
}

function isValidLatitude(value) {
  return isFiniteNumber(value) && value >= -90 && value <= 90;
}

function isValidLongitude(value) {
  return isFiniteNumber(value) && value >= -180 && value <= 180;
}

function isNonEmptyString(value) {
  return typeof value === "string" && value.trim().length > 0;
}

function isValidPoiCoordinates(payload) {
  return isValidLatitude(payload.lat) && isValidLongitude(payload.lng);
}

function isValidPoiUpdate(payload) {
  if (payload.name !== undefined && !isNonEmptyString(payload.name)) {
    return false;
  }

  if (payload.lat !== undefined && !isValidLatitude(payload.lat)) {
    return false;
  }

  if (payload.lng !== undefined && !isValidLongitude(payload.lng)) {
    return false;
  }

  return true;
}

export function createApp({ dbPath = DEFAULT_DB_PATH, fetchImpl = globalThis.fetch } = {}) {
  const app = express();
  const store = createStore({ dbPath });

  app.use(express.json());

  app.get("/api/health", (_request, response) => {
    response.json({ ok: true });
  });

  app.get("/api/v1/routes", (_request, response) => {
    response.json(store.listRoutes());
  });

  app.get("/api/v1/routes/:routeId", (request, response) => {
    const route = store.getRoute(request.params.routeId);
    if (!route) {
      response.status(404).json({ message: "Route not found" });
      return;
    }

    response.json(route);
  });

  app.get("/api/v1/routes/:routeId/map-data", (request, response) => {
    const mapData = store.getMapData(request.params.routeId);
    if (!mapData) {
      response.status(404).json({ message: "Route map data not found" });
      return;
    }

    response.json(mapData);
  });

  app.patch("/api/v1/routes/:routeId/geometry", (request, response) => {
    const { geometry } = request.body ?? {};
    if (!isValidRouteGeometry(geometry)) {
      response.status(400).json({ message: "Invalid geometry payload" });
      return;
    }

    const route = store.updateRouteGeometry(request.params.routeId, geometry);
    if (!route) {
      response.status(404).json({ message: "Route not found" });
      return;
    }

    response.json(route);
  });

  app.post("/api/v1/routes/:routeId/snap-geometry", async (request, response) => {
    const route = store.getRoute(request.params.routeId);
    if (!route) {
      response.status(404).json({ message: "Route not found" });
      return;
    }

    const { geometry } = request.body ?? {};
    if (!isValidSnapGeometry(geometry)) {
      response.status(400).json({ message: "Invalid geometry payload" });
      return;
    }

    try {
      const result = await snapGeometry({ geometry, fetchImpl });
      response.json(result);
    } catch (error) {
      console.info("[snap-geometry] failed", {
        routeId: request.params.routeId,
        error: error instanceof Error ? error.message : String(error),
      });
      response.status(502).json({ message: "Failed to snap route geometry" });
    }
  });

  app.post("/api/v1/routes/:routeId/pois", (request, response) => {
    const route = store.getRoute(request.params.routeId);
    if (!route) {
      response.status(404).json({ message: "Route not found" });
      return;
    }

    const { name, lat, lng } = request.body ?? {};
    if (!isNonEmptyString(name) || !isValidPoiCoordinates({ lat, lng })) {
      response.status(400).json({ message: "Invalid poi payload" });
      return;
    }

    const poi = store.createPoi(request.params.routeId, request.body);
    response.status(201).json(poi);
  });

  app.patch("/api/v1/routes/:routeId/pois/:poiId", (request, response) => {
    const payload = request.body ?? {};
    if (!isValidPoiUpdate(payload)) {
      response.status(400).json({ message: "Invalid poi payload" });
      return;
    }

    const poi = store.updatePoi(request.params.routeId, request.params.poiId, payload);
    if (!poi) {
      response.status(404).json({ message: "Poi not found" });
      return;
    }

    response.json(poi);
  });

  app.get("/api/v1/routes/:routeId/segments", (request, response) => {
    const route = store.getRoute(request.params.routeId);
    if (!route) {
      response.status(404).json({ message: "Route not found" });
      return;
    }

    response.json(store.getSegments(request.params.routeId));
  });

  app.put("/api/v1/routes/:routeId/segments", (request, response) => {
    const route = store.getRoute(request.params.routeId);
    if (!route) {
      response.status(404).json({ message: "Route not found" });
      return;
    }

    const segments = Array.isArray(request.body?.segments) ? request.body.segments : [];
    response.json(store.replaceSegments(request.params.routeId, segments));
  });

  app.get("/api/v1/routes/:routeId/export", (request, response) => {
    const payload = store.buildExport(request.params.routeId);
    if (!payload) {
      response.status(404).json({ message: "Route not found" });
      return;
    }

    const filename = `${payload.route.id}.json`;
    response.setHeader("Content-Type", "application/json; charset=utf-8");
    response.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    response.send(JSON.stringify(payload, null, 2));
  });

  return app;
}
