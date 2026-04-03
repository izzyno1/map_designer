import type { AnnotationDraft, DraftSelection } from "../types/draft";

interface DraftAnnotationSidebarProps {
  draft: AnnotationDraft | null;
  selection: DraftSelection;
  onSelectPoi: (id: string) => void;
  onSelectSegment: (id: string) => void;
}

function itemClass(isActive: boolean) {
  return isActive ? "list-item is-active" : "list-item";
}

export function DraftAnnotationSidebar({
  draft,
  selection,
  onSelectPoi,
  onSelectSegment,
}: DraftAnnotationSidebarProps) {
  return (
    <aside className="panel editor-sidebar">
      <section className="editor-sidebar__route">
        <h2>当前标注稿</h2>
        <p>单草稿模式，仅维护当前这份地图标注。</p>
      </section>

      <section className="editor-sidebar__section">
        <div className="editor-sidebar__section-header">
          <h3>标注点 ({draft?.pois.length ?? 0})</h3>
        </div>
        {draft && draft.pois.length > 0 ? (
          <div className="geometry-list">
            {draft.pois.map((poi) => (
              <button
                key={poi.id}
                type="button"
                className={itemClass(selection.kind === "poi" && selection.id === poi.id)}
                onClick={() => onSelectPoi(poi.id)}
              >
                {poi.name}
              </button>
            ))}
          </div>
        ) : (
          <p>暂无标注点。</p>
        )}
      </section>

      <section className="editor-sidebar__section">
        <div className="editor-sidebar__section-header">
          <h3>赛段 ({draft?.segments.length ?? 0})</h3>
        </div>
        {draft && draft.segments.length > 0 ? (
          <div className="geometry-list">
            {draft.segments.map((segment) => (
              <button
                key={segment.id}
                type="button"
                className={itemClass(selection.kind === "segment" && selection.id === segment.id)}
                onClick={() => onSelectSegment(segment.id)}
              >
                {segment.name}
              </button>
            ))}
          </div>
        ) : (
          <p>暂无赛段。</p>
        )}
      </section>
    </aside>
  );
}
