import express from "express";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createStore } from "./db.js";
import { isValidDraftPayload } from "./services/draft-store.js";
import { MAX_SNAP_WAYPOINTS, isValidRouteGeometry, snapGeometry } from "./services/snap-geometry.js";

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

function isValidSnapPoints(points) {
  return (
    Array.isArray(points) &&
    points.length >= 2 &&
    points.length <= MAX_SNAP_WAYPOINTS &&
    points.every(
      (point) =>
        point &&
        typeof point === "object" &&
        !Array.isArray(point) &&
        isValidLatitude(point.lat) &&
        isValidLongitude(point.lng),
    )
  );
}

export function createApp({ dbPath = DEFAULT_DB_PATH, fetchImpl = globalThis.fetch } = {}) {
  const app = express();
  const store = createStore({ dbPath });

  app.use(express.json());

  app.get("/api/health", (_request, response) => {
    response.json({ ok: true });
  });

  app.get("/api/v1/draft", (_request, response) => {
    response.json(store.getDraft());
  });

  app.put("/api/v1/draft", (request, response) => {
    const payload = request.body ?? {};
    if (!isValidDraftPayload(payload)) {
      response.status(400).json({ message: "Invalid draft payload" });
      return;
    }

    response.json(store.saveDraft(payload));
  });

  app.get("/api/v1/draft/export", (_request, response) => {
    const payload = store.buildDraftExport();
    response.setHeader("Content-Type", "application/json; charset=utf-8");
    response.setHeader("Content-Disposition", 'attachment; filename="map-annotation-draft.json"');
    response.send(JSON.stringify(payload, null, 2));
  });

  app.post("/api/v1/snap-path", async (request, response) => {
    const points = request.body?.points;
    if (!isValidSnapPoints(points)) {
      response.status(400).json({
        message: `Invalid points payload. Must provide 2-${MAX_SNAP_WAYPOINTS} coordinates.`,
      });
      return;
    }

    const geometry = {
      type: "LineString",
      coordinates: points.map((point) => ({
        lat: point.lat,
        lng: point.lng,
      })),
    };

    if (!isValidRouteGeometry(geometry)) {
      response.status(400).json({
        message: "Invalid points payload.",
      });
      return;
    }

    try {
      const result = await snapGeometry({ geometry, fetchImpl });
      response.json({
        points: result.geometry.coordinates.map((point) => ({
          lat: point.lat,
          lng: point.lng,
        })),
      });
    } catch (error) {
      console.info("[snap-path] failed", {
        error: error instanceof Error ? error.message : String(error),
      });
      response.status(502).json({ message: "Failed to snap path" });
    }
  });

  return app;
}
