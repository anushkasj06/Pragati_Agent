/**
 * DashboardPage.jsx
 * Enterprise analytics dashboard for Meesho Pragati Agent.
 * All styles are inline – no custom Tailwind @apply classes.
 */

import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  TrendingUp, CheckCircle, XCircle, Clock, IndianRupee,
  ExternalLink, ArrowUpRight, ArrowDownRight, ThumbsUp, ThumbsDown,
} from "lucide-react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell,
  BarChart, Bar, Legend,
} from "recharts";
import { useAnimatedNumber } from "../hooks/useAnimatedNumber";
import { useNotifications } from "../context/NotificationContext";
import { approveLoanApplication, getLoanApplications, rejectLoanApplication } from "../services/api";

// ---------------------------------------------------------------------------
// Design tokens
// ---------------------------------------------------------------------------
const C = {
  purple:  "#371064ff",
  purple2: "#56369eff",
  orange:  "#F59E0B",
  green:   "#22C55E",
  red:     "#EF4444",
  amber:   "#F59E0B",
  text1:   "#1A1A2E",
  text2:   "#4B5563",
  muted:   "#9CA3AF",
  cardBg:  "#FFFFFF",
  border:  "#E9E5F5",
  bg:      "#F8F4FF",
};

// ---------------------------------------------------------------------------
// Mock data
// ---------------------------------------------------------------------------
const TREND_DATA = [
  { date: "Mon", approved: 12, rejected: 3, review: 2 },
  { date: "Tue", approved: 18, rejected: 5, review: 4 },
  { date: "Wed", approved: 14, rejected: 2, review: 3 },
  { date: "Thu", approved: 22, rejected: 6, review: 5 },
  { date: "Fri", approved: 19, rejected: 4, review: 2 },
  { date: "Sat", approved: 9,  rejected: 1, review: 1 },
  { date: "Sun", approved: 16, rejected: 3, review: 3 },
];

const PIE_DATA = [
  { name: "Low Risk",    value: 45, color: C.green },
  { name: "Moderate",   value: 35, color: C.amber  },
  { name: "High Risk",  value: 20, color: C.red    },
];

const BAR_DATA = [
  { metric: "Dispatch SLA",    score: 91 },
  { metric: "Cust. Rating",    score: 78 },
  { metric: "Sales Growth",    score: 84 },
  { metric: "Ad ROI",          score: 70 },
  { metric: "Catalog Size",    score: 65 },
];

const DECISIONS = [
  { id: "SELL_00123", riskClass: "Low",      score: 18, limit: "₹2,00,000", status: "Approved",  lang: "English", time: "2m ago"  },
  { id: "SELL_00124", riskClass: "Moderate", score: 48, limit: "₹75,000",   status: "Review",    lang: "Hindi",   time: "5m ago"  },
  { id: "SELL_00125", riskClass: "High",     score: 82, limit: "—",         status: "Rejected",  lang: "Tamil",   time: "11m ago" },
  { id: "SELL_00126", riskClass: "Low",      score: 22, limit: "₹1,50,000", status: "Approved",  lang: "Telugu",  time: "18m ago" },
  { id: "SELL_00127", riskClass: "Moderate", score: 55, limit: "₹50,000",   status: "Review",    lang: "Marathi", time: "25m ago" },
  { id: "SELL_00128", riskClass: "Low",      score: 14, limit: "₹2,50,000", status: "Approved",  lang: "Kannada", time: "31m ago" },
];

// ---------------------------------------------------------------------------
// Shared card style helper
// ---------------------------------------------------------------------------
const card = (extra = {}) => ({
  background: C.cardBg,
  border: `1px solid ${C.border}`,
  borderRadius: 16,
  padding: 24,
  boxShadow: "0 2px 16px rgba(111,45,189,0.08)",
  ...extra,
});

// ---------------------------------------------------------------------------
// Motion helpers
// ---------------------------------------------------------------------------
const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 24 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.45, delay, ease: [0.22, 1, 0.36, 1] },
});

