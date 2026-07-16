/**
 * SellerPortal — PRIMARY seller-facing page at /seller
 *
 * Layout:
 *   Top header (Meesho Pragati brand)
 *   Two-column body:
 *     Left  → Seller Info (ID, phone, language)
 *     Right → 12 Business Metrics
 *   Demo profile buttons (Strong / Borderline / High Risk)
 *   Evaluate Loan button
 *   Result section (decision, seller message, improvement plan, reasoning)
 *
 * No auth. No sidebar. No JWT. Pure hackathon demo.
 * All API calls via Axios to http://localhost:3001/api/loan/evaluate
 */

import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles, ArrowRight, CheckCircle, XCircle, Clock,
  TrendingUp, Shield, MessageCircle, Brain, RotateCcw,
  AlertCircle, ChevronDown, Globe, Loader2, Star,
  IndianRupee, Package, Truck, BookOpen, CreditCard,
  Zap, BarChart2,
} from "lucide-react";
import { evaluateLoan } from "../../services/api";

/* ─── design tokens ───────────────────────────────────────── */
const P  = "#6F2DBD";   // primary purple
const P2 = "#8B5CF6";   // secondary purple
const OR = "#F59E0B";   // orange accent
const GR = "#22C55E";   // success green
const RD = "#EF4444";   // danger red
const T1 = "#1A1A2E";   // text primary
const T2 = "#4B5563";   // text secondary
const MU = "#9CA3AF";   // muted
const BD = "#E9E5F5";   // border
const BG = "#F8F4FF";   // light purple bg
const WH = "#FFFFFF";   // white

const card = (x = {}) => ({
  background: WH,
  border: `1px solid ${BD}`,
  borderRadius: 20,
  boxShadow: "0 2px 20px rgba(111,45,189,0.08)",
  ...x,
});

const inp = (focus = false) => ({
  width: "100%",
  padding: "11px 14px",
  borderRadius: 12,
  fontSize: 14,
  border: `1.5px solid ${focus ? P : BD}`,
  background: WH,
  color: T1,
  outline: "none",
  boxSizing: "border-box",
  transition: "border-color 0.2s",
  fontFamily: "Inter, sans-serif",
});

const fu = (d = 0) => ({
  initial: { opacity: 0, y: 18 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.45, delay: d, ease: [0.22, 1, 0.36, 1] },
});

/* ─── supported languages ─────────────────────────────────── */
const LANGUAGES = [
  { value: "English",   label: "English",   native: "English",  flag: "🇺🇸" },
  { value: "Hindi",     label: "Hindi",     native: "हिंदी",     flag: "🇮🇳" },
  { value: "Marathi",   label: "Marathi",   native: "मराठी",     flag: "🇮🇳" },
  { value: "Tamil",     label: "Tamil",     native: "தமிழ்",     flag: "🇮🇳" },
  { value: "Telugu",    label: "Telugu",    native: "తెలుగు",    flag: "🇮🇳" },
  { value: "Kannada",   label: "Kannada",   native: "ಕನ್ನಡ",    flag: "🇮🇳" },
  { value: "Gujarati",  label: "Gujarati",  native: "ગુજરાતી",   flag: "🇮🇳" },
  { value: "Malayalam", label: "Malayalam", native: "മലയാളം",   flag: "🇮🇳" },
];

