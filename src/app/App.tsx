import { lazy } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { AppShell } from "./AppShell";
import { DashboardPage } from "../pages/dashboard/DashboardPage";

const ShowcasePage = lazy(async () => {
  const module = await import("../pages/showcase/ShowcasePage");
  return { default: module.ShowcasePage };
});

export function App() {
  return (
    <AppShell>
      <Routes>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/showcase" element={<ShowcasePage />} />
      </Routes>
    </AppShell>
  );
}
