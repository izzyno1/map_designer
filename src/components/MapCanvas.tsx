import { useMemo } from "react";
import { MapContainer, Marker, Polyline, TileLayer, useMapEvents } from "react-leaflet";
import L from "leaflet";
import type { Segment, SelectedAnnotation } from "../types/annotation";
import type { Poi, RouteGeometry } from "../types/route";
import { buildFallbackView, geometryToLatLngTuples } from "../lib/geometry";
import { getSegmentSlice } from "../lib/segments";
import { defaultLeafletIcon, geometryHandleIcon } from "../lib/leaflet-icons";

L.Marker.prototype.options.icon = defaultLeafletIcon;

interface MapCanvasProps {
  geometry: RouteGeometry | null;
  pois: Poi[];
  segments: Segment[];
  selected: SelectedAnnotation;
  onMapClick: (lat: number, lng: number) => void;
  onPoiClick: (poiId: string) => void;
  onSegmentClick: (segmentId: string) => void;
  onGeometryChange: (geometry: RouteGeometry) => void;
}

function ClickCapture({ onMapClick }: { onMapClick: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(event) {
      onMapClick(event.latlng.lat, event.latlng.lng);
    },
  });

  return null;
}

export function MapCanvas({
  geometry,
  pois,
  segments,
  selected,
  onMapClick,
  onPoiClick,
  onSegmentClick,
  onGeometryChange,
}: MapCanvasProps) {
  const points = geometry?.coordinates ?? [];
  const tuples = geometry ? geometryToLatLngTuples(geometry) : [];
  const fallback = buildFallbackView(points);

  const highlightedSegment = useMemo(() => {
    if (selected.kind !== "segment") return [];

    const segment = segments.find((item) => item.id === selected.id);
    if (!segment || !geometry) return [];

    return getSegmentSlice(geometry.coordinates, segment.startIndex, segment.endIndex).map((point) => [
      point.lat,
      point.lng,
    ]) as [number, number][];
  }, [geometry, segments, selected]);

  return (
    <div className="map-canvas panel">
      <MapContainer center={fallback.center} zoom={fallback.zoom} className="map-canvas__map">
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <ClickCapture onMapClick={onMapClick} />
        {tuples.length > 1 ? <Polyline positions={tuples} pathOptions={{ color: "#1f6feb", weight: 5 }} /> : null}
        {highlightedSegment.length > 1 ? (
          <Polyline
            positions={highlightedSegment}
            pathOptions={{ color: "#f76707", weight: 7 }}
            eventHandlers={{
              click: () => {
                if (selected.kind === "segment") onSegmentClick(selected.id);
              },
            }}
          />
        ) : null}
        {pois.map((poi) => (
          <Marker
            key={poi.id}
            position={[poi.lat, poi.lng]}
            eventHandlers={{ click: () => onPoiClick(poi.id) }}
          />
        ))}
        {selected.kind === "geometry"
          ? points.map((point, index) => (
              <Marker
                key={`${point.lat}-${point.lng}-${index}`}
                position={[point.lat, point.lng]}
                draggable
                icon={geometryHandleIcon}
                eventHandlers={{
                  dragend: (event) => {
                    if (!geometry) return;

                    const next = structuredClone(geometry);
                    const latlng = event.target.getLatLng();
                    next.coordinates[index].lat = latlng.lat;
                    next.coordinates[index].lng = latlng.lng;
                    onGeometryChange(next);
                  },
                  click: () => {
                    if (!geometry) return;

                    const next = structuredClone(geometry);
                    next.coordinates.splice(index + 1, 0, {
                      lat: point.lat + 0.002,
                      lng: point.lng + 0.002,
                      distanceKm: point.distanceKm,
                    });
                    onGeometryChange(next);
                  },
                }}
              />
            ))
          : null}
      </MapContainer>
      <div className="map-canvas__hint">
        点击地图可新增 POI；切换到 Geometry 后可拖拽节点改线，也可点击节点在其后插入新点，再用右侧面板继续调整坐标。
      </div>
    </div>
  );
}
