import fs from "node:fs";
import path from "node:path";
import Database from "better-sqlite3";
import { randomUUID } from "node:crypto";
import { seedPois, seedRoutes, seedSegments } from "./seed.js";

function ensureDir(filePath) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
}

function parseJson(value, fallback) {
  if (!value) return fallback;
  return JSON.parse(value);
}

function toRouteSummary(row) {
  return {
    id: row.id,
    name: row.name,
    distanceKm: row.distance_km ?? undefined,
    updatedAt: row.updated_at ?? undefined,
    status: row.status ?? undefined,
  };
}

function toRouteDetail(row) {
  return {
    ...toRouteSummary(row),
    description: row.description ?? undefined,
    geometry: parseJson(row.geometry_json, { type: "LineString", coordinates: [] }),
  };
}

function toPoi(row) {
  return {
    id: row.id,
    name: row.name,
    type: row.type ?? "supply",
    iconName: row.icon_name ?? undefined,
    distanceLabel: row.distance_label ?? undefined,
    description: row.description ?? undefined,
    tone: row.tone ?? undefined,
    lat: row.lat,
    lng: row.lng,
  };
}

function toSegment(row) {
  return {
    id: row.id,
    routeId: row.route_id,
    name: row.name,
    type: row.type ?? "tempo",
    effort: row.effort ?? undefined,
    rank: row.rank ?? undefined,
    best: row.best ?? undefined,
    pr: row.pr ?? undefined,
    likes: row.likes ?? undefined,
    riders: row.riders ?? undefined,
    startIndex: row.start_index ?? undefined,
    endIndex: row.end_index ?? undefined,
  };
}

function lastDistanceKm(geometry) {
  const lastPoint = geometry.coordinates.at(-1);
  return lastPoint?.distanceKm ?? 0;
}