// ---------------------------------------------------------------------------
// KPI Card
// ---------------------------------------------------------------------------
function KpiCard({ icon: Icon, label, target, prefix = "", suffix = "", color, bgColor, trend, trendUp, delay }) {
  const animated = useAnimatedNumber(target, 1200, delay * 200);
  return (
    <motion.div style={card()} {...fadeUp(delay * 0.12)}>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 16 }}>
        <div style={{
          width: 44, height: 44, borderRadius: 12, flexShrink: 0,
          background: bgColor,
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <Icon style={{ width: 22, height: 22, color }} />
        </div>
        <div style={{
          display: "flex", alignItems: "center", gap: 4,
          fontSize: 12, fontWeight: 600,
          color: trendUp ? C.green : C.red,
          background: trendUp ? "rgba(34,197,94,0.1)" : "rgba(239,68,68,0.1)",
          padding: "3px 8px", borderRadius: 20,
        }}>
          {trendUp ? <ArrowUpRight style={{ width: 13, height: 13 }} /> : <ArrowDownRight style={{ width: 13, height: 13 }} />}
          {trend}
        </div>
      </div>
      <div style={{ fontSize: 28, fontWeight: 800, color: C.text1, letterSpacing: "-0.02em", lineHeight: 1 }}>
        {prefix}{animated.toLocaleString()}{suffix}
      </div>
      <div style={{ fontSize: 13, color: C.text2, marginTop: 6, fontWeight: 500 }}>{label}</div>
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// Status / Risk badge
// ---------------------------------------------------------------------------
const STATUS_CFG = {
  Approved: { color: "#16A34A", bg: "rgba(34,197,94,0.12)", border: "rgba(34,197,94,0.3)" },
  Rejected: { color: "#DC2626", bg: "rgba(239,68,68,0.12)", border: "rgba(239,68,68,0.3)" },
  Review:   { color: "#D97706", bg: "rgba(245,158,11,0.12)", border: "rgba(245,158,11,0.3)" },
};
const RISK_CFG = {
  Low:      { color: "#16A34A", bg: "rgba(34,197,94,0.1)"  },
  Moderate: { color: "#D97706", bg: "rgba(245,158,11,0.1)" },
  High:     { color: "#DC2626", bg: "rgba(239,68,68,0.1)"  },
};

function StatusBadge({ status }) {
  const cfg = STATUS_CFG[status] || STATUS_CFG.Review;
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 4,
      padding: "3px 10px", borderRadius: 20, fontSize: 12, fontWeight: 600,
      color: cfg.color, background: cfg.bg, border: `1px solid ${cfg.border}`,
    }}>
      <span style={{ width: 5, height: 5, borderRadius: "50%", background: cfg.color }} />
      {status}
    </span>
  );
}

function RiskBadge({ risk }) {
  const cfg = RISK_CFG[risk] || RISK_CFG.Moderate;
  return (
    <span style={{
      display: "inline-block",
      padding: "2px 10px", borderRadius: 20, fontSize: 12, fontWeight: 600,
      color: cfg.color, background: cfg.bg,
    }}>
      {risk}
    </span>
  );
}

