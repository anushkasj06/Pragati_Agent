/**
 * ApplicationContext — stores loan applications submitted via DocumentUpload.
 * Shared between Seller Portal (history) and Admin Dashboard (approval queue).
 */
import { createContext, useContext, useState, useCallback, useEffect } from "react";

const ApplicationContext = createContext(null);

function loadApps() {
  try { return JSON.parse(localStorage.getItem("pragati:applications") || "[]"); }
  catch { return []; }
}
function saveApps(list) {
  try { localStorage.setItem("pragati:applications", JSON.stringify(list)); } catch {}
}

export function ApplicationProvider({ children }) {
  const [applications, setApplications] = useState(loadApps);
  useEffect(() => { saveApps(applications); }, [applications]);

  const submitApplication = useCallback((app) => {
    const newApp = {
      ...app,
      id:          `APP-${Date.now()}`,
      submittedAt: new Date().toISOString(),
      status:      "pending", // pending | approved | rejected
      reviewedAt:  null,
      reviewedBy:  null,
      adminNote:   "",
    };
    setApplications(prev => [newApp, ...prev]);
    return newApp;
  }, []);

  const approveApplication = useCallback((appId, adminNote = "") => {
    setApplications(prev => prev.map(a =>
      a.id === appId
        ? { ...a, status:"approved", reviewedAt:new Date().toISOString(), reviewedBy:"Admin", adminNote }
        : a
    ));
  }, []);

  const rejectApplication = useCallback((appId, adminNote = "") => {
    setApplications(prev => prev.map(a =>
      a.id === appId
        ? { ...a, status:"rejected", reviewedAt:new Date().toISOString(), reviewedBy:"Admin", adminNote }
        : a
    ));
  }, []);

  const getSellerApplications = useCallback((sellerId) =>
    applications.filter(a => a.sellerId === sellerId), [applications]);

  const pendingCount = applications.filter(a => a.status === "pending").length;

  return (
    <ApplicationContext.Provider value={{
      applications, submitApplication, approveApplication, rejectApplication,
      getSellerApplications, pendingCount,
    }}>
      {children}
    </ApplicationContext.Provider>
  );
}

export function useApplications() {
  const ctx = useContext(ApplicationContext);
  if (!ctx) throw new Error("useApplications must be used within ApplicationProvider");
  return ctx;
}
