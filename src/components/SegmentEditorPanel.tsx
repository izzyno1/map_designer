import { useParams } from "react-router-dom";
import type { SelectedAnnotation, Segment } from "../types/annotation";

interface SegmentEditorPanelProps {
  selected: SelectedAnnotation;
  segments: Segment[];
  onSelect: (id: string) => void;
  onChange: (nextSegments: Segment[]) => void;
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

export function SegmentEditorPanel({
  selected,
  segments,
  onSelect,
  onChange,
}: SegmentEditorPanelProps) {
  const { routeId = "" } = useParams();
  const selectedSegment =
    selected.kind === "segment"
      ? segments.find((item) => item.id === selected.id) ?? null
      : null;

  function upsertNext(next: Segment) {
    return upsertSegment(segments, next);
  }

  return (
    <section className="panel form-panel">
      <h2>赛段编辑</h2>
      <button
        type="button"
        onClick={() => {
          const next: Segment = {
            id: crypto.randomUUID(),
            routeId: segments[0]?.routeId ?? routeId,
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

          onChange(upsertNext(next));
          onSelect(next.id);
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
                onChange(
                  upsertNext({
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
                onChange(
                  upsertNext({
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
                onChange(
                  upsertNext({
                    ...selectedSegment,
                    effort: event.currentTarget.value,
                  }),
                )
              }
            />
          </label>
          <label>
            rank
            <input
              value={selectedSegment.rank ?? ""}
              onChange={(event) =>
                onChange(
                  upsertNext({
                    ...selectedSegment,
                    rank: event.currentTarget.value,
                  }),
                )
              }
            />
          </label>
          <label>
            best
            <input
              value={selectedSegment.best ?? ""}
              onChange={(event) =>
                onChange(
                  upsertNext({
                    ...selectedSegment,
                    best: event.currentTarget.value,
                  }),
                )
              }
            />
          </label>
          <label>
            pr
            <input
              value={selectedSegment.pr ?? ""}
              onChange={(event) =>
                onChange(
                  upsertNext({
                    ...selectedSegment,
                    pr: event.currentTarget.value,
                  }),
                )
              }
            />
          </label>
          <label>
            likes
            <input
              type="number"
              value={selectedSegment.likes ?? 0}
              onChange={(event) =>
                onChange(
                  upsertNext({
                    ...selectedSegment,
                    likes: toNumber(event.currentTarget.value),
                  }),
                )
              }
            />
          </label>
          <label>
            riders
            <input
              type="number"
              value={selectedSegment.riders ?? 0}
              onChange={(event) =>
                onChange(
                  upsertNext({
                    ...selectedSegment,
                    riders: toNumber(event.currentTarget.value),
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
                onChange(
                  upsertNext({
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
                onChange(
                  upsertNext({
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
