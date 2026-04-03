import type { RouteGeometry } from "../types/route";

interface GeometryEditorPanelProps {
  geometry: RouteGeometry | null;
  onChange: (next: RouteGeometry) => void;
  onSave: (geometry: RouteGeometry) => void;
}

function toNumber(value: string) {
  return value === "" ? 0 : Number(value);
}

export function GeometryEditorPanel({ geometry, onChange, onSave }: GeometryEditorPanelProps) {
  if (!geometry) {
    return (
      <section className="panel form-panel">
        <h2>路线坐标</h2>
        <p>当前没有路线坐标数据。</p>
      </section>
    );
  }

  return (
    <section className="panel form-panel">
      <h2>路线坐标</h2>
      <div className="geometry-list">
        {geometry.coordinates.map((point, index) => (
          <div key={`${index}-${point.lat}-${point.lng}`} className="geometry-row geometry-row--wide">
            <div>{index}</div>
            <input
              type="number"
              step="any"
              value={point.lat}
              onChange={(event) => {
                const next = structuredClone(geometry);
                next.coordinates[index].lat = toNumber(event.currentTarget.value);
                onChange(next);
              }}
            />
            <input
              type="number"
              step="any"
              value={point.lng}
              onChange={(event) => {
                const next = structuredClone(geometry);
                next.coordinates[index].lng = toNumber(event.currentTarget.value);
                onChange(next);
              }}
            />
            <button
              type="button"
              onClick={() => {
                const next = structuredClone(geometry);
                next.coordinates.splice(index + 1, 0, {
                  lat: point.lat + 0.002,
                  lng: point.lng + 0.002,
                  distanceKm: point.distanceKm,
                });
                onChange(next);
              }}
            >
              插入
            </button>
            <button
              type="button"
              disabled={geometry.coordinates.length <= 2}
              onClick={() => {
                const next = structuredClone(geometry);
                next.coordinates.splice(index, 1);
                onChange(next);
              }}
            >
              删除
            </button>
          </div>
        ))}
      </div>
      <button type="button" onClick={() => onSave(geometry)}>
        保存路线坐标
      </button>
    </section>
  );
}
