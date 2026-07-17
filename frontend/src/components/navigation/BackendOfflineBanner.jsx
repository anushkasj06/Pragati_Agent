import { motion } from "framer-motion";
import { WifiOff, RefreshCw } from "lucide-react";
import { useApp } from "../../context/AppContext";

const API_BASE_URL = (import.meta.env.VITE_API_URL || "http://localhost:3001").replace(/\/$/, "");

export default function BackendOfflineBanner() {
  const { pingBackend } = useApp();
  return (
    <motion.div
      initial={{ opacity: 0, y: -4 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-red-50 border-b border-red-200 px-4 py-2.5"
    >
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <WifiOff className="w-4 h-4 text-red-500 flex-shrink-0" />
          <p className="text-red-700 text-sm">
            Cannot connect to backend on{" "}
            <code className="font-mono text-xs bg-red-100 px-1.5 py-0.5 rounded">{API_BASE_URL}</code>.
            Please start the server.
          </p>
        </div>
        <button
          onClick={pingBackend}
          className="flex items-center gap-1.5 text-xs font-semibold text-red-600
                     hover:text-red-800 px-3 py-1.5 rounded-lg bg-red-100 hover:bg-red-200
                     transition-colors flex-shrink-0"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Retry
        </button>
      </div>
    </motion.div>
  );
}
