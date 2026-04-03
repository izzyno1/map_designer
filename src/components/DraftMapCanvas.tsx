import { useEffect, useMemo } from "react";
import {
  CircleMarker,
  MapContainer,
  Polyline,
  TileLayer,
  useMap,
  useMapEvents,
} from "react-leaflet";
import { SHANXI_FALLBACK_CENTER, SHANXI_FALLBACK_ZOOM } from "../lib/constants";
import type {
  AnnotationDraft,
  DraftInteractionMode,
  DraftSelection,
  DraftViewport,
} from "../types/draft";

interface DraftMapCanvasProps {
  draft: AnnotationDraft | null;
  selection: DraftSelection;
  mode: DraftInteractionMode;
  segmentDraftPoints: Array<{ lat: number; lng: number }>;
  onMapClick: (lat: number, lng: number) => void;
  onSelectPoi: (id: string) => void;
  onSelectSegment: (id: string) => void;
  onViewportChange: (viewport: DraftViewport) => void;
}

function ViewportSync({ viewport }: { viewport: DraftViewport }) {
  const map = useMap();

  useEffect(() => {
    map.setView([viewport.center.lat, viewport.center.lng], viewport.zoom, {
      animate: false,
    });
  }, [map, viewport.center.lat, viewport.center.lng, viewport.zoom]);

  return null;
}

function MapEvents({
  onMapClick,
  onViewportChange,
}: {
  onMapClick: (lat: number, lng: number) => void;
  onViewportChange: (viewport: DraftViewport) => void;
}) {
  useMapEvents({
    click(event) {
      onMapClick(event.latlng.lat, event.latlng.lng);
    },
    moveend(event) {
      const map = event.target;
      const center = map.getCenter();
      onViewportChange({
        center: { lat: center.lat, lng: center.lng },
        zoom: map.getZoom(),
      });
    },
  });

  return null;
}

export function DraftMapCanvas({
  draft,
  selection,
  mode,
  segmentDraftPoints,
  onMapClick,
  onSelectPoi,
  onSelectSegment,
  onViewportChange,
}: DraftMapCanvasProps) {
  const viewport = draft?.viewport ?? {
    center: { lat: SHANXI_FALLBACK_CENTER[0], lng: SHANXI_FALLBACK_CENTER[1] },
    zoom: SHANXI_FALLBACK_ZOOM,
  };
  const segmentDraftLine = useMemo(
    () => segmentDraftPoints.map((point) => [point.lat, point.lng] as [number, number]),
    [segmentDraftPoints],
  );

  return (
    <div className="map-canvas panel">
      <MapContainer
        center={[viewport.center.lat, viewport.center.lng]}
        zoom={viewport.zoom}
        className="map-canvas__map"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <ViewportSync viewport={viewport} />
        <MapEvents onMapClick={onMapClick} onViewportChange={onViewportChange} />

        {draft?.segments.map((segment) => (
          <Polyline
            key={segment.id}
            positions={segment.points.map((point) => [point.lat, point.lng] as [number, number])}
            pathOptions={{
              color: selection.kind === "segment" && selection.id === segment.id ? "#f76707" : "#1f6feb",
              weight: selection.kind === "segment" && selection.id === segment.id ? 6 : 4,
            }}
            eventHandlers={{
              click: (event) => {
                event.originalEvent?.stopPropagation();
                onSelectSegment(segment.id);
              },
            }}
          />
        ))}

        {segmentDraftLine.length > 0 ? (
          <Polyline
            positions={segmentDraftLine}
            pathOptions={{ color: "#f76707", weight: 4, dashArray: "8 6" }}
          />
        ) : null}

        {draft?.pois.map((poi) => (
          <CircleMarker
            key={poi.id}
            center={[poi.lat, poi.lng]}
            radius={selection.kind === "poi" && selection.id === poi.id ? 8 : 6}
            pathOptions={{
              color: selection.kind === "poi" && selection.id === poi.id ? "#f76707" : "#1f6feb",
              weight: 2,
              fillColor: "#ffffff",
              fillOpacity: 1,
            }}
            eventHandlers={{
              click: (event) => {
                event.originalEvent?.stopPropagation();
                onSelectPoi(poi.id);
              },
            }}
          />
        ))}
      </MapContainer>
      <div className="map-canvas__hint">
        {mode === "create-poi" ? "点击地图放置标注点。" : null}
        {mode === "draw-segment"
          ? `赛段绘制中：已放置 ${segmentDraftPoints.length} 个点。`
          : null}
        {mode === "browse" ? "在左侧选择对象，或从顶部开始新增标注点和赛段。" : null}
      </div>
    </div>
  );
}
