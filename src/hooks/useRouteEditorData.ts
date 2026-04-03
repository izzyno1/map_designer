import { useEffect, useMemo, useRef, useState } from "react";
import { createPoi, updatePoi } from "../api/pois";
import {
  getRouteDetail,
  getRouteMapData,
  snapRouteGeometry,
  updateRouteGeometry,
} from "../api/routes";
import { getSegments, saveSegments } from "../api/segments";
import type { DraftPoi, SelectedAnnotation, Segment } from "../types/annotation";
import type { Poi, RouteDetail, RouteGeometry, RouteMapDataResponse } from "../types/route";

type Source = "api" | "mock";

function upsertPoi(list: Poi[], next: Poi) {
  const index = list.findIndex((item) => item.id === next.id);
  if (index === -1) {
    return [...list, next];
  }

  const copy = [...list];
  copy[index] = next;
  return copy;
}

export function useRouteEditorData(routeId: string) {
  const [route, setRoute] = useState<RouteDetail | null>(null);
  const [mapData, setMapData] = useState<RouteMapDataResponse | null>(null);
  const [segments, setSegments] = useState<Segment[]>([]);
  const [selected, setSelected] = useState<SelectedAnnotation>({ kind: "none" });
  const [draftPoi, setDraftPoi] = useState<DraftPoi | null>(null);
  const [source, setSource] = useState<Source>("mock");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [snapping, setSnapping] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const activeRouteIdRef = useRef(routeId);
  const saveRequestIdRef = useRef(0);
  const snapRequestIdRef = useRef(0);

  activeRouteIdRef.current = routeId;

  useEffect(() => {
    if (!routeId) {
      setLoading(false);
      return;
    }

    let cancelled = false;

    setLoading(true);
    setSaving(false);
    setSnapping(false);
    void (async () => {
      try {
        const [routeDetail, routeMapData, nextSegments] = await Promise.all([
          getRouteDetail(routeId),
          getRouteMapData(routeId),
          getSegments(routeId),
        ]);

        if (cancelled) {
          return;
        }

        setRoute(routeDetail.data);
        setMapData(routeMapData.data);
        setSegments(nextSegments.data);
        setSource(
          routeDetail.source === "api" &&
            routeMapData.source === "api" &&
            nextSegments.source === "api"
            ? "api"
            : "mock",
        );
        setSelected({ kind: "none" });
        setDraftPoi(null);
        setMessage(null);
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [routeId]);

  function startRouteSave(requestRouteId: string) {
    const requestId = saveRequestIdRef.current + 1;
    saveRequestIdRef.current = requestId;
    setSaving(true);

    return { requestId, routeId: requestRouteId };
  }

  function isStaleRouteSave(scope: { requestId: number; routeId: string }) {
    return (
      activeRouteIdRef.current !== scope.routeId ||
      saveRequestIdRef.current !== scope.requestId
    );
  }

  function finishRouteSave(requestId: number, requestRouteId: string) {
    if (
      activeRouteIdRef.current === requestRouteId &&
      saveRequestIdRef.current === requestId
    ) {
      setSaving(false);
    }
  }

  function startRouteSnap(requestRouteId: string) {
    const requestId = snapRequestIdRef.current + 1;
    snapRequestIdRef.current = requestId;
    setSnapping(true);

    return { requestId, routeId: requestRouteId };
  }

  function isStaleRouteSnap(scope: { requestId: number; routeId: string }) {
    return (
      activeRouteIdRef.current !== scope.routeId ||
      snapRequestIdRef.current !== scope.requestId
    );
  }

  function finishRouteSnap(requestId: number, requestRouteId: string) {
    if (activeRouteIdRef.current === requestRouteId && snapRequestIdRef.current === requestId) {
      setSnapping(false);
    }
  }

  const selectedPoi = useMemo(() => {
    if (selected.kind !== "poi") {
      return null;
    }

    return mapData?.pois.find((item) => item.id === selected.id) ?? null;
  }, [mapData, selected]);

  const selectedSegment = useMemo(() => {
    if (selected.kind !== "segment") {
      return null;
    }

    return segments.find((item) => item.id === selected.id) ?? null;
  }, [segments, selected]);

  async function savePoiDraft(input: DraftPoi) {
    if (!routeId) {
      return;
    }

    const saveScope = startRouteSave(routeId);
    try {
      const { isNew, ...rest } = input;
      const result = isNew
        ? await createPoi(routeId, {
            name: rest.name,
            type: rest.type,
            iconName: rest.iconName,
            distanceLabel: rest.distanceLabel,
            description: rest.description,
            tone: rest.tone,
            lat: rest.lat,
            lng: rest.lng,
          })
        : await updatePoi(routeId, input.id, rest);

      if (isStaleRouteSave(saveScope)) {
        return;
      }

      setMapData((current) => {
        if (!current) {
          return current;
        }

        return {
          ...current,
          pois: upsertPoi(current.pois, result.data),
        };
      });
      setSelected({ kind: "poi", id: result.data.id });
      setDraftPoi(null);
      setMessage(result.source === "api" ? "标注点已保存到后端" : "标注点已保存到演示数据");
    } finally {
      finishRouteSave(saveScope.requestId, saveScope.routeId);
    }
  }

  async function saveSegmentList(nextSegments: Segment[]) {
    if (!routeId) {
      return;
    }

    const saveScope = startRouteSave(routeId);
    try {
      const savedSegments = await saveSegments(routeId, nextSegments);

      if (isStaleRouteSave(saveScope)) {
        return;
      }

      setSegments(savedSegments.data);
      setMessage(savedSegments.source === "api" ? "赛段已保存到后端" : "赛段已保存到演示数据");
    } finally {
      finishRouteSave(saveScope.requestId, saveScope.routeId);
    }
  }

  async function saveGeometry(geometry: RouteGeometry): Promise<RouteGeometry | null> {
    if (!routeId) {
      return null;
    }

    const saveScope = startRouteSave(routeId);
    try {
      const result = await updateRouteGeometry(routeId, geometry);

      if (isStaleRouteSave(saveScope)) {
        return null;
      }

      setRoute(result.data);
      setMapData((current) => {
        if (!current) {
          return current;
        }

        return {
          ...current,
          geometry: result.data.geometry,
        };
      });
      setMessage(
        result.source === "api" ? "路线坐标已保存到后端" : "路线坐标已保存到演示数据",
      );
      return result.data.geometry;
    } finally {
      finishRouteSave(saveScope.requestId, saveScope.routeId);
    }
  }

  async function snapGeometryDraft(geometry: RouteGeometry) {
    if (!routeId) {
      return null;
    }

    if (geometry.coordinates.length < 2) {
      setMessage("至少需要两个坐标点");
      return null;
    }

    const snapScope = startRouteSnap(routeId);
    try {
      const result = await snapRouteGeometry(routeId, geometry);

      if (isStaleRouteSnap(snapScope)) {
        return null;
      }

      setMessage("已生成道路贴合结果，请确认后保存");
      return result.data;
    } catch {
      if (activeRouteIdRef.current === snapScope.routeId) {
        setMessage("道路贴合失败，请稍后重试");
      }

      return null;
    } finally {
      finishRouteSnap(snapScope.requestId, snapScope.routeId);
    }
  }

  function startCreatePoi(lat: number, lng: number) {
    setDraftPoi({
      id: "draft-poi",
      isNew: true,
      name: "",
      type: "supply",
      iconName: "",
      distanceLabel: "",
      description: "",
      tone: "",
      lat,
      lng,
    });
    setSelected({ kind: "new-poi" });
  }

  function selectPoi(id: string) {
    setSelected({ kind: "poi", id });
    setDraftPoi(null);
  }

  function selectSegment(id: string) {
    setSelected({ kind: "segment", id });
    setDraftPoi(null);
  }

  function selectGeometry() {
    setSelected({ kind: "geometry" });
    setDraftPoi(null);
  }

  return {
    route,
    mapData,
    segments,
    selected,
    selectedPoi,
    selectedSegment,
    draftPoi,
    source,
    loading,
    saving,
    snapping,
    message,
    setDraftPoi,
    setMessage,
    setSelected,
    savePoiDraft,
    saveSegmentList,
    saveGeometry,
    snapGeometryDraft,
    startCreatePoi,
    selectPoi,
    selectSegment,
    selectGeometry,
  };
}
