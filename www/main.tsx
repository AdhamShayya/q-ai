import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import "./tailwind.css";
import "./styles/index.scss";

import { createBrowserRouter, href, RouterProvider } from "react-router";

import HomePage, { loader as homeLoader } from "./pages";
import UsersPage, { loader as usersLoader } from "./pages/users";
import AiTutorPage, { loader as aiTutorLoader } from "./pages/ai-tutor";
// import VoiceStudyPage from "./pages/voice-study";

const rootElement = document.getElementById("root");

export const router = createBrowserRouter([
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
]);

if (rootElement == null) {
  throw new Error("Root element not found");
}

createRoot(rootElement).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>,
);
