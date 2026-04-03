import type { Poi } from "../types/route";
import type { SelectedAnnotation, Segment } from "../types/annotation";

interface AnnotationSidebarProps {
  routeName?: string;
  routeDescription?: string;
  pois: Poi[];
  segments: Segment[];
  selected: SelectedAnnotation;
  onSelectPoi: (id: string) => void;
  onSelectSegment: (id: string) => void;
  onSelectGeometry: () => void;
}

function getItemClass(isActive: boolean) {
  return isActive ? "list-item is-active" : "list-item";
}

export function AnnotationSidebar({
  routeName,
  routeDescription,
  pois,
  segments,
  selected,
  onSelectPoi,
  onSelectSegment,
  onSelectGeometry,
}: AnnotationSidebarProps) {
  return (
    <aside className="panel editor-sidebar">
      <section className="editor-sidebar__route">
        <h2>{routeName ?? "路线编辑器"}</h2>
        <p>{routeDescription ?? "暂无路线描述。"}</p>
      </section>

      <section className="editor-sidebar__section">
        <div className="editor-sidebar__section-header">
          <h3>标注列表</h3>
        </div>
        {pois.length ? (
          <div className="geometry-list">
            {pois.map((poi) => (
              <button
                key={poi.id}
                type="button"
                className={getItemClass(selected.kind === "poi" && selected.id === poi.id)}
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
          <h3>赛段</h3>
        </div>
        {segments.length ? (
          <div className="geometry-list">
            {segments.map((segment) => (
              <button
                key={segment.id}
                type="button"
                className={getItemClass(
                  selected.kind === "segment" && selected.id === segment.id,
                )}
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

      <section className="editor-sidebar__section">
        <div className="editor-sidebar__section-header">
          <h3>路线坐标</h3>
        </div>
        <button
          type="button"
          className={getItemClass(selected.kind === "geometry")}
          onClick={onSelectGeometry}
        >
          编辑路线坐标
        </button>
        <p>拖拽节点或右侧手动编辑</p>
      </section>
    </aside>
  );
}
