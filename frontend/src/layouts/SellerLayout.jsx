/**
 * SellerLayout — Meesho Seller Portal layout.
 * White sidebar with purple accents. Feels like the official Meesho seller app.
 */

import { useState, useEffect } from "react";
import { NavLink, Link, Outlet, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Toaster } from "react-hot-toast";
import {
  LayoutDashboard, CreditCard, MessageCircle,
  ClipboardList, BarChart2, User, Menu, X,
  Bell, ChevronDown, Globe, Check, LogOut,
  Sparkles, Zap,
} from "lucide-react";
import { SUPPORTED_LANGUAGES } from "../utils/constants";
import { useApp } from "../context/AppContext";

import NotificationBell from "../components/NotificationBell";
import { useNotifications } from "../context/NotificationContext";

/* ── design tokens ─────────────────────────────────────────── */
const S = {
  sidebar: "#FFFFFF",
  sidebarBorder: "#F0EBF8",
  activeBg: "#F3ECFF",
  activeColor: "#6F2DBD",
  inactiveColor: "#6B7280",
  topbar: "#FFFFFF",
  topbarBorder: "#F0EBF8",
  purple: "#6F2DBD",
  purple2: "#8B5CF6",
  bg: "#F8F4FF",
  width: 248,
  topH: 64,
};

const NAV = [
  { to: "/seller",             label: "Dashboard",         icon: LayoutDashboard, exact: true },
  // { to: "/seller/portal",      label: "Seller Portal",     icon: Sparkles                     },
  { to: "/seller/loan-guide",  label: "Apply for Loan",    icon: CreditCard                   },
  { to: "/seller/coach",       label: "AI Financial Coach",icon: MessageCircle                },
  { to: "/seller/apply",       label: "Quick Evaluate",    icon: Zap                          },
  { to: "/seller/history",     label: "Loan History",      icon: ClipboardList                },
  { to: "/seller/insights",    label: "Business Insights", icon: BarChart2                    },
  { to: "/seller/profile",     label: "My Profile",        icon: User                         },
];

const BREADCRUMBS = {
  "/seller":             "Dashboard",
  "/seller/dashboard":   "Dashboard",
  "/seller/portal":      "Seller Portal",
  "/seller/loan-guide":  "Apply for Loan",
  "/seller/apply":       "Quick Evaluate",
  "/seller/decision":    "Loan Decision",
  "/seller/coach":       "AI Financial Coach",
  "/seller/history":     "Loan History",
  "/seller/insights":    "Business Insights",
  "/seller/profile":     "My Profile",
};

