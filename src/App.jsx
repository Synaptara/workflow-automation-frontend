import { lazy, Suspense } from "react";
import { BrowserRouter, Routes, Route, Navigate, Outlet } from "react-router-dom";
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

const Loading = () => (
  <div className="h-full min-h-[200px] flex items-center justify-center">
    <div className="w-4 h-4 rounded-full border-2 border-muted-foreground border-t-transparent animate-spin" />
  </div>
);

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
        <Suspense fallback={<Loading />}>
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/auth/callback/:provider" element={<AuthCallback />} />
            <Route path="/integrations/callback/:provider" element={<ProtectedRoute><IntegrationCallback /></ProtectedRoute>} />

            <Route element={<AppLayout />}>
              <Route path="/webhooks" element={<WorkflowList />} />
              <Route path="/workflows" element={<Navigate to="/webhooks" replace />} />
              <Route path="/workflows/:id" element={<WorkflowBuilder />} />
              <Route path="/workflows/:id/runs" element={<RunHistory />} />
              <Route path="/history" element={<RunHistory />} />
              <Route path="/integrations" element={<IntegrationsVault />} />
              <Route path="/templates" element={<TemplateGallery />} />
              <Route path="/billing" element={<Billing />} />
              <Route path="/notifications" element={<Notifications />} />
            </Route>

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </AuthProvider>
    </BrowserRouter>
  );
}
