import type { DraftPoi, SelectedAnnotation } from "../types/annotation";
import type { Poi } from "../types/route";

interface PoiEditorPanelProps {
  selected: SelectedAnnotation;
  selectedPoi: Poi | null;
  draftPoi: DraftPoi | null;
  onChange: (next: DraftPoi) => void;
  onSave: (next: DraftPoi) => void;
}

export function PoiEditorPanel({
  selected,
  selectedPoi,
  draftPoi,
  onChange,
  onSave,
}: PoiEditorPanelProps) {
  const value: DraftPoi | null = draftPoi ?? (selectedPoi ? ({ ...selectedPoi } as DraftPoi) : null);

  if (!value) {
    return (
      <section className="panel form-panel">
        <h2>POI 编辑</h2>
        <p>点击地图新增补给点，或从左侧列表选择已有 POI。</p>
      </section>
    );
  }

  return (
    <section className="panel form-panel">
      <h2>{selected.kind === "new-poi" ? "新建 POI" : "POI 编辑"}</h2>
      <label>
        名称
        <input
          value={value.name}
          onChange={(event) => onChange({ ...value, name: event.currentTarget.value })}
        />
      </label>
      <label>
        类型
        <select
          value={value.type}
          onChange={(event) =>
            onChange({
              ...value,
              type: event.currentTarget.value as Poi["type"],
            })
          }
        >
          <option value="supply">supply</option>
          <option value="coffee">coffee</option>
          <option value="repair">repair</option>
          <option value="meetup">meetup</option>
        </select>
      </label>
      <label>
        图标名
        <input
          value={value.iconName ?? ""}
          onChange={(event) =>
            onChange({ ...value, iconName: event.currentTarget.value })
          }
        />
      </label>
      <label>
        距离文案
        <input
          value={value.distanceLabel ?? ""}
          onChange={(event) =>
            onChange({ ...value, distanceLabel: event.currentTarget.value })
          }
        />
      </label>
      <label>
        描述
        <textarea
          rows={4}
          value={value.description ?? ""}
          onChange={(event) =>
            onChange({ ...value, description: event.currentTarget.value })
          }
        />
      </label>
      <label>
        备注 tone
        <input
          value={value.tone ?? ""}
          onChange={(event) => onChange({ ...value, tone: event.currentTarget.value })}
        />
      </label>
      <button type="button" onClick={() => onSave(value)}>
        保存 POI
      </button>
      <button type="button" disabled>
        删除按钮（未启用）
      </button>
    </section>
  );
}
