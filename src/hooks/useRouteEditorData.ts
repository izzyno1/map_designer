import { useEffect, useMemo, useRef, useState } from "react";
import { createPoi, updatePoi } from "../api/pois";
import {
  getRouteDetail,
  getRouteMapData,
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
  const [message, setMessage] = useState<string | null>(null);
  const activeRouteIdRef = useRef(routeId);
  const saveRequestIdRef = useRef(0);

  activeRouteIdRef.current = routeId;

  useEffect(() => {
    if (!routeId) {
      setLoading(false);
      return;
    }

    let cancelled = false;

    setLoading(true);
    setSaving(false);
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
        setSegments(nextSegments);
        setSource(
          routeDetail.source === "api" && routeMapData.source === "api" ? "api" : "mock",
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

  function isStaleRouteSave(requestRouteId: string) {
    return activeRouteIdRef.current !== requestRouteId;
  }

  function finishRouteSave(requestId: number, requestRouteId: string) {
    if (
      activeRouteIdRef.current === requestRouteId &&
      saveRequestIdRef.current === requestId
    ) {
      setSaving(false);
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

      if (isStaleRouteSave(saveScope.routeId)) {
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

      if (isStaleRouteSave(saveScope.routeId)) {
        return;
      }

      setSegments(savedSegments);
      setMessage("赛段已保存到本地演示数据");
    } finally {
      finishRouteSave(saveScope.requestId, saveScope.routeId);
    }
  }

  async function saveGeometry(geometry: RouteGeometry) {
    if (!routeId) {
      return;
    }

    const saveScope = startRouteSave(routeId);
    try {
      const result = await updateRouteGeometry(routeId, geometry);

      if (isStaleRouteSave(saveScope.routeId)) {
        return;
      }

      setRoute(result.data);
      setMapData((current) => {
        if (!current) {
          return current;
        }

        return {
          ...current,
          geometry,
        };
      });
      setMessage(
        result.source === "api" ? "路线坐标已保存到后端" : "路线坐标已保存到演示数据",
      );
    } finally {
      finishRouteSave(saveScope.requestId, saveScope.routeId);
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
    message,
    setDraftPoi,
    setMessage,
    setSelected,
    savePoiDraft,
    saveSegmentList,
    saveGeometry,
    startCreatePoi,
    selectPoi,
    selectSegment,
    selectGeometry,
  };
}
