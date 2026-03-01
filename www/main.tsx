import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import "./tailwind.css";
import "./styles/index.scss";

import {
  createBrowserRouter,
  href,
  Outlet,
  RouterProvider,
} from "react-router";

import HomePage, { loader as homeLoader } from "./pages";
import UsersPage, { loader as usersLoader } from "./pages/users";
import AiTutorPage, { loader as aiTutorLoader } from "./pages/ai-tutor";
import SignInPage from "./pages/sign-in";
import SignUpPage from "./pages/sign-up";
import Navbar from "./components/Navbar";
// import VoiceStudyPage from "./pages/voice-study";

// ── Root layout — shared by all main pages ────────────────────────────────────

function RootLayout() {
  // TODO: replace null with the authenticated user once auth is wired up
  return (
    <>
      <Navbar user={null} />
      <Outlet />
    </>
  );
}

const rootElement = document.getElementById("root");

export const router = createBrowserRouter([
  {
    element: <RootLayout />,
    children: [
      {
        path: href("/"),
        element: <HomePage />,
        loader: homeLoader,
      },
      {
        path: href("/users"),
        element: <UsersPage />,
        loader: usersLoader,
      },
      {
        path: href("/ai-tutor"),
        element: <AiTutorPage />,
        loader: aiTutorLoader,
      },
      // {
      //   path: href("/voice-study"),
      //   element: <VoiceStudyPage />,
      // },
    ],
  },
  // Auth pages — no Navbar, they use their own AuthCard layout
  {
    path: href("/sign-in"),
    element: <SignInPage />,
  },
  {
    path: href("/sign-up"),
    element: <SignUpPage />,
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
