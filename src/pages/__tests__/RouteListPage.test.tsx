import React from "react";
import { MemoryRouter } from "react-router-dom";
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import * as routesApi from "../../api/routes";
import { RouteListPage } from "../RouteListPage";

describe("RouteListPage", () => {
  it("renders route cards from the loader", async () => {
    vi.spyOn(routesApi, "getRouteList").mockResolvedValue({
      source: "mock",
      data: [
        {
          id: "route-1",
          name: "测试路线",
          distanceKm: 88.8,
          status: "draft",
        },
      ],
    });

    render(React.createElement(MemoryRouter, null, React.createElement(RouteListPage)));

    expect(await screen.findByText("测试路线")).toBeInTheDocument();
    expect(screen.getByText("88.8 km")).toBeInTheDocument();
  });
});
