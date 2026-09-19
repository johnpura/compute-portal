import { useState } from "react";
import Portal from "./components/Portal.jsx";
import Dashboard from "./components/Dashboard.jsx";
import AdminView from "./components/AdminView.jsx";

/*
 * App is the shell. It holds one piece of state — which tab is active — and
 * renders the matching view. This is the simplest form of "routing": no
 * library, just a useState. When you're comfortable, react-router is the
 * natural next step.
 */

const TABS = [
  { id: "portal", label: "Request compute" },
  { id: "dashboard", label: "Dashboard" },
  { id: "admin", label: "Admin" },
];

export default function App() {
  const [tab, setTab] = useState("portal");

  return (
    <div className="app">
      <header className="app-header">
        <div className="brand">
          {/* <span className="brand-mark"></span> */}
          <span className="brand-name">Compute Portal</span>
        </div>
        <nav className="tabs">
          {TABS.map((t) => (
            <button
              key={t.id}
              className={`tab ${tab === t.id ? "tab-active" : ""}`}
              onClick={() => setTab(t.id)}
            >
              {t.label}
            </button>
          ))}
        </nav>
      </header>

      <main className="app-main">
        {tab === "portal" && <Portal />}
        {tab === "dashboard" && <Dashboard />}
        {tab === "admin" && <AdminView />}
      </main>

      <footer className="app-footer">
        Demo project · React + Flask + PostgreSQL + Docker
      </footer>
    </div>
  );
}
