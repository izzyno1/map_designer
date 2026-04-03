import React from "react";
import { MemoryRouter } from "react-router-dom";
import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { DraftEditorPage } from "../DraftEditorPage";

const hookState = {
  draft: {
    viewport: {
      center: { lat: 37.87, lng: 112.55 },
      zoom: 12,
    },
    pois: [],
    segments: [],
  },
  source: "mock" as const,
  loading: false,
  saving: false,
  snapping: false,
  message: null as string | null,
  mode: "browse" as const,
  selection: { kind: "none" as const },
  selectedPoi: null,
  selectedSegment: null,
  segmentDraftPoints: [],
  setMessage: vi.fn(),
  startCreatePoiMode: vi.fn(),
  startSegmentDrawMode: vi.fn(),
  cancelSegmentDrawMode: vi.fn(),
  finishSegmentDrawMode: vi.fn(),
  onMapClick: vi.fn(),
  selectPoi: vi.fn(),
  selectSegment: vi.fn(),
  updateSelectedPoi: vi.fn(),
  updateSelectedSegment: vi.fn(),
  deleteSelectedPoi: vi.fn(),
  deleteSelectedSegment: vi.fn(),
  updateViewport: vi.fn(),
  saveCurrentDraft: vi.fn(async () => {}),
  exportCurrentDraft: vi.fn(async () => {}),
};

vi.mock("../../hooks/useDraftAnnotationData", () => ({
  useDraftAnnotationData: () => hookState,
}));

vi.mock("../../components/DraftMapCanvas", () => ({
  DraftMapCanvas: ({ onMapClick }: { onMapClick: (lat: number, lng: number) => void }) => (
    <button type="button" onClick={() => onMapClick(37.86, 112.54)}>
      mock-map-click
    </button>
  ),
}));

void React;

describe("DraftEditorPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders draft workflow actions", () => {
    render(
      <MemoryRouter>
        <DraftEditorPage />
      </MemoryRouter>,
    );

    expect(screen.getByRole("button", { name: "新增标注点" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "新增赛段" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "保存标注" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "导出 JSON" })).toBeInTheDocument();
  });

  it("triggers create poi action from toolbar", () => {
    render(
      <MemoryRouter>
        <DraftEditorPage />
      </MemoryRouter>,
    );

    fireEvent.click(screen.getByRole("button", { name: "新增标注点" }));
    expect(hookState.startCreatePoiMode).toHaveBeenCalled();
  });
});
