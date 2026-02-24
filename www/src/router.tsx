import { createBrowserRouter } from "react-router";
import UsersPage, { loader as usersLoader } from "./pages/users";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <UsersPage />,
    loader: usersLoader,
  },
]);
