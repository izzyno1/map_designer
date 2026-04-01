import { beforeEach, describe, expect, it, vi } from "vitest";
import { getRouteList } from "../routes";

describe("route api fallback", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("returns mock routes when fetch fails", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("network down")));

    const result = await getRouteList();

    expect(result.source).toBe("mock");
    expect(result.data.length).toBeGreaterThan(0);
  });
});
