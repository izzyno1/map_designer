import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { AnnotationSidebar } from "../components/AnnotationSidebar";
import { AppShell } from "../components/AppShell";
import { GeometryEditorPanel } from "../components/GeometryEditorPanel";
import { PoiEditorPanel } from "../components/PoiEditorPanel";
import { SegmentEditorPanel } from "../components/SegmentEditorPanel";
import { StatusBanner } from "../components/StatusBanner";
import { useRouteEditorData } from "../hooks/useRouteEditorData";
import type { RouteGeometry } from "../types/route";

export function RouteEditorPage() {
  const { routeId = "" } = useParams();
  const editor = useRouteEditorData(routeId);
  const [geometryDraft, setGeometryDraft] = useState<RouteGeometry | null>(null);

  useEffect(() => {
    setGeometryDraft(editor.mapData?.geometry ?? null);
  }, [editor.mapData]);

  return (
    <AppShell title={editor.route?.name ?? "路线编辑器"} subtitle="左侧列表，中间地图，右侧属性编辑">
      <div className="editor-page">
        <div className="editor-page__status">
          <StatusBanner tone={editor.source === "api" ? "success" : "warning"}>
            {editor.source === "api" ? "Connected to API" : "Fallback mock mode"}
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
              segments={editor.segments}
              selected={editor.selected}
              onSelectPoi={editor.selectPoi}
              onSelectSegment={editor.selectSegment}
              onSelectGeometry={editor.selectGeometry}
            />
            <div className="panel editor-map-placeholder">
              地图画布将在下个任务中接入 Leaflet。
            </div>
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
                segments={editor.segments}
                onSelect={editor.selectSegment}
                onChange={editor.saveSegmentList}
              />
              <GeometryEditorPanel
                geometry={geometryDraft}
                onChange={setGeometryDraft}
                onSave={editor.saveGeometry}
              />
            </div>
          </section>
        )}
      </div>
    </AppShell>
  );
}
