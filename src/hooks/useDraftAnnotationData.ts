import { useEffect, useMemo, useState } from "react";
import { downloadDraftExport, getDraft, saveDraft } from "../api/draft";
import { snapPath } from "../api/snap";
import type {
  AnnotationDraft,
  DraftInteractionMode,
  DraftPoi,
  DraftSegment,
  DraftSelection,
  DraftViewport,
} from "../types/draft";

type Source = "api" | "mock";

function upsertPoi(list: DraftPoi[], next: DraftPoi) {
  const index = list.findIndex((item) => item.id === next.id);
  if (index < 0) {
    return [...list, next];
  }

  const copy = [...list];
  copy[index] = next;
  return copy;
}

function createId() {
  if (typeof globalThis.crypto?.randomUUID === "function") {
    return globalThis.crypto.randomUUID();
  }

  return `draft-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function upsertSegment(list: DraftSegment[], next: DraftSegment) {
  const index = list.findIndex((item) => item.id === next.id);
  if (index < 0) {
    return [...list, next];
  }

  const copy = [...list];
  copy[index] = next;
  return copy;
}

export function useDraftAnnotationData() {
  const [draft, setDraft] = useState<AnnotationDraft | null>(null);
  const [source, setSource] = useState<Source>("mock");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [snapping, setSnapping] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [selection, setSelection] = useState<DraftSelection>({ kind: "none" });
  const [mode, setMode] = useState<DraftInteractionMode>("browse");
  const [segmentDraftPoints, setSegmentDraftPoints] = useState<Array<{ lat: number; lng: number }>>([]);

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      setLoading(true);
      try {
        const result = await getDraft();
        if (cancelled) {
          return;
        }

        setDraft(result.data);
        setSource(result.source);
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const selectedPoi = useMemo(() => {
    if (!draft || selection.kind !== "poi") {
      return null;
    }

    return draft.pois.find((item) => item.id === selection.id) ?? null;
  }, [draft, selection]);

  const selectedSegment = useMemo(() => {
    if (!draft || selection.kind !== "segment") {
      return null;
    }

    return draft.segments.find((item) => item.id === selection.id) ?? null;
  }, [draft, selection]);

  function startCreatePoiMode() {
    setMode("create-poi");
    setMessage("点击地图放置一个标注点");
  }

  function startSegmentDrawMode() {
    setMode("draw-segment");
    setSegmentDraftPoints([]);
    setMessage("请在地图上连续点击多个点来绘制赛段");
  }

  function cancelSegmentDrawMode() {
    setMode("browse");
    setSegmentDraftPoints([]);
    setMessage("已取消赛段绘制");
  }

  function onMapClick(lat: number, lng: number) {
    if (!draft) {
      return;
    }

    if (mode === "create-poi") {
      const poi: DraftPoi = {
        id: createId(),
        name: `标注点 ${draft.pois.length + 1}`,
        remark: "",
        lat,
        lng,
      };

      setDraft((current) => {
        if (!current) {
          return current;
        }

        return {
          ...current,
          pois: [...current.pois, poi],
        };
      });
      setSelection({ kind: "poi", id: poi.id });
      setMode("browse");
      setMessage("已创建标注点");
      return;
    }

    if (mode === "draw-segment") {
      setSegmentDraftPoints((current) => [...current, { lat, lng }]);
    }
  }

  async function finishSegmentDrawMode() {
    if (!draft) {
      return;
    }

    if (segmentDraftPoints.length < 2) {
      setMessage("赛段至少需要两个点");
      return;
    }

    setSnapping(true);
    let snappedPoints = segmentDraftPoints;
    try {
      snappedPoints = await snapPath(segmentDraftPoints);
      setMessage("赛段已贴合道路");
    } catch {
      setMessage("赛段贴路失败，已保留原始赛段线");
    } finally {
      setSnapping(false);
    }

    const segment: DraftSegment = {
      id: createId(),
      name: `赛段 ${draft.segments.length + 1}`,
      remark: "",
      points: snappedPoints,
    };

    setDraft((current) => {
      if (!current) {
        return current;
      }

      return {
        ...current,
        segments: [...current.segments, segment],
      };
    });
    setSelection({ kind: "segment", id: segment.id });
    setMode("browse");
    setSegmentDraftPoints([]);
    setMessage("已创建赛段");
  }

  function selectPoi(id: string) {
    setSelection({ kind: "poi", id });
    setMode("browse");
  }

  function selectSegment(id: string) {
    setSelection({ kind: "segment", id });
    setMode("browse");
  }

  function updateSelectedPoi(next: DraftPoi) {
    setDraft((current) => {
      if (!current) {
        return current;
      }

      return {
        ...current,
        pois: upsertPoi(current.pois, next),
      };
    });
  }

  function updateSelectedSegment(next: DraftSegment) {
    setDraft((current) => {
      if (!current) {
        return current;
      }

      return {
        ...current,
        segments: upsertSegment(current.segments, next),
      };
    });
  }

  function deleteSelectedPoi() {
    if (selection.kind !== "poi") {
      return;
    }

    setDraft((current) => {
      if (!current) {
        return current;
      }

      return {
        ...current,
        pois: current.pois.filter((item) => item.id !== selection.id),
      };
    });
    setSelection({ kind: "none" });
    setMessage("标注点已删除");
  }

  function deleteSelectedSegment() {
    if (selection.kind !== "segment") {
      return;
    }

    setDraft((current) => {
      if (!current) {
        return current;
      }

      return {
        ...current,
        segments: current.segments.filter((item) => item.id !== selection.id),
      };
    });
    setSelection({ kind: "none" });
    setMessage("赛段已删除");
  }

  function updateViewport(viewport: DraftViewport) {
    setDraft((current) => {
      if (!current) {
        return current;
      }

      if (
        current.viewport.center.lat === viewport.center.lat &&
        current.viewport.center.lng === viewport.center.lng &&
        current.viewport.zoom === viewport.zoom
      ) {
        return current;
      }

      return {
        ...current,
        viewport,
      };
    });
  }

  async function saveCurrentDraft() {
    if (!draft) {
      return;
    }

    setSaving(true);
    try {
      const result = await saveDraft(draft);
      setDraft(result.data);
      setSource(result.source);
      setMessage(result.source === "api" ? "标注稿已保存到后端" : "标注稿已保存到本地演示数据");
    } finally {
      setSaving(false);
    }
  }

  async function exportCurrentDraft() {
    await downloadDraftExport();
    setMessage("导出文件已开始下载");
  }

  return {
    draft,
    source,
    loading,
    saving,
    snapping,
    message,
    mode,
    selection,
    selectedPoi,
    selectedSegment,
    segmentDraftPoints,
    setMessage,
    startCreatePoiMode,
    startSegmentDrawMode,
    cancelSegmentDrawMode,
    finishSegmentDrawMode,
    onMapClick,
    selectPoi,
    selectSegment,
    updateSelectedPoi,
    updateSelectedSegment,
    deleteSelectedPoi,
    deleteSelectedSegment,
    updateViewport,
    saveCurrentDraft,
    exportCurrentDraft,
  };
}
