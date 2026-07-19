/**
 * DashboardLayout.jsx
 * Main enterprise layout: fixed dark sidebar (#120B2E) + content area (#F8F4FF)
 */

import { useState, useEffect } from "react";
import { NavLink, Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Toaster } from "react-hot-toast";
import {
  LayoutDashboard,
  Sparkles,
  ClipboardList,
  FlaskConical,
  GitBranch,
  Info,
  Settings,
  Menu,
  X,
  Wifi,
  WifiOff,
  ChevronRight,
} from "lucide-react";
import { useBackendHealth } from "../hooks/useBackendHealth";
import NotificationBell from "../components/NotificationBell";
import LanguageSelector from "../components/ui/LanguageSelector";
import { useApp } from "../context/AppContext";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------
const SIDEBAR_WIDTH = 240;
const TOPBAR_HEIGHT = 64;

const NAV_ITEMS = [
  { icon: LayoutDashboard, label: "Dashboard",       to: "/dashboard" },
  { icon: Sparkles,        label: "Evaluate Seller", to: "/evaluate"  },
  { icon: ClipboardList,   label: "Decision History",to: "/history"   },
  { icon: LayoutDashboard, label: "Seller Portal",   to: "/seller/dashboard" },
  { icon: FlaskConical,    label: "What-If Simulator",to: "/simulator" },
  { icon: GitBranch,       label: "Architecture",    to: "/docs"      },
  { icon: Info,            label: "About",           to: "/about"     },
  { icon: Settings,        label: "Settings",        to: "/settings"  },
];

// Map path to breadcrumb labels
const BREADCRUMB_MAP = {
  "/dashboard": ["Dashboard"],
  "/evaluate":  ["Dashboard", "Evaluate Seller"],
  "/history":   ["Dashboard", "Decision History"],
  "/simulator": ["Dashboard", "What-If Simulator"],
  "/docs":      ["Dashboard", "Architecture"],
  "/about":     ["Dashboard", "About"],
  "/settings":  ["Dashboard", "Settings"],
};

// ---------------------------------------------------------------------------
// Sidebar NavItem
// ---------------------------------------------------------------------------
function SideNavItem({ item, collapsed, onClick }) {
  const Icon = item.icon;
  return (
    <NavLink
      to={item.to}
      onClick={onClick}
      style={({ isActive }) => ({
        display: "flex",
        alignItems: "center",
        gap: "12px",
        padding: collapsed ? "10px 0" : "10px 14px",
        justifyContent: collapsed ? "center" : "flex-start",
        borderRadius: "12px",
        fontSize: "14px",
        fontWeight: isActive ? 600 : 500,
        color: isActive ? "#ffffff" : "rgba(255,255,255,0.6)",
        background: isActive ? "rgba(111,45,189,0.35)" : "transparent",
        border: isActive ? "1px solid rgba(111,45,189,0.4)" : "1px solid transparent",
        textDecoration: "none",
        transition: "all 0.18s",
        cursor: "pointer",
        whiteSpace: "nowrap",
        overflow: "hidden",
      })}
      onMouseEnter={e => {
        const isActive = e.currentTarget.getAttribute("aria-current") === "page";
        if (!isActive) {
          e.currentTarget.style.color = "#ffffff";
          e.currentTarget.style.background = "rgba(255,255,255,0.07)";
        }
      }}
      onMouseLeave={e => {
        const isActive = e.currentTarget.getAttribute("aria-current") === "page";
        if (!isActive) {
          e.currentTarget.style.color = "rgba(255,255,255,0.6)";
          e.currentTarget.style.background = "transparent";
        }
      }}
    >
      <Icon style={{ width: 18, height: 18, flexShrink: 0 }} />
      {!collapsed && (
        <span style={{ overflow: "hidden", textOverflow: "ellipsis" }}>
          {item.label}
        </span>
      )}
    </NavLink>
  );
}

