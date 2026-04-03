import { useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { downloadRouteExport } from "../api/routes";
import { AnnotationSidebar } from "../components/AnnotationSidebar";
import { AppShell } from "../components/AppShell";
import { GeometryEditorPanel } from "../components/GeometryEditorPanel";
import { MapCanvas } from "../components/MapCanvas";
import { PoiEditorPanel } from "../components/PoiEditorPanel";
import { SegmentEditorPanel } from "../components/SegmentEditorPanel";
import { StatusBanner } from "../components/StatusBanner";
import { useRouteEditorData } from "../hooks/useRouteEditorData";
import { applyGeometryEdit } from "../lib/geometry";
import {
  getRouteGeometrySnapDisabledReason,
  ROUTE_GEOMETRY_SNAP_MAX_POINTS,
} from "../lib/constants";
import type { Segment } from "../types/annotation";
import type { RouteGeometry } from "../types/route";

export function RouteEditorPage() {
  const { routeId = "" } = useParams();
  const editor = useRouteEditorData(routeId);
  const [geometryDraftState, setGeometryDraftState] = useState<{
    routeId: string;
    geometry: RouteGeometry | null;
  }>({
    routeId: "",
    geometry: null,
  });
  const geometryDraft =
    geometryDraftState.routeId === routeId ? geometryDraftState.geometry : null;
  const activeRouteIdRef = useRef(routeId);
  const draftRevisionRef = useRef(0);
  const [segmentDraftState, setSegmentDraftState] = useState<{
    routeId: string;
    segments: Segment[];
  }>({
    routeId: "",
    segments: [],
  });
  const segmentDraft =
    segmentDraftState.routeId === routeId ? segmentDraftState.segments : editor.segments;
  const currentGeometryDraft =
    geometryDraft ?? (editor.mapData?.routeId === routeId ? editor.mapData.geometry : null);
  const snapDisabledReason = getRouteGeometrySnapDisabledReason(
    currentGeometryDraft?.coordinates.length ?? 0,
  );
  const snapLimitExceeded =
    (currentGeometryDraft?.coordinates.length ?? 0) > ROUTE_GEOMETRY_SNAP_MAX_POINTS;
  const canSnap = snapDisabledReason === null;

  activeRouteIdRef.current = routeId;

  useEffect(() => {
    if (editor.mapData?.routeId !== routeId) {
      return;
    }

    if (geometryDraftState.routeId !== routeId || geometryDraft === null) {
      setGeometryDraftState({
        routeId,
        geometry: editor.mapData.geometry,
      });
    }
  }, [routeId, editor.mapData, geometryDraftState.routeId, geometryDraft]);

  useEffect(() => {
    if (editor.route?.id !== routeId) {
      return;
    }

    if (segmentDraftState.routeId !== routeId) {
      setSegmentDraftState({
        routeId,
        segments: editor.segments,
      });
    }
  }, [routeId, editor.route, editor.segments, segmentDraftState.routeId]);

  function updateGeometryDraft(nextGeometry: RouteGeometry) {
    draftRevisionRef.current += 1;
    const previousGeometry =
      geometryDraft ?? (editor.mapData?.routeId === routeId ? editor.mapData.geometry : null);
    const nextSegments =
      segmentDraftState.routeId === routeId ? segmentDraftState.segments : editor.segments;
    const appliedEdit = applyGeometryEdit(previousGeometry, nextGeometry, nextSegments);

    setGeometryDraftState({
      routeId,
      geometry: appliedEdit.geometry,
    });
    setSegmentDraftState({
      routeId,
      segments: appliedEdit.segments,
    });
  }

  async function snapCurrentGeometryDraft() {
    if (!currentGeometryDraft || !canSnap) {
      return;
    }

    const requestRouteId = routeId;
    const requestRevision = draftRevisionRef.current;
    const snappedGeometry = await editor.snapGeometryDraft(currentGeometryDraft);
    if (
      !snappedGeometry ||
      activeRouteIdRef.current !== requestRouteId ||
      draftRevisionRef.current !== requestRevision
    ) {
      return;
    }

    const nextSegments =
      segmentDraftState.routeId === requestRouteId ? segmentDraftState.segments : editor.segments;
    const appliedEdit = applyGeometryEdit(currentGeometryDraft, snappedGeometry, nextSegments);
    draftRevisionRef.current += 1;

    setGeometryDraftState({
      routeId: requestRouteId,
      geometry: appliedEdit.geometry,
    });
    setSegmentDraftState({
      routeId: requestRouteId,
      segments: appliedEdit.segments,
    });
  }

  function updateSegmentDraft(nextSegments: Segment[]) {
    draftRevisionRef.current += 1;
    setSegmentDraftState({
      routeId,
      segments: nextSegments,
    });
    void editor.saveSegmentList(nextSegments);
  }

  async function saveGeometryDraft(geometry: RouteGeometry) {
    const nextSegments =
      segmentDraftState.routeId === routeId ? segmentDraftState.segments : editor.segments;
    const requestRouteId = routeId;

    await editor.saveSegmentList(nextSegments);
    const savedGeometry = await editor.saveGeometry(geometry);
    if (!savedGeometry || activeRouteIdRef.current !== requestRouteId) {
      return;
    }

    draftRevisionRef.current += 1;
    const appliedEdit = applyGeometryEdit(geometry, savedGeometry, nextSegments);
    setGeometryDraftState({
      routeId: requestRouteId,
      geometry: savedGeometry,
    });
    setSegmentDraftState({
      routeId: requestRouteId,
      segments: appliedEdit.segments,
    });
  }

  async function exportRouteJson() {
    if (!editor.route) {
      return;
    }

    try {
      await downloadRouteExport(routeId, editor.route.name);
      editor.setMessage("导出文件已开始下载");
    } catch {
      editor.setMessage("导出失败，请确认后端服务已启动");
    }
  }

  return (
    <AppShell
      title={editor.route?.name ?? "路线编辑器"}
      subtitle="左侧列表，中间地图，右侧属性编辑"
      actions={
        <div className="toolbar-actions">
          <button
            type="button"
            className="toolbar-button"
            onClick={() => void snapCurrentGeometryDraft()}
            disabled={!currentGeometryDraft || !canSnap || editor.snapping || editor.loading}
            title={snapDisabledReason ?? undefined}
          >
            {editor.snapping ? "贴路中..." : "一键贴路"}
          </button>
          {snapLimitExceeded ? (
            <p className="geometry-hint toolbar-hint">{snapDisabledReason}</p>
          ) : null}
          <button
            type="button"
            className="toolbar-button"
            onClick={() => void exportRouteJson()}
            disabled={!editor.route || editor.loading}
          >
            导出 JSON
          </button>
          <div className="toolbar-chip">{editor.saving ? "保存中..." : "可编辑"}</div>
        </div>
      }
    >
      <div className="editor-page">
        <div className="editor-page__status">
          <StatusBanner tone={editor.source === "api" ? "success" : "warning"}>
            {editor.source === "api" ? "已连接后端接口" : "当前使用本地演示数据"}
          </StatusBanner>
          {editor.message ? <StatusBanner tone="neutral">{editor.message}</StatusBanner> : null}
        </div>
        {editor.loading ? (
          <div className="panel">正在加载路线编辑器...</div>
        ) : (
          <section className="editor-layout">
            <AnnotationSidebar
              routeName={editor.route?.name}
              routeDescription={editor.route?.description}
              pois={editor.mapData?.pois ?? []}
              segments={segmentDraft}
              selected={editor.selected}
              onSelectPoi={editor.selectPoi}
              onSelectSegment={editor.selectSegment}
              onSelectGeometry={editor.selectGeometry}
            />
            <MapCanvas
              geometry={geometryDraft}
              pois={editor.mapData?.pois ?? []}
              segments={segmentDraft}
              selected={editor.selected}
              onMapClick={editor.startCreatePoi}
              onPoiClick={editor.selectPoi}
              onSegmentClick={editor.selectSegment}
              onGeometryChange={updateGeometryDraft}
            />
            <div className="editor-panel-stack">
              <PoiEditorPanel
                selected={editor.selected}
                selectedPoi={editor.selectedPoi}
                draftPoi={editor.draftPoi}
                onChange={editor.setDraftPoi}
                onSave={editor.savePoiDraft}
              />
              <SegmentEditorPanel
                selected={editor.selected}
                segments={segmentDraft}
                onSelect={editor.selectSegment}
                onChange={updateSegmentDraft}
              />
              <GeometryEditorPanel
                geometry={currentGeometryDraft}
                onChange={updateGeometryDraft}
                onSave={saveGeometryDraft}
                onSnap={snapCurrentGeometryDraft}
                snapping={editor.snapping}
              />
            </div>
          </section>
        )}
      </div>
    </AppShell>
  );
}
