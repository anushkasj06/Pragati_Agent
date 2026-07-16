/**
 * HistoryPage.jsx
 * Decision History — searchable, filterable table with pagination.
 */

import { useEffect, useState, useMemo } from "react";
import { motion } from "framer-motion";
import { ClipboardList, Search, ChevronLeft, ChevronRight, ExternalLink } from "lucide-react";
import { getDecisionHistory } from "../services/api";

const C = {
  purple: "#6F2DBD",
  text1:  "#1A1A2E",
  text2:  "#4B5563",
  muted:  "#9CA3AF",
  border: "#E9E5F5",
  bg:     "#F8F4FF",
};

const card = (extra = {}) => ({
  background: "#FFFFFF",
  border: `1px solid ${C.border}`,
  borderRadius: 16,
  boxShadow: "0 2px 16px rgba(111,45,189,0.08)",
  ...extra,
});

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.4, delay, ease: [0.22, 1, 0.36, 1] },
});

// ---------------------------------------------------------------------------
// Mock data — 10 rows
// ---------------------------------------------------------------------------
const ALL_DECISIONS = [
  { id: "SELL_00101", riskClass: "Low",      score: 16, limit: "₹2,50,000", status: "Approved",  lang: "English", date: "2025-07-10 09:14" },
  { id: "SELL_00102", riskClass: "Moderate", score: 51, limit: "₹80,000",   status: "Review",    lang: "Hindi",   date: "2025-07-10 10:02" },
  { id: "SELL_00103", riskClass: "High",     score: 79, limit: "—",         status: "Rejected",  lang: "Tamil",   date: "2025-07-10 10:48" },
  { id: "SELL_00104", riskClass: "Low",      score: 21, limit: "₹1,75,000", status: "Approved",  lang: "Telugu",  date: "2025-07-10 11:30" },
  { id: "SELL_00105", riskClass: "Moderate", score: 44, limit: "₹60,000",   status: "Review",    lang: "Marathi", date: "2025-07-10 12:15" },
  { id: "SELL_00106", riskClass: "Low",      score: 11, limit: "₹3,00,000", status: "Approved",  lang: "Kannada", date: "2025-07-10 13:40" },
  { id: "SELL_00107", riskClass: "High",     score: 88, limit: "—",         status: "Rejected",  lang: "Gujarati",date: "2025-07-10 14:20" },
  { id: "SELL_00108", riskClass: "Moderate", score: 58, limit: "₹45,000",   status: "Review",    lang: "English", date: "2025-07-10 15:05" },
  { id: "SELL_00109", riskClass: "Low",      score: 25, limit: "₹1,20,000", status: "Approved",  lang: "Hindi",   date: "2025-07-10 15:55" },
  { id: "SELL_00110", riskClass: "High",     score: 74, limit: "—",         status: "Rejected",  lang: "Malayalam",date:"2025-07-10 16:30"},
];

const PAGE_SIZE = 5;

// ---------------------------------------------------------------------------
// Badge components
// ---------------------------------------------------------------------------
const STATUS_CFG = {
  Approved: { color: "#16A34A", bg: "rgba(34,197,94,0.12)",  border: "rgba(34,197,94,0.3)"  },
  Rejected: { color: "#DC2626", bg: "rgba(239,68,68,0.12)",  border: "rgba(239,68,68,0.3)"  },
  Review:   { color: "#D97706", bg: "rgba(245,158,11,0.12)", border: "rgba(245,158,11,0.3)" },
};
const RISK_CFG = {
  Low:      { color: "#16A34A", bg: "rgba(34,197,94,0.1)"   },
  Moderate: { color: "#D97706", bg: "rgba(245,158,11,0.1)"  },
  High:     { color: "#DC2626", bg: "rgba(239,68,68,0.1)"   },
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
      display: "inline-block", padding: "2px 10px", borderRadius: 20,
      fontSize: 12, fontWeight: 600, color: cfg.color, background: cfg.bg,
    }}>
      {risk}
    </span>
  );
}

function formatCurrency(amount) {
  if (!amount) return "Rs. 0";
  return `Rs. ${Number(amount).toLocaleString("en-IN")}`;
}