/* ─── demo profiles ───────────────────────────────────────── */
const DEMOS = [
  {
    label: "Strong Seller",
    color: GR,
    bg: "#F0FDF4",
    border: "#BBF7D0",
    seller_id: "SELL_STRONG_01",
    language: "English",
    phone: "+919876500001",
    data: {
      sales_velocity_6m: 150000,
      sales_growth_rate: 25,
      rto_rate: 5,
      dispatch_sla_compliance: 97,
      avg_customer_rating: 4.7,
      rating_trend: 0.2,
      order_cancellation_rate: 3,
      ad_spend_roi: 3.5,
      account_age_months: 48,
      total_orders_6m: 3500,
      catalog_size: 300,
      prior_loan_default: 0,
    },
  },
  {
    label: "Borderline Seller",
    color: OR,
    bg: "#FFFBEB",
    border: "#FDE68A",
    seller_id: "SELL_MED_02",
    language: "Hindi",
    phone: "+919876500002",
    data: {
      sales_velocity_6m: 60000,
      sales_growth_rate: 5,
      rto_rate: 16,
      dispatch_sla_compliance: 80,
      avg_customer_rating: 3.5,
      rating_trend: -0.05,
      order_cancellation_rate: 10,
      ad_spend_roi: 1.5,
      account_age_months: 18,
      total_orders_6m: 800,
      catalog_size: 80,
      prior_loan_default: 0,
    },
  },
  {
    label: "High Risk Seller",
    color: RD,
    bg: "#FEF2F2",
    border: "#FECACA",
    seller_id: "SELL_HIGH_03",
    language: "Tamil",
    phone: "+919876500003",
    data: {
      sales_velocity_6m: 15000,
      sales_growth_rate: -5,
      rto_rate: 23,
      dispatch_sla_compliance: 65,
      avg_customer_rating: 2.5,
      rating_trend: -0.3,
      order_cancellation_rate: 18,
      ad_spend_roi: 0.8,
      account_age_months: 4,
      total_orders_6m: 120,
      catalog_size: 12,
      prior_loan_default: 1,
    },
  },
];

/* ─── field definitions ───────────────────────────────────── */
const FIELDS = [
  { key: "sales_velocity_6m",       label: "Sales Velocity (6M)",     unit: "₹",      icon: IndianRupee, min: 5000,   max: 200000, step: 1000,  isInt: false, hint: "Total sales in last 6 months"      },
  { key: "sales_growth_rate",       label: "Sales Growth Rate",       unit: "%",      icon: TrendingUp,  min: -20,    max: 40,     step: 0.1,   isInt: false, hint: "Month-over-month growth"            },
  { key: "rto_rate",                label: "RTO Rate",                unit: "%",      icon: RotateCcw,   min: 2,      max: 25,     step: 0.1,   isInt: false, hint: "Return to origin (lower is better)" },
  { key: "dispatch_sla_compliance", label: "Dispatch SLA",            unit: "%",      icon: Truck,       min: 60,     max: 100,    step: 0.1,   isInt: false, hint: "On-time dispatch percentage"        },
  { key: "avg_customer_rating",     label: "Average Rating",          unit: "★",      icon: Star,        min: 1,      max: 5,      step: 0.1,   isInt: false, hint: "Customer rating out of 5"           },
  { key: "rating_trend",            label: "Rating Trend",            unit: "",       icon: BarChart2,   min: -0.5,   max: 0.5,    step: 0.001, isInt: false, hint: "Positive = improving"               },
  { key: "order_cancellation_rate", label: "Cancellation Rate",       unit: "%",      icon: XCircle,     min: 0,      max: 20,     step: 0.1,   isInt: false, hint: "Percentage of cancelled orders"     },
  { key: "ad_spend_roi",            label: "Ad Spend ROI",            unit: "x",      icon: Zap,         min: 0.5,    max: 5,      step: 0.01,  isInt: false, hint: "Return on ad spend"                 },
  { key: "account_age_months",      label: "Account Age",             unit: "months", icon: BookOpen,    min: 1,      max: 60,     step: 1,     isInt: true,  hint: "Months since account created"       },
  { key: "total_orders_6m",         label: "Total Orders (6M)",       unit: "",       icon: Package,     min: 50,     max: 5000,   step: 1,     isInt: true,  hint: "Orders fulfilled in 6 months"       },
  { key: "catalog_size",            label: "Catalog Size",            unit: "items",  icon: BookOpen,    min: 5,      max: 500,    step: 1,     isInt: true,  hint: "Active product listings"            },
  { key: "prior_loan_default",      label: "Prior Loan Default",      unit: "",       icon: CreditCard,  isSelect: true, hint: "Any previous loan defaults"         },
];

