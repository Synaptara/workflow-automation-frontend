import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import TopNav from "./components/TopNav";
import Login from "./pages/Login";
import Register from "./pages/Register";
import WorkflowList from "./pages/WorkflowList";
import WorkflowBuilder from "./pages/WorkflowBuilder";
import RunHistory from "./pages/RunHistory";

function Shell({ children }) {
  return (
    <div className="min-h-screen bg-base-950">
      <TopNav />
      {children}
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
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
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