// Custom recharts tooltip
function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: "#fff", border: `1px solid ${C.border}`, borderRadius: 12,
      padding: "10px 14px", boxShadow: "0 4px 20px rgba(111,45,189,0.12)", fontSize: 13,
    }}>
      <div style={{ fontWeight: 700, color: C.text1, marginBottom: 6 }}>{label}</div>
      {payload.map((p) => (
        <div key={p.name} style={{ color: p.color, fontWeight: 500, marginBottom: 2 }}>
          {p.name.charAt(0).toUpperCase() + p.name.slice(1)}: <strong>{p.value}</strong>
        </div>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main DashboardPage
// ---------------------------------------------------------------------------
export default function DashboardPage() {
  const navigate = useNavigate();
  const [hoveredRow, setHoveredRow] = useState(null);
  const [applications, setApplications] = useState([]);
  const [loadingApps, setLoadingApps] = useState(true);
  const [reviewNote, setReviewNote] = useState({});
  const [busyId, setBusyId] = useState(null);
  const [selectedAppId, setSelectedAppId] = useState(null);
  const { addNotification } = useNotifications();

  useEffect(() => {
    async function load() {
      try {
        const data = await getLoanApplications();
        setApplications(data || []);
      } catch {
        setApplications([]);
      } finally {
        setLoadingApps(false);
      }
    }
    load();
  }, []);

  const approvedCount = applications.filter((app) => app.status === "approved").length;
  const rejectedCount = applications.filter((app) => app.status === "rejected").length;
  const pendingCount = applications.filter((app) => app.status === "pending").length;
  const avgAmount = applications.length ? Math.round(applications.reduce((sum, app) => sum + Number(app.amount || app.requestedAmount || 0), 0) / applications.length) : 0;

  async function handleDecision(appId, action) {
    const note = reviewNote[appId] || "";
    setBusyId(appId);
    try {
      const updated = action === "approve"
        ? await approveLoanApplication(appId, note)
        : await rejectLoanApplication(appId, note);
      addNotification({
        title: action === "approve" ? "Loan sanctioned" : "Loan rejected",
        message: `${updated.sellerName || "Seller"}'s application ${updated.id} was ${action === "approve" ? "approved" : "rejected"}.`,
        type: action === "approve" ? "success" : "rejected",
      });
      setApplications((prev) => prev.map((app) => (app.id === updated.id ? updated : app)));
      setSelectedAppId(updated.id);
    } catch (err) {
      alert(err?.message || "Unable to update application");
    } finally {
      setBusyId(null);
    }
  }

  // ----- KPI section -----
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>

      {/* Page heading */}
      <motion.div {...fadeUp(0)}>
        <h1 style={{ fontSize: 22, fontWeight: 800, color: C.text1, margin: 0, letterSpacing: "-0.02em" }}>
          Analytics Dashboard
        </h1>
        <p style={{ fontSize: 13, color: C.muted, margin: "4px 0 0" }}>
          Real-time overview of seller evaluations and loan decisions
        </p>
      </motion.div>

      {/* Section 1: KPI cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 16 }}>
        <KpiCard icon={TrendingUp}   label="Total Applications" target={applications.length} color="#6F2DBD" bgColor="rgba(111,45,189,0.12)" trend="Live" trendUp delay={0} />
        <KpiCard icon={CheckCircle}  label="Approved"          target={approvedCount}  color="#22C55E" bgColor="rgba(34,197,94,0.12)"  trend="" trendUp delay={1} />
        <KpiCard icon={XCircle}      label="Rejected"          target={rejectedCount}  color="#EF4444" bgColor="rgba(239,68,68,0.12)"  trend=""  trendUp={false} delay={2} />
        <KpiCard icon={Clock}        label="Pending Review"    target={pendingCount}  color="#F59E0B" bgColor="rgba(245,158,11,0.12)" trend=""  trendUp delay={3} />
        <KpiCard icon={IndianRupee}  label="Avg Loan Limit"    target={avgAmount} prefix="₹" color="#8B5CF6" bgColor="rgba(139,92,246,0.12)" trend="" trendUp delay={4} />
      </div>

      {/* Section 2: Charts row */}
      <div style={{ display: "grid", gridTemplateColumns: "3fr 2fr", gap: 20 }}>

        {/* Approval Trends area chart */}
        <motion.div style={card()} {...fadeUp(0.18)}>
          <div style={{ marginBottom: 20 }}>
            <h2 style={{ fontSize: 16, fontWeight: 700, color: C.text1, margin: 0 }}>Approval Trends</h2>
            <p style={{ fontSize: 12, color: C.muted, margin: "3px 0 0" }}>Last 7 days performance</p>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={TREND_DATA} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="gradApproved" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#6F2DBD" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#6F2DBD" stopOpacity={0.02} />
                </linearGradient>
                <linearGradient id="gradRejected" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#EF4444" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#EF4444" stopOpacity={0.02} />
                </linearGradient>
                <linearGradient id="gradReview" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#F59E0B" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#F59E0B" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#F0ECF9" />
              <XAxis dataKey="date" tick={{ fontSize: 12, fill: C.muted }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: C.muted }} axisLine={false} tickLine={false} />
              <Tooltip content={<ChartTooltip />} />
              <Area type="monotone" dataKey="approved" stroke="#6F2DBD" strokeWidth={2.5} fill="url(#gradApproved)" />
              <Area type="monotone" dataKey="rejected" stroke="#EF4444" strokeWidth={2}   fill="url(#gradRejected)" />
              <Area type="monotone" dataKey="review"   stroke="#F59E0B" strokeWidth={2}   fill="url(#gradReview)"   />
            </AreaChart>
          </ResponsiveContainer>
          {/* Legend */}
          <div style={{ display: "flex", gap: 20, marginTop: 12, justifyContent: "center" }}>
            {[["#6F2DBD","Approved"],["#EF4444","Rejected"],["#F59E0B","Review"]].map(([color, label]) => (
              <div key={label} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: C.text2 }}>
                <span style={{ width: 10, height: 10, borderRadius: 3, background: color }} />
                {label}
              </div>
            ))}
          </div>
        </motion.div>

        {/* Risk Distribution pie */}
        <motion.div style={card()} {...fadeUp(0.24)}>
          <div style={{ marginBottom: 16 }}>
            <h2 style={{ fontSize: 16, fontWeight: 700, color: C.text1, margin: 0 }}>Risk Distribution</h2>
            <p style={{ fontSize: 12, color: C.muted, margin: "3px 0 0" }}>Current portfolio breakdown</p>
          </div>
          <ResponsiveContainer width="100%" height={180}>
            <PieChart>
              <Pie data={PIE_DATA} cx="50%" cy="50%" innerRadius={52} outerRadius={82} paddingAngle={3} dataKey="value">
                {PIE_DATA.map((entry, i) => (
                  <Cell key={i} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip formatter={(v, n) => [`${v}%`, n]} contentStyle={{ borderRadius: 10, border: `1px solid ${C.border}`, fontSize: 12 }} />
            </PieChart>
          </ResponsiveContainer>
          <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 10 }}>
            {PIE_DATA.map((d) => (
              <div key={d.name} style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ width: 10, height: 10, borderRadius: "50%", background: d.color, flexShrink: 0 }} />
                  <span style={{ fontSize: 13, color: C.text2 }}>{d.name}</span>
                </div>
                <span style={{ fontSize: 13, fontWeight: 700, color: C.text1 }}>{d.value}%</span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Section 3: Approval queue */}
      <motion.div style={card({ padding: 0 })} {...fadeUp(0.3)}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "20px 24px 16px" }}>
          <div>
            <h2 style={{ fontSize: 16, fontWeight: 700, color: C.text1, margin: 0 }}>Approval Queue</h2>
            <p style={{ fontSize: 12, color: C.muted, margin: "3px 0 0" }}>Review seller applications and sanction loans</p>
          </div>
          <Link to="/history" style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 13, fontWeight: 600, color: C.purple, textDecoration: "none" }}>
            View All <ExternalLink style={{ width: 13, height: 13 }} />
          </Link>
        </div>
        <div style={{ overflowX: "auto" }}>
          {loadingApps ? (
            <div style={{ padding: "24px", color: C.muted }}>Loading applications...</div>
          ) : (() => {
            const reviewApps = applications.filter((app) => app.status === "pending" || !app.status);
            return reviewApps.length === 0 ? (
            <div style={{ padding: "24px", color: C.muted }}>All applications have been reviewed. <Link to="/history" style={{ color: C.purple, textDecoration: "none", fontWeight: 600 }}>View all applications</Link></div>
          ) : (
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: "#FAFAFA", borderBottom: `1px solid ${C.border}` }}>
                  {['Seller','Amount','Risk','Submitted','Details'].map((h) => (
                    <th key={h} style={{ padding: "10px 16px", fontSize: 12, fontWeight: 600, color: C.muted, textAlign: "left", whiteSpace: "nowrap" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {reviewApps.map((app, i) => (
                  <tr
                    key={app.id}
                    onMouseEnter={() => setHoveredRow(i)}
                    onMouseLeave={() => setHoveredRow(null)}
                    onClick={() => setSelectedAppId(selectedAppId === app.id ? null : app.id)}
                    style={{
                      borderBottom: i < reviewApps.length - 1 ? `1px solid ${C.border}` : "none",
                      background: selectedAppId === app.id ? "#EEF2FF" : hoveredRow === i ? "#F8F4FF" : i % 2 === 0 ? "#FFFFFF" : "#FDFCFF",
                      transition: "background 0.15s",
                      cursor: "pointer",
                    }}
                  >
                    <td style={{ padding: "12px 16px" }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: C.purple }}>{app.sellerName || app.sellerId}</div>
                      <div style={{ fontSize: 12, color: C.muted }}>{app.sellerId}</div>
                    </td>
                    <td style={{ padding: "12px 16px", fontSize: 13, fontWeight: 600, color: C.text1 }}>₹{Number(app.amount || app.requestedAmount || 0).toLocaleString("en-IN")}</td>
                    <td style={{ padding: "12px 16px" }}><RiskBadge risk={app.riskClass || "Pending"} /></td>
                    <td style={{ padding: "12px 16px", fontSize: 12, color: C.muted }}>{new Date(app.submittedAt).toLocaleString("en-IN")}</td>
                    <td style={{ padding: "12px 16px" }}>
                      <button
                        onClick={(e) => { e.stopPropagation(); setSelectedAppId(selectedAppId === app.id ? null : app.id); }}
                        style={{
                          padding: "6px 12px",
                          borderRadius: 6,
                          border: `1px solid ${C.border}`,
                          background: "#fff",
                          color: C.purple,
                          cursor: "pointer",
                          fontSize: 12,
                          fontWeight: 600,
                        }}
                      >
                        {selectedAppId === app.id ? "Hide details" : "View details"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          );
          })()}
        </div>
          {selectedAppId && (
            <div style={{ padding: "20px 24px 24px", background: "#F9F7FF", borderTop: `1px solid ${C.border}` }}>
              {(() => {
                const app = applications.find((item) => item.id === selectedAppId);
                if (!app) return null;
                return (
                  <div style={{ display: "grid", gap: 24 }}>
                    {/* Loan Summary Card */}
                    <div style={{ ...card({ padding: 20, background: "#fff" }) }}>
                      <div style={{ fontSize: 14, fontWeight: 700, color: C.text1, marginBottom: 16, display: "flex", alignItems: "center", gap: 8 }}>
                        <IndianRupee style={{ width: 18, height: 18, color: C.purple }} />
                        Loan Summary
                      </div>
                      <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 16 }}>
                        <div>
                          <div style={{ fontSize: 12, color: C.muted, marginBottom: 6 }}>Submitted Amount</div>
                          <div style={{ fontSize: 15, fontWeight: 700, color: C.text1 }}>₹{Number(app.amount || app.requestedAmount || 0).toLocaleString("en-IN")}</div>
                        </div>
                        <div>
                          <div style={{ fontSize: 12, color: C.muted, marginBottom: 6 }}>Estimated Loan Limit</div>
                          <div style={{ fontSize: 15, fontWeight: 700, color: C.purple }}>₹{Number(app.evaluation?.decision?.loan_limit || app.amount || 0).toLocaleString("en-IN")}</div>
                        </div>
                        <div>
                          <div style={{ fontSize: 12, color: C.muted, marginBottom: 6 }}>Risk Classification</div>
                          <RiskBadge risk={app.evaluation?.decision?.risk_class || app.riskClass || "Pending"} />
                        </div>
                        <div>
                          <div style={{ fontSize: 12, color: C.muted, marginBottom: 6 }}>Current Status</div>
                          <StatusBadge status={app.status === "approved" ? "Approved" : app.status === "rejected" ? "Rejected" : "Review"} />
                        </div>
                      </div>
                    </div>

                    {/* Decision Controls Card (only show if status is pending) */}
                    {(!app.status || app.status === "pending") && (
                      <div style={{ ...card({ padding: 20, background: "#fff" }) }}>
                        <div style={{ fontSize: 14, fontWeight: 700, color: C.text1, marginBottom: 16 }}>Loan Decision</div>
                        <textarea
                          value={reviewNote[app.id] || ""}
                          onChange={(e) => setReviewNote((prev) => ({ ...prev, [app.id]: e.target.value }))}
                          placeholder="Optional admin note or remarks..."
                          style={{ width: "100%", minHeight: 80, borderRadius: 10, border: `1px solid ${C.border}`, padding: 12, fontSize: 13, marginBottom: 16, fontFamily: "inherit" }}
                        />
                        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                          <button
                            onClick={() => handleDecision(app.id, "approve")}
                            disabled={busyId === app.id}
                            style={{
                              padding: "10px 16px",
                              borderRadius: 8,
                              border: "none",
                              background: C.green,
                              color: "#fff",
                              cursor: busyId === app.id ? "not-allowed" : "pointer",
                              fontSize: 13,
                              fontWeight: 600,
                              display: "flex",
                              alignItems: "center",
                              gap: 8,
                              opacity: busyId === app.id ? 0.6 : 1,
                              transition: "all 0.2s",
                            }}
                            onMouseEnter={(e) => !busyId && (e.target.style.background = "#16A34A", e.target.style.transform = "translateY(-1px)", e.target.style.boxShadow = "0 4px 12px rgba(34,197,94,0.3)")}
                            onMouseLeave={(e) => (e.target.style.background = C.green, e.target.style.transform = "translateY(0)", e.target.style.boxShadow = "none")}
                          >
                            <ThumbsUp style={{ width: 16, height: 16 }} />
                            {busyId === app.id ? "Processing..." : "Approve Loan"}
                          </button>
                          <button
                            onClick={() => handleDecision(app.id, "reject")}
                            disabled={busyId === app.id}
                            style={{
                              padding: "10px 16px",
                              borderRadius: 8,
                              border: "none",
                              background: C.red,
                              color: "#fff",
                              cursor: busyId === app.id ? "not-allowed" : "pointer",
                              fontSize: 13,
                              fontWeight: 600,
                              display: "flex",
                              alignItems: "center",
                              gap: 8,
                              opacity: busyId === app.id ? 0.6 : 1,
                              transition: "all 0.2s",
                            }}
                            onMouseEnter={(e) => !busyId && (e.target.style.background = "#DC2626", e.target.style.transform = "translateY(-1px)", e.target.style.boxShadow = "0 4px 12px rgba(239,68,68,0.3)")}
                            onMouseLeave={(e) => (e.target.style.background = C.red, e.target.style.transform = "translateY(0)", e.target.style.boxShadow = "none")}
                          >
                            <ThumbsDown style={{ width: 16, height: 16 }} />
                            {busyId === app.id ? "Processing..." : "Reject Loan"}
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Business Metrics Card */}
                    <div style={{ ...card({ padding: 20, background: "#fff" }) }}>
                      <div style={{ fontSize: 14, fontWeight: 700, color: C.text1, marginBottom: 16 }}>Business Metrics</div>
                      {app.businessStats ? (
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 12 }}>
                          {Object.entries(app.businessStats).slice(0, 6).map(([key, value]) => (
                            <div key={key} style={{ padding: 12, borderRadius: 8, background: "#F8F4FF" }}>
                              <div style={{ fontSize: 12, color: C.muted, marginBottom: 4 }}>{key.replace(/_/g, " ")}</div>
                              <div style={{ fontSize: 14, fontWeight: 700, color: C.text1 }}>{String(value)}</div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div style={{ fontSize: 12, color: C.muted }}>No business metrics submitted.</div>
                      )}
                    </div>

                    {/* Audit Trail Card */}
                    <div style={{ ...card({ padding: 20, background: "#fff" }) }}>
                      <div style={{ fontSize: 14, fontWeight: 700, color: C.text1, marginBottom: 12 }}>Audit Trail</div>
                      <div style={{ fontSize: 12, color: C.text2, whiteSpace: "pre-wrap", lineHeight: 1.8, background: "#F8F4FF", padding: 12, borderRadius: 8 }}>
                        {app.evaluation?.auditor_trail || "No audit trail available."}
                      </div>
                    </div>

                    {/* Top Feature Reasons */}
                    <div style={{ ...card({ padding: 20, background: "#fff" }) }}>
                      <div style={{ fontSize: 14, fontWeight: 700, color: C.text1, marginBottom: 16 }}>Risk Assessment Details</div>
                      {app.evaluation?.top_reasoning_features?.length > 0 ? (
                        <div style={{ display: "grid", gap: 12 }}>
                          {app.evaluation.top_reasoning_features.map((feat, idx) => (
                            <div key={idx} style={{ padding: 14, borderRadius: 10, background: "#F8F4FF", borderLeft: `4px solid ${feat.impact === "positive" ? C.green : C.red}` }}>
                              <div style={{ fontSize: 13, fontWeight: 700, color: C.text1, marginBottom: 4 }}>{feat.feature}</div>
                              <div style={{ fontSize: 12, color: C.text2, marginBottom: 8 }}>{feat.reason}</div>
                              <div style={{ display: "inline-block", padding: "3px 8px", borderRadius: 4, background: feat.impact === "positive" ? "rgba(34,197,94,0.15)" : "rgba(239,68,68,0.15)", fontSize: 11, fontWeight: 600, color: feat.impact === "positive" ? C.green : C.red }}>
                                {feat.impact === "positive" ? "✓ Positive" : "✗ Negative"} Impact
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div style={{ fontSize: 12, color: C.muted }}>No detailed feature analysis available.</div>
                      )}
                    </div>

                    {/* Documents Section - Only show if application is not approved/rejected */}
                    {(!app.status || app.status === "pending") && Object.entries(app.documents || {}).length > 0 && (
                      <div style={{ ...card({ padding: 20, background: "#fff" }) }}>
                        <div style={{ fontSize: 14, fontWeight: 700, color: C.text1, marginBottom: 16 }}>Uploaded Documents</div>
                        <div style={{ display: "grid", gap: 10 }}>
                          {Object.entries(app.documents).map(([key, doc]) => (
                            <a key={key} href={doc.url || "#"} target="_blank" rel="noreferrer" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: 12, borderRadius: 8, background: "#F8F4FF", color: C.purple, textDecoration: "none", transition: "all 0.2s", border: `1px solid ${C.border}` }}
                              onMouseEnter={(e) => (e.currentTarget.style.background = "#EEF2FF", e.currentTarget.style.transform = "translateX(4px)")}
                              onMouseLeave={(e) => (e.currentTarget.style.background = "#F8F4FF", e.currentTarget.style.transform = "translateX(0)")}
                            >
                              <span style={{ fontSize: 12, fontWeight: 700 }}>{key.toUpperCase()}</span>
                              <span style={{ fontSize: 12, color: C.text2 }}>📄 {doc.fileName}</span>
                            </a>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })()}
            </div>
          )}
      </motion.div>

      {/* Section 4: Bar chart + Quick Actions */}
      <div style={{ display: "grid", gridTemplateColumns: "3fr 2fr", gap: 20 }}>

        {/* Top Performing Metrics */}
        <motion.div style={card()} {...fadeUp(0.36)}>
          <div style={{ marginBottom: 16 }}>
            <h2 style={{ fontSize: 16, fontWeight: 700, color: C.text1, margin: 0 }}>Top Performing Metrics</h2>
            <p style={{ fontSize: 12, color: C.muted, margin: "3px 0 0" }}>Average scores across active sellers</p>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={BAR_DATA} layout="vertical" margin={{ top: 0, right: 16, left: 10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F0ECF9" horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 11, fill: C.muted }} axisLine={false} tickLine={false} domain={[0, 100]} />
              <YAxis type="category" dataKey="metric" tick={{ fontSize: 12, fill: C.text2 }} axisLine={false} tickLine={false} width={90} />
              <Tooltip formatter={(v) => [`${v}%`, "Score"]} contentStyle={{ borderRadius: 10, border: `1px solid ${C.border}`, fontSize: 12 }} />
              <Bar dataKey="score" fill="#6F2DBD" radius={[0, 6, 6, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Quick Actions + System Status */}
        <motion.div style={card({ display: "flex", flexDirection: "column", gap: 12 })} {...fadeUp(0.42)}>
          <h2 style={{ fontSize: 16, fontWeight: 700, color: C.text1, margin: 0 }}>Quick Actions</h2>

          {/* Action buttons */}
          <button onClick={() => navigate("/evaluate")} style={{
            width: "100%", padding: "11px 16px", borderRadius: 10, fontSize: 13, fontWeight: 600,
            color: "#fff", background: "linear-gradient(135deg, #6F2DBD, #8B5CF6)",
            border: "none", cursor: "pointer", textAlign: "center",
            boxShadow: "0 2px 10px rgba(111,45,189,0.3)", transition: "box-shadow 0.2s",
          }}
            onMouseEnter={e => e.currentTarget.style.boxShadow = "0 4px 18px rgba(111,45,189,0.5)"}
            onMouseLeave={e => e.currentTarget.style.boxShadow = "0 2px 10px rgba(111,45,189,0.3)"}
          >Run New Evaluation</button>

          <button onClick={() => navigate("/history")} style={{
            width: "100%", padding: "11px 16px", borderRadius: 10, fontSize: 13, fontWeight: 600,
            color: C.purple, background: "rgba(111,45,189,0.08)",
            border: `1px solid rgba(111,45,189,0.2)`, cursor: "pointer", textAlign: "center",
          }}>View All Decisions</button>

          <button onClick={() => navigate("/simulator")} style={{
            width: "100%", padding: "11px 16px", borderRadius: 10, fontSize: 13, fontWeight: 600,
            color: "#92400E", background: "rgba(245,158,11,0.1)",
            border: "1px solid rgba(245,158,11,0.3)", cursor: "pointer", textAlign: "center",
          }}>What-If Simulator</button>

          <button style={{
            width: "100%", padding: "11px 16px", borderRadius: 10, fontSize: 13, fontWeight: 600,
            color: C.text2, background: "transparent",
            border: `1px solid ${C.border}`, cursor: "pointer", textAlign: "center",
          }}>Export Report</button>

          {/* System Status */}
          <div style={{ marginTop: 4, padding: "14px 16px", borderRadius: 12, background: "#F8F4FF", border: `1px solid ${C.border}` }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: C.text1, marginBottom: 10 }}>System Status</div>
            {[
              ["Backend",  true],
              ["ML Model", true],
              ["Groq AI",  true],
              ["MongoDB",  true],
            ].map(([label, online]) => (
              <div key={label} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                <span style={{ fontSize: 12, color: C.text2 }}>{label}</span>
                <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                  <span style={{ width: 6, height: 6, borderRadius: "50%", background: online ? C.green : C.red }} />
                  <span style={{ fontSize: 12, fontWeight: 600, color: online ? "#16A34A" : "#DC2626" }}>
                    {online ? (label === "ML Model" ? "Active" : label === "Groq AI" || label === "MongoDB" ? "Connected" : "Online") : "Offline"}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

      </div>
    </div>
  );
}