// ---------------------------------------------------------------------------
// Sidebar component
// ---------------------------------------------------------------------------
function Sidebar({ collapsed, onClose, isMobile }) {
  const { backendOnline, backendChecked } = useBackendHealth();

  const sidebarStyle = {
    position: "fixed",
    top: 0,
    left: 0,
    height: "100vh",
    width: collapsed && !isMobile ? 68 : SIDEBAR_WIDTH,
    background: "#120B2E",
    borderRight: "1px solid rgba(255,255,255,0.07)",
    display: "flex",
    flexDirection: "column",
    zIndex: 50,
    transition: "width 0.25s ease",
    overflow: "hidden",
  };

  return (
    <aside style={sidebarStyle}>
      {/* Logo */}
      <Link to="/" style={{
        height: TOPBAR_HEIGHT,
        display: "flex",
        alignItems: "center",
        padding: collapsed && !isMobile ? "0 15px" : "0 20px",
        borderBottom: "1px solid rgba(255,255,255,0.07)",
        flexShrink: 0,
        justifyContent: collapsed && !isMobile ? "center" : "flex-start",
        gap: "10px",
        textDecoration: "none",
      }}>
        {/* Logo icon */}
        <div style={{
          width: 36, height: 36, borderRadius: 10, flexShrink: 0,
          background: "linear-gradient(135deg, #6F2DBD, #8B5CF6)",
          display: "flex", alignItems: "center", justifyContent: "center",
          boxShadow: "0 2px 12px rgba(111,45,189,0.45)",
        }}>
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
            <path d="M9 2L16 6V12L9 16L2 12V6L9 2Z" fill="white" fillOpacity="0.95"/>
            <circle cx="9" cy="9" r="3" fill="white"/>
          </svg>
        </div>
        {(!collapsed || isMobile) && (
          <div style={{ lineHeight: 1.25, overflow: "hidden" }}>
            <div style={{ fontSize: "14px", fontWeight: 700, color: "#ffffff", letterSpacing: "-0.01em", whiteSpace: "nowrap" }}>
              Pragati Agent
            </div>
            <div style={{ fontSize: "11px", color: "rgba(255,255,255,0.4)", fontWeight: 400, whiteSpace: "nowrap" }}>
              by Meesho Finance
            </div>
          </div>
        )}
        {/* Mobile close */}
        {isMobile && (
          <button
            onClick={onClose}
            style={{
              marginLeft: "auto",
              padding: "6px",
              borderRadius: "8px",
              background: "rgba(255,255,255,0.07)",
              border: "none",
              color: "rgba(255,255,255,0.7)",
              cursor: "pointer",
              flexShrink: 0,
            }}
          >
            <X style={{ width: 18, height: 18 }} />
          </button>
        )}
      </Link>

      {/* Navigation */}
      <nav style={{ flex: 1, padding: "16px 12px", overflowY: "auto", display: "flex", flexDirection: "column", gap: "3px" }}>
        {/* Backend status mini pill */}
        {(!collapsed || isMobile) && backendChecked && (
          <div style={{
            display: "flex", alignItems: "center", gap: "6px",
            padding: "6px 10px", borderRadius: "8px", marginBottom: "8px",
            background: backendOnline ? "rgba(34,197,94,0.1)" : "rgba(239,68,68,0.1)",
            border: `1px solid ${backendOnline ? "rgba(34,197,94,0.25)" : "rgba(239,68,68,0.25)"}`,
            fontSize: "11px", fontWeight: 600,
            color: backendOnline ? "#4ADE80" : "#F87171",
          }}>
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: backendOnline ? "#4ADE80" : "#F87171", flexShrink: 0 }} />
            {backendOnline ? <Wifi style={{ width: 11, height: 11 }} /> : <WifiOff style={{ width: 11, height: 11 }} />}
            {backendOnline ? "Backend Live" : "Backend Offline"}
          </div>
        )}

        {NAV_ITEMS.map((item) => (
          <SideNavItem
            key={item.to}
            item={item}
            collapsed={collapsed && !isMobile}
            onClick={isMobile ? onClose : undefined}
          />
        ))}
      </nav>

      {/* User area */}
      <div style={{
        padding: collapsed && !isMobile ? "16px 10px" : "16px",
        borderTop: "1px solid rgba(255,255,255,0.07)",
        display: "flex",
        alignItems: "center",
        gap: "10px",
        flexShrink: 0,
      }}>
        <div style={{
          width: 34, height: 34, borderRadius: "50%", flexShrink: 0,
          background: "linear-gradient(135deg, #6F2DBD 0%, #8B5CF6 100%)",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: "13px", fontWeight: 700, color: "#fff",
          boxShadow: "0 2px 8px rgba(111,45,189,0.4)",
        }}>
          AJ
        </div>
        {(!collapsed || isMobile) && (
          <div style={{ overflow: "hidden", flex: 1 }}>
            <div style={{ fontSize: "13px", fontWeight: 600, color: "#ffffff", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
              Anushka Jadhav
            </div>
            <div style={{ fontSize: "11px", color: "rgba(255,255,255,0.4)", marginTop: 1 }}>
              Admin
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}

// ---------------------------------------------------------------------------
// Top bar
// ---------------------------------------------------------------------------
function TopBar({ onMenuToggle, sidebarCollapsed }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { backendOnline, backendChecked } = useBackendHealth();
  const { sellerLanguage, setSellerLanguage } = useApp();
  const crumbs = BREADCRUMB_MAP[location.pathname] || ["Dashboard"];
  const effectiveSidebarWidth = sidebarCollapsed ? 68 : SIDEBAR_WIDTH;

  return (
    <div style={{
      position: "fixed",
      top: 0,
      left: effectiveSidebarWidth,
      right: 0,
      height: TOPBAR_HEIGHT,
      background: "#ffffff",
      borderBottom: "1px solid #E9E5F5",
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      padding: "0 28px",
      zIndex: 40,
      transition: "left 0.25s ease",
      boxShadow: "0 1px 8px rgba(111,45,189,0.06)",
    }}>
      {/* Left: hamburger + breadcrumb */}
      <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
        {/* Mobile hamburger */}
        {/* <button
          onClick={onMenuToggle}
          className="md:hidden"
          style={{
            padding: "7px",
            borderRadius: "9px",
            background: "#F8F4FF",
            border: "1px solid #E9E5F5",
            color: "#6F2DBD",
            cursor: "pointer",
            display: "flex",
          }}
        >
          <Menu style={{ width: 18, height: 18 }} />
        </button> */}

        {/* Desktop collapse toggle */}
        <button
          onClick={onMenuToggle}
          className="hidden md:flex"
          style={{
            padding: "7px",
            borderRadius: "9px",
            background: "#F8F4FF",
            border: "1px solid #E9E5F5",
            color: "#6F2DBD",
            cursor: "pointer",
            alignItems: "center",
          }}
        >
          <Menu style={{ width: 17, height: 17 }} />
        </button>

        {/* Breadcrumb */}
        <nav style={{ display: "flex", alignItems: "center", gap: "4px" }} aria-label="breadcrumb">
          {crumbs.map((crumb, i) => (
            <span key={i} style={{ display: "flex", alignItems: "center", gap: "4px" }}>
              {i > 0 && <ChevronRight style={{ width: 13, height: 13, color: "#9CA3AF" }} />}
              <span style={{
                fontSize: "13px",
                fontWeight: i === crumbs.length - 1 ? 600 : 400,
                color: i === crumbs.length - 1 ? "#1A1A2E" : "#9CA3AF",
              }}>
                {crumb}
              </span>
            </span>
          ))}
        </nav>
      </div>

      {/* Right: backend status + bell + CTA */}
      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
        {backendChecked && (
          <div style={{
            display: "flex", alignItems: "center", gap: "6px",
            padding: "5px 11px", borderRadius: "20px",
            fontSize: "12px", fontWeight: 600,
            color: backendOnline ? "#16A34A" : "#DC2626",
            background: backendOnline ? "rgba(34,197,94,0.1)" : "rgba(239,68,68,0.1)",
            border: `1px solid ${backendOnline ? "rgba(34,197,94,0.25)" : "rgba(239,68,68,0.25)"}`,
          }}>
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: backendOnline ? "#22C55E" : "#EF4444" }} />
            {backendOnline ? "Online" : "Offline"}
          </div>
        )}

        <div style={{ width: 190, minWidth: 170 }}>
          <LanguageSelector
            value={sellerLanguage}
            onChange={setSellerLanguage}
            buttonClassName="text-slate-900 bg-white border-slate-200 hover:border-slate-400"
            menuClassName="bg-white text-slate-900"
          />
        </div>

        <NotificationBell dark />

        <button
          onClick={() => navigate("/evaluate")}
          style={{
            padding: "8px 18px",
            borderRadius: "10px",
            fontSize: "13px",
            fontWeight: 600,
            color: "#ffffff",
            background: "linear-gradient(135deg, #6F2DBD 0%, #8B5CF6 100%)",
            border: "none",
            cursor: "pointer",
            boxShadow: "0 2px 10px rgba(111,45,189,0.35)",
            transition: "box-shadow 0.2s",
          }}
          onMouseEnter={e => e.currentTarget.style.boxShadow = "0 4px 18px rgba(111,45,189,0.55)"}
          onMouseLeave={e => e.currentTarget.style.boxShadow = "0 2px 10px rgba(111,45,189,0.35)"}
        >
          Evaluate Now
        </button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// DashboardLayout
// ---------------------------------------------------------------------------
export default function DashboardLayout() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    function handleResize() {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (!mobile) setMobileOpen(false);
    }
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  function handleMenuToggle() {
    if (isMobile) {
      setMobileOpen((v) => !v);
    } else {
      setSidebarCollapsed((v) => !v);
    }
  }

  const effectiveSidebarWidth = isMobile ? 0 : sidebarCollapsed ? 68 : SIDEBAR_WIDTH;

  return (
    <div style={{ minHeight: "100vh", background: "#F8F4FF", display: "flex" }}>
      {/* Desktop sidebar */}
      {!isMobile && (
        <Sidebar collapsed={sidebarCollapsed} isMobile={false} />
      )}

      {/* Mobile sidebar overlay */}
      <AnimatePresence>
        {isMobile && mobileOpen && (
          <>
            <motion.div
              key="overlay"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileOpen(false)}
              style={{
                position: "fixed", inset: 0,
                background: "rgba(0,0,0,0.5)",
                zIndex: 49,
              }}
            />
            <motion.div
              key="mobile-sidebar"
              initial={{ x: -SIDEBAR_WIDTH }}
              animate={{ x: 0 }}
              exit={{ x: -SIDEBAR_WIDTH }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              style={{ zIndex: 50 }}
            >
              <Sidebar collapsed={false} isMobile={true} onClose={() => setMobileOpen(false)} />
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Top bar */}
      <TopBar
        onMenuToggle={handleMenuToggle}
        sidebarCollapsed={sidebarCollapsed}
      />

      {/* Main content */}
      <main style={{
        marginLeft: effectiveSidebarWidth,
        marginTop: TOPBAR_HEIGHT,
        flex: 1,
        minWidth: 0,
        transition: "margin-left 0.25s ease",
        background: "#F8F4FF",
        minHeight: `calc(100vh - ${TOPBAR_HEIGHT}px)`,
      }}>
        <div style={{ padding: "28px" }}>
          <Outlet />
        </div>
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
