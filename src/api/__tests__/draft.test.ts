import { beforeEach, describe, expect, it, vi } from "vitest";
import { downloadDraftExport, getDraft, saveDraft } from "../draft";
import type { AnnotationDraft } from "../../types/draft";

const sampleDraft: AnnotationDraft = {
  viewport: {
    center: { lat: 37.87, lng: 112.55 },
    zoom: 12,
  },
  pois: [
    {
      id: "poi-1",
      name: "补给点",
      remark: "补水",
      lat: 37.86,
      lng: 112.54,
    },
  ],
  segments: [
    {
      id: "segment-1",
      name: "赛段",
      remark: "节奏",
      points: [
        { lat: 37.87, lng: 112.55 },
        { lat: 37.88, lng: 112.57 },
      ],
    },
  ],
};

describe("draft api", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it("falls back to mock/local draft when api load fails", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("network")));

    const result = await getDraft();
    expect(result.source).toBe("mock");
    expect(result.data.pois).toEqual([]);
    expect(result.data.segments).toEqual([]);
  });

  it("saves to local storage when api save fails", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("network")));

    const result = await saveDraft(sampleDraft);

    expect(result.source).toBe("mock");
    expect(result.data).toEqual(sampleDraft);
    expect(localStorage.getItem("map-designer:draft")).toContain("poi-1");
  });

  it("downloads export from api response", async () => {
    const clickSpy = vi.fn();
    const appendSpy = vi.spyOn(document.body, "append");
    const removeSpy = vi.spyOn(HTMLElement.prototype, "remove").mockImplementation(() => {});
    if (!window.URL.createObjectURL) {
      window.URL.createObjectURL = (() => "blob:demo-url") as typeof window.URL.createObjectURL;
    }
    if (!window.URL.revokeObjectURL) {
      window.URL.revokeObjectURL = (() => {}) as typeof window.URL.revokeObjectURL;
    }
    const createObjectURLSpy = vi.spyOn(window.URL, "createObjectURL").mockReturnValue("blob:demo-url");
    const revokeObjectURLSpy = vi.spyOn(window.URL, "revokeObjectURL").mockImplementation(() => {});
    const originalCreateElement = document.createElement.bind(document);
    vi.spyOn(document, "createElement").mockImplementation((tagName: string) => {
      if (tagName === "a") {
        return {
          href: "",
          download: "",
          click: clickSpy,
          remove: removeSpy,
        } as unknown as HTMLAnchorElement;
      }

      return originalCreateElement(tagName);
    });

    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        blob: async () => new Blob(["{}"], { type: "application/json" }),
      }),
    );

    await downloadDraftExport("draft-test");

    expect(clickSpy).toHaveBeenCalled();
    expect(appendSpy).toHaveBeenCalled();
    expect(createObjectURLSpy).toHaveBeenCalled();
    expect(revokeObjectURLSpy).toHaveBeenCalledWith("blob:demo-url");
  });
});
