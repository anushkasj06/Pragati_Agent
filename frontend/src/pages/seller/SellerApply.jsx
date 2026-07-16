/**
 * SellerApply � Seller Loan Evaluation & Application Page (redesigned).
 *
 * Flow:
 *   1. Auto-loads selected seller metrics (read-only, from context)
 *   2. One-click "Run AI Evaluation" ? calls POST /api/loan/evaluate
 *   3. EvaluationProcessor animation runs
 *   4. Full result: SHAP factors, AI explanation in seller's language, loan decision
 *   5. "Apply Now" ? document upload form (Aadhaar, bank details, etc.)
 *   6. "Talk to AI Coach" deep-link
 *   No manual metric entry. No start evaluation button gating.
 */
import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import {
  Sparkles, ArrowRight, CheckCircle, XCircle, Clock,
  TrendingUp, Shield, MessageCircle, Brain, RotateCcw,
  AlertCircle, Loader2, ChevronRight, ChevronDown, ChevronUp,
  IndianRupee, Star, Truck, Package, BookOpen, CreditCard,
  FileText, Upload, Phone, User, Building2, Sliders,
} from "lucide-react";
import { useApp } from "../../context/AppContext";
import { SELLER_PROFILES } from "../../utils/sellerData";
import { SUPPORTED_LANGUAGES } from "../../utils/constants";
import { evaluateLoan, submitLoanApplication } from "../../services/api";
import EvaluationProcessor from "../../components/EvaluationProcessor";

const C = {
  purple:"#6F2DBD", p2:"#8B5CF6", orange:"#F59E0B", green:"#22C55E",
  red:"#EF4444", text1:"#1A1A2E", text2:"#4B5563", muted:"#9CA3AF",
  border:"#E9E5F5", bg:"#F8F4FF", card:"#FFFFFF",
};
const card  = (x={}) => ({ background:C.card, border:`1px solid ${C.border}`,
  borderRadius:16, boxShadow:"0 2px 16px rgba(111,45,189,0.07)", ...x });
const fu = (d=0) => ({ initial:{opacity:0,y:20}, animate:{opacity:1,y:0},
  transition:{duration:0.4, delay:d, ease:[0.22,1,0.36,1]} });

const RISK_COLOR = { Low:C.green, Moderate:C.orange, Medium:C.orange, High:C.red };

/* -- METRIC display (read-only cards) ----------------------- */
const METRIC_DISPLAY = [
  { key:"sales_velocity_6m",         label:"Sales Velocity",     fmt:v=>`Rs. ${Number(v).toLocaleString("en-IN")}` },
  { key:"sales_growth_rate",         label:"Sales Growth",       fmt:v=>`${v > 0 ? "+" : ""}${v}%` },
  { key:"avg_customer_rating",       label:"Customer Rating",    fmt:v=>`${v} / 5.0` },
  { key:"dispatch_sla_compliance",   label:"Dispatch SLA",       fmt:v=>`${v}%` },
  { key:"rto_rate",                  label:"RTO Rate",           fmt:v=>`${v}%` },
  { key:"total_orders_6m",           label:"Orders (6M)",        fmt:v=>Number(v).toLocaleString("en-IN") },
  { key:"catalog_size",              label:"Catalog Size",       fmt:v=>`${v} items` },
  { key:"account_age_months",        label:"Account Age",        fmt:v=>`${v} months` },
  { key:"order_cancellation_rate",   label:"Cancellation Rate",  fmt:v=>`${v}%` },
  { key:"ad_spend_roi",              label:"Ad Spend ROI",       fmt:v=>`${v}x` },
  { key:"rating_trend",              label:"Rating Trend",       fmt:v=>Number(v) >= 0 ? `+${v} (Rising)` : `${v} (Falling)` },
  { key:"prior_loan_default",        label:"Prior Default",      fmt:v=>v === 0 || v === "0" ? "No" : "Yes � Has defaulted" },
];

function metricColor(key, value) {
  const v = parseFloat(value);
  if (key === "rto_rate")                return v < 8 ? C.green : v < 16 ? C.orange : C.red;
  if (key === "avg_customer_rating")     return v >= 4.5 ? C.green : v >= 3.5 ? C.orange : C.red;
  if (key === "dispatch_sla_compliance") return v >= 95 ? C.green : v >= 80 ? C.orange : C.red;
  if (key === "prior_loan_default")      return Number(v) === 0 ? C.green : C.red;
  if (key === "sales_growth_rate")       return v >= 10 ? C.green : v >= 0 ? C.orange : C.red;
  if (key === "order_cancellation_rate") return v < 5 ? C.green : v < 12 ? C.orange : C.red;
  return C.purple;
}

