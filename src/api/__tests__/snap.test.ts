import { beforeEach, describe, expect, it, vi } from "vitest";
import { snapPath } from "../snap";

describe("snap api", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("returns snapped points from backend api", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          points: [
            { lat: 37.87, lng: 112.55 },
            { lat: 37.88, lng: 112.57 },
          ],
        }),
      }),
    );

    const result = await snapPath([
      { lat: 37.87, lng: 112.55 },
      { lat: 37.88, lng: 112.57 },
    ]);

    expect(result).toHaveLength(2);
    expect(result[1]).toEqual({ lat: 37.88, lng: 112.57 });
  });
});
