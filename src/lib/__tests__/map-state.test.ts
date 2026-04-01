import { describe, expect, it } from "vitest";
import { getSegmentSlice } from "../segments";
import { geometryToLatLngTuples } from "../geometry";

describe("map state helpers", () => {
  it("creates polyline tuples for the full route and highlighted segment", () => {
    const geometry = {
      type: "LineString" as const,
      coordinates: [
        { lat: 37.87, lng: 112.54 },
        { lat: 37.88, lng: 112.55 },
        { lat: 37.89, lng: 112.56 },
      ],
    };

    expect(geometryToLatLngTuples(geometry)).toEqual([
      [37.87, 112.54],
      [37.88, 112.55],
      [37.89, 112.56],
    ]);
    expect(getSegmentSlice(geometry.coordinates, 1, 2)).toHaveLength(2);
  });
});
