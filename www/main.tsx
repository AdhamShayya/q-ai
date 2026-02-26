import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import "./tailwind.css";
import "./styles/index.scss";

import { createBrowserRouter, href, RouterProvider } from "react-router";

import HomePage from "./pages";
import UsersPage, { loader as usersLoader } from "./pages/users";
import AiTutorPage from "./pages/ai-tutor";

const rootElement = document.getElementById("root");

export const router = createBrowserRouter([
  {
    path: href("/"),
    element: <HomePage />,
  },
  {
    path: href("/users"),
    element: <UsersPage />,
    loader: usersLoader,
  },
  {
    path: href("/ai-tutor"),
    element: <AiTutorPage />,
  },
]);

if (rootElement == null) {
  throw new Error("Root element not found");
}

createRoot(rootElement).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>,
);
