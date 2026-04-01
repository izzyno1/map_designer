import type { SelectedAnnotation, Segment } from "../types/annotation";

interface SegmentEditorPanelProps {
  selected: SelectedAnnotation;
  segments: Segment[];
  onSave: (nextSegments: Segment[]) => void;
}

function upsertSegment(list: Segment[], next: Segment) {
  const index = list.findIndex((item) => item.id === next.id);
  if (index === -1) {
    return [...list, next];
  }

  const copy = [...list];
  copy[index] = next;
  return copy;
}

function toNumber(value: string) {
  return value === "" ? 0 : Number(value);
}

export function SegmentEditorPanel({ selected, segments, onSave }: SegmentEditorPanelProps) {
  const selectedSegment =
    selected.kind === "segment"
      ? segments.find((item) => item.id === selected.id) ?? null
      : null;

  return (
    <section className="panel form-panel">
      <h2>赛段编辑</h2>
      <button
        type="button"
        onClick={() => {
          const next: Segment = {
            id: crypto.randomUUID(),
            routeId: segments[0]?.routeId ?? "",
            name: "新赛段",
            type: "tempo",
            effort: "",
            rank: "",
            best: "",
            pr: "",
            likes: 0,
            riders: 0,
            startIndex: 0,
            endIndex: 1,
          };

          onSave(upsertSegment(segments, next));
        }}
      >
        新增赛段
      </button>

      {selectedSegment ? (
        <>
          <label>
            名称
            <input
              value={selectedSegment.name}
              onChange={(event) =>
                onSave(
                  upsertSegment(segments, {
                    ...selectedSegment,
                    name: event.currentTarget.value,
                  }),
                )
              }
            />
          </label>
          <label>
            类型
            <select
              value={selectedSegment.type}
              onChange={(event) =>
                onSave(
                  upsertSegment(segments, {
                    ...selectedSegment,
                    type: event.currentTarget.value as Segment["type"],
                  }),
                )
              }
            >
              <option value="climb">climb</option>
              <option value="flat">flat</option>
              <option value="tempo">tempo</option>
              <option value="sprint">sprint</option>
            </select>
          </label>
          <label>
            effort
            <input
              value={selectedSegment.effort ?? ""}
              onChange={(event) =>
                onSave(
                  upsertSegment(segments, {
                    ...selectedSegment,
                    effort: event.currentTarget.value,
                  }),
                )
              }
            />
          </label>
          <label>
            起点索引
            <input
              type="number"
              value={selectedSegment.startIndex ?? 0}
              onChange={(event) =>
                onSave(
                  upsertSegment(segments, {
                    ...selectedSegment,
                    startIndex: toNumber(event.currentTarget.value),
                  }),
                )
              }
            />
          </label>
          <label>
            终点索引
            <input
              type="number"
              value={selectedSegment.endIndex ?? 0}
              onChange={(event) =>
                onSave(
                  upsertSegment(segments, {
                    ...selectedSegment,
                    endIndex: toNumber(event.currentTarget.value),
                  }),
                )
              }
            />
          </label>
        </>
      ) : (
        <p>从左侧选择一个赛段，或先新建赛段。</p>
      )}
    </section>
  );
}
