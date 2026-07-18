import { useState } from "react";
import { NavLink, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, Wifi, WifiOff, Globe, ChevronDown, Check } from "lucide-react";
import { useBackendHealth } from "../../hooks/useBackendHealth";
import { useLanguage } from "../../i18n/LanguageProvider";

function MiniLanguageSelector() {
  const [open, setOpen] = useState(false);
  const { language, setLanguage, supportedLanguages } = useLanguage();
  const selected = supportedLanguages.find((lang) => lang.code === language) || supportedLanguages[0];

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "6px",
          padding: "6px 12px",
          borderRadius: "10px",
          fontSize: "13px",
          fontWeight: 500,
          color: "rgba(255,255,255,0.75)",
          background: "rgba(255,255,255,0.08)",
          border: "1px solid rgba(255,255,255,0.12)",
          cursor: "pointer",
          transition: "all 0.2s",
        }}
        onMouseEnter={e => {
          e.currentTarget.style.color = "#ffffff";
          e.currentTarget.style.background = "rgba(255,255,255,0.13)";
        }}
        onMouseLeave={e => {
          e.currentTarget.style.color = "rgba(255,255,255,0.75)";
          e.currentTarget.style.background = "rgba(255,255,255,0.08)";
        }}
      >
        <Globe style={{ width: 14, height: 14 }} />
        <span>{selected.native}</span>
        <ChevronDown style={{ width: 12, height: 12, opacity: 0.6 }} />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.15 }}
            style={{
              position: "absolute",
              right: 0,
              top: "calc(100% + 8px)",
              width: "168px",
              background: "#1C1033",
              border: "1px solid rgba(255,255,255,0.12)",
              borderRadius: "16px",
              boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
              zIndex: 100,
              overflow: "hidden",
            }}
          >
            {supportedLanguages.map((lang) => (
              <button
                key={lang.code}
                onClick={() => { setLanguage(lang.code); setOpen(false); }}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  width: "100%",
                  padding: "10px 16px",
                  fontSize: "13px",
                  color: selected.code === lang.code ? "#A78BFA" : "rgba(255,255,255,0.75)",
                  background: "transparent",
                  border: "none",
                  cursor: "pointer",
                  transition: "background 0.15s",
                  textAlign: "left",
                }}
                onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.06)"}
                onMouseLeave={e => e.currentTarget.style.background = "transparent"}
              >
                <span>{lang.nativeName}</span>
                {selected.code === lang.code && (
                  <Check style={{ width: 13, height: 13, color: "#A78BFA" }} />
                )}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { backendOnline, backendChecked } = useBackendHealth();
  const { t } = useLanguage();

  const NAV_LINKS = [
    { to: "/", label: t("home"), end: true },
    { to: "/evaluate", label: t("evaluate") },
    { to: "/docs", label: t("architecture") },
    { to: "/about", label: t("about") },
  ];

  const navStyle = {
    position: "sticky",
    top: 0,
    zIndex: 40,
    background: "#2b0633",
    borderBottom: "1px solid rgba(255,255,255,0.08)",
    boxShadow: "0 2px 24px rgba(0,0,0,0.35)",
  };

  return (
    <header style={navStyle}>
      <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "0 24px", height: "64px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>

        {/* Logo */}
        <Link to="/" style={{ display: "flex", alignItems: "center", gap: "10px", textDecoration: "none" }}>
          <div style={{
            width: 36, height: 36, borderRadius: 10,
            background: "linear-gradient(135deg, #6F2DBD, #8B5CF6)",
            display: "flex", alignItems: "center", justifyContent: "center",
            boxShadow: "0 2px 12px rgba(111,45,189,0.45)",
          }}>
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <path d="M9 2L16 6V12L9 16L2 12V6L9 2Z" fill="white" fillOpacity="0.95"/>
              <circle cx="9" cy="9" r="3" fill="white"/>
            </svg>
          </div>
          <div style={{ lineHeight: 1.2 }}>
            <div style={{ fontSize: "14px", fontWeight: 700, color: "#ffffff", letterSpacing: "-0.01em" }}>
              Pragati Agent
            </div>
            <div style={{ fontSize: "11px", color: "rgba(255,255,255,0.4)", fontWeight: 400 }}>
              by Meesho Finance
            </div>
          </div>
        </Link>

        {/* Desktop nav links */}
        <nav style={{ display: "flex", alignItems: "center", gap: "4px" }} className="hidden md:flex">
          {NAV_LINKS.map(({ to, label, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              style={({ isActive }) => ({
                padding: "7px 16px",
                borderRadius: "10px",
                fontSize: "14px",
                fontWeight: isActive ? 600 : 500,
                color: isActive ? "#ffffff" : "rgba(255,255,255,1)",
                background: isActive ? "rgba(111,45,189,0.35)" : "transparent",
                border: isActive ? "1px solid rgba(111,45,189,0.4)" : "1px solid transparent",
                textDecoration: "none",
                transition: "all 0.2s",
              })}
              onMouseEnter={e => {
                if (!e.currentTarget.style.background.includes("0.35")) {
                  e.currentTarget.style.color = "#ffffff";
                  e.currentTarget.style.background = "rgba(255,255,255,0.06)";
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
              {label}
            </NavLink>
          ))}
        </nav>

        {/* Right side */}
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }} className="hidden md:flex">
          <MiniLanguageSelector />

          {/* Backend status */}
          {backendChecked && (
            <motion.div
              initial={{ opacity: 0, scale: 0.85 }}
              animate={{ opacity: 1, scale: 1 }}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "6px",
                padding: "5px 12px",
                borderRadius: "10px",
                fontSize: "12px",
                fontWeight: 600,
                color: backendOnline ? "#4ADE80" : "#F87171",
                background: backendOnline ? "rgba(74,222,128,0.1)" : "rgba(248,113,113,0.1)",
                border: `1px solid ${backendOnline ? "rgba(74,222,128,0.25)" : "rgba(248,113,113,0.25)"}`,
              }}
            >
              {backendOnline ? (
                <>
                  <motion.span
                    style={{ width: 6, height: 6, borderRadius: "50%", background: "#4ADE80", display: "block" }}
                    animate={{ opacity: [1, 0.3, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  />
                  <Wifi style={{ width: 13, height: 13 }} />
                  Live
                </>
              ) : (
                <>
                  <WifiOff style={{ width: 13, height: 13 }} />
                  Offline
                </>
              )}
            </motion.div>
          )}

          {/* CTA */}
          <Link
            to="/evaluate"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              padding: "8px 20px",
              borderRadius: "10px",
              fontSize: "13px",
              fontWeight: 600,
              color: "#ffffff",
              background: "linear-gradient(135deg, #6F2DBD 0%, #8B5CF6 100%)",
              boxShadow: "0 2px 12px rgba(111,45,189,0.4)",
              textDecoration: "none",
              transition: "all 0.2s",
              border: "none",
            }}
            onMouseEnter={e => e.currentTarget.style.boxShadow = "0 4px 20px rgba(111,45,189,0.6)"}
            onMouseLeave={e => e.currentTarget.style.boxShadow = "0 2px 12px rgba(111,45,189,0.4)"}
          >
            Evaluate Now
          </Link>
        </div>

        {/* Mobile toggle */}
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          style={{
            padding: "8px",
            borderRadius: "10px",
            background: "rgba(255,255,255,0.06)",
            border: "1px solid rgba(255,255,255,0.1)",
            color: "rgba(255,255,255,0.8)",
            cursor: "pointer",
          }}
          className="md:hidden"
        >
          {mobileOpen ? <X style={{ width: 20, height: 20 }} /> : <Menu style={{ width: 20, height: 20 }} />}
        </button>
      </div>

      {/* Mobile menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            style={{
              background: "#120B2E",
              borderTop: "1px solid rgba(255,255,255,0.08)",
              overflow: "hidden",
            }}
            className="md:hidden"
          >
            <div style={{ padding: "12px 16px", display: "flex", flexDirection: "column", gap: "4px" }}>
              {NAV_LINKS.map(({ to, label, end }) => (
                <NavLink
                  key={to}
                  to={to}
                  end={end}
                  onClick={() => setMobileOpen(false)}
                  style={({ isActive }) => ({
                    padding: "10px 16px",
                    borderRadius: "10px",
                    fontSize: "14px",
                    fontWeight: 500,
                    color: isActive ? "#ffffff" : "rgba(255,255,255,0.6)",
                    background: isActive ? "rgba(111,45,189,0.3)" : "transparent",
                    textDecoration: "none",
                  })}
                >
                  {label}
                </NavLink>
              ))}
              <div style={{ paddingTop: "12px", borderTop: "1px solid rgba(255,255,255,0.08)", marginTop: "4px" }}>
                <Link
                  to="/evaluate"
                  onClick={() => setMobileOpen(false)}
                  style={{
                    display: "block",
                    textAlign: "center",
                    padding: "10px",
                    borderRadius: "10px",
                    fontSize: "14px",
                    fontWeight: 600,
                    color: "#ffffff",
                    background: "linear-gradient(135deg, #6F2DBD, #8B5CF6)",
                    textDecoration: "none",
                  }}
                >
                  Evaluate Now
                </Link>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
