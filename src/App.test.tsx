import React from "react";
import { render, screen } from "@testing-library/react";
import { createMemoryRouter, RouterProvider } from "react-router-dom";
import { describe, expect, it } from "vitest";
import App from "./App";

void React;

describe("app shell", () => {
  it("renders the placeholder route content", () => {
    const router = createMemoryRouter(
      [
        {
          path: "/",
          element: <App />,
          children: [{ index: true, element: <div>正在加载应用外壳...</div> }],
        },
      ],
      { initialEntries: ["/"] },
    );

    render(<RouterProvider router={router} />);

    expect(screen.getByText("正在加载应用外壳...")).toBeInTheDocument();
  });
});