/* -- Customize fields (demo mode) --------------------------- */
const EDIT_DEFS = [
  { key:"sales_velocity_6m",       label:"Sales Velocity",    min:5000,   max:200000, step:1000,  isInt:false },
  { key:"sales_growth_rate",       label:"Sales Growth %",    min:-20,    max:40,     step:0.1,   isInt:false },
  { key:"rto_rate",                label:"RTO Rate %",        min:2,      max:25,     step:0.1,   isInt:false },
  { key:"dispatch_sla_compliance", label:"Dispatch SLA %",    min:60,     max:100,    step:0.1,   isInt:false },
  { key:"avg_customer_rating",     label:"Rating /5",         min:1,      max:5,      step:0.1,   isInt:false },
  { key:"rating_trend",            label:"Rating Trend",      min:-0.5,   max:0.5,    step:0.001, isInt:false },
  { key:"order_cancellation_rate", label:"Cancellation %",    min:0,      max:20,     step:0.1,   isInt:false },
  { key:"ad_spend_roi",            label:"Ad ROI x",          min:0.5,    max:5,      step:0.01,  isInt:false },
  { key:"account_age_months",      label:"Account Age",       min:1,      max:60,     step:1,     isInt:true  },
  { key:"total_orders_6m",         label:"Orders 6M",         min:50,     max:5000,   step:1,     isInt:true  },
  { key:"catalog_size",            label:"Catalog Size",      min:5,      max:500,    step:1,     isInt:true  },
  { key:"prior_loan_default",      label:"Prior Default",     isSelect:true },
];

/* ── Metric read-only card ─────────────────────────────────── */
function MetricChip({ def, value }) {
  const color = metricColor(def.key, value);
  return (
    <div style={{ padding:"12px 14px", borderRadius:12, background:"#fff",
      border:`1px solid ${C.border}`, boxShadow:"0 1px 6px rgba(111,45,189,0.05)" }}>
      <div style={{ fontSize:10, fontWeight:600, color:C.muted, marginBottom:5, textTransform:"uppercase", letterSpacing:"0.04em" }}>
        {def.label}
      </div>
      <div style={{ fontSize:15, fontWeight:800, color }}>{def.fmt(value)}</div>
    </div>
  );
}

/* ── Customize edit field ──────────────────────────────────── */
function EditField({ def, value, onChange }) {
  const [focus, setFocus] = useState(false);
  if (def.isSelect) return (
    <div>
      <label style={{ fontSize:11, fontWeight:600, color:C.text2, marginBottom:4, display:"block" }}>{def.label}</label>
      <select value={value} onChange={e => onChange(def.key, Number(e.target.value))}
        style={{ width:"100%", padding:"8px 10px", borderRadius:9, fontSize:13,
          border:`1.5px solid ${focus ? C.purple : C.border}`, background:"#fff",
          color:C.text1, outline:"none", appearance:"none" }}
        onFocus={() => setFocus(true)} onBlur={() => setFocus(false)}>
        <option value={0}>No default</option>
        <option value={1}>Has defaulted</option>
      </select>
    </div>
  );
  return (
    <div>
      <label style={{ fontSize:11, fontWeight:600, color:C.text2, marginBottom:4, display:"block" }}>{def.label}</label>
      <input type="number" value={value} min={def.min} max={def.max} step={def.step}
        onChange={e => onChange(def.key, e.target.value)}
        onFocus={() => setFocus(true)} onBlur={() => setFocus(false)}
        style={{ width:"100%", padding:"8px 10px", borderRadius:9, fontSize:13,
          border:`1.5px solid ${focus ? C.purple : C.border}`, background:"#fff",
          color:C.text1, outline:"none", boxSizing:"border-box" }} />
    </div>
  );
}

/* ── SHAP factor card ──────────────────────────────────────── */
function FactorCard({ feature, index }) {
  const pos = feature.impact?.toLowerCase() === "positive";
  return (
    <motion.div initial={{ opacity:0, x:-10 }} animate={{ opacity:1, x:0 }}
      transition={{ delay: index * 0.06, duration:0.35 }}
      style={{ display:"flex", gap:12, padding:"13px 16px", borderRadius:12,
        background: pos ? "rgba(34,197,94,0.04)" : "rgba(239,68,68,0.04)",
        border:`1px solid ${pos ? "rgba(34,197,94,0.18)" : "rgba(239,68,68,0.18)"}` }}>
      <div style={{ width:4, borderRadius:2, flexShrink:0,
        background: pos ? C.green : C.red }} />
      <div style={{ flex:1, minWidth:0 }}>
        <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:3 }}>
          <span style={{ fontSize:13, fontWeight:700, color:C.text1 }}>{feature.feature}</span>
          <span style={{ fontSize:11, fontWeight:700, padding:"2px 8px", borderRadius:20, flexShrink:0,
            color: pos ? "#16A34A" : "#DC2626",
            background: pos ? "rgba(34,197,94,0.1)" : "rgba(239,68,68,0.1)" }}>
            {pos ? "Positive" : "Negative"}
          </span>
        </div>
        <p style={{ fontSize:12, color:C.text2, margin:0, lineHeight:1.55 }}>{feature.reason}</p>
      </div>
    </motion.div>
  );
}

