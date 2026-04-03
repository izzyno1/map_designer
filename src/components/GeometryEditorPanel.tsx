import { useEffect, useState } from "react";
import { getRouteGeometrySnapDisabledReason } from "../lib/constants";
import type { RouteGeometry } from "../types/route";

interface GeometryEditorPanelProps {
  geometry: RouteGeometry | null;
  onChange: (next: RouteGeometry) => void;
  onSave: (geometry: RouteGeometry) => void;
  onSnap?: (geometry: RouteGeometry) => void;
  snapping?: boolean;
}

function parseNumberInput(value: string) {
  if (value.trim() === "") {
    return null;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

interface GeometryNumberInputProps {
  value: number;
  label: string;
  onCommit: (next: number) => void;
}

function GeometryNumberInput({ value, label, onCommit }: GeometryNumberInputProps) {
  const [text, setText] = useState(String(value));

  useEffect(() => {
    setText(String(value));
  }, [value]);

  return (
    <input
      type="text"
      inputMode="decimal"
      aria-label={label}
      step="any"
      value={text}
      onChange={(event) => {
        const nextText = event.currentTarget.value;
        setText(nextText);

        const next = parseNumberInput(nextText);
        if (next !== null) {
          onCommit(next);
        }
      }}
      onBlur={() => {
        const next = parseNumberInput(text);
        if (next === null) {
          setText(String(value));
        }
      }}
    />
  );
}

export function GeometryEditorPanel({
  geometry,
  onChange,
  onSave,
  onSnap,
  snapping = false,
}: GeometryEditorPanelProps) {
  if (!geometry) {
    return (
      <section className="panel form-panel">
        <h2>路线坐标</h2>
        <p>当前没有路线坐标数据。</p>
        <button
          type="button"
          className="toolbar-button geometry-button"
          disabled
          title="至少需要两个坐标点"
        >
          一键贴路
        </button>
      </section>
    );
  }

  const snapDisabledReason = getRouteGeometrySnapDisabledReason(geometry.coordinates.length);
  const canSnap = snapDisabledReason === null;

  return (
    <section className="panel form-panel">
      <h2>路线坐标</h2>
      <div className="geometry-list">
        {geometry.coordinates.map((point, index) => (
          <div key={`${index}-${point.lat}-${point.lng}`} className="geometry-row geometry-row--wide">
            <div>{index}</div>
            <GeometryNumberInput
              label={`路线坐标 ${index} 纬度`}
              value={point.lat}
              onCommit={(nextLat) => {
                const next = structuredClone(geometry);
                next.coordinates[index].lat = nextLat;
                onChange(next);
              }}
            />
            <GeometryNumberInput
              label={`路线坐标 ${index} 经度`}
              value={point.lng}
              onCommit={(nextLng) => {
                const next = structuredClone(geometry);
                next.coordinates[index].lng = nextLng;
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
      <div className="geometry-actions">
        <button
          type="button"
          className="toolbar-button geometry-button"
          onClick={() => onSnap?.(geometry)}
          disabled={!canSnap || snapping}
          title={snapDisabledReason ?? undefined}
        >
          {snapping ? "贴路中..." : "一键贴路"}
        </button>
        {snapDisabledReason ? <p className="geometry-hint">{snapDisabledReason}</p> : null}
      </div>
      <button type="button" onClick={() => onSave(geometry)}>
        保存路线坐标
      </button>
    </section>
  );
}
