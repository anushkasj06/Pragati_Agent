import { useRef } from "react";
import { Link } from "react-router-dom";
import { motion, useInView } from "framer-motion";
import { ArrowRight, ArrowUpRight, Plus } from "lucide-react";

/* ── Floating metric card ──────────────────────────────────── */
function FloatCard({ children, style, delay = 0 }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.5 }}
      style={{
        position: "absolute",
        background: "#ffffff",
        border: "1px solid #E9E5F5",
        borderRadius: "16px",
        boxShadow: "0 4px 24px rgba(111,45,189,0.10)",
        padding: "12px 16px",
        ...style,
      }}
    >
      {children}
    </motion.div>
  );
}

/* ── Hero illustration ─────────────────────────────────────── */
function HeroIllustration() {
  return (
    <div style={{ position: "relative", width: "100%", maxWidth: 480, margin: "0 auto", paddingBottom: 40, paddingTop: 20 }}>

      {/* Central purple card — matches PPT exactly */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25, duration: 0.6 }}
        style={{
          background: "linear-gradient(138deg, #5F26B0 0%, #6F2DBD 42%, #8857F4 100%)",
          borderRadius: 24,
          padding: "32px 28px",
          color: "#ffffff",
          boxShadow: "0 16px 54px rgba(95,38,176,0.34)",
          position: "relative",
          overflow: "hidden",
          zIndex: 2,
        }}
      >
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.35, duration: 0.8 }}
          style={{
            position: "absolute",
            top: -74,
            right: -62,
            width: 180,
            height: 180,
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(255,255,255,0.26) 0%, rgba(255,255,255,0) 70%)",
            pointerEvents: "none",
          }}
        />
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.45, duration: 0.9 }}
          style={{
            position: "absolute",
            bottom: -96,
            left: -58,
            width: 220,
            height: 220,
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(196,181,253,0.22) 0%, rgba(196,181,253,0) 72%)",
            pointerEvents: "none",
          }}
        />

        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.32, duration: 0.45 }}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            padding: "6px 11px",
            borderRadius: 999,
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: "0.04em",
            textTransform: "uppercase",
            background: "rgba(255,255,255,0.14)",
            border: "1px solid rgba(255,255,255,0.20)",
            marginBottom: 14,
            position: "relative",
            zIndex: 1,
          }}
        >
          <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#4ADE80", boxShadow: "0 0 0 6px rgba(74,222,128,0.18)" }} />
          Live Underwriting Snapshot
        </motion.div>

        {/* Logo icon */}
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 18, position: "relative", zIndex: 1 }}>
          <div style={{
            width: 44, height: 44, borderRadius: 12,
            background: "rgba(255,255,255,0.18)",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
              <path d="M11 3L19 7.5V14.5L11 19L3 14.5V7.5L11 3Z" fill="white" fillOpacity="0.95"/>
              <circle cx="11" cy="11" r="3.5" fill="white"/>
            </svg>
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: 15 }}>Pragati Agent</div>
            <div style={{ fontSize: 12, opacity: 0.65 }}>AI Underwriting Engine</div>
          </div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.55, duration: 0.45 }}
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
            gap: 7,
            marginBottom: 16,
            position: "relative",
            zIndex: 1,
          }}
        >
          {[
            { label: "SLA", value: "97%" },
            { label: "RTO", value: "8.4%" },
            { label: "Growth", value: "+18%" },
          ].map((item) => (
            <div
              key={item.label}
              style={{
                background: "rgba(255,255,255,0.12)",
                border: "1px solid rgba(255,255,255,0.16)",
                borderRadius: 10,
                padding: "7px 8px",
                textAlign: "center",
              }}
            >
              <div style={{ fontSize: 10, opacity: 0.72, marginBottom: 2 }}>{item.label}</div>
              <div style={{ fontSize: 12, fontWeight: 800 }}>{item.value}</div>
            </div>
          ))}
        </motion.div>

        {/* Risk score bar */}
        <div style={{ marginBottom: 16, position: "relative", zIndex: 1 }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
            <span style={{ fontSize: 12, opacity: 0.7 }}>Risk Score</span>
            <span style={{ fontSize: 13, fontWeight: 700, color: "#4ADE80" }}>94 / 100</span>
          </div>
          <div style={{ height: 6, background: "rgba(255,255,255,0.15)", borderRadius: 99, overflow: "hidden" }}>
            <motion.div
              style={{ height: "100%", borderRadius: 99, background: "#4ADE80" }}
              initial={{ width: 0 }}
              animate={{ width: "94%" }}
              transition={{ delay: 0.8, duration: 1.2, ease: "easeOut" }}
            />
          </div>
        </div>

        {/* Three metric chips */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginBottom: 12, position: "relative", zIndex: 1 }}>
          {[
            { label: "Risk Class",   value: "Low",    color: "#4ADE80" },
            { label: "Loan Limit",   value: "Rs.75K", color: "#FCD34D" },
            { label: "Language",     value: "Hindi",  color: "#C4B5FD" },
          ].map((m, idx) => (
            <motion.div
              key={m.label}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.75 + idx * 0.1, duration: 0.35 }}
              style={{
                background: "rgba(255,255,255,0.12)",
                borderRadius: 12,
                padding: "10px 8px",
                textAlign: "center",
              }}
            >
              <div style={{ fontSize: 11, opacity: 0.65, marginBottom: 3 }}>{m.label}</div>
              <div style={{ fontSize: 13, fontWeight: 700, color: m.color }}>{m.value}</div>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.95, duration: 0.4 }}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 10,
            fontSize: 11,
            color: "rgba(255,255,255,0.88)",
            borderTop: "1px dashed rgba(255,255,255,0.24)",
            paddingTop: 10,
            position: "relative",
            zIndex: 1,
          }}
        >
          <span>Top driver: Dispatch reliability</span>
          <span style={{ fontWeight: 700, color: "#FDE68A" }}>Confidence 0.92</span>
        </motion.div>
      </motion.div>

      {/* Float card — Approved */}
      <FloatCard
        delay={0.55}
        style={{ right: -24, top: 16, width: 164, zIndex: 3 }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
          <div style={{ width: 7, height: 7, borderRadius: "50%", background: "#22C55E" }} />
          <span style={{ fontSize: 11, fontWeight: 700, color: "#16A34A" }}>Approved</span>
        </div>
        <div style={{ fontSize: 18, fontWeight: 800, color: "#1A1A2E" }}>Rs. 75,000</div>
        <div style={{ fontSize: 11, color: "#9CA3AF", marginTop: 2 }}>Working capital loan</div>
      </FloatCard>

      {/* Float card — AI explanation */}
      <FloatCard
        delay={0.7}
        style={{ left: -20, bottom: 48, width: 196, zIndex: 3 }}
      >
        <div style={{ fontSize: 10, color: "#9CA3AF", fontWeight: 600, marginBottom: 5, textTransform: "uppercase", letterSpacing: "0.05em" }}>
          AI Explanation
        </div>
        <p style={{ fontSize: 12, color: "#374151", lineHeight: 1.5 }}>
          Strong dispatch SLA and customer rating drive eligibility.
        </p>
      </FloatCard>

      {/* Float card — Languages */}
      <FloatCard
        delay={0.85}
        style={{ right: -16, bottom: 8, zIndex: 3 }}
      >
        <div style={{ fontSize: 11, color: "#9CA3AF", marginBottom: 2 }}>Response in</div>
        <div style={{ fontSize: 14, fontWeight: 800, color: "#6F2DBD" }}>8 Languages</div>
      </FloatCard>
    </div>
  );
}

