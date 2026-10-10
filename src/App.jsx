import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import Sidebar from "./components/Sidebar";
import TopNav from "./components/TopNav";
import Login from "./pages/Login";
import Register from "./pages/Register";
import WorkflowList from "./pages/WorkflowList";
import WorkflowBuilder from "./pages/WorkflowBuilder";
import RunHistory from "./pages/RunHistory";
import IntegrationsVault from "./pages/IntegrationsVault";
import LandingPage from "./landing/Landingpage.jsx";
import TemplateGallery from "./pages/TemplateGallery";
import AuthCallback from "./pages/AuthCallback";
import IntegrationCallback from "./pages/IntegrationCallback";
import Billing from "./pages/Billing";
import Notifications from "./pages/Notifications";
// import AdminLayout from "./components/admin/AdminLayout";
// import AdminOverview from "./components/admin/AdminOverview";
// import AdminUsers from "./components/admin/AdminUsers";

// small stub so the other sidebar links don't render blank
// const Soon = ({ title }) => (
//   <div className="text-[13px] text-[#a1a1aa]">{title} is coming soon.</div>
// );

function Shell({ children }) {
  return (
    <div className="flex h-screen w-full bg-background overflow-hidden">
      <Sidebar />
      <div className="flex flex-col flex-1 min-w-0">
        <TopNav />
        <main className="flex-1 relative overflow-hidden">
          {children}
        </main>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Public Landing Page at Root */}
          <Route path="/" element={<LandingPage />} />

          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Catch the OAuth redirects */}
          <Route path="/auth/callback/:provider" element={<AuthCallback />} />

          {/* Authenticated App Routes */}
          <Route
            path="/webhooks"
            element={
              <ProtectedRoute>
                <Shell>
                  <WorkflowList />
                </Shell>
              </ProtectedRoute>
            }
          />
          {/* Optional: Keep /workflows as an alias or redirect */}
          <Route path="/workflows" element={<Navigate to="/webhooks" replace />} />

          <Route
            path="/workflows/:id"
            element={
              <ProtectedRoute>
                <Shell>
                  <WorkflowBuilder />
                </Shell>
              </ProtectedRoute>
            }
          />
          <Route
            path="/workflows/:id/runs"
            element={
              <ProtectedRoute>
                <Shell>
                  <RunHistory />
                </Shell>
              </ProtectedRoute>
            }
          />
          <Route
            path="/integrations"
            element={
              <ProtectedRoute>
                <Shell>
                  <IntegrationsVault />
                </Shell>
              </ProtectedRoute>
            }
          />
          <Route
            path="/integrations/callback/:provider"
            element={
              <ProtectedRoute>
                <IntegrationCallback />
              </ProtectedRoute>
            }
          />
          <Route
            path="/history"
            element={
              <ProtectedRoute>
                <Shell>
                  <RunHistory />
                </Shell>
              </ProtectedRoute>
            }
          />
          <Route
            path="/templates"
            element={
              <ProtectedRoute>
                <Shell>
                  <TemplateGallery />
                </Shell>
              </ProtectedRoute>
            }
          />
          <Route
            path="/billing"
            element={
              <ProtectedRoute>
                <Shell>
                  <Billing />
                </Shell>
              </ProtectedRoute>
            }
          />
          <Route
            path="/notifications"
            element={
              <ProtectedRoute>
                <Shell>
                  <Notifications />
                </Shell>
              </ProtectedRoute>
            }
          />
          {/* <Route
            path="/admin"
            element={
              <ProtectedRoute>
                <AdminLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<AdminOverview />} />
            <Route path="users" element={<AdminUsers />} />
            <Route path="workflows" element={<Soon title="Global workflows" />} />
            <Route path="health" element={<Soon title="System health" />} />
            <Route path="billing" element={<Soon title="Billing" />} />
          </Route>*/}
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