/* ── Document upload step ──────────────────────────────────── */
function DocumentUpload({ seller, loanLimit, onClose, onSubmit }) {
  const [files, setFiles] = useState({ aadhaar:null, pan:null, bank:null, gst:null });
  const [phone, setPhone]   = useState(seller.phone || "");
  const [bank,  setBank]    = useState("");
  const [ifsc,  setIfsc]    = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [focus, setFocus]   = useState({});
  const inp = (k) => ({
    width:"100%", padding:"10px 13px", borderRadius:10, fontSize:13,
    border:`1.5px solid ${focus[k] ? C.purple : C.border}`,
    background:"#fff", color:C.text1, outline:"none", boxSizing:"border-box",
  });

  const DOCS = [
    { key:"aadhaar", label:"Aadhaar Card", icon:"🪪", required:true  },
    { key:"pan",     label:"PAN Card",     icon:"💳", required:true  },
    { key:"bank",    label:"Bank Statement (3 months)", icon:"🏦", required:true },
    { key:"gst",     label:"GST Certificate", icon:"📄", required:false },
  ];

  function handleFile(key, e) {
    const file = e.target.files?.[0];
    if (file) setFiles(p => ({ ...p, [key]: file }));
  }

  async function handleSubmit() {
    setError(null);
    if (!allRequired) return;
    setSubmitting(true);

    try {
      const application = await submitLoanApplication({
        sellerId: seller.id,
        sellerName: seller.name,
        phoneNumber: phone,
        amount: loanLimit,
        requestedAmount: loanLimit,
        purpose: "Working capital loan",
        documents: Object.fromEntries(Object.entries(files).filter(([, value]) => value)),
        decisionMessage: "Documents submitted successfully. Awaiting admin review.",
        riskClass: seller.risk_category || "Pending",
        language: seller.language || "English",
      });

      setSubmitted(true);
      onSubmit?.(application);
      setTimeout(() => { onClose(); }, 1500);
    } catch (err) {
      setError(err?.message || "Unable to submit the application. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  const allRequired = files.aadhaar && files.pan && files.bank && bank && ifsc && phone;

  if (submitted) return (
    <div style={{ textAlign:"center", padding:"32px 24px" }}>
      <motion.div initial={{ scale:0 }} animate={{ scale:1 }}
        transition={{ type:"spring", stiffness:200 }}
        style={{ width:72, height:72, borderRadius:"50%",
          background:"rgba(34,197,94,0.1)", border:"2px solid rgba(34,197,94,0.3)",
          display:"flex", alignItems:"center", justifyContent:"center", margin:"0 auto 16px" }}>
        <CheckCircle style={{ width:36, height:36, color:C.green }} />
      </motion.div>
      <div style={{ fontSize:20, fontWeight:900, color:C.text1, marginBottom:6 }}>
        Application Submitted!
      </div>
      <p style={{ fontSize:14, color:C.text2 }}>
        Your loan application has been submitted successfully. Our team will review and respond within 24 hours.
      </p>
    </div>
  );

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:20 }}>
      <div style={{ fontSize:14, color:C.text2, lineHeight:1.6,
        padding:"12px 16px", borderRadius:12, background:"rgba(111,45,189,0.05)",
        border:"1px solid rgba(111,45,189,0.15)" }}>
        Please upload the following documents to complete your loan application.
        All documents are encrypted and handled securely.
      </div>

      {/* Document uploads */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(200px,1fr))", gap:12 }}>
        {DOCS.map(doc => (
          <div key={doc.key} style={{ padding:"14px", borderRadius:12,
            border:`1.5px dashed ${files[doc.key] ? C.green : C.border}`,
            background: files[doc.key] ? "rgba(34,197,94,0.04)" : "#FAFAFA",
            cursor:"pointer", textAlign:"center", position:"relative" }}>
            <label htmlFor={`file-${doc.key}`} style={{ cursor:"pointer", display:"block" }}>
              <div style={{ fontSize:24, marginBottom:6 }}>{doc.icon}</div>
              <div style={{ fontSize:12, fontWeight:700, color:C.text1 }}>{doc.label}</div>
              <div style={{ fontSize:11, color:C.muted, marginTop:2 }}>
                {files[doc.key] ? files[doc.key].name : `PDF / JPG ${doc.required ? "(Required)" : "(Optional)"}`}
              </div>
              {files[doc.key] && (
                <div style={{ fontSize:11, color:C.green, fontWeight:600, marginTop:4 }}>Uploaded</div>
              )}
            </label>
            <input id={`file-${doc.key}`} type="file" accept=".pdf,.jpg,.jpeg,.png"
              onChange={e => handleFile(doc.key, e)}
              style={{ position:"absolute", opacity:0, inset:0, cursor:"pointer" }} />
          </div>
        ))}
      </div>

      {/* Bank + contact details */}
      <div style={{ ...card({ padding:20 }) }}>
        <div style={{ fontSize:13, fontWeight:700, color:C.text1, marginBottom:14 }}>Bank & Contact Details</div>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(200px,1fr))", gap:12 }}>
          <div>
            <label style={{ fontSize:12, fontWeight:600, color:C.text2, marginBottom:5, display:"block" }}>
              Account Number <span style={{ color:C.red }}>*</span>
            </label>
            <input value={bank} onChange={e => setBank(e.target.value)} placeholder="XXXX XXXX XXXX"
              onFocus={() => setFocus(p=>({...p,bank:true}))} onBlur={() => setFocus(p=>({...p,bank:false}))}
              style={inp("bank")} />
          </div>
          <div>
            <label style={{ fontSize:12, fontWeight:600, color:C.text2, marginBottom:5, display:"block" }}>
              IFSC Code <span style={{ color:C.red }}>*</span>
            </label>
            <input value={ifsc} onChange={e => setIfsc(e.target.value)} placeholder="HDFC0001234"
              onFocus={() => setFocus(p=>({...p,ifsc:true}))} onBlur={() => setFocus(p=>({...p,ifsc:false}))}
              style={inp("ifsc")} />
          </div>
          <div>
            <label style={{ fontSize:12, fontWeight:600, color:C.text2, marginBottom:5, display:"block" }}>
              WhatsApp Number <span style={{ color:C.red }}>*</span>
            </label>
            <input value={phone} onChange={e => setPhone(e.target.value)} placeholder="+91 9876543210"
              onFocus={() => setFocus(p=>({...p,phone:true}))} onBlur={() => setFocus(p=>({...p,phone:false}))}
              style={inp("phone")} />
          </div>
        </div>
      </div>

      {/* Submit */}
      <button onClick={handleSubmit} disabled={!allRequired || submitting}
        style={{ width:"100%", padding:"14px", borderRadius:12, fontSize:15, fontWeight:800,
          color:"#fff", background: allRequired && !submitting ? "linear-gradient(135deg,#6F2DBD,#8B5CF6)" : "#9CA3AF",
          border:"none", cursor: allRequired && !submitting ? "pointer" : "not-allowed",
          display:"flex", alignItems:"center", justifyContent:"center", gap:10,
          boxShadow: allRequired && !submitting ? "0 4px 18px rgba(111,45,189,0.3)" : "none" }}>
        <Upload style={{ width:18, height:18 }} />
        {submitting ? "Submitting..." : "Submit Loan Application"}
      </button>
      {error && (
        <p style={{ fontSize:12, color:C.red, textAlign:"center", margin:0 }}>
          {error}
        </p>
      )}
      {!allRequired && (
        <p style={{ fontSize:12, color:C.muted, textAlign:"center", margin:0 }}>
          Upload all required documents and fill bank details to continue.
        </p>
      )}
    </div>
  );
}