function buildEmpty() {
  const d = {};
  FIELDS.forEach(f => { d[f.key] = f.isSelect ? 0 : ""; });
  return d;
}

/* ─── sub-components ──────────────────────────────────────── */

function FieldInput({ field, value, onChange }) {
  const [focus, setFocus] = useState(false);
  const Icon = field.icon;

  if (field.isSelect) {
    return (
      <div style={{ position: "relative" }}>
        <select
          value={value}
          onChange={e => onChange(field.key, Number(e.target.value))}
          onFocus={() => setFocus(true)}
          onBlur={() => setFocus(false)}
          style={{ ...inp(focus), appearance: "none", cursor: "pointer", paddingRight: 36 }}
        >
          <option value={0}>No — Clean record</option>
          <option value={1}>Yes — Has defaulted</option>
        </select>
        <ChevronDown style={{ position: "absolute", right: 12, top: "50%",
          transform: "translateY(-50%)", width: 14, height: 14, color: MU, pointerEvents: "none" }} />
      </div>
    );
  }

  return (
    <div style={{ position: "relative" }}>
      <input
        type="number"
        value={value}
        min={field.min}
        max={field.max}
        step={field.step}
        onChange={e => onChange(field.key, e.target.value)}
        onFocus={() => setFocus(true)}
        onBlur={() => setFocus(false)}
        style={{ ...inp(focus), paddingRight: field.unit ? 48 : 14 }}
        placeholder="0"
      />
      {field.unit && (
        <span style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)",
          fontSize: 12, fontWeight: 700, color: MU, pointerEvents: "none" }}>
          {field.unit}
        </span>
      )}
    </div>
  );
}

