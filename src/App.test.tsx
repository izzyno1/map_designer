import { render, screen } from "@testing-library/react";
import { createMemoryRouter, RouterProvider } from "react-router-dom";
import { describe, expect, it } from "vitest";
import App from "./App";

describe("app shell", () => {
  it("renders the placeholder route content", () => {
    const router = createMemoryRouter(
      [
        {
          path: "/",
          element: <App />,
          children: [{ index: true, element: <div>Loading app shell...</div> }],
        },
      ],
      { initialEntries: ["/"] },
    );

    render(<RouterProvider router={router} />);

    expect(screen.getByText("Loading app shell...")).toBeInTheDocument();
  });
});
