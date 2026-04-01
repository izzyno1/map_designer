import { useEffect, useMemo, useState } from "react";
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

export function useRouteEditorData(routeId?: string) {
  const [route, setRoute] = useState<RouteDetail | null>(null);
  const [mapData, setMapData] = useState<RouteMapDataResponse | null>(null);
  const [segments, setSegments] = useState<Segment[]>([]);
  const [selected, setSelected] = useState<SelectedAnnotation>({ kind: "none" });
  const [draftPoi, setDraftPoi] = useState<DraftPoi | null>(null);
  const [source, setSource] = useState<Source>("mock");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!routeId) {
      setLoading(false);
      return;
    }

    let cancelled = false;

    setLoading(true);
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
        setSource(routeDetail.source === "api" || routeMapData.source === "api" ? "api" : "mock");
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

    setSaving(true);
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
      setSource(result.source);
      setMessage(
        result.source === "api" ? "POI 已保存到 API" : "POI 已保存到本地 mock 存储",
      );
    } finally {
      setSaving(false);
    }
  }

  async function saveSegmentList(nextSegments: Segment[]) {
    if (!routeId) {
      return;
    }

    setSaving(true);
    try {
      const savedSegments = await saveSegments(routeId, nextSegments);
      setSegments(savedSegments);
      setMessage("赛段已保存到本地 mock 存储");
    } finally {
      setSaving(false);
    }
  }

  async function saveGeometry(geometry: RouteGeometry) {
    if (!routeId) {
      return;
    }

    setSaving(true);
    try {
      const result = await updateRouteGeometry(routeId, geometry);
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
      setSource(result.source);
      setMessage(
        result.source === "api"
          ? "Geometry 已保存到 API"
          : "Geometry 已保存到本地 mock 存储",
      );
    } finally {
      setSaving(false);
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
    savePoiDraft,
    saveSegmentList,
    saveGeometry,
    startCreatePoi,
    selectPoi,
    selectSegment,
    selectGeometry,
  };
}