function LangDropdown({ value, onChange }) {
  const [open, setOpen] = useState(false);
  const sel = LANGUAGES.find(l => l.value === value) || LANGUAGES[0];

  return (
    <div style={{ position: "relative" }}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        style={{ ...inp(open), display: "flex", alignItems: "center", gap: 10,
          cursor: "pointer", border: `1.5px solid ${open ? P : BD}` }}
      >
        <Globe style={{ width: 15, height: 15, color: P, flexShrink: 0 }} />
        <span style={{ flex: 1, textAlign: "left", fontSize: 14, color: T1 }}>
          {sel.flag} {sel.native}
        </span>
        <ChevronDown style={{ width: 14, height: 14, color: MU,
          transform: open ? "rotate(180deg)" : "none", transition: "transform 0.2s" }} />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.15 }}
            style={{ position: "absolute", top: "calc(100% + 6px)", left: 0, right: 0,
              background: WH, border: `1px solid ${BD}`, borderRadius: 14,
              boxShadow: "0 8px 32px rgba(111,45,189,0.12)", zIndex: 99, overflow: "hidden" }}
          >
            {LANGUAGES.map(l => (
              <button
                key={l.value}
                type="button"
                onClick={() => { onChange(l.value); setOpen(false); }}
                style={{ display: "flex", alignItems: "center", gap: 10, width: "100%",
                  padding: "10px 14px", background: value === l.value ? BG : "transparent",
                  border: "none", cursor: "pointer", fontSize: 14, color: T1, textAlign: "left" }}
              >
                <span style={{ fontSize: 18 }}>{l.flag}</span>
                <span style={{ fontWeight: 500 }}>{l.native}</span>
                <span style={{ color: MU, fontSize: 12 }}>{l.label}</span>
                {value === l.value && <CheckCircle style={{ marginLeft: "auto", width: 14, height: 14, color: P }} />}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ─── processing animation ────────────────────────────────── */
function ProcessingOverlay({ sellerId }) {
  const [step, setStep] = useState(0);
  const steps = [
    "Gathering seller business metrics",
    "Running XGBoost risk model",
    "Computing SHAP explainability",
    "Applying RBI business rules",
    "Generating AI explanation (Groq)",
    "Preparing multilingual response",
  ];
  useEffect(() => {
    const t = setInterval(() => setStep(s => Math.min(s + 1, steps.length - 1)), 1000);
    return () => clearInterval(t);
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      style={{ position: "fixed", inset: 0, background: "rgba(11,7,30,0.75)",
        backdropFilter: "blur(8px)", zIndex: 200,
        display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.35 }}
        style={{ background: WH, borderRadius: 24, padding: "36px 44px",
          maxWidth: 420, width: "100%", boxShadow: "0 24px 60px rgba(0,0,0,0.35)" }}
      >
        {/* Spinning brain */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginBottom: 28 }}>
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1.8, repeat: Infinity, ease: "linear" }}
            style={{ width: 64, height: 64, borderRadius: 18,
              background: "linear-gradient(135deg,#6F2DBD18,#8B5CF610)",
              border: `2px solid ${P}30`,
              display: "flex", alignItems: "center", justifyContent: "center" }}
          >
            <Brain style={{ width: 30, height: 30, color: P }} />
          </motion.div>
          <div style={{ fontSize: 18, fontWeight: 800, color: T1, marginTop: 14, marginBottom: 4 }}>
            AI Evaluating
          </div>
          <div style={{ fontSize: 13, color: MU }}>
            Analysing <strong style={{ color: P }}>{sellerId || "seller"}</strong>
          </div>
        </div>

        {/* Progress bar */}
        <div style={{ height: 5, background: BD, borderRadius: 3, overflow: "hidden", marginBottom: 20 }}>
          <motion.div
            style={{ height: "100%", background: `linear-gradient(90deg,${P},${P2})`, borderRadius: 3 }}
            animate={{ width: `${((step + 1) / steps.length) * 100}%` }}
            transition={{ duration: 0.6, ease: "easeOut" }}
          />
        </div>

        {/* Step list */}
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {steps.map((s, i) => (
            <div key={s} style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ width: 20, height: 20, borderRadius: "50%", flexShrink: 0,
                background: i < step ? P : i === step ? P : BD,
                display: "flex", alignItems: "center", justifyContent: "center",
                transition: "background 0.3s" }}>
                {i < step ? (
                  <CheckCircle style={{ width: 11, height: 11, color: WH }} />
                ) : i === step ? (
                  <motion.span
                    animate={{ scale: [1, 1.4, 1] }}
                    transition={{ duration: 0.7, repeat: Infinity }}
                    style={{ width: 6, height: 6, borderRadius: "50%", background: WH, display: "block" }}
                  />
                ) : (
                  <span style={{ width: 6, height: 6, borderRadius: "50%", background: MU, display: "block" }} />
                )}
              </div>
              <span style={{ fontSize: 13, color: i <= step ? T1 : MU, fontWeight: i <= step ? 600 : 400 }}>
                {s}
              </span>
            </div>
          ))}
        </div>
      </motion.div>
    </motion.div>
  );
}

