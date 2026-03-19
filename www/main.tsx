import { StrictMode, useEffect } from "react";
import { createRoot } from "react-dom/client";
import { ToastContainer } from "react-toastify";
import { useThemeStore } from "./store/theme";

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
import LandingPage from "./pages";
import AboutPage from "./pages/about";
import Header from "./components/Navbar";
import SignInPage from "./pages/sign-in";
import Footer from "./components/Footer";
import SignUpPage from "./pages/sign-up";
import ContactPage from "./pages/contact";
import FeaturesPage from "./pages/features";
import UsersPage, { loader as usersLoader } from "./pages/users";
import AiTutorPage, { loader as aiTutorLoader } from "./pages/ai-tutor";
import SettingsPage, { loader as settingsLoader } from "./pages/settings";
import DashboardPage, { loader as dashboardLoader } from "./pages/dashboard";
import OnboardingPage, { loader as onboardingLoader } from "./pages/onboarding";
import PersonaQuizPage, {
  loader as personaQuizLoader,
} from "./pages/persona-quiz";
// import VoiceStudyPage from "./pages/voice-study";

async function rootLoader() {
  const user = await userApi.me.query();
  return { user };
}

function ThemeSync() {
  const isDark = useThemeStore((s) => s.isDark);
  useEffect(() => {
    document.documentElement.dataset.theme = isDark ? "dark" : "light";
  }, [isDark]);
  return null;
}

function RootLayout() {
  const { user } = useLoaderData<typeof rootLoader>();
  return (
    <>
      <ThemeSync />
      <Header user={user} />
      <Outlet />
      {window.location.pathname !== href("/ai-tutor") && <Footer />}
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
      {
        path: href("/settings"),
        element: <SettingsPage />,
        loader: settingsLoader,
      },
      {
        path: href("/persona-quiz"),
        element: <PersonaQuizPage />,
        loader: personaQuizLoader,
      },
      {
        path: href("/onboarding"),
        element: <OnboardingPage />,
        loader: onboardingLoader,
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
