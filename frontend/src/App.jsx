/**
 * App.jsx — root router for Meesho Pragati Agent.
 * Three layout zones:
 *   / ................. Landing page (AppLayout)
 *   /dashboard, etc ... Admin portal (DashboardLayout)
 *   /seller, etc ...... Seller portal (SellerLayout)
 */

import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AppProvider } from "./context/AppContext";
import { NotificationProvider } from "./context/NotificationContext";
import { ApplicationProvider } from "./context/ApplicationContext";

import AppLayout       from "./layouts/AppLayout";
import DashboardLayout from "./layouts/DashboardLayout";
import SellerLayout    from "./layouts/SellerLayout";

/* ── Public landing ── */
import HomePage      from "./pages/HomePage";

/* ── Admin portal ── */
import DashboardPage from "./pages/DashboardPage";
import EvaluatePage  from "./pages/EvaluatePage";
import HistoryPage   from "./pages/HistoryPage";
import SimulatorPage from "./pages/SimulatorPage";
import DocsPage      from "./pages/DocsPage";
import AboutPage     from "./pages/AboutPage";
import SettingsPage  from "./pages/SettingsPage";
import CreateSellerPage from "./pages/CreateSellerPage";

/* ── Seller portal ── */
import SellerDashboard   from "./pages/seller/SellerDashboard";
import SellerApply       from "./pages/seller/SellerApply";
import SellerCoach       from "./pages/seller/SellerCoach";
import SellerHistory     from "./pages/seller/SellerHistory";
import SellerInsights    from "./pages/seller/SellerInsights";
import SellerProfile     from "./pages/seller/SellerProfile";
import SellerLoanGuide   from "./pages/seller/SellerLoanGuide";
import LoanDecisionPage  from "./pages/seller/LoanDecisionPage";
import SellerPortal      from "./pages/seller/SellerPortal";

export default function App() {
  return (
    <AppProvider>
      <NotificationProvider>
        <ApplicationProvider>
          <BrowserRouter>
        <Routes>

          {/* ── Landing page ── */}
          <Route element={<AppLayout />}>
            <Route path="/" element={<HomePage />} />
            <Route path="/create-seller" element={<CreateSellerPage />} />
          </Route>

          {/* ── Admin / analyst portal ── */}
          <Route element={<DashboardLayout />}>
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/evaluate"  element={<EvaluatePage />}  />
            <Route path="/history"   element={<HistoryPage />}   />
            <Route path="/simulator" element={<SimulatorPage />} />
            <Route path="/docs"      element={<DocsPage />}      />
            <Route path="/about"     element={<AboutPage />}     />
            <Route path="/settings"  element={<SettingsPage />}  />
          </Route>

          {/* ── Seller dashboard shell and all inner seller routes ── */}
          <Route path="/seller" element={<SellerLayout />}>

            {/* Seller dashboard sub-pages */}
            <Route index element={<SellerDashboard />} />
            <Route path="dashboard"    element={<SellerDashboard />}  />
            <Route path="portal"       element={<SellerPortal />}     />
            <Route path="apply"        element={<SellerApply />}      />
            <Route path="loan-guide"   element={<SellerLoanGuide />}  />
            <Route path="decision"     element={<LoanDecisionPage />} />
            <Route path="coach"        element={<SellerCoach />}      />
            <Route path="history"      element={<SellerHistory />}    />
            <Route path="insights"     element={<SellerInsights />}   />
            <Route path="profile"      element={<SellerProfile />}    />
          </Route>

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />

        </Routes>
          </BrowserRouter>
        </ApplicationProvider>
      </NotificationProvider>
    </AppProvider>
  );
}
