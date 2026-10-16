import { lazy, Suspense, useEffect } from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  Outlet,
  Link,
  useLocation,
} from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import Sidebar from "./components/Sidebar";
import TopNav from "./components/TopNav";

const LandingPage = lazy(() => import("./landing/Landingpage.jsx"));
const Login = lazy(() => import("./pages/Login"));
const Register = lazy(() => import("./pages/Register"));
const AuthCallback = lazy(() => import("./pages/AuthCallback"));
const IntegrationCallback = lazy(() => import("./pages/IntegrationCallback"));
const WorkflowList = lazy(() => import("./pages/WorkflowList"));
const WorkflowBuilder = lazy(() => import("./pages/WorkflowBuilder"));
const RunHistory = lazy(() => import("./pages/RunHistory"));
const IntegrationsVault = lazy(() => import("./pages/IntegrationsVault"));
const TemplateGallery = lazy(() => import("./pages/TemplateGallery"));
const Billing = lazy(() => import("./pages/Billing"));
const Notifications = lazy(() => import("./pages/Notifications"));

const ROUTE_TITLES = {
  "/": "Orkflo — Event-Driven Workflow Automation",
  "/login": "Sign In — Orkflo",
  "/register": "Create Account — Orkflo",
  "/webhooks": "Workflows — Orkflo",
  "/history": "Executions — Orkflo",
  "/integrations": "Integrations Vault — Orkflo",
  "/templates": "Templates — Orkflo",
  "/billing": "Billing & Usage — Orkflo",
  "/notifications": "Notifications — Orkflo",
};

function RouteTitleUpdater() {
  const { pathname } = useLocation();
  useEffect(() => {
    if (ROUTE_TITLES[pathname]) {
      document.title = ROUTE_TITLES[pathname];
    } else if (pathname.startsWith("/workflows/")) {
      document.title = "Workflow Builder — Orkflo";
    } else {
      document.title = "Page Not Found — Orkflo";
    }
  }, [pathname]);
  return null;
}

const Loading = () => (
  <div className="h-full min-h-[200px] flex items-center justify-center">
    <div className="w-4 h-4 rounded-full border-2 border-muted-foreground border-t-transparent animate-spin" />
  </div>
);

function NotFound() {
  return (
    <main className="min-h-dvh w-full bg-background text-foreground flex flex-col items-center justify-center px-6 text-center gap-4">
      <span className="font-mono text-xs uppercase tracking-widest text-muted-foreground border border-border rounded-full px-3 py-1">
        404 · Page not found
      </span>
      <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight">
        This page doesn&apos;t exist
      </h1>
      <p className="text-sm text-muted-foreground max-w-[40ch]">
        The link you followed may be broken, or the page may have been moved.
      </p>
      <div className="flex items-center gap-3 mt-2">
        <Link
          to="/"
          className="h-9 px-4 rounded-md bg-foreground text-background text-xs font-medium inline-flex items-center justify-center hover:opacity-90 transition-opacity"
        >
          Back to home
        </Link>
        <Link
          to="/webhooks"
          className="h-9 px-4 rounded-md border border-border bg-card text-foreground text-xs font-medium inline-flex items-center justify-center hover:bg-accent transition-colors"
        >
          Go to dashboard
        </Link>
      </div>
    </main>
  );
}

function AppLayout() {
  return (
    <ProtectedRoute>
      <div className="flex h-dvh w-full bg-background overflow-hidden">
        <Sidebar />
        <div className="flex flex-col flex-1 min-w-0">
          <TopNav />
          <main className="flex-1 relative overflow-hidden">
            <Suspense fallback={<Loading />}>
              <Outlet />
            </Suspense>
          </main>
        </div>
      </div>
    </ProtectedRoute>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <RouteTitleUpdater />
        <Suspense fallback={<Loading />}>
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/auth/callback/:provider" element={<AuthCallback />} />
            <Route
              path="/integrations/callback/:provider"
              element={
                <ProtectedRoute>
                  <IntegrationCallback />
                </ProtectedRoute>
              }
            />

            <Route element={<AppLayout />}>
              <Route path="/webhooks" element={<WorkflowList />} />
              <Route
                path="/workflows"
                element={<Navigate to="/webhooks" replace />}
              />
              <Route path="/workflows/:id" element={<WorkflowBuilder />} />
              <Route path="/workflows/:id/runs" element={<RunHistory />} />
              <Route path="/history" element={<RunHistory />} />
              <Route path="/integrations" element={<IntegrationsVault />} />
              <Route path="/templates" element={<TemplateGallery />} />
              <Route path="/billing" element={<Billing />} />
              <Route path="/notifications" element={<Notifications />} />
            </Route>

            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </AuthProvider>
    </BrowserRouter>
  );
}
