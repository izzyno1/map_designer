import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { AnnotationSidebar } from "../components/AnnotationSidebar";
import { AppShell } from "../components/AppShell";
import { GeometryEditorPanel } from "../components/GeometryEditorPanel";
import { MapCanvas } from "../components/MapCanvas";
import { PoiEditorPanel } from "../components/PoiEditorPanel";
import { SegmentEditorPanel } from "../components/SegmentEditorPanel";
import { StatusBanner } from "../components/StatusBanner";
import { useRouteEditorData } from "../hooks/useRouteEditorData";
import { applyGeometryEdit } from "../lib/geometry";
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
  const [segmentDraftState, setSegmentDraftState] = useState<{
    routeId: string;
    segments: Segment[];
  }>({
    routeId: "",
    segments: [],
  });
  const segmentDraft =
    segmentDraftState.routeId === routeId ? segmentDraftState.segments : editor.segments;

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

  function updateSegmentDraft(nextSegments: Segment[]) {
    setSegmentDraftState({
      routeId,
      segments: nextSegments,
    });
    void editor.saveSegmentList(nextSegments);
  }

  async function saveGeometryDraft(geometry: RouteGeometry) {
    const nextSegments =
      segmentDraftState.routeId === routeId ? segmentDraftState.segments : editor.segments;

    await editor.saveSegmentList(nextSegments);
    await editor.saveGeometry(geometry);
  }

  return (
    <AppShell
      title={editor.route?.name ?? "路线编辑器"}
      subtitle="左侧列表，中间地图，右侧属性编辑"
      actions={<div className="toolbar-chip">{editor.saving ? "保存中..." : "可编辑"}</div>}
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
                geometry={geometryDraft}
                onChange={updateGeometryDraft}
                onSave={saveGeometryDraft}
              />
            </div>
          </section>
        )}
      </div>
    </AppShell>
  );
}