export function createStore({ dbPath }) {
  ensureDir(dbPath);

  const db = new Database(dbPath);
  db.pragma("journal_mode = WAL");
  db.exec(`
    CREATE TABLE IF NOT EXISTS routes (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT,
      distance_km REAL,
      updated_at TEXT,
      status TEXT,
      geometry_json TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS pois (
      id TEXT PRIMARY KEY,
      route_id TEXT NOT NULL,
      name TEXT NOT NULL,
      type TEXT,
      icon_name TEXT,
      distance_label TEXT,
      description TEXT,
      tone TEXT,
      lat REAL NOT NULL,
      lng REAL NOT NULL,
      FOREIGN KEY (route_id) REFERENCES routes(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS segments (
      id TEXT PRIMARY KEY,
      route_id TEXT NOT NULL,
      name TEXT NOT NULL,
      type TEXT,
      effort TEXT,
      rank TEXT,
      best TEXT,
      pr TEXT,
      likes INTEGER,
      riders INTEGER,
      start_index INTEGER,
      end_index INTEGER,
      FOREIGN KEY (route_id) REFERENCES routes(id) ON DELETE CASCADE
    );
  `);

  const routeCount = db.prepare("SELECT COUNT(*) AS count FROM routes").get().count;
  if (routeCount === 0) {
    const insertRoute = db.prepare(`
      INSERT INTO routes (id, name, description, distance_km, updated_at, status, geometry_json)
      VALUES (@id, @name, @description, @distanceKm, @updatedAt, @status, @geometryJson)
    `);
    const insertPoi = db.prepare(`
      INSERT INTO pois (id, route_id, name, type, icon_name, distance_label, description, tone, lat, lng)
      VALUES (@id, @routeId, @name, @type, @iconName, @distanceLabel, @description, @tone, @lat, @lng)
    `);
    const insertSegment = db.prepare(`
      INSERT INTO segments (id, route_id, name, type, effort, rank, best, pr, likes, riders, start_index, end_index)
      VALUES (@id, @routeId, @name, @type, @effort, @rank, @best, @pr, @likes, @riders, @startIndex, @endIndex)
    `);

    const seed = db.transaction(() => {
      for (const route of seedRoutes) {
        insertRoute.run({
          id: route.id,
          name: route.name,
          description: route.description,
          distanceKm: route.distanceKm,
          updatedAt: route.updatedAt,
          status: route.status,
          geometryJson: JSON.stringify(route.geometry),
        });
      }

      for (const poi of seedPois) {
        insertPoi.run(poi);
      }

      for (const segment of seedSegments) {
        insertSegment.run(segment);
      }
    });

    seed();
  }

  const routeSummaryQuery = db.prepare(`
    SELECT id, name, description, distance_km, updated_at, status, geometry_json
    FROM routes
    ORDER BY updated_at DESC, name ASC
  `);
  const routeDetailQuery = db.prepare(`
    SELECT id, name, description, distance_km, updated_at, status, geometry_json
    FROM routes
    WHERE id = ?
  `);
  const routePoisQuery = db.prepare(`
    SELECT id, route_id, name, type, icon_name, distance_label, description, tone, lat, lng
    FROM pois
    WHERE route_id = ?
    ORDER BY rowid ASC
  `);
  const routeSegmentsQuery = db.prepare(`
    SELECT id, route_id, name, type, effort, rank, best, pr, likes, riders, start_index, end_index
    FROM segments
    WHERE route_id = ?
    ORDER BY rowid ASC
  `);
  const updateGeometryQuery = db.prepare(`
    UPDATE routes
    SET geometry_json = @geometryJson,
        distance_km = @distanceKm,
        updated_at = @updatedAt
    WHERE id = @routeId
  `);
  const insertPoiQuery = db.prepare(`
    INSERT INTO pois (id, route_id, name, type, icon_name, distance_label, description, tone, lat, lng)
    VALUES (@id, @routeId, @name, @type, @iconName, @distanceLabel, @description, @tone, @lat, @lng)
  `);
  const poiDetailQuery = db.prepare(`
    SELECT id, route_id, name, type, icon_name, distance_label, description, tone, lat, lng
    FROM pois
    WHERE id = ? AND route_id = ?
  `);
  const updatePoiQuery = db.prepare(`
    UPDATE pois
    SET name = @name,
        type = @type,
        icon_name = @iconName,
        distance_label = @distanceLabel,
        description = @description,
        tone = @tone,
        lat = @lat,
        lng = @lng
    WHERE id = @id AND route_id = @routeId
  `);
  const deleteSegmentsQuery = db.prepare("DELETE FROM segments WHERE route_id = ?");
  const insertSegmentQuery = db.prepare(`
    INSERT INTO segments (id, route_id, name, type, effort, rank, best, pr, likes, riders, start_index, end_index)
    VALUES (@id, @routeId, @name, @type, @effort, @rank, @best, @pr, @likes, @riders, @startIndex, @endIndex)
  `);

  return {
    listRoutes() {
      return routeSummaryQuery.all().map(toRouteSummary);
    },
    getRoute(routeId) {
      const row = routeDetailQuery.get(routeId);
      return row ? toRouteDetail(row) : null;
    },
    getMapData(routeId) {
      const route = this.getRoute(routeId);
      if (!route) return null;

      return {
        routeId,
        geometry: route.geometry,
        pois: routePoisQuery.all(routeId).map(toPoi),
      };
    },
    updateRouteGeometry(routeId, geometry) {
      updateGeometryQuery.run({
        routeId,
        geometryJson: JSON.stringify(geometry),
        distanceKm: lastDistanceKm(geometry),
        updatedAt: new Date().toISOString(),
      });
      return this.getRoute(routeId);
    },
    createPoi(routeId, payload) {
      const poi = {
        id: randomUUID(),
        routeId,
        name: payload.name,
        type: payload.type ?? "supply",
        iconName: payload.iconName ?? null,
        distanceLabel: payload.distanceLabel ?? null,
        description: payload.description ?? null,
        tone: payload.tone ?? null,
        lat: payload.lat,
        lng: payload.lng,
      };

      insertPoiQuery.run(poi);
      return this.getPoi(routeId, poi.id);
    },
    getPoi(routeId, poiId) {
      const row = poiDetailQuery.get(poiId, routeId);
      return row ? toPoi(row) : null;
    },
    updatePoi(routeId, poiId, payload) {
      const current = this.getPoi(routeId, poiId);
      if (!current) return null;

      updatePoiQuery.run({
        id: poiId,
        routeId,
        name: payload.name ?? current.name,
        type: payload.type ?? current.type,
        iconName: payload.iconName ?? current.iconName ?? null,
        distanceLabel: payload.distanceLabel ?? current.distanceLabel ?? null,
        description: payload.description ?? current.description ?? null,
        tone: payload.tone ?? current.tone ?? null,
        lat: payload.lat ?? current.lat,
        lng: payload.lng ?? current.lng,
      });

      return this.getPoi(routeId, poiId);
    },
    getSegments(routeId) {
      return routeSegmentsQuery.all(routeId).map(toSegment);
    },
    replaceSegments(routeId, segments) {
      const replace = db.transaction((input) => {
        deleteSegmentsQuery.run(routeId);
        for (const segment of input) {
          insertSegmentQuery.run({
            id: segment.id ?? randomUUID(),
            routeId,
            name: segment.name,
            type: segment.type ?? "tempo",
            effort: segment.effort ?? null,
            rank: segment.rank ?? null,
            best: segment.best ?? null,
            pr: segment.pr ?? null,
            likes: segment.likes ?? 0,
            riders: segment.riders ?? 0,
            startIndex: segment.startIndex ?? null,
            endIndex: segment.endIndex ?? null,
          });
        }
      });

      replace(segments);
      return this.getSegments(routeId);
    },
    buildExport(routeId) {
      const route = this.getRoute(routeId);
      if (!route) return null;

      return {
        route: {
          id: route.id,
          name: route.name,
          geometry: route.geometry,
        },
        pois: this.getMapData(routeId).pois.map((poi) => ({
          id: poi.id,
          name: poi.name,
          remark: poi.description ?? "",
          lat: poi.lat,
          lng: poi.lng,
        })),
        segments: this.getSegments(routeId).map((segment) => ({
          id: segment.id,
          name: segment.name,
          remark: segment.effort ?? "",
          startIndex: segment.startIndex ?? 0,
          endIndex: segment.endIndex ?? 0,
        })),
        meta: {
          version: 1,
          exportedAt: new Date().toISOString(),
        },
      };
    },
    close() {
      db.close();
    },
  };
}
