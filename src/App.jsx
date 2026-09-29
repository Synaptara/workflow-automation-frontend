import { BrowserRouter, Routes, Route } from "react-router-dom";
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

function Shell({ children }) {
  return (
    <div className="flex h-screen w-full bg-canvas overflow-hidden">
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
          <Route path="/landing" element={<LandingPage />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Shell>
                  <WorkflowList />
                </Shell>
              </ProtectedRoute>
            }
          />
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
            path="/history"
            element={
              <ProtectedRoute>
                <Shell>
                  <RunHistory />
                </Shell>
              </ProtectedRoute>
            }
          />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