/* ─── Result display ──────────────────────────────────────── */
function ResultCard({ result, onReset }) {
  const { decision, seller_message, improvement_plan, top_reasoning_features, execution_time_ms } = result;
  const [tab, setTab] = useState("seller");
  const isApproved = decision.decision_status === "Approved";
  const statusColor = isApproved ? GR : decision.decision_status === "Review" ? OR : RD;
  const RISK_C = { Low: GR, Moderate: OR, Medium: OR, High: RD };
  const rc = RISK_C[decision.risk_class] || OR;

  return (
    <motion.div {...fu(0)} style={{ display: "flex", flexDirection: "column", gap: 16 }}>

      {/* Hero status */}
      <div style={{ ...card(), borderTop: `4px solid ${statusColor}`, padding: 28 }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between",
          flexWrap: "wrap", gap: 16, marginBottom: 22 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <div style={{ width: 54, height: 54, borderRadius: 16,
              background: `${statusColor}12`, display: "flex", alignItems: "center", justifyContent: "center" }}>
              {isApproved
                ? <CheckCircle style={{ width: 28, height: 28, color: statusColor }} />
                : decision.decision_status === "Review"
                  ? <Clock style={{ width: 28, height: 28, color: statusColor }} />
                  : <XCircle style={{ width: 28, height: 28, color: statusColor }} />}
            </div>
            <div>
              <div style={{ fontSize: 24, fontWeight: 900, color: statusColor, letterSpacing: "-0.02em" }}>
                {decision.decision_status === "Approved" ? "Loan Approved"
                  : decision.decision_status === "Review" ? "Under Review"
                  : "Application Declined"}
              </div>
              <div style={{ fontSize: 13, color: MU }}>
                AI-powered underwriting decision · {execution_time_ms}ms
              </div>
            </div>
          </div>
          <button onClick={onReset}
            style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 16px",
              borderRadius: 10, fontSize: 13, fontWeight: 600, color: P,
              background: `${P}0d`, border: `1px solid ${P}30`, cursor: "pointer" }}>
            <RotateCcw style={{ width: 13, height: 13 }} /> New Evaluation
          </button>
        </div>

        {/* KPI strip */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(130px,1fr))", gap: 12 }}>
          {[
            { l: "Loan Limit",   v: `₹${decision.loan_limit?.toLocaleString("en-IN")}`, c: P       },
            { l: "Risk Score",   v: `${decision.risk_score} / 100`,                       c: rc      },
            { l: "Risk Class",   v: decision.risk_class,                                  c: rc      },
            { l: "Review",       v: decision.requires_human_review ? "Required" : "Auto", c: decision.requires_human_review ? OR : GR },
          ].map(k => (
            <div key={k.l} style={{ background: BG, borderRadius: 12, padding: "12px 14px", textAlign: "center" }}>
              <div style={{ fontSize: 11, color: MU, marginBottom: 4 }}>{k.l}</div>
              <div style={{ fontSize: 16, fontWeight: 800, color: k.c }}>{k.v}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 3, background: BG, borderRadius: 12, padding: 3 }}>
        {[["seller", "Seller View"], ["auditor", "Auditor View"]].map(([k, l]) => (
          <button key={k} type="button" onClick={() => setTab(k)}
            style={{ flex: 1, padding: "9px 6px", borderRadius: 9, fontSize: 13, fontWeight: 700,
              border: "none", cursor: "pointer", transition: "all 0.2s",
              background: tab === k ? WH : "transparent",
              color: tab === k ? P : MU,
              boxShadow: tab === k ? "0 1px 8px rgba(111,45,189,0.12)" : "none" }}>
            {l}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div key={tab}
          initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>

          {tab === "seller" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {/* Seller message */}
              <div style={{ ...card(), padding: 22 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                  <MessageCircle style={{ width: 17, height: 17, color: P }} />
                  <span style={{ fontSize: 15, fontWeight: 700, color: T1 }}>Decision Message</span>
                  <span style={{ marginLeft: "auto", fontSize: 11, color: MU,
                    padding: "2px 8px", borderRadius: 20, background: BG, border: `1px solid ${BD}` }}>
                    {result.language}
                  </span>
                </div>
                <p style={{ fontSize: 15, color: T1, lineHeight: 1.85, margin: 0 }}>{seller_message}</p>
              </div>

              {/* Improvement plan */}
              {(improvement_plan || []).length > 0 && (
                <div style={{ ...card(), padding: 22 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
                    <TrendingUp style={{ width: 17, height: 17, color: OR }} />
                    <span style={{ fontSize: 15, fontWeight: 700, color: T1 }}>Improvement Plan</span>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    {improvement_plan.map((item, i) => (
                      <div key={i} style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
                        <div style={{ width: 26, height: 26, borderRadius: 8, flexShrink: 0,
                          background: `${OR}18`, border: `1.5px solid ${OR}35`,
                          display: "flex", alignItems: "center", justifyContent: "center",
                          fontSize: 12, fontWeight: 800, color: OR }}>{i + 1}</div>
                        <p style={{ fontSize: 14, color: T1, lineHeight: 1.65, margin: 0, paddingTop: 3 }}>{item}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {tab === "auditor" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {/* Reasoning features */}
              <div style={{ ...card(), padding: 22 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
                  <Brain style={{ width: 17, height: 17, color: P }} />
                  <span style={{ fontSize: 15, fontWeight: 700, color: T1 }}>SHAP Reasoning Features</span>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {(top_reasoning_features || []).map((f, i) => {
                    const pos = f.impact?.toLowerCase() === "positive";
                    return (
                      <div key={i} style={{ display: "flex", gap: 10, padding: "11px 14px", borderRadius: 10,
                        background: pos ? "rgba(34,197,94,0.05)" : "rgba(239,68,68,0.05)",
                        border: `1px solid ${pos ? "rgba(34,197,94,0.2)" : "rgba(239,68,68,0.2)"}` }}>
                        <div style={{ width: 4, borderRadius: 2, flexShrink: 0,
                          background: pos ? GR : RD }} />
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: 13, fontWeight: 700, color: T1 }}>{f.feature}</div>
                          <div style={{ fontSize: 12, color: T2, marginTop: 2 }}>{f.reason}</div>
                        </div>
                        <span style={{ fontSize: 11, fontWeight: 700, alignSelf: "flex-start", flexShrink: 0,
                          padding: "2px 8px", borderRadius: 20,
                          color: pos ? "#16A34A" : "#DC2626",
                          background: pos ? "rgba(34,197,94,0.1)" : "rgba(239,68,68,0.1)" }}>
                          {f.impact}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Auditor trail */}
              <div style={{ ...card(), padding: 22 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                  <Shield style={{ width: 17, height: 17, color: P }} />
                  <span style={{ fontSize: 15, fontWeight: 700, color: T1 }}>Auditor Trail</span>
                  <span style={{ marginLeft: "auto", fontSize: 11, color: MU,
                    padding: "2px 8px", borderRadius: 20, background: BG, border: `1px solid ${BD}` }}>
                    Internal Only
                  </span>
                </div>
                <p style={{ fontSize: 13, color: T2, lineHeight: 1.85, margin: 0, fontFamily: "monospace" }}>
                  {result.auditor_trail}
                </p>
              </div>
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </motion.div>
  );
}

function normalizeSellerData(values) {
  return Object.fromEntries(
    FIELDS.map(field => {
      const raw = values[field.key];
      const parsed = field.isInt || field.isSelect
        ? parseInt(raw, 10)
        : parseFloat(raw);
      return [field.key, Number.isFinite(parsed) ? parsed : 0];
    })
  );
}

export default function SellerPortal() {
  const [sellerId, setSellerId] = useState("");
  const [phone, setPhone] = useState("");
  const [language, setLanguage] = useState("English");
  const [sellerData, setSellerData] = useState(buildEmpty);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [sellerFocus, setSellerFocus] = useState(false);
  const [phoneFocus, setPhoneFocus] = useState(false);

  const handleField = useCallback((key, value) => {
    setSellerData(prev => ({ ...prev, [key]: value }));
  }, []);

  const fillDemo = useCallback((demo) => {
    setSellerId(demo.seller_id);
    setPhone(demo.phone);
    setLanguage(demo.language);
    setSellerData(demo.data);
    setResult(null);
    setError(null);
  }, []);

  async function handleSubmit(event) {
    event.preventDefault();

    if (!sellerId.trim()) {
      setError("Please enter a seller ID or select a demo profile.");
      return;
    }

    setLoading(true);
    setResult(null);
    setError(null);

    try {
      const response = await evaluateLoan({
        seller_id: sellerId.trim(),
        language,
        phone_number: phone.trim() || undefined,
        seller_data: normalizeSellerData(sellerData),
      });
      setResult(response);
    } catch (err) {
      setError(err?.message || "Evaluation failed. Please check backend connectivity and try again.");
    } finally {
      setLoading(false);
    }
  }

  function resetEvaluation() {
    setResult(null);
    setError(null);
  }

  return (
    <main style={{ minHeight: "100vh", background: "linear-gradient(180deg,#FFFFFF 0%,#F8F4FF 100%)" }}>
      <style>{`
        .seller-portal-shell { max-width: 1180px; margin: 0 auto; padding: 28px 20px 56px; }
        .seller-portal-grid { display: grid; grid-template-columns: 0.85fr 1.15fr; gap: 22px; align-items: start; }
        .seller-field-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 14px; }
        @media (max-width: 920px) {
          .seller-portal-grid { grid-template-columns: 1fr; }
        }
        @media (max-width: 620px) {
          .seller-field-grid { grid-template-columns: 1fr; }
        }
        input[type=number]::-webkit-inner-spin-button { -webkit-appearance: none; }
        input[type=number] { -moz-appearance: textfield; }
      `}</style>

      <AnimatePresence>
        {loading && <ProcessingOverlay sellerId={sellerId} />}
      </AnimatePresence>

      <div className="seller-portal-shell">
        <motion.div {...fu(0)} style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between",
          flexWrap: "wrap", gap: 16, marginBottom: 22 }}>
          <div>
            <div style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "5px 11px",
              borderRadius: 999, background: `${P}0f`, color: P, fontSize: 12, fontWeight: 800,
              border: `1px solid ${P}24`, marginBottom: 10 }}>
              <Sparkles style={{ width: 14, height: 14 }} />
              Seller Portal
            </div>
            <h1 style={{ margin: 0, color: T1, fontSize: 28, lineHeight: 1.12, fontWeight: 900 }}>
              Pragati Loan Evaluation
            </h1>
            <p style={{ margin: "7px 0 0", color: T2, fontSize: 14, maxWidth: 620, lineHeight: 1.55 }}>
              Enter seller metrics and run the live backend underwriting pipeline.
            </p>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 12px",
            borderRadius: 12, background: WH, border: `1px solid ${BD}`, color: T2,
            fontSize: 12, fontWeight: 700, boxShadow: "0 2px 14px rgba(111,45,189,0.07)" }}>
            <Shield style={{ width: 15, height: 15, color: P }} />
            Backend: /api/loan/evaluate
          </div>
        </motion.div>

        <div className="seller-portal-grid">
          <section style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <motion.div {...fu(0.04)} style={{ ...card(), padding: 20 }}>
              <div style={{ fontSize: 12, fontWeight: 800, color: MU, textTransform: "uppercase",
                letterSpacing: "0.06em", marginBottom: 12 }}>
                Demo Profiles
              </div>
              <div style={{ display: "grid", gap: 10 }}>
                {DEMOS.map(demo => (
                  <button
                    key={demo.seller_id}
                    type="button"
                    onClick={() => fillDemo(demo)}
                    style={{ display: "flex", alignItems: "center", gap: 12, width: "100%",
                      padding: 13, borderRadius: 14, background: demo.bg, border: `1.5px solid ${demo.border}`,
                      cursor: "pointer", textAlign: "left" }}
                  >
                    <span style={{ width: 10, height: 10, borderRadius: "50%", background: demo.color, flexShrink: 0 }} />
                    <span style={{ flex: 1 }}>
                      <span style={{ display: "block", fontSize: 13, fontWeight: 800, color: T1 }}>{demo.label}</span>
                      <span style={{ display: "block", fontSize: 12, color: T2, marginTop: 2 }}>{demo.seller_id}</span>
                    </span>
                    <ArrowRight style={{ width: 15, height: 15, color: demo.color }} />
                  </button>
                ))}
              </div>
            </motion.div>

            <motion.form onSubmit={handleSubmit} {...fu(0.08)} style={{ ...card(), padding: 20 }}>
              <div style={{ fontSize: 13, fontWeight: 800, color: T1, marginBottom: 14 }}>Seller Details</div>

              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                <div>
                  <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: T2, marginBottom: 6 }}>
                    Seller ID
                  </label>
                  <input
                    value={sellerId}
                    onChange={e => setSellerId(e.target.value)}
                    onFocus={() => setSellerFocus(true)}
                    onBlur={() => setSellerFocus(false)}
                    placeholder="SELL_STRONG_01"
                    style={inp(sellerFocus)}
                  />
                </div>

                <div>
                  <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: T2, marginBottom: 6 }}>
                    WhatsApp Number
                  </label>
                  <input
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    onFocus={() => setPhoneFocus(true)}
                    onBlur={() => setPhoneFocus(false)}
                    placeholder="+91 9876543210"
                    style={inp(phoneFocus)}
                  />
                </div>

                <div>
                  <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: T2, marginBottom: 6 }}>
                    Response Language
                  </label>
                  <LangDropdown value={language} onChange={setLanguage} />
                </div>

                {error && (
                  <div style={{ display: "flex", gap: 9, alignItems: "flex-start", padding: "11px 12px",
                    borderRadius: 12, background: "rgba(239,68,68,0.07)", border: "1px solid rgba(239,68,68,0.22)" }}>
                    <AlertCircle style={{ width: 16, height: 16, color: RD, flexShrink: 0, marginTop: 1 }} />
                    <span style={{ fontSize: 13, color: "#DC2626", lineHeight: 1.45 }}>{error}</span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
                    width: "100%", padding: "15px 16px", borderRadius: 14, border: "none",
                    background: loading ? MU : `linear-gradient(135deg,${P},${P2})`,
                    color: WH, fontSize: 15, fontWeight: 900, cursor: loading ? "not-allowed" : "pointer",
                    boxShadow: loading ? "none" : "0 8px 24px rgba(111,45,189,0.28)" }}
                >
                  {loading ? <Loader2 style={{ width: 19, height: 19, animation: "spin 1s linear infinite" }} /> : <Sparkles style={{ width: 19, height: 19 }} />}
                  {loading ? "Evaluating..." : "Evaluate Loan"}
                </button>
              </div>
            </motion.form>
          </section>

          <section style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <motion.div {...fu(0.06)} style={{ ...card(), padding: 20 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between",
                gap: 12, flexWrap: "wrap", marginBottom: 16 }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 800, color: T1 }}>Business Metrics</div>
                  <div style={{ fontSize: 12, color: MU, marginTop: 2 }}>12 features expected by backend and ML model</div>
                </div>
                <button
                  type="button"
                  onClick={() => setSellerData(buildEmpty())}
                  style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "7px 11px",
                    borderRadius: 10, border: `1px solid ${BD}`, background: WH, color: T2,
                    fontSize: 12, fontWeight: 700, cursor: "pointer" }}
                >
                  <RotateCcw style={{ width: 13, height: 13 }} />
                  Clear
                </button>
              </div>

              <div className="seller-field-grid">
                {FIELDS.map(field => {
                  const Icon = field.icon;
                  return (
                    <div key={field.key}>
                      <label style={{ display: "flex", alignItems: "center", gap: 7,
                        fontSize: 12, fontWeight: 700, color: T2, marginBottom: 6 }}>
                        <Icon style={{ width: 14, height: 14, color: P }} />
                        {field.label}
                      </label>
                      <FieldInput field={field} value={sellerData[field.key]} onChange={handleField} />
                      <div style={{ fontSize: 11, color: MU, marginTop: 4 }}>{field.hint}</div>
                    </div>
                  );
                })}
              </div>
            </motion.div>

            <AnimatePresence>
              {result && (
                <motion.div
                  initial={{ opacity: 0, y: 18 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 12 }}
                  transition={{ duration: 0.35 }}
                >
                  <ResultCard result={result} onReset={resetEvaluation} />
                </motion.div>
              )}
            </AnimatePresence>
          </section>
        </div>
      </div>
    </main>
  );
}
