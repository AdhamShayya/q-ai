import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { ToastContainer } from "react-toastify";

import "react-toastify/dist/ReactToastify.css";
import "./tailwind.css";
import "./styles/index.scss";

import {
  createBrowserRouter,
  href,
  Outlet,
  RouterProvider,
  useLoaderData,
} from "react-router";

import { userApi } from "./trpc";
import SignInPage from "./pages/sign-in";
import SignUpPage from "./pages/sign-up";
import Header from "./components/Navbar";
import LandingPage, { loader as landingLoader } from "./pages";
import DashboardPage, { loader as dashboardLoader } from "./pages/dashboard";
import FeaturesPage from "./pages/features";
import AboutPage from "./pages/about";
import ContactPage from "./pages/contact";
import UsersPage, { loader as usersLoader } from "./pages/users";
import AiTutorPage, { loader as aiTutorLoader } from "./pages/ai-tutor";
// import VoiceStudyPage from "./pages/voice-study";

async function rootLoader() {
  const user = await userApi.me.query();
  return { user };
}

function RootLayout() {
  const { user } = useLoaderData<typeof rootLoader>();
  return (
    <>
      <Header user={user} />
      <Outlet />
    </>
  );
}

const rootElement = document.getElementById("root");

export const router = createBrowserRouter([
  {
    element: <RootLayout />,
    loader: rootLoader,
    children: [
      {
        path: href("/"),
        element: <LandingPage />,
        loader: landingLoader,
      },
      {
        path: href("/dashboard"),
        element: <DashboardPage />,
        loader: dashboardLoader,
      },
      {
        path: href("/features"),
        element: <FeaturesPage />,
      },
      {
        path: href("/about"),
        element: <AboutPage />,
      },
      {
        path: href("/contact"),
        element: <ContactPage />,
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

const root = createRoot(rootElement);
root.render(
  <StrictMode>
    <RouterProvider router={router} />
    <ToastContainer position="bottom-right" autoClose={4000} />
  </StrictMode>,
);

// Properly unmount the React root before HMR replaces this module.
// Without this, every hot update re-executes createRoot() on the same
// DOM node and the old root is never cleaned up, causing duplications.
if ((import.meta as any).hot) {
  (import.meta as any).hot.dispose(() => {
    root.unmount();
  });
}