/* ── Workflow strip ─────────────────────────────────────────── */
const PIPELINE = [
  "Gather Data",
  "ML Scoring",
  "AI Reasoning",
  "Rules Engine",
  "Loan Decision",
  "WhatsApp Guide",
];

/* ── Main component ─────────────────────────────────────────── */
export default function HeroSection() {
  return (
    <section
      style={{
        background: "radial-gradient(circle at 14% 22%, #F4EDFF 0%, rgba(244,237,255,0) 34%), radial-gradient(circle at 86% 14%, #FFF5E8 0%, rgba(255,245,232,0) 31%), linear-gradient(160deg, #FBF8FF 0%, #FFFFFF 54%, #FFF9EF 100%)",
        padding: "52px 12px 34px",
        overflow: "hidden",
      }}
    >
      <style>{`
        @keyframes pulse {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.2); opacity: 0.7; }
        }
        .hero-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 34px;
          align-items: center;
        }
        @media (max-width: 900px) {
          .hero-grid {
            grid-template-columns: 1fr;
            gap: 32px;
          }
        }
      `}</style>
      <div style={{ maxWidth: 1280, margin: "0 auto" }}>
        <div className="hero-grid">
          {/* ── Left column ── */}
          <div style={{ minWidth: 0 }}>

            <motion.div
              style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 18 }}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
            >
              <span className="badge-orange">Meesho ScriptedBy Her 2.0</span>
              <span className="badge-purple">Building for Bharat</span>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1, duration: 0.45 }}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 10,
                padding: "10px 14px",
                borderRadius: 999,
                marginBottom: 20,
                background: "linear-gradient(90deg, rgba(111,45,189,0.10) 0%, rgba(37,211,102,0.12) 100%)",
                border: "1px solid rgba(111,45,189,0.16)",
                boxShadow: "0 8px 24px rgba(111,45,189,0.08)",
              }}
            >
              <div style={{ width: 9, height: 9, borderRadius: "50%", background: "#25D366", boxShadow: "0 0 0 6px rgba(37,211,102,0.16)", animation: "pulse 1.8s ease-in-out infinite" }} />
              <div style={{ fontSize: 13, color: "#374151", lineHeight: 1.4 }}>
                <span style={{ fontWeight: 800, color: "#111827" }}>Demo Note (Click on Refresh till Backend get live ):</span>{" "}
                Backend is hosted on Render Free Tier. Initial wake-up may take 2–3 minutes. Once the live indicator turns green, the full AI underwriting pipeline becomes available.
              </div>
            </motion.div>

            {/* Headline */}
            <motion.h1
              style={{
                fontSize: "clamp(40px, 5vw, 60px)",
                fontWeight: 900,
                lineHeight: 1.08,
                color: "#1A1A2E",
                letterSpacing: "-0.02em",
                marginBottom: 16,
              }}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.08, duration: 0.55 }}
            >
              Meesho{" "}
              <span style={{ color: "#6F2DBD" }}>Pragati</span>
              <br />
              Agent
            </motion.h1>

            {/* Subtitle — PPT purple */}
            <motion.p
              style={{
                fontSize: 20,
                fontWeight: 700,
                color: "#6F2DBD",
                marginBottom: 12,
              }}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15, duration: 0.5 }}
            >
              Agentic AI for Inclusive Seller Lending in Bharat
            </motion.p>

            {/* Body copy */}
            <motion.p
              style={{
                fontSize: 16,
                color: "#4B5563",
                lineHeight: 1.75,
                marginBottom: 28,
                maxWidth: 520,
              }}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.22, duration: 0.5 }}
            >
              An autonomous AI agent that analyzes a seller's real business performance
              on Meesho, recommends fair working capital, and provides transparent
              financial decisions — instead of rejecting them just because they lack a
              traditional bank credit score.
            </motion.p>

            {/* Theme strip */}
            {/* <motion.div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                background: "#FFFBEB",
                border: "1px solid #FDE68A",
                borderRadius: 14,
                padding: "10px 16px",
                marginBottom: 32,
                width: "fit-content",
              }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3, duration: 0.4 }}
            >
              <div style={{ width: 3, height: 36, borderRadius: 99, background: "#F59E0B" }} />
              <div>
                <div style={{ fontSize: 11, color: "#92400E", fontWeight: 600, marginBottom: 2 }}>Theme</div>
                <div style={{ fontSize: 13, fontWeight: 700, color: "#1A1A2E" }}>
                  <span style={{ color: "#F59E0B" }}>Building for Bharat</span>
                  {" "}with the Power of{" "}
                  <span style={{ color: "#6F2DBD" }}>Agentic AI</span>
                </div>
              </div>
            </motion.div> */}

            {/* CTA buttons */}
            <motion.div
              style={{ display: "flex", flexWrap: "wrap", gap: 12, marginBottom: 36 }}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.36, duration: 0.5 }}
            >
              <Link to="/seller" style={{ display:"inline-flex",alignItems:"center",gap:8,
                padding:"13px 28px",borderRadius:12,fontSize:15,fontWeight:700,
                color:"#ffffff",background:"#6F2DBD",
                boxShadow:"0 3px 16px rgba(111,45,189,0.30)",textDecoration:"none",transition:"all 0.2s" }}
                onMouseEnter={e=>{ e.currentTarget.style.background="#5A22A0"; e.currentTarget.style.boxShadow="0 5px 24px rgba(111,45,189,0.4)"; }}
                onMouseLeave={e=>{ e.currentTarget.style.background="#6F2DBD"; e.currentTarget.style.boxShadow="0 3px 16px rgba(111,45,189,0.30)"; }}
              >
                Seller Portal
                <ArrowRight style={{ width: 16, height: 16 }} />
              </Link>

              <Link to="/create-seller" style={{ display:"inline-flex",alignItems:"center",gap:8,
                padding:"13px 24px",borderRadius:12,fontSize:15,fontWeight:700,
                color:"#ffffff",background:"#128C7E",
                boxShadow:"0 3px 16px rgba(18,140,126,0.24)",textDecoration:"none",transition:"all 0.2s" }}
                onMouseEnter={e=>{ e.currentTarget.style.background="#0F766E"; e.currentTarget.style.boxShadow="0 5px 20px rgba(18,140,126,0.32)"; }}
                onMouseLeave={e=>{ e.currentTarget.style.background="#128C7E"; e.currentTarget.style.boxShadow="0 3px 16px rgba(18,140,126,0.24)"; }}
              >
                <Plus style={{ width: 16, height: 16 }} />
                Create Seller
              </Link>

              <Link to="/dashboard" style={{ display:"inline-flex",alignItems:"center",gap:8,
                padding:"13px 28px",borderRadius:12,fontSize:15,fontWeight:600,
                color:"#6F2DBD",background:"#ffffff",border:"1.5px solid #6F2DBD",
                textDecoration:"none",transition:"all 0.2s" }}
                onMouseEnter={e => e.currentTarget.style.background = "#F3ECFF"}
                onMouseLeave={e => e.currentTarget.style.background = "#ffffff"}
              >
                Admin Portal
                <ArrowUpRight style={{ width: 15, height: 15 }} />
              </Link>
            </motion.div>

            {/* Pipeline strip
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.44, duration: 0.5 }}
            >
              <div style={{ fontSize: 10, fontWeight: 600, color: "#9CA3AF", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 10 }}>
                The Pipeline
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6, alignItems: "center" }}>
                {PIPELINE.map((step, i) => (
                  <div key={step} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <motion.span
                      style={{
                        padding: "5px 12px",
                        background: "#ffffff",
                        border: "1px solid #E9E5F5",
                        borderRadius: 10,
                        fontSize: 12,
                        fontWeight: 500,
                        color: "#374151",
                        boxShadow: "0 1px 6px rgba(111,45,189,0.06)",
                      }}
                      initial={{ opacity: 0, x: -6 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.5 + i * 0.06 }}
                    >
                      {step}
                    </motion.span>
                    {i < PIPELINE.length - 1 && (
                      <span style={{ fontSize: 13, color: "#D1D5DB", fontWeight: 300 }}>→</span>
                    )}
                  </div>
                ))}
              </div>
            </motion.div>*/}
          </div> 

          {/* ── Right column — illustration ── */}
          <motion.div
            initial={{ opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.28, duration: 0.65 }}
            style={{ display: "flex", justifyContent: "center" }}
          >
            <HeroIllustration />
          </motion.div>
        </div>
      </div>
    </section>
  );
}
