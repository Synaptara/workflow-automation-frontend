import { BrowserRouter, Routes, Route } from "react-router-dom";

function Sidebar() {
  return (
    <aside className="w-14 bg-base-900 border-r border-border flex flex-col items-center py-4 gap-4">
      <div className="w-8 h-8 rounded bg-accent" />
    </aside>
  );
}

function Topbar() {
  return (
    <header className="h-12 bg-base-900 border-b border-border flex items-center px-4 justify-between">
      <span className="text-sm text-text-muted">Workflow Automation</span>
      <button className="bg-accent hover:bg-accent-hover text-base-950 text-sm font-medium px-3 py-1.5 rounded">
        Get Started
      </button>
    </header>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <div className="h-screen flex bg-base-950">
        <Sidebar />
        <div className="flex-1 flex flex-col">
          <Topbar />
          <main className="flex-1 overflow-auto p-6">
            <Routes>
              <Route path="/" element={<div className="text-text-muted">Dashboard placeholder</div>} />
            </Routes>
          </main>
        </div>
      </div>
    </BrowserRouter>
  );
}