function formatDate(value) {
  if (!value) return "Unknown";
  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function mapDecisionRow(item) {
  const status = item.decision?.decision_status === "Approved" && item.decision?.requires_human_review
    ? "Review"
    : item.decision?.decision_status ?? "Review";

  return {
    id: item.seller_id,
    riskClass: item.decision?.risk_class ?? "Moderate",
    score: item.decision?.risk_score ?? 0,
    limit: formatCurrency(item.decision?.loan_limit),
    status,
    lang: item.language ?? "English",
    date: formatDate(item.timestamp),
  };
}

// ---------------------------------------------------------------------------
// HistoryPage
// ---------------------------------------------------------------------------
export default function HistoryPage() {
  const [decisions,   setDecisions]   = useState(ALL_DECISIONS);
  const [loading,     setLoading]     = useState(true);
  const [loadError,   setLoadError]   = useState(null);
  const [search,      setSearch]      = useState("");
  const [filterRisk,  setFilterRisk]  = useState("All");
  const [filterStatus,setFilterStatus]= useState("All");
  const [filterLang,  setFilterLang]  = useState("All");
  const [page,        setPage]        = useState(1);
  const [hoveredRow,  setHoveredRow]  = useState(null);

  useEffect(() => {
    let cancelled = false;

    async function loadDecisions() {
      setLoading(true);
      setLoadError(null);
      try {
        const rows = await getDecisionHistory({ limit: 100 });
        if (!cancelled && rows.length > 0) {
          setDecisions(rows.map(mapDecisionRow));
        }
      } catch (err) {
        if (!cancelled) {
          setLoadError(err?.message || "Could not load decision history.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadDecisions();
    return () => {
      cancelled = true;
    };
  }, []);

  const filtered = useMemo(() => {
    return decisions.filter((d) => {
      const matchSearch = search === "" ||
        d.id.toLowerCase().includes(search.toLowerCase()) ||
        d.lang.toLowerCase().includes(search.toLowerCase());
      const matchRisk   = filterRisk   === "All" || d.riskClass === filterRisk;
      const matchStatus = filterStatus === "All" || d.status    === filterStatus;
      const matchLang   = filterLang   === "All" || d.lang      === filterLang;
      return matchSearch && matchRisk && matchStatus && matchLang;
    });
  }, [decisions, search, filterRisk, filterStatus, filterLang]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePageNum = Math.min(page, totalPages);
  const pageSlice   = filtered.slice((safePageNum - 1) * PAGE_SIZE, safePageNum * PAGE_SIZE);

  function gotoPage(p) {
    setPage(Math.max(1, Math.min(p, totalPages)));
  }

  const inputStyle = {
    padding: "8px 12px",
    fontSize: 13,
    borderRadius: 10,
    border: `1px solid ${C.border}`,
    background: "#fff",
    color: C.text1,
    outline: "none",
    cursor: "pointer",
  };

  const selectStyle = {
    ...inputStyle,
    paddingRight: 28,
    appearance: "none",
    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%239CA3AF' stroke-width='2'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E")`,
    backgroundRepeat: "no-repeat",
    backgroundPosition: "right 10px center",
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>

      {/* Header */}
      <motion.div {...fadeUp(0)}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 4 }}>
          <div style={{
            width: 42, height: 42, borderRadius: 12,
            background: "rgba(111,45,189,0.1)",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <ClipboardList style={{ width: 22, height: 22, color: C.purple }} />
          </div>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 800, color: C.text1, margin: 0, letterSpacing: "-0.02em" }}>
              Decision History
            </h1>
            <p style={{ fontSize: 13, color: C.muted, margin: "2px 0 0" }}>
              {loading ? "Loading decision history..." : `${filtered.length} records - Search and filter all past evaluations`}
            </p>
            {loadError && (
              <p style={{ fontSize: 12, color: "#DC2626", margin: "4px 0 0" }}>
                {loadError}
              </p>
            )}
          </div>
        </div>
      </motion.div>

      {/* Filters */}
      <motion.div style={card({ padding: 16, display: "flex", flexWrap: "wrap", gap: 12, alignItems: "center" })} {...fadeUp(0.08)}>
        {/* Search */}
        <div style={{ position: "relative", flex: "1 1 220px" }}>
          <Search style={{ position: "absolute", left: 11, top: "50%", transform: "translateY(-50%)", width: 15, height: 15, color: C.muted }} />
          <input
            type="text"
            placeholder="Search seller ID or language…"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            style={{ ...inputStyle, width: "100%", paddingLeft: 34, boxSizing: "border-box" }}
          />
        </div>

        {/* Risk Class */}
        <select value={filterRisk} onChange={(e) => { setFilterRisk(e.target.value); setPage(1); }} style={selectStyle}>
          <option value="All">All Risk Classes</option>
          <option value="Low">Low</option>
          <option value="Moderate">Moderate</option>
          <option value="High">High</option>
        </select>

        {/* Status */}
        <select value={filterStatus} onChange={(e) => { setFilterStatus(e.target.value); setPage(1); }} style={selectStyle}>
          <option value="All">All Statuses</option>
          <option value="Approved">Approved</option>
          <option value="Review">Under Review</option>
          <option value="Rejected">Rejected</option>
        </select>

        {/* Language */}
        <select value={filterLang} onChange={(e) => { setFilterLang(e.target.value); setPage(1); }} style={selectStyle}>
          <option value="All">All Languages</option>
          {["English","Hindi","Tamil","Telugu","Marathi","Kannada","Gujarati","Malayalam"].map((l) => (
            <option key={l} value={l}>{l}</option>
          ))}
        </select>
      </motion.div>

      {/* Table */}
      <motion.div style={card({ padding: 0 })} {...fadeUp(0.14)}>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "#FAFAFA", borderBottom: `1px solid ${C.border}` }}>
                {["Seller ID","Risk Class","Risk Score","Loan Limit","Status","Language","Date & Time"].map((h) => (
                  <th key={h} style={{ padding: "10px 16px", fontSize: 12, fontWeight: 600, color: C.muted, textAlign: "left", whiteSpace: "nowrap" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {pageSlice.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ padding: "40px 16px", textAlign: "center", color: C.muted, fontSize: 14 }}>
                    No decisions match your filters.
                  </td>
                </tr>
              ) : pageSlice.map((row, i) => (
                <tr
                  key={row.id}
                  onMouseEnter={() => setHoveredRow(i)}
                  onMouseLeave={() => setHoveredRow(null)}
                  style={{
                    borderBottom: i < pageSlice.length - 1 ? `1px solid ${C.border}` : "none",
                    background: hoveredRow === i ? "#F8F4FF" : i % 2 === 0 ? "#FFFFFF" : "#FDFCFF",
                    transition: "background 0.15s",
                  }}
                >
                  <td style={{ padding: "13px 16px", fontSize: 13, fontWeight: 700, color: C.purple }}>{row.id}</td>
                  <td style={{ padding: "13px 16px" }}><RiskBadge risk={row.riskClass} /></td>
                  <td style={{ padding: "13px 16px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <div style={{ width: 60, height: 5, borderRadius: 3, background: "#EEE", overflow: "hidden" }}>
                        <div style={{ width: `${row.score}%`, height: "100%", borderRadius: 3,
                          background: row.riskClass === "Low" ? "#22C55E" : row.riskClass === "High" ? "#EF4444" : "#F59E0B" }} />
                      </div>
                      <span style={{ fontSize: 12, fontWeight: 600, color: C.text2 }}>{row.score}</span>
                    </div>
                  </td>
                  <td style={{ padding: "13px 16px", fontSize: 13, fontWeight: 600, color: C.text1 }}>{row.limit}</td>
                  <td style={{ padding: "13px 16px" }}><StatusBadge status={row.status} /></td>
                  <td style={{ padding: "13px 16px", fontSize: 13, color: C.text2 }}>{row.lang}</td>
                  <td style={{ padding: "13px 16px", fontSize: 12, color: C.muted, whiteSpace: "nowrap" }}>{row.date}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "14px 20px", borderTop: `1px solid ${C.border}`,
        }}>
          <span style={{ fontSize: 13, color: C.muted }}>
            Showing {Math.min((safePageNum - 1) * PAGE_SIZE + 1, filtered.length)}–{Math.min(safePageNum * PAGE_SIZE, filtered.length)} of {filtered.length}
          </span>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <button
              onClick={() => gotoPage(safePageNum - 1)}
              disabled={safePageNum === 1}
              style={{
                padding: "6px 10px", borderRadius: 8, fontSize: 13, fontWeight: 500,
                color: safePageNum === 1 ? C.muted : C.purple,
                background: "transparent", border: `1px solid ${C.border}`,
                cursor: safePageNum === 1 ? "not-allowed" : "pointer",
                display: "flex", alignItems: "center", gap: 4,
              }}
            >
              <ChevronLeft style={{ width: 15, height: 15 }} /> Prev
            </button>

            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
              <button
                key={p}
                onClick={() => gotoPage(p)}
                style={{
                  width: 34, height: 34, borderRadius: 8, fontSize: 13, fontWeight: p === safePageNum ? 700 : 500,
                  color: p === safePageNum ? "#fff" : C.text2,
                  background: p === safePageNum ? C.purple : "transparent",
                  border: `1px solid ${p === safePageNum ? C.purple : C.border}`,
                  cursor: "pointer",
                }}
              >{p}</button>
            ))}

            <button
              onClick={() => gotoPage(safePageNum + 1)}
              disabled={safePageNum === totalPages}
              style={{
                padding: "6px 10px", borderRadius: 8, fontSize: 13, fontWeight: 500,
                color: safePageNum === totalPages ? C.muted : C.purple,
                background: "transparent", border: `1px solid ${C.border}`,
                cursor: safePageNum === totalPages ? "not-allowed" : "pointer",
                display: "flex", alignItems: "center", gap: 4,
              }}
            >
              Next <ChevronRight style={{ width: 15, height: 15 }} />
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