/* ── Language mini dropdown ─────────────────────────────────── */
function LangPicker() {
  const { sellerLanguage, setSellerLanguage } = useApp();
  const [open, setOpen] = useState(false);
  const sel = SUPPORTED_LANGUAGES.find(l => l.value === sellerLanguage) || SUPPORTED_LANGUAGES[0];
  useEffect(() => {
    if (!open) return;
    const fn = () => setOpen(false);
    document.addEventListener("mousedown", fn);
    return () => document.removeEventListener("mousedown", fn);
  }, [open]);
  return (
    <div style={{ position: "relative" }} onMouseDown={e => e.stopPropagation()}>
      <button onClick={() => setOpen(!open)} style={{
        display: "flex", alignItems: "center", gap: 6,
        padding: "7px 12px", borderRadius: 10, border: "1px solid #E9E5F5",
        background: open ? "#F3ECFF" : "#fff", cursor: "pointer",
        fontSize: 13, fontWeight: 500, color: "#374151", transition: "all 0.15s",
      }}>
        <Globe style={{ width: 15, height: 15, color: S.purple }} />
        <span>{sel.native}</span>
        <ChevronDown style={{ width: 13, height: 13, color: "#9CA3AF", transform: open ? "rotate(180deg)" : "none", transition: "transform 0.2s" }} />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.15 }}
            style={{ position: "absolute", right: 0, top: "calc(100% + 6px)", width: 190, background: "#fff",
              border: "1px solid #E9E5F5", borderRadius: 14, boxShadow: "0 8px 32px rgba(111,45,189,0.12)",
              zIndex: 100, overflow: "hidden" }}>
            {SUPPORTED_LANGUAGES.map(l => (
              <button key={l.value} onClick={() => { setSellerLanguage(l.value); setOpen(false); }}
                style={{ display: "flex", alignItems: "center", gap: 10, width: "100%",
                  padding: "9px 14px", background: sellerLanguage === l.value ? "#F8F4FF" : "transparent",
                  border: "none", cursor: "pointer", fontSize: 13, color: "#1A1A2E", textAlign: "left" }}>
                <span style={{ fontSize: 16 }}>{l.flag}</span>
                <span style={{ flex: 1, fontWeight: 500 }}>{l.native}</span>
                {sellerLanguage === l.value && <Check style={{ width: 13, height: 13, color: S.purple }} />}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ── Sidebar ─────────────────────────────────────────────────── */
function initials(name = "Seller") {
  return name.split(" ").map(part => part[0]).join("").slice(0, 2).toUpperCase();
}

function Sidebar({ isMobile, onClose, seller }) {
  return (
    <aside style={{
      position: "fixed", top: 0, left: 0, height: "100vh", width: S.width,
      background: S.sidebar, borderRight: `1px solid ${S.sidebarBorder}`,
      display: "flex", flexDirection: "column", zIndex: 50,
      boxShadow: "2px 0 16px rgba(111,45,189,0.06)",
    }}>
      {/* Brand */}
      <Link to="/" style={{ height: S.topH, display: "flex", alignItems: "center",
        padding: "0 20px", borderBottom: `1px solid ${S.sidebarBorder}`,
        flexShrink: 0, gap: 12, justifyContent: "space-between", textDecoration: "none" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, flexShrink: 0,
            background: "linear-gradient(135deg,#6F2DBD,#8B5CF6)",
            display: "flex", alignItems: "center", justifyContent: "center",
            boxShadow: "0 2px 10px rgba(111,45,189,0.3)" }}>
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <path d="M9 2L16 6V12L9 16L2 12V6L9 2Z" fill="white" fillOpacity="0.95"/>
              <circle cx="9" cy="9" r="3" fill="white"/>
            </svg>
          </div>
          <div style={{ lineHeight: 1.2 }}>
            <div style={{ fontSize: 14, fontWeight: 800, color: S.purple, letterSpacing: "-0.01em" }}>Pragati</div>
            <div style={{ fontSize: 11, color: "#9CA3AF" }}>Seller Portal</div>
          </div>
        </div>
        {isMobile && (
          <button onClick={onClose} style={{ padding: 6, borderRadius: 8, border: "1px solid #E9E5F5",
            background: "#F8F4FF", cursor: "pointer", color: "#6B7280" }}>
            <X style={{ width: 16, height: 16 }} />
          </button>
        )}
      </Link>

      {/* Seller chip */}
      <div style={{ margin: "16px 14px 8px", padding: "12px 14px", borderRadius: 14,
        background: "linear-gradient(135deg,#F3ECFF,#EDE4FF)", border: "1px solid #E9E5F5" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 36, height: 36, borderRadius: "50%", flexShrink: 0,
            background: "linear-gradient(135deg,#6F2DBD,#8B5CF6)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 13, fontWeight: 800, color: "#fff" }}>{initials(seller?.name)}</div>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: "#1A1A2E", whiteSpace: "nowrap",
              overflow: "hidden", textOverflow: "ellipsis" }}>{seller?.name ?? "Select Seller"}</div>
            <div style={{ fontSize: 11, color: "#9CA3AF" }}>Seller ID: {seller?.id ?? "None"}</div>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: "8px 12px", overflowY: "auto",
        display: "flex", flexDirection: "column", gap: 2 }}>
        {NAV.map(item => {
          const Icon = item.icon;
          return (
            <NavLink key={item.to} to={item.to} end={item.exact}
              onClick={isMobile ? onClose : undefined}
              style={({ isActive }) => ({
                display: "flex", alignItems: "center", gap: 12, padding: "10px 14px",
                borderRadius: 12, fontSize: 14, fontWeight: isActive ? 700 : 500,
                color: isActive ? S.activeColor : S.inactiveColor,
                background: isActive ? S.activeBg : "transparent",
                border: `1px solid ${isActive ? "#DDD0F5" : "transparent"}`,
                textDecoration: "none", transition: "all 0.18s", whiteSpace: "nowrap",
              })}
              onMouseEnter={e => {
                if (e.currentTarget.getAttribute("aria-current") !== "page") {
                  e.currentTarget.style.background = "#F8F4FF";
                  e.currentTarget.style.color = S.purple;
                }
              }}
              onMouseLeave={e => {
                if (e.currentTarget.getAttribute("aria-current") !== "page") {
                  e.currentTarget.style.background = "transparent";
                  e.currentTarget.style.color = S.inactiveColor;
                }
              }}
            >
              <Icon style={{ width: 18, height: 18, flexShrink: 0 }} />
              {item.label}
            </NavLink>
          );
        })}
      </nav>

      {/* Bottom — switch portal + logout */}
      <div style={{ padding: "12px", borderTop: `1px solid ${S.sidebarBorder}`, flexShrink: 0 }}>
        <Link to="/dashboard" style={{ display: "flex", alignItems: "center", gap: 10,
          padding: "10px 14px", borderRadius: 12, fontSize: 13, fontWeight: 600,
          color: "#6B7280", textDecoration: "none", border: "1px solid #E9E5F5",
          background: "#FAFAFA", marginBottom: 6, transition: "all 0.15s" }}
          onMouseEnter={e => { e.currentTarget.style.borderColor="#DDD0F5"; e.currentTarget.style.color=S.purple; }}
          onMouseLeave={e => { e.currentTarget.style.borderColor="#E9E5F5"; e.currentTarget.style.color="#6B7280"; }}
        >
          <BarChart2 style={{ width: 16, height: 16 }} />
          Admin Dashboard
        </Link>
        <button style={{ display: "flex", alignItems: "center", gap: 10, width: "100%",
          padding: "9px 14px", borderRadius: 12, fontSize: 13, fontWeight: 500,
          color: "#9CA3AF", background: "transparent", border: "none", cursor: "pointer" }}>
          <LogOut style={{ width: 16, height: 16 }} />
          Sign Out
        </button>
      </div>
    </aside>
  );
}

/* ── Topbar ──────────────────────────────────────────────────── */
function Topbar({ onMenuToggle, isMobile, seller }) {
  const location = useLocation();
  const label = BREADCRUMBS[location.pathname] || "Seller Portal";
  const { unreadCount } = useNotifications();
  return (
    <div style={{ position: "fixed", top: 0, left: isMobile ? 0 : S.width, right: 0,
      height: S.topH, background: S.topbar, borderBottom: `1px solid ${S.topbarBorder}`,
      display: "flex", alignItems: "center", justifyContent: "space-between",
      padding: "0 24px", zIndex: 40, boxShadow: "0 1px 8px rgba(111,45,189,0.05)",
      transition: "left 0.25s" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
        {isMobile && (
          <button onClick={onMenuToggle} style={{ padding: 7, borderRadius: 9,
            background: "#F8F4FF", border: "1px solid #E9E5F5", color: S.purple, cursor: "pointer" }}>
            <Menu style={{ width: 18, height: 18 }} />
          </button>
        )}
        <div>
          <div style={{ fontSize: 16, fontWeight: 700, color: "#1A1A2E" }}>{label}</div>
          <div style={{ fontSize: 11, color: "#9CA3AF" }}>Meesho Pragati — Seller Portal</div>
        </div>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 10, position: "relative" }}>
        <LangPicker />
        <div style={{ position: "relative" }}>
          <NotificationBell />
          {unreadCount > 0 && (
            <span style={{ position: "absolute", top: 6, right: 6, width: 8, height: 8,
              borderRadius: "50%", background: "#EF4444", border: "2px solid #fff" }} />
          )}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 12px",
          borderRadius: 10, background: "#F8F4FF", border: "1px solid #E9E5F5", cursor: "pointer" }}>
          <div style={{ width: 28, height: 28, borderRadius: "50%",
            background: "linear-gradient(135deg,#6F2DBD,#8B5CF6)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 11, fontWeight: 800, color: "#fff" }}>{initials(seller?.name)}</div>
          <div style={{ lineHeight: 1.2 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: "#1A1A2E" }}>{seller?.name ?? "Seller"}</div>
            <div style={{ fontSize: 10, color: "#9CA3AF" }}>{seller?.risk_category ?? "Meesho"} Seller</div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Layout ─────────────────────────────────────────────────── */
export default function SellerLayout() {
  const { selectedSeller } = useApp();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const fn = () => { const m = window.innerWidth < 768; setIsMobile(m); if (!m) setMobileOpen(false); };
    fn(); window.addEventListener("resize", fn); return () => window.removeEventListener("resize", fn);
  }, []);

  return (
    <div style={{ minHeight: "100vh", background: S.bg, display: "flex" }}>
      {!isMobile && <Sidebar isMobile={false} seller={selectedSeller} />}
      <AnimatePresence>
        {isMobile && mobileOpen && (
          <>
            <motion.div key="ov" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setMobileOpen(false)}
              style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", zIndex: 49 }} />
            <motion.div key="sb" initial={{ x: -S.width }} animate={{ x: 0 }} exit={{ x: -S.width }}
              transition={{ type: "spring", stiffness: 320, damping: 32 }} style={{ zIndex: 50 }}>
              <Sidebar isMobile onClose={() => setMobileOpen(false)} seller={selectedSeller} />
            </motion.div>
          </>
        )}
      </AnimatePresence>
      <Topbar onMenuToggle={() => setMobileOpen(v => !v)} isMobile={isMobile} seller={selectedSeller} />
      <main style={{ marginLeft: isMobile ? 0 : S.width, marginTop: S.topH, flex: 1,
        minWidth: 0, background: S.bg, minHeight: `calc(100vh - ${S.topH}px)`,
        transition: "margin-left 0.25s" }}>
        <div style={{ padding: 28, maxWidth: 1200, margin: "0 auto" }}>
          <Outlet />
        </div>
      </main>
      <Toaster position="bottom-right" toastOptions={{
        style: { background:"#fff", color:"#1A1A2E", border:"1px solid #E9E5F5",
          borderRadius:14, fontSize:14, boxShadow:"0 4px 24px rgba(111,45,189,0.12)" }
      }} />
    </div>
  );
}
