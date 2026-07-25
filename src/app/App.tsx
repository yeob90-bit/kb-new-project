import { Navigate, Route, Routes } from "react-router-dom";
import { DashboardPage } from "../pages/dashboard/DashboardPage";
import { ShowcasePage } from "../pages/showcase/ShowcasePage";

export function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="/dashboard" element={<DashboardPage />} />
      <Route path="/showcase" element={<ShowcasePage />} />
    </Routes>
  );
}
