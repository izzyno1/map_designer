import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { describe, expect, it, vi } from "vitest";
import type { DraftPoi } from "../../types/annotation";
import { PoiEditorPanel } from "../PoiEditorPanel";

void React;

describe("PoiEditorPanel", () => {
  it("shows only name location and remark fields for POI editing", () => {
    render(
      <PoiEditorPanel
        selected={{ kind: "new-poi" }}
        selectedPoi={null}
        draftPoi={{
          id: "draft-poi",
          isNew: true,
          name: "",
          type: "supply",
          iconName: "",
          distanceLabel: "",
          description: "",
          tone: "",
          lat: 37.8735,
          lng: 112.5624,
        }}
        onChange={vi.fn()}
        onSave={vi.fn()}
      />,
    );

    expect(screen.getByLabelText("名称")).toBeInTheDocument();
    expect(screen.getByLabelText("位置")).toBeInTheDocument();
    expect(screen.getByLabelText("备注")).toBeInTheDocument();
    expect(screen.queryByLabelText("类型")).not.toBeInTheDocument();
    expect(screen.queryByLabelText("图标名")).not.toBeInTheDocument();
    expect(screen.queryByLabelText("距离文案")).not.toBeInTheDocument();
    expect(screen.queryByLabelText("备注 tone")).not.toBeInTheDocument();
  });

  it("writes remark changes back into the poi draft", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();

    function Harness() {
      const [draftPoi, setDraftPoi] = useState<DraftPoi>({
        id: "draft-poi",
        isNew: true,
        name: "补给点 A",
        type: "supply" as const,
        iconName: "",
        distanceLabel: "",
        description: "",
        tone: "",
        lat: 37.8735,
        lng: 112.5624,
      });

      return (
        <PoiEditorPanel
          selected={{ kind: "new-poi" }}
          selectedPoi={null}
          draftPoi={draftPoi}
          onChange={(next) => {
            setDraftPoi(next);
            onChange(next);
          }}
          onSave={vi.fn()}
        />
      );
    }

    render(<Harness />);

    await user.type(screen.getByLabelText("备注"), "桥下集合");

    expect(onChange).toHaveBeenCalled();
    expect(onChange.mock.calls.at(-1)?.[0]).toMatchObject({
      name: "补给点 A",
      description: "桥下集合",
      lat: 37.8735,
      lng: 112.5624,
      type: "supply",
    });
  });
});
