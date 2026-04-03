import type { DraftSegment, DraftSelection } from "../types/draft";

interface DraftSegmentEditorPanelProps {
  selection: DraftSelection;
  segment: DraftSegment | null;
  drawingPointCount: number;
  onChange: (next: DraftSegment) => void;
  onDelete: () => void;
}

export function DraftSegmentEditorPanel({
  selection,
  segment,
  drawingPointCount,
  onChange,
  onDelete,
}: DraftSegmentEditorPanelProps) {
  if (!segment) {
    return (
      <section className="panel form-panel">
        <h2>赛段编辑</h2>
        {drawingPointCount > 0 ? (
          <p>赛段绘制中，已放置 {drawingPointCount} 个点。完成后可编辑名称和备注。</p>
        ) : (
          <p>先点击“新增赛段”，然后在地图上连续点击多个点。</p>
        )}
      </section>
    );
  }

  return (
    <section className="panel form-panel">
      <h2>{selection.kind === "segment" ? "赛段编辑" : "赛段"}</h2>
      <label>
        名称
        <input
          value={segment.name}
          onChange={(event) => onChange({ ...segment, name: event.currentTarget.value })}
        />
      </label>
      <label>
        点数
        <input value={`${segment.points.length}`} readOnly />
      </label>
      <label>
        备注
        <textarea
          rows={4}
          value={segment.remark ?? ""}
          onChange={(event) => onChange({ ...segment, remark: event.currentTarget.value })}
        />
      </label>
      <button type="button" className="danger-button" onClick={onDelete}>
        删除赛段
      </button>
    </section>
  );
}
