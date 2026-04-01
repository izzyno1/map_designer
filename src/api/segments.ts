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