/* ── Main page ─────────────────────────────────────────────── */
export default function SellerApply() {
  const { selectedSeller, setSelectedSeller, sellerLanguage } = useApp();
  const navigate = useNavigate();

  const activeSeller  = selectedSeller || SELLER_PROFILES[0];
  const activeMetrics = activeSeller.metrics;

  /* customize mode — editable copy */
  const [customMetrics,  setCustomMetrics]  = useState({ ...activeMetrics });
  const [customizeOpen,  setCustomizeOpen]  = useState(false);
  const [isCustomised,   setIsCustomised]   = useState(false);

  /* evaluation state */
  const [loading,   setLoading]   = useState(false);
  const [result,    setResult]    = useState(null);
  const [error,     setError]     = useState(null);

  /* apply modal */
  const [showApply, setShowApply] = useState(false);
  const [applied,   setApplied]   = useState(false);
  const [applicationError, setApplicationError] = useState(null);
  const [submittingApplication, setSubmittingApplication] = useState(false);

  /* Re-sync when seller switches */
  useEffect(() => {
    setCustomMetrics({ ...activeSeller.metrics });
    setIsCustomised(false);
    setResult(null);
    setError(null);
    setCustomizeOpen(false);
    setShowApply(false);
  }, [activeSeller.id]);

  const handleMetricChange = useCallback((key, val) => {
    setIsCustomised(true);
    setCustomMetrics(prev => ({ ...prev, [key]: val }));
  }, []);

  const usedMetrics = isCustomised ? customMetrics : activeMetrics;

  /* language from context (navbar selector) */
  const langObj = SUPPORTED_LANGUAGES.find(l => l.value === sellerLanguage) || SUPPORTED_LANGUAGES[0];

  async function runEvaluation() {
    setError(null); setLoading(true); setResult(null);
    try {
      const seller_data = {};
      const intKeys = ["prior_loan_default","account_age_months","total_orders_6m","catalog_size"];
      Object.entries(usedMetrics).forEach(([k, v]) => {
        seller_data[k] = intKeys.includes(k) ? parseInt(v, 10) || 0 : parseFloat(v) || 0;
      });
      const res = await evaluateLoan({
        seller_id:    activeSeller.id,
        language:     sellerLanguage,
        phone_number: activeSeller.phone,
        seller_data,
      });
      setResult(res);
    } catch (err) {
      setError(err?.message || "Evaluation failed. Please check backend connectivity.");
    } finally {
      setLoading(false);
    }
  }

  const decision = result?.decision;
  const rc       = RISK_COLOR[decision?.risk_class] || C.orange;
  const ok       = decision?.decision_status === "Approved";

  return (
    <div style={{ maxWidth:1000, margin:"0 auto" }}>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        .apply-grid { display:grid; grid-template-columns:1fr; gap:24px; }
        .metrics-grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(130px,1fr)); gap:10px; }
        .edit-grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(170px,1fr)); gap:12px; }
        @media(min-width:880px){ .apply-grid{ grid-template-columns:3fr 2fr; } }
        input[type=number]::-webkit-inner-spin-button { -webkit-appearance:none; }
        input[type=number] { -moz-appearance:textfield; }
      `}</style>

      <AnimatePresence>
        {loading && <EvaluationProcessor isVisible={loading} sellerId={activeSeller.id} estimatedMs={11000} />}
      </AnimatePresence>

      {/* ── Seller switcher ── */}
      <motion.div {...fu(0)} style={{ ...card({ padding:18, marginBottom:22 }) }}>
        <div style={{ fontSize:11, fontWeight:700, color:C.muted, textTransform:"uppercase",
          letterSpacing:"0.07em", marginBottom:12 }}>Active Seller Profile</div>
        <div style={{ display:"flex", gap:10, flexWrap:"wrap" }}>
          {SELLER_PROFILES.map(s => {
            const active = activeSeller.id === s.id;
            const col    = RISK_COLOR[s.risk_category] || C.orange;
            return (
              <button key={s.id} type="button" onClick={() => setSelectedSeller(s)}
                style={{ display:"flex", alignItems:"center", gap:10, padding:"10px 16px",
                  borderRadius:12, cursor:"pointer", transition:"all 0.2s",
                  border:`1.5px solid ${active ? col : C.border}`,
                  background: active ? `${col}10` : "#fff" }}>
                <div style={{ width:32, height:32, borderRadius:9, flexShrink:0,
                  background:`linear-gradient(135deg,${C.purple},${C.p2})`,
                  display:"flex", alignItems:"center", justifyContent:"center",
                  fontSize:11, fontWeight:800, color:"#fff" }}>{s.initials}</div>
                <div style={{ textAlign:"left" }}>
                  <div style={{ fontSize:13, fontWeight:700, color:C.text1 }}>{s.name}</div>
                  <div style={{ fontSize:11, color:C.muted }}>{s.id} · {s.risk_category} Risk</div>
                </div>
                {active && <CheckCircle style={{ width:14, height:14, color:col, marginLeft:4 }} />}
              </button>
            );
          })}
          <div style={{ marginLeft:"auto", display:"flex", alignItems:"center", gap:6,
            padding:"8px 12px", borderRadius:10, background:"#F3ECFF", border:"1px solid #DDD0F5" }}>
            <span style={{ fontSize:11, color:C.muted }}>Response in:</span>
            <span style={{ fontSize:13, fontWeight:700, color:C.purple }}>{langObj.flag} {langObj.native}</span>
          </div>
        </div>
      </motion.div>

      <div className="apply-grid">
        {/* ── Left: metrics + customize ── */}
        <div style={{ display:"flex", flexDirection:"column", gap:18 }}>

          {/* Seller banner */}
          <motion.div {...fu(0.04)} style={{ ...card({ padding:0, overflow:"hidden" }) }}>
            <div style={{ background:"linear-gradient(135deg,#6F2DBD,#8B5CF6)",
              padding:"18px 22px", display:"flex", alignItems:"center", gap:14 }}>
              <div style={{ width:46, height:46, borderRadius:14, flexShrink:0,
                background:"rgba(255,255,255,0.2)", display:"flex", alignItems:"center",
                justifyContent:"center", fontSize:16, fontWeight:900, color:"#fff" }}>
                {activeSeller.initials}
              </div>
              <div>
                <div style={{ fontSize:16, fontWeight:800, color:"#fff" }}>{activeSeller.name}</div>
                <div style={{ fontSize:12, color:"rgba(255,255,255,0.72)" }}>
                  {activeSeller.business} · {activeSeller.city} · {activeSeller.id}
                </div>
              </div>
              <span style={{ marginLeft:"auto", fontSize:11, fontWeight:800, padding:"4px 12px",
                borderRadius:20, background:"rgba(255,255,255,0.2)", color:"#fff" }}>
                {activeSeller.risk_category} Risk
              </span>
            </div>
            {isCustomised && (
              <div style={{ padding:"8px 22px", background:"rgba(245,158,11,0.08)",
                borderTop:"1px solid rgba(245,158,11,0.25)", fontSize:12, fontWeight:600,
                color:"#92400E", display:"flex", alignItems:"center", gap:6 }}>
                <Sliders style={{ width:13, height:13 }} />
                Demo mode — using customised metrics. Results may differ from live data.
              </div>
            )}
          </motion.div>

          {/* Metrics (read-only) */}
          <motion.div {...fu(0.08)}>
            <div style={{ fontSize:11, fontWeight:700, color:C.muted, textTransform:"uppercase",
              letterSpacing:"0.07em", marginBottom:10 }}>Live Business Metrics</div>
            <div className="metrics-grid">
              {METRIC_DISPLAY.map(def => (
                <MetricChip key={def.key} def={def} value={usedMetrics[def.key] ?? 0} />
              ))}
            </div>
          </motion.div>

          {/* Customize toggle */}
          <motion.div {...fu(0.12)}>
            <button type="button" onClick={() => setCustomizeOpen(!customizeOpen)}
              style={{ width:"100%", display:"flex", alignItems:"center", gap:10,
                padding:"11px 18px", borderRadius:12, fontSize:13, fontWeight:700,
                cursor:"pointer", transition:"all 0.2s",
                background: customizeOpen ? "rgba(245,158,11,0.1)" : "#F8F4FF",
                border:`1.5px solid ${customizeOpen ? "rgba(245,158,11,0.35)" : C.border}`,
                color: customizeOpen ? "#92400E" : C.text2 }}>
              <Sliders style={{ width:16, height:16 }} />
              Customize & Re-evaluate
              <span style={{ fontSize:11, fontWeight:600, padding:"2px 8px", borderRadius:8,
                background:"rgba(245,158,11,0.15)", color:"#92400E", marginLeft:4 }}>Demo Mode</span>
              {customizeOpen
                ? <ChevronUp style={{ width:15, height:15, marginLeft:"auto" }} />
                : <ChevronDown style={{ width:15, height:15, marginLeft:"auto" }} />}
            </button>
            <AnimatePresence>
              {customizeOpen && (
                <motion.div initial={{ opacity:0, height:0 }} animate={{ opacity:1, height:"auto" }}
                  exit={{ opacity:0, height:0 }} transition={{ duration:0.3 }}
                  style={{ overflow:"hidden", marginTop:10 }}>
                  <div style={{ ...card({ padding:18 }) }}>
                    <div style={{ fontSize:12, color:C.muted, marginBottom:12 }}>
                      Edit metrics below to simulate different scenarios for judges / demo purposes.
                    </div>
                    <div className="edit-grid">
                      {EDIT_DEFS.map(def => (
                        <EditField key={def.key} def={def}
                          value={customMetrics[def.key] ?? 0}
                          onChange={handleMetricChange} />
                      ))}
                    </div>
                    <button type="button"
                      onClick={() => { setCustomMetrics({...activeMetrics}); setIsCustomised(false); }}
                      style={{ marginTop:12, padding:"7px 14px", borderRadius:9, fontSize:12, fontWeight:600,
                        color:C.muted, background:"transparent", border:`1px solid ${C.border}`,
                        cursor:"pointer", display:"flex", alignItems:"center", gap:6 }}>
                      <RotateCcw style={{ width:13, height:13 }} /> Reset to Original
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </div>

        {/* ── Right: sticky CTA ── */}
        <div style={{ position:"sticky", top:80, height:"fit-content",
          display:"flex", flexDirection:"column", gap:14 }}>

          {/* Run evaluation */}
          {!result && (
            <motion.div {...fu(0.06)} style={{ ...card({ padding:22 }) }}>
              <div style={{ fontSize:13, fontWeight:700, color:C.text1, marginBottom:6 }}>
                AI Underwriting Evaluation
              </div>
              <p style={{ fontSize:13, color:C.text2, lineHeight:1.65, marginBottom:18 }}>
                Run the full ML + AI pipeline on {activeSeller.name}'s metrics. The system will explain
                every factor responsible for the risk class and loan limit in <strong style={{ color:C.purple }}>{langObj.native}</strong>.
              </p>

              {error && (
                <div style={{ display:"flex", gap:8, padding:"10px 12px", marginBottom:14,
                  background:"rgba(239,68,68,0.06)", border:"1px solid rgba(239,68,68,0.2)", borderRadius:10 }}>
                  <AlertCircle style={{ width:15, height:15, color:C.red, flexShrink:0, marginTop:1 }} />
                  <p style={{ fontSize:12, color:"#DC2626", margin:0 }}>{error}</p>
                </div>
              )}

              <button onClick={runEvaluation} disabled={loading}
                style={{ width:"100%", padding:"15px", borderRadius:12, fontSize:15, fontWeight:800,
                  color:"#fff", background: loading ? "#9CA3AF" : "linear-gradient(135deg,#6F2DBD,#8B5CF6)",
                  border:"none", cursor: loading ? "not-allowed" : "pointer",
                  display:"flex", alignItems:"center", justifyContent:"center", gap:10,
                  boxShadow: loading ? "none" : "0 4px 20px rgba(111,45,189,0.32)" }}>
                {loading
                  ? <><Loader2 style={{ width:19, height:19, animation:"spin 1s linear infinite" }} />Evaluating...</>
                  : <><Sparkles style={{ width:19, height:19 }} />Run AI Evaluation</>}
              </button>

              <div style={{ marginTop:14, display:"flex", flexDirection:"column", gap:6 }}>
                {["XGBoost Risk Classification","SHAP Feature Attribution","RBI Rules Engine",
                  `Groq Llama 3.1 Explanation (${langObj.label})`,"Full Audit Trail"].map((s,i) => (
                  <div key={s} style={{ display:"flex", alignItems:"center", gap:8 }}>
                    <div style={{ width:16, height:16, borderRadius:5, flexShrink:0,
                      background:"rgba(111,45,189,0.1)", display:"flex", alignItems:"center",
                      justifyContent:"center", fontSize:9, fontWeight:800, color:C.purple }}>{i+1}</div>
                    <span style={{ fontSize:11, color:C.text2 }}>{s}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {/* Post-result CTAs */}
          {result && (
            <motion.div {...fu(0)} style={{ display:"flex", flexDirection:"column", gap:10 }}>
              {ok && (
                <button onClick={() => setShowApply(true)}
                  style={{ width:"100%", padding:"14px", borderRadius:12, fontSize:14, fontWeight:800,
                    color:"#fff", background:"linear-gradient(135deg,#22C55E,#16A34A)",
                    border:"none", cursor:"pointer",
                    display:"flex", alignItems:"center", justifyContent:"center", gap:9,
                    boxShadow:"0 4px 18px rgba(34,197,94,0.3)" }}>
                  <Upload style={{ width:18, height:18 }} />
                  Apply Now — Upload Documents
                </button>
              )}
              <Link to="/seller/coach"
                style={{ width:"100%", padding:"13px", borderRadius:12, fontSize:14, fontWeight:700,
                  color:C.purple, background:"#F3ECFF", border:"1.5px solid #DDD0F5",
                  textDecoration:"none", display:"flex", alignItems:"center", justifyContent:"center", gap:9 }}>
                <MessageCircle style={{ width:17, height:17 }} />
                Talk to AI Coach for Guidance
              </Link>
              <button onClick={() => { setResult(null); setError(null); }}
                style={{ width:"100%", padding:"10px", borderRadius:12, fontSize:13, fontWeight:600,
                  color:C.muted, background:"transparent", border:`1px solid ${C.border}`,
                  cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", gap:7 }}>
                <RotateCcw style={{ width:14, height:14 }} /> Re-evaluate
              </button>
            </motion.div>
          )}
        </div>
      </div>

      {/* ── Result section ── */}
      <AnimatePresence>
        {result && (
          <motion.div initial={{ opacity:0, y:24 }} animate={{ opacity:1, y:0 }}
            transition={{ duration:0.5 }} style={{ marginTop:28 }}>

            {/* Decision hero */}
            <div style={{ ...card({ padding:0, overflow:"hidden", marginBottom:18 }) }}>
              <div style={{ height:4, background: ok
                ? "linear-gradient(90deg,#22C55E,#16A34A)"
                : decision?.decision_status === "Review"
                  ? "linear-gradient(90deg,#F59E0B,#E67E22)"
                  : "linear-gradient(90deg,#EF4444,#DC2626)" }} />
              <div style={{ padding:"24px 28px", display:"flex", gap:22, flexWrap:"wrap", alignItems:"flex-start" }}>
                <div style={{ display:"flex", alignItems:"center", gap:14, flex:1, minWidth:220 }}>
                  <div style={{ width:52, height:52, borderRadius:15, background:`${ok?C.green:C.red}12`,
                    display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                    {ok ? <CheckCircle style={{ width:26, height:26, color:C.green }} />
                         : <XCircle    style={{ width:26, height:26, color:C.red   }} />}
                  </div>
                  <div>
                    <div style={{ fontSize:24, fontWeight:900, letterSpacing:"-0.02em",
                      color: ok ? C.green : C.red }}>
                      {decision?.decision_status === "Approved" ? "Loan Approved" : "Application Declined"}
                    </div>
                    <div style={{ fontSize:12, color:C.muted }}>
                      AI Underwriting · {result.execution_time_ms}ms · {langObj.native}
                    </div>
                  </div>
                </div>
                <div style={{ display:"flex", gap:10, flexWrap:"wrap" }}>
                  {[
                    { l:"Loan Limit",  v:`Rs. ${decision?.loan_limit?.toLocaleString("en-IN")}`, c:C.purple },
                    { l:"Risk Score",  v:`${decision?.risk_score}/100`,                           c:rc       },
                    { l:"Risk Class",  v:decision?.risk_class,                                    c:rc       },
                    { l:"Review",      v:decision?.requires_human_review?"Required":"Auto",       c:decision?.requires_human_review?C.orange:C.green },
                  ].map(k => (
                    <div key={k.l} style={{ padding:"10px 16px", borderRadius:12, background:C.bg,
                      border:`1px solid ${C.border}`, textAlign:"center", minWidth:90 }}>
                      <div style={{ fontSize:10, color:C.muted, marginBottom:3 }}>{k.l}</div>
                      <div style={{ fontSize:14, fontWeight:800, color:k.c }}>{k.v}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Three-column result cards */}
            <div style={{ display:"grid", gap:18,
              gridTemplateColumns:"repeat(auto-fit,minmax(280px,1fr))" }}>

              {/* SHAP Factors — why this decision */}
              <div style={{ ...card({ padding:22 }) }}>
                <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:14 }}>
                  <Brain style={{ width:17, height:17, color:C.purple }} />
                  <span style={{ fontSize:15, fontWeight:700, color:C.text1 }}>Why This Decision</span>
                  <span style={{ marginLeft:"auto", fontSize:10, color:C.muted,
                    padding:"2px 7px", borderRadius:20, background:C.bg, border:`1px solid ${C.border}` }}>
                    SHAP
                  </span>
                </div>
                <div style={{ display:"flex", flexDirection:"column", gap:9 }}>
                  {(result.top_reasoning_features || []).map((f, i) => (
                    <FactorCard key={i} feature={f} index={i} />
                  ))}
                </div>
              </div>

              {/* AI Explanation in seller's language */}
              <div style={{ ...card({ padding:22 }) }}>
                <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:14 }}>
                  <MessageCircle style={{ width:17, height:17, color:C.purple }} />
                  <span style={{ fontSize:15, fontWeight:700, color:C.text1 }}>AI Explanation</span>
                  <span style={{ marginLeft:"auto", fontSize:11, fontWeight:700,
                    padding:"2px 8px", borderRadius:20, color:C.purple,
                    background:"rgba(111,45,189,0.08)", border:"1px solid #DDD0F5" }}>
                    {langObj.flag} {langObj.label}
                  </span>
                </div>
                <p style={{ fontSize:15, color:C.text1, lineHeight:1.85, margin:"0 0 14px" }}>
                  {result.seller_message}
                </p>
                <div style={{ height:1, background:C.border, margin:"14px 0" }} />
                <div style={{ fontSize:11, fontWeight:700, color:C.muted, textTransform:"uppercase",
                  letterSpacing:"0.06em", marginBottom:10 }}>Auditor Trail</div>
                <p style={{ fontSize:12, color:C.text2, lineHeight:1.7, fontFamily:"monospace", margin:0 }}>
                  {result.auditor_trail}
                </p>
              </div>

              {/* Improvement Plan */}
              <div style={{ ...card({ padding:22 }) }}>
                <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:14 }}>
                  <TrendingUp style={{ width:17, height:17, color:C.orange }} />
                  <span style={{ fontSize:15, fontWeight:700, color:C.text1 }}>Improvement Plan</span>
                </div>
                <div style={{ display:"flex", flexDirection:"column", gap:10, marginBottom:18 }}>
                  {(result.improvement_plan || []).map((item, i) => (
                    <motion.div key={i} initial={{ opacity:0, x:-8 }} animate={{ opacity:1, x:0 }}
                      transition={{ delay: i * 0.07 }}
                      style={{ display:"flex", gap:12, alignItems:"flex-start" }}>
                      <div style={{ width:26, height:26, borderRadius:8, flexShrink:0,
                        background:"rgba(245,158,11,0.12)", border:"1.5px solid rgba(245,158,11,0.3)",
                        display:"flex", alignItems:"center", justifyContent:"center",
                        fontSize:12, fontWeight:800, color:C.orange }}>{i+1}</div>
                      <p style={{ fontSize:14, color:C.text1, lineHeight:1.65, margin:0, paddingTop:3 }}>{item}</p>
                    </motion.div>
                  ))}
                </div>
                <Link to="/seller/coach"
                  style={{ display:"flex", alignItems:"center", gap:8, padding:"11px 16px",
                    borderRadius:12, fontSize:13, fontWeight:700, color:C.purple,
                    background:"#F3ECFF", border:"1.5px solid #DDD0F5", textDecoration:"none" }}>
                  <MessageCircle style={{ width:15, height:15 }} />
                  Discuss with AI Coach
                  <ChevronRight style={{ width:14, height:14, marginLeft:"auto" }} />
                </Link>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Document upload modal ── */}
      <AnimatePresence>
        {showApply && (
          <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
            style={{ position:"fixed", inset:0, background:"rgba(11,7,30,0.65)",
              backdropFilter:"blur(8px)", zIndex:200,
              display:"flex", alignItems:"center", justifyContent:"center", padding:20 }}>
            <motion.div initial={{ scale:0.93, opacity:0 }} animate={{ scale:1, opacity:1 }}
              exit={{ scale:0.93, opacity:0 }} transition={{ duration:0.3 }}
              style={{ background:"#fff", borderRadius:24, width:"100%", maxWidth:640,
                maxHeight:"90vh", overflow:"auto", padding:28,
                boxShadow:"0 24px 60px rgba(0,0,0,0.3)" }}>
              <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:20 }}>
                <div style={{ width:42, height:42, borderRadius:12,
                  background:"rgba(111,45,189,0.1)", display:"flex", alignItems:"center",
                  justifyContent:"center", flexShrink:0 }}>
                  <FileText style={{ width:20, height:20, color:C.purple }} />
                </div>
                <div>
                  <div style={{ fontSize:17, fontWeight:800, color:C.text1 }}>Loan Application</div>
                  <div style={{ fontSize:12, color:C.muted }}>
                    {activeSeller.name} · Rs. {decision?.loan_limit?.toLocaleString("en-IN")} approved
                  </div>
                </div>
                <button onClick={() => setShowApply(false)}
                  style={{ marginLeft:"auto", width:32, height:32, borderRadius:9,
                    background:"#F8F4FF", border:"1px solid #E9E5F5",
                    display:"flex", alignItems:"center", justifyContent:"center",
                    cursor:"pointer", color:C.muted, fontSize:18 }}>×</button>
              </div>
              <DocumentUpload
                seller={activeSeller}
                loanLimit={decision?.loan_limit || 0}
                onClose={() => setShowApply(false)}
                onSubmit={() => setApplied(true)}
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Applied success banner */}
      <AnimatePresence>
        {applied && (
          <motion.div initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }}
            exit={{ opacity:0 }} style={{ marginTop:20, ...card({ padding:20,
              background:"rgba(34,197,94,0.06)", border:"1px solid rgba(34,197,94,0.25)" }) }}>
            <div style={{ display:"flex", alignItems:"center", gap:12 }}>
              <CheckCircle style={{ width:22, height:22, color:C.green, flexShrink:0 }} />
              <div>
                <div style={{ fontSize:15, fontWeight:700, color:C.text1 }}>
                  Application submitted successfully!
                </div>
                <div style={{ fontSize:13, color:C.text2 }}>
                  Our team will review {activeSeller.name}'s application and respond within 24 hours.
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
