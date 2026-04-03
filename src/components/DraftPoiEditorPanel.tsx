import type { DraftPoi, DraftSelection } from "../types/draft";

interface DraftPoiEditorPanelProps {
  selection: DraftSelection;
  poi: DraftPoi | null;
  onChange: (next: DraftPoi) => void;
  onDelete: () => void;
}

export function DraftPoiEditorPanel({
  selection,
  poi,
  onChange,
  onDelete,
}: DraftPoiEditorPanelProps) {
  if (!poi) {
    return (
      <section className="panel form-panel">
        <h2>标注点编辑</h2>
        <p>先从顶部点击“新增标注点”，再在地图上点一个位置。</p>
      </section>
    );
  }

  return (
    <section className="panel form-panel">
      <h2>{selection.kind === "poi" ? "标注点编辑" : "标注点"}</h2>
      <label>
        名称
        <input
          value={poi.name}
          onChange={(event) => onChange({ ...poi, name: event.currentTarget.value })}
        />
      </label>
      <label>
        位置
        <input value={`${poi.lat.toFixed(6)}, ${poi.lng.toFixed(6)}`} readOnly />
      </label>
      <label>
        备注
        <textarea
          rows={4}
          value={poi.remark ?? ""}
          onChange={(event) => onChange({ ...poi, remark: event.currentTarget.value })}
        />
      </label>
      <button type="button" className="danger-button" onClick={onDelete}>
        删除标注点
      </button>
    </section>
  );
}
