import express from "express";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createStore } from "./db.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DEFAULT_DB_PATH = path.resolve(__dirname, "../data/map-designer.sqlite");

export function createApp({ dbPath = DEFAULT_DB_PATH } = {}) {
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
    if (!geometry || !Array.isArray(geometry.coordinates)) {
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

  app.post("/api/v1/routes/:routeId/pois", (request, response) => {
    const route = store.getRoute(request.params.routeId);
    if (!route) {
      response.status(404).json({ message: "Route not found" });
      return;
    }

    const { name, lat, lng } = request.body ?? {};
    if (!name || typeof lat !== "number" || typeof lng !== "number") {
      response.status(400).json({ message: "Invalid poi payload" });
      return;
    }

    const poi = store.createPoi(request.params.routeId, request.body);
    response.status(201).json(poi);
  });

  app.patch("/api/v1/routes/:routeId/pois/:poiId", (request, response) => {
    const poi = store.updatePoi(request.params.routeId, request.params.poiId, request.body ?? {});
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
