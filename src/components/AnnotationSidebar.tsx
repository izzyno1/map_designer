import type { SelectedAnnotation, Segment } from "../types/annotation";
import type { RouteDetail, RouteMapDataResponse } from "../types/route";

interface AnnotationSidebarProps {
  route: RouteDetail | null;
  mapData: RouteMapDataResponse | null;
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
  route,
  mapData,
  segments,
  selected,
  onSelectPoi,
  onSelectSegment,
  onSelectGeometry,
}: AnnotationSidebarProps) {
  return (
    <aside className="panel editor-sidebar">
      <section className="editor-sidebar__route">
        <h2>{route?.name ?? "路线编辑器"}</h2>
        <p>{route?.description ?? "暂无路线描述。"}</p>
      </section>

      <section className="editor-sidebar__section">
        <div className="editor-sidebar__section-header">
          <h3>标注列表</h3>
        </div>
        {mapData?.pois.length ? (
          <div className="geometry-list">
            {mapData.pois.map((poi) => (
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
          <p>暂无 POI。</p>
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
          <h3>Geometry</h3>
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
