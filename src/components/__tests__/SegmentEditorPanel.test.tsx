import React, { useState } from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
import { SegmentEditorPanel } from "../SegmentEditorPanel";
import type { Segment } from "../../types/annotation";

void React;

describe("SegmentEditorPanel", () => {
  it("uses the current route id when creating the first segment", async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    const onChange = vi.fn();

    render(
      <MemoryRouter initialEntries={["/routes/route-1"]}>
        <Routes>
          <Route
            path="/routes/:routeId"
            element={
              <SegmentEditorPanel
                selected={{ kind: "none" }}
                segments={[]}
                onSelect={onSelect}
                onChange={onChange}
              />
            }
          />
        </Routes>
      </MemoryRouter>,
    );

    await user.click(screen.getByRole("button", { name: "新增赛段" }));

    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange.mock.calls[0][0][0]).toMatchObject({
      routeId: "route-1",
      name: "新赛段",
      type: "tempo",
    });
    expect(onSelect).toHaveBeenCalledTimes(1);
  });

  it("updates rank best pr likes and riders for the selected segment", async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    const onChange = vi.fn();

    function Harness() {
      const [segments, setSegments] = useState<Segment[]>([
        {
          id: "segment-1",
          routeId: "route-1",
          name: "赛段 1",
          type: "tempo",
          effort: "",
          rank: "",
          best: "",
          pr: "",
          likes: 0,
          riders: 0,
          startIndex: 0,
          endIndex: 1,
        },
      ]);

      return (
        <SegmentEditorPanel
          selected={{ kind: "segment", id: "segment-1" }}
          segments={segments}
          onSelect={onSelect}
          onChange={(nextSegments) => {
            setSegments(nextSegments);
            onChange(nextSegments);
          }}
        />
      );
    }

    render(
      <MemoryRouter initialEntries={["/routes/route-1"]}>
        <Routes>
          <Route
            path="/routes/:routeId"
            element={<Harness />}
          />
        </Routes>
      </MemoryRouter>,
    );

    await user.type(screen.getByLabelText("排名"), "A");
    await user.type(screen.getByLabelText("最佳成绩"), "1:23:45");
    await user.type(screen.getByLabelText("个人纪录"), "1:20:10");
    await user.clear(screen.getByLabelText("点赞数"));
    await user.type(screen.getByLabelText("点赞数"), "18");
    await user.clear(screen.getByLabelText("骑行人数"));
    await user.type(screen.getByLabelText("骑行人数"), "42");

    expect(onChange).toHaveBeenCalled();
    expect(onChange.mock.calls.at(-1)?.[0][0]).toMatchObject({
      rank: "A",
      best: "1:23:45",
      pr: "1:20:10",
      likes: 18,
      riders: 42,
    });
  });
});
