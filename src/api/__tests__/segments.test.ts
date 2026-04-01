import { beforeEach, describe, expect, it } from "vitest";
import { getSegments, saveSegments } from "../segments";

describe("segment storage", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("persists segments by route id", async () => {
    await saveSegments("route-1", [
      {
        id: "segment-1",
        routeId: "route-1",
        name: "测试赛段",
        type: "climb",
      },
    ]);

    const result = await getSegments("route-1");
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe("测试赛段");
  });
});
