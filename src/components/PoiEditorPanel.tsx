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
  const positionLabel =
    value ? `${value.lat.toFixed(6)}, ${value.lng.toFixed(6)}` : "";

  if (!value) {
    return (
      <section className="panel form-panel">
        <h2>标注点编辑</h2>
        <p>点击地图新增标注点，或从左侧列表选择已有标注点。</p>
      </section>
    );
  }

  return (
    <section className="panel form-panel">
      <h2>{selected.kind === "new-poi" ? "新建标注点" : "标注点编辑"}</h2>
      <label>
        名称
        <input
          value={value.name}
          onChange={(event) => onChange({ ...value, name: event.currentTarget.value })}
        />
      </label>
      <label>
        位置
        <input
          value={positionLabel}
          readOnly
        />
      </label>
      <label>
        备注
        <textarea
          rows={4}
          value={value.description ?? ""}
          onChange={(event) =>
            onChange({ ...value, description: event.currentTarget.value })
          }
        />
      </label>
      <button type="button" onClick={() => onSave(value)}>
        保存标注点
      </button>
      <button type="button" disabled>
        删除按钮（未启用）
      </button>
    </section>
  );
}
