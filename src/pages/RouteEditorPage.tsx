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
            <MapCanvas
              geometry={geometryDraft}
              pois={editor.mapData?.pois ?? []}
              segments={editor.segments}
              selected={editor.selected}
              onMapClick={editor.startCreatePoi}
              onPoiClick={editor.selectPoi}
              onSegmentClick={editor.selectSegment}
              onGeometryChange={(next) =>
                setGeometryDraftState({
                  routeId,
                  geometry: next,
                })
              }
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
                segments={editor.segments}
                onSelect={editor.selectSegment}
                onChange={editor.saveSegmentList}
              />
              <GeometryEditorPanel
                geometry={geometryDraft}
                onChange={(next) =>
                  setGeometryDraftState({
                    routeId,
                    geometry: next,
                  })
                }
                onSave={editor.saveGeometry}
              />
            </div>
          </section>
        )}
      </div>
    </AppShell>
  );
}
