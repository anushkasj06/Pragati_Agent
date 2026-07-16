import { Outlet } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import Navbar from "../components/navigation/Navbar";
import { useBackendHealth } from "../hooks/useBackendHealth";
import BackendOfflineBanner from "../components/navigation/BackendOfflineBanner";

export default function AppLayout() {
  const { backendOnline, backendChecked } = useBackendHealth();

  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      {backendChecked && backendOnline === false && <BackendOfflineBanner />}
      <main>
        <Outlet />
      </main>
      <Toaster
        position="bottom-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: "#fff",
            color: "#1A1A2E",
            border: "1px solid #E9E5F5",
            borderRadius: "14px",
            fontSize: "14px",
            boxShadow: "0 4px 24px rgba(111,45,189,0.12)",
          },
        }}
      />
    </div>
  );
}
