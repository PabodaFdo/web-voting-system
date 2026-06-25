import "./App.css";
import { Routes, Route } from "react-router-dom";

import Home from "./pages/Home.jsx";
import EventManager from "./pages/EventManager.jsx";
import CategoryManager from "./pages/CategoryManager.jsx";
import NomineeManager from "./pages/NomineeManager.jsx";

export default function App() {
  return (
    <main className="nominee-shell">
      <div className="nominee-shell__container">
        <Routes>
          <Route index element={<Home />} />
          <Route path="events" element={<EventManager />} />
          <Route path="categories" element={<CategoryManager />} />
          <Route path="nominees" element={<NomineeManager />} />
        </Routes>
      </div>
    </main>
  );
}
