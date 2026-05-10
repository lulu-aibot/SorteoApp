import { Routes, Route } from "react-router";
import Navbar from "./components/Navbar";
import LandingPage from "./pages/LandingPage";
import GiveawayApp from "./pages/GiveawayApp";
import CertificatePage from "./pages/CertificatePage";

export default function App() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans">
      <Navbar />
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col">
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/app" element={<GiveawayApp />} />
          <Route path="/cert/:id" element={<CertificatePage />} />
        </Routes>
      </main>
    </div>
  );
}
