import { createBrowserRouter, Navigate } from "react-router-dom";
import App from "../App";
import { RouteEditorPage } from "../pages/RouteEditorPage";
import { RouteListPage } from "../pages/RouteListPage";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <App />,
    children: [
      { index: true, element: <RouteListPage /> },
      { path: "routes/:routeId", element: <RouteEditorPage /> },
      { path: "*", element: <Navigate to="/" replace /> },
    ],
  },
]);
