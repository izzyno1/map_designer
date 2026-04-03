import { createBrowserRouter, Navigate } from "react-router-dom";
import App from "../App";
import { DraftEditorPage } from "../pages/DraftEditorPage";
import { DraftEntryPage } from "../pages/DraftEntryPage";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <App />,
    children: [
      { index: true, element: <DraftEntryPage /> },
      { path: "draft", element: <DraftEditorPage /> },
      { path: "routes/:routeId", element: <Navigate to="/draft" replace /> },
      { path: "*", element: <Navigate to="/" replace /> },
    ],
  },
]);
