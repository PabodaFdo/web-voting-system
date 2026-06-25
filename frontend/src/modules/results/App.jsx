import { Routes, Route, Navigate } from "react-router-dom";
import Results from "./pages/Results.jsx";
import SetDetail from "./pages/SetDetail.jsx";
import Analytics from "./pages/Analytics.jsx";
import "./App.css";

export default function App() {
  return (
    <div className="app">
      {/* Removed global <DashHeader /> */}
      <main className="main">
        <Routes>
          <Route index element={<Results />} />
          <Route path="set/:id" element={<SetDetail />} />
          <Route path="analytics" element={<Analytics />} />
          <Route path="*" element={<Navigate to="." replace />} />
        </Routes>
      </main>
    </div>
  );
}
