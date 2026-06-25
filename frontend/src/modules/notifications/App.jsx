import { Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "sonner";

import Compose from "./pages/Compose";
import NotificationHistory from "./pages/NotificationHistory";
import ArchivedNotifications from "./pages/ArchivedNotifications";
import EditNotification from "./pages/EditNotification";
import NotificationHome from "./pages/NotificationHome"; 

function NotFound() {
  return (
    <div style={{ padding: 24 }}>
      <h2>Page Not Found</h2>
      <p>The page you’re looking for doesn’t exist.</p>
    </div>
  );
}

export default function App() {
  return (
    <>
      <Toaster richColors position="top-center" />
      <Routes>
        <Route index element={<NotificationHome />} />
        <Route path="home" element={<NotificationHome />} />

        <Route path="compose" element={<Compose />} />

        <Route path="history" element={<NotificationHistory />} />
        <Route path="archived" element={<ArchivedNotifications />} />
        <Route path="edit/:id" element={<EditNotification />} />

        <Route path="404" element={<NotFound />} />
        <Route path="*" element={<Navigate to="404" replace />} />
      </Routes>
    </>
  );
}
