import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { createBrowserRouter, RouterProvider } from "react-router";
import UsersPage, { loader as usersLoader } from "./pages/users";

const router = createBrowserRouter([
  {
    path: "/",
    element: <UsersPage />,
    loader: usersLoader,
  },
]);

const rootElement = document.getElementById("root");

if (rootElement == null) {
  throw new Error("Root element not found");
}

createRoot(rootElement).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>,
);
