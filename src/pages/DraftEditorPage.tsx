import { AppShell } from "../components/AppShell";
import { DraftAnnotationSidebar } from "../components/DraftAnnotationSidebar";
import { DraftMapCanvas } from "../components/DraftMapCanvas";
import { DraftPoiEditorPanel } from "../components/DraftPoiEditorPanel";
import { DraftSegmentEditorPanel } from "../components/DraftSegmentEditorPanel";
import { StatusBanner } from "../components/StatusBanner";
import { useDraftAnnotationData } from "../hooks/useDraftAnnotationData";

export function DraftEditorPage() {
  const draftEditor = useDraftAnnotationData();

  return (
    <AppShell
      title="地图标注编辑器"
      subtitle="左侧清单，中间地图，右侧属性编辑"
      actions={
        <div className="toolbar-actions">
          <button
            type="button"
            className="toolbar-button"
            onClick={draftEditor.startCreatePoiMode}
            disabled={draftEditor.loading || draftEditor.mode === "draw-segment" || draftEditor.snapping}
          >
            新增标注点
          </button>
          <button
            type="button"
            className="toolbar-button"
            onClick={draftEditor.startSegmentDrawMode}
            disabled={draftEditor.loading || draftEditor.mode === "draw-segment" || draftEditor.snapping}
          >
            新增赛段
          </button>
          <button
            type="button"
            className="toolbar-button"
            onClick={() => void draftEditor.finishSegmentDrawMode()}
            disabled={draftEditor.mode !== "draw-segment" || draftEditor.snapping}
          >
            {draftEditor.snapping ? "贴路中..." : "完成赛段"}
          </button>
          <button
            type="button"
            className="toolbar-button"
            onClick={draftEditor.cancelSegmentDrawMode}
            disabled={draftEditor.mode !== "draw-segment" || draftEditor.snapping}
          >
            取消绘制
          </button>
          <button
            type="button"
            className="toolbar-button"
            onClick={() => void draftEditor.saveCurrentDraft()}
            disabled={draftEditor.loading || draftEditor.saving || draftEditor.snapping}
          >
            保存标注
          </button>
          <button
            type="button"
            className="toolbar-button"
            onClick={() => void draftEditor.exportCurrentDraft()}
            disabled={draftEditor.loading}
          >
            导出 JSON
          </button>
          <div className="toolbar-chip">{draftEditor.saving ? "保存中..." : "可编辑"}</div>
        </div>
      }
    >
      <div className="editor-page">
        <div className="editor-page__status">
          <StatusBanner tone={draftEditor.source === "api" ? "success" : "warning"}>
            {draftEditor.source === "api" ? "已连接后端接口" : "当前使用本地演示数据"}
          </StatusBanner>
          {draftEditor.message ? <StatusBanner tone="neutral">{draftEditor.message}</StatusBanner> : null}
        </div>

        {draftEditor.loading ? (
          <div className="panel">正在加载标注编辑器...</div>
        ) : (
          <section className="editor-layout">
            <DraftAnnotationSidebar
              draft={draftEditor.draft}
              selection={draftEditor.selection}
              onSelectPoi={draftEditor.selectPoi}
              onSelectSegment={draftEditor.selectSegment}
            />
            <DraftMapCanvas
              draft={draftEditor.draft}
              selection={draftEditor.selection}
              mode={draftEditor.mode}
              segmentDraftPoints={draftEditor.segmentDraftPoints}
              onMapClick={draftEditor.onMapClick}
              onSelectPoi={draftEditor.selectPoi}
              onSelectSegment={draftEditor.selectSegment}
              onViewportChange={draftEditor.updateViewport}
            />
            <div className="editor-panel-stack">
              <DraftPoiEditorPanel
                selection={draftEditor.selection}
                poi={draftEditor.selectedPoi}
                onChange={draftEditor.updateSelectedPoi}
                onDelete={draftEditor.deleteSelectedPoi}
              />
              <DraftSegmentEditorPanel
                selection={draftEditor.selection}
                segment={draftEditor.selectedSegment}
                drawingPointCount={draftEditor.segmentDraftPoints.length}
                onChange={draftEditor.updateSelectedSegment}
                onDelete={draftEditor.deleteSelectedSegment}
              />
            </div>
          </section>
        )}
      </div>
    </AppShell>
  );
}
