/**
 * EvaluatePage — full seller evaluation form with demo autofill, live API call, and result display.
 */
import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, CheckCircle, XCircle, Clock, ChevronDown, Loader2,
         TrendingUp, RotateCcw, AlertCircle, Sparkles, IndianRupee,
         Shield, Brain, MessageCircle, ArrowRight } from "lucide-react";
import { SUPPORTED_LANGUAGES, SELLER_DATA_FIELDS, DEMO_PROFILES } from "../utils/constants";
import { evaluateLoan } from "../services/api";
import EvaluationProcessor from "../components/EvaluationProcessor";

/* ── design tokens ─────────────────────────────────────────── */
const C = {
  purple:"#6F2DBD", purple2:"#8B5CF6", orange:"#F59E0B",
  green:"#22C55E",  red:"#EF4444",     amber:"#F59E0B",
  text1:"#1A1A2E",  text2:"#4B5563",   muted:"#9CA3AF",
  border:"#E9E5F5", bg:"#F8F4FF",      card:"#FFFFFF",
};
const card  = (x={}) => ({ background:C.card, border:`1px solid ${C.border}`, borderRadius:16, boxShadow:"0 2px 16px rgba(111,45,189,0.08)", ...x });
const input = (focus=false) => ({
  width:"100%", padding:"10px 14px", borderRadius:10, fontSize:13,
  border:`1.5px solid ${focus ? C.purple : C.border}`,
  background:"#fff", color:C.text1, outline:"none", boxSizing:"border-box",
  transition:"border-color 0.2s",
});
const fadeUp = (d=0) => ({ initial:{opacity:0,y:20}, animate:{opacity:1,y:0}, transition:{duration:0.4,delay:d,ease:[0.22,1,0.36,1]} });

/* ── field group metadata ───────────────────────────────────── */
const GROUPS = [
  { key:"sales",    label:"Sales Performance",  color:"#6F2DBD", bg:"rgba(111,45,189,0.08)" },
  { key:"delivery", label:"Delivery Metrics",   color:"#8B5CF6", bg:"rgba(139,92,246,0.08)" },
  { key:"quality",  label:"Quality Signals",    color:"#F59E0B", bg:"rgba(245,158,11,0.08)" },
  { key:"business", label:"Business Profile",   color:"#6F2DBD", bg:"rgba(111,45,189,0.08)" },
  { key:"credit",   label:"Credit History",     color:"#EF4444", bg:"rgba(239,68,68,0.08)"  },
];

/* ── default form values ────────────────────────────────────── */
function buildDefaults() {
  const d = {};
  SELLER_DATA_FIELDS.forEach(f => {
    d[f.key] = f.type === "select" ? (f.options[0].value) : "";
  });
  return d;
}

/* ── FieldInput ─────────────────────────────────────────────── */
function FieldInput({ field, value, onChange }) {
  const [focused, setFocused] = useState(false);
  if (field.type === "select") {
    return (
      <div style={{ position:"relative" }}>
        <select
          value={value}
          onChange={e => onChange(field.key, Number(e.target.value))}
          style={{ ...input(focused), appearance:"none", cursor:"pointer", paddingRight:32 }}
          onFocus={()=>setFocused(true)} onBlur={()=>setFocused(false)}
        >
          {field.options.map(o=>(
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
        <ChevronDown style={{ position:"absolute", right:10, top:"50%", transform:"translateY(-50%)", width:15, height:15, color:C.muted, pointerEvents:"none" }} />
      </div>
    );
  }
  return (
    <div style={{ position:"relative" }}>
      <input
        type="number"
        value={value}
        placeholder={field.placeholder}
        min={field.min} max={field.max} step={field.step}
        onChange={e => onChange(field.key, e.target.value)}
        onFocus={()=>setFocused(true)} onBlur={()=>setFocused(false)}
        style={{ ...input(focused), paddingRight: field.unit ? 44 : 14 }}
      />
      {field.unit && (
        <span style={{ position:"absolute", right:12, top:"50%", transform:"translateY(-50%)",
          fontSize:12, fontWeight:600, color:C.muted }}>{field.unit}</span>
      )}
    </div>
  );
}

/* ── LanguageDropdown ───────────────────────────────────────── */
function LanguageDropdown({ value, onChange }) {
  const [open, setOpen] = useState(false);
  const sel = SUPPORTED_LANGUAGES.find(l=>l.value===value) || SUPPORTED_LANGUAGES[0];
  return (
    <div style={{ position:"relative" }}>
      <button type="button" onClick={()=>setOpen(!open)}
        style={{ ...input(open), display:"flex", alignItems:"center", gap:8, cursor:"pointer", border:`1.5px solid ${open?C.purple:C.border}` }}
      >
        <span style={{ fontSize:16 }}>{sel.flag}</span>
        <span style={{ flex:1, textAlign:"left", fontSize:13, color:C.text1 }}>{sel.native} — {sel.label}</span>
        <ChevronDown style={{ width:15, height:15, color:C.muted, transform:open?"rotate(180deg)":"none", transition:"transform 0.2s" }} />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div initial={{opacity:0,y:-6}} animate={{opacity:1,y:0}} exit={{opacity:0,y:-6}}
            transition={{duration:0.15}}
            style={{ position:"absolute", top:"calc(100% + 6px)", left:0, right:0, background:"#fff",
              border:`1px solid ${C.border}`, borderRadius:12, boxShadow:"0 8px 32px rgba(111,45,189,0.12)",
              zIndex:99, overflow:"hidden" }}
          >
            {SUPPORTED_LANGUAGES.map(l=>(
              <button key={l.value} type="button"
                onClick={()=>{ onChange(l.value); setOpen(false); }}
                style={{ display:"flex", alignItems:"center", gap:10, width:"100%", padding:"10px 14px",
                  background: value===l.value ? "#F8F4FF" : "transparent", border:"none", cursor:"pointer",
                  fontSize:13, color:C.text1, textAlign:"left" }}
              >
                <span style={{ fontSize:16 }}>{l.flag}</span>
                <span style={{ fontWeight:500 }}>{l.native}</span>
                <span style={{ color:C.muted, fontSize:12 }}>{l.label}</span>
                {value===l.value && <CheckCircle style={{ marginLeft:"auto", width:14, height:14, color:C.purple }} />}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ── LoadingOverlay ─────────────────────────────────────────── */
function ResultPanel({ result, onReset }) {
  const { decision, seller_message, auditor_trail, improvement_plan, top_reasoning_features, execution_time_ms } = result;
  const [tab, setTab] = useState("decision");
  const isApproved = decision.decision_status === "Approved";
  const statusColor = isApproved ? C.green : C.red;

  const RISK_COLOR = { Low:C.green, Moderate:C.amber, Medium:C.amber, High:C.red };
  const riskColor = RISK_COLOR[decision.risk_class] || C.amber;

  return (
    <motion.div {...fadeUp(0)} style={{ display:"flex", flexDirection:"column", gap:20 }}>
      {/* Hero result card */}
      <div style={{ ...card(), borderTop:`4px solid ${statusColor}`, padding:28 }}>
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:20, flexWrap:"wrap", gap:12 }}>
          <div style={{ display:"flex", alignItems:"center", gap:12 }}>
            <div style={{ width:48, height:48, borderRadius:14, background:`${statusColor}18`,
              display:"flex", alignItems:"center", justifyContent:"center" }}>
              {isApproved
                ? <CheckCircle style={{ width:24, height:24, color:statusColor }} />
                : <XCircle style={{ width:24, height:24, color:statusColor }} />}
            </div>
            <div>
              <div style={{ fontSize:22, fontWeight:900, color:statusColor }}>{decision.decision_status}</div>
              <div style={{ fontSize:13, color:C.muted }}>AI-powered lending decision</div>
            </div>
          </div>
          <button onClick={onReset}
            style={{ display:"flex", alignItems:"center", gap:6, padding:"8px 16px", borderRadius:10,
              fontSize:13, fontWeight:600, color:C.purple, background:"rgba(111,45,189,0.08)",
              border:`1px solid rgba(111,45,189,0.2)`, cursor:"pointer" }}>
            <RotateCcw style={{ width:14, height:14 }} /> New Evaluation
          </button>
        </div>

        {/* KPI strip */}
        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(140px,1fr))", gap:12 }}>
          {[
            { label:"Loan Limit",    value:`₹${decision.loan_limit?.toLocaleString("en-IN")}`, color:C.purple },
            { label:"Risk Score",    value:decision.risk_score,           color:riskColor  },
            { label:"Risk Class",    value:decision.risk_class,           color:riskColor  },
            { label:"Human Review",  value:decision.requires_human_review?"Required":"Auto", color:decision.requires_human_review?C.amber:C.green },
            { label:"Processed in",  value:`${execution_time_ms}ms`,      color:C.text2    },
          ].map(k=>(
            <div key={k.label} style={{ background:C.bg, borderRadius:12, padding:"12px 14px", textAlign:"center" }}>
              <div style={{ fontSize:11, color:C.muted, marginBottom:4 }}>{k.label}</div>
              <div style={{ fontSize:16, fontWeight:800, color:k.color }}>{k.value}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display:"flex", gap:4, background:C.bg, borderRadius:12, padding:4 }}>
        {[["decision","Decision Message"],["reasoning","AI Reasoning"],["improve","Improvement Plan"],["audit","Auditor Trail"]].map(([key,label])=>(
          <button key={key} onClick={()=>setTab(key)} type="button"
            style={{ flex:1, padding:"8px 4px", borderRadius:9, fontSize:12, fontWeight:600, border:"none", cursor:"pointer",
              background: tab===key?"#fff":"transparent", color: tab===key?C.purple:C.muted,
              boxShadow: tab===key?"0 1px 6px rgba(111,45,189,0.1)":"none", transition:"all 0.2s" }}>
            {label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <AnimatePresence mode="wait">
        <motion.div key={tab} initial={{opacity:0,y:8}} animate={{opacity:1,y:0}} exit={{opacity:0}} transition={{duration:0.2}}>
          {tab==="decision" && (
            <div style={{ ...card(), padding:24 }}>
              <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:14 }}>
                <MessageCircle style={{ width:18, height:18, color:C.purple }} />
                <span style={{ fontSize:15, fontWeight:700, color:C.text1 }}>Seller Message</span>
              </div>
              <p style={{ fontSize:15, color:C.text1, lineHeight:1.8, margin:0 }}>{seller_message}</p>
            </div>
          )}
          {tab==="reasoning" && (
            <div style={{ ...card(), padding:24 }}>
              <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:16 }}>
                <Brain style={{ width:18, height:18, color:C.purple }} />
                <span style={{ fontSize:15, fontWeight:700, color:C.text1 }}>Top Reasoning Features</span>
              </div>
              <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
                {(top_reasoning_features||[]).map((f,i)=>(
                  <div key={i} style={{ display:"flex", gap:12, padding:"12px 14px", borderRadius:10,
                    background: f.impact?.toLowerCase()==="positive"?"rgba(34,197,94,0.06)":"rgba(239,68,68,0.06)",
                    border:`1px solid ${f.impact?.toLowerCase()==="positive"?"rgba(34,197,94,0.2)":"rgba(239,68,68,0.2)"}` }}>
                    <div style={{ width:6, borderRadius:3, flexShrink:0,
                      background: f.impact?.toLowerCase()==="positive"?C.green:C.red }} />
                    <div>
                      <div style={{ fontSize:13, fontWeight:700, color:C.text1 }}>{f.feature}</div>
                      <div style={{ fontSize:12, color:C.text2, marginTop:2 }}>{f.reason}</div>
                    </div>
                    <span style={{ marginLeft:"auto", fontSize:11, fontWeight:700, flexShrink:0, alignSelf:"flex-start",
                      padding:"2px 8px", borderRadius:20,
                      color: f.impact?.toLowerCase()==="positive"?"#16A34A":"#DC2626",
                      background: f.impact?.toLowerCase()==="positive"?"rgba(34,197,94,0.1)":"rgba(239,68,68,0.1)" }}>
                      {f.impact}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
          {tab==="improve" && (
            <div style={{ ...card(), padding:24 }}>
              <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:16 }}>
                <TrendingUp style={{ width:18, height:18, color:C.orange }} />
                <span style={{ fontSize:15, fontWeight:700, color:C.text1 }}>Improvement Plan</span>
              </div>
              <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
                {(improvement_plan||[]).map((item,i)=>(
                  <div key={i} style={{ display:"flex", gap:12, alignItems:"flex-start" }}>
                    <div style={{ width:26, height:26, borderRadius:8, background:"rgba(245,158,11,0.12)",
                      border:"1.5px solid rgba(245,158,11,0.3)", display:"flex", alignItems:"center",
                      justifyContent:"center", fontSize:12, fontWeight:800, color:C.orange, flexShrink:0 }}>
                      {i+1}
                    </div>
                    <p style={{ fontSize:14, color:C.text1, lineHeight:1.6, margin:0, paddingTop:3 }}>{item}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
          {tab==="audit" && (
            <div style={{ ...card(), padding:24 }}>
              <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:14 }}>
                <Shield style={{ width:18, height:18, color:C.purple }} />
                <span style={{ fontSize:15, fontWeight:700, color:C.text1 }}>Auditor Trail</span>
                <span style={{ marginLeft:"auto", fontSize:11, color:C.muted, padding:"2px 8px",
                  background:C.bg, borderRadius:20, border:`1px solid ${C.border}` }}>Internal Only</span>
              </div>
              <p style={{ fontSize:13, color:C.text2, lineHeight:1.8, margin:0, fontFamily:"monospace" }}>{auditor_trail}</p>
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </motion.div>
  );
}

/* ── Main EvaluatePage ─────────────────────────────────────── */
export default function EvaluatePage() {
  const [sellerData, setSellerData] = useState(buildDefaults);
  const [sellerId,   setSellerId]   = useState("");
  const [language,   setLanguage]   = useState("English");
  const [phone,      setPhone]      = useState("");
  const [loading,    setLoading]    = useState(false);
  const [result,     setResult]     = useState(null);
  const [error,      setError]      = useState(null);
  const [idFocus,    setIdFocus]    = useState(false);
  const [phoneFocus, setPhoneFocus] = useState(false);

  const handleField = useCallback((key, val) => {
    setSellerData(prev => ({ ...prev, [key]: val }));
  }, []);

  function fillDemo(profile) {
    setSellerId(profile.data.seller_id);
    setLanguage(profile.data.language);
    Object.entries(profile.data.seller_data).forEach(([k,v]) => handleField(k, v));
    setResult(null); setError(null);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!sellerId.trim()) { setError("Please enter a Seller ID."); return; }
    setError(null); setLoading(true); setResult(null);
    try {
      const payload = {
        seller_id: sellerId.trim(),
        language,
        phone_number: phone || undefined,
        seller_data: Object.fromEntries(
          SELLER_DATA_FIELDS.map(f => {
            const v = sellerData[f.key];
            return [f.key, f.isInt ? parseInt(v,10)||0 : parseFloat(v)||0];
          })
        ),
      };
      const res = await evaluateLoan(payload);
      setResult(res);
    } catch(err) {
      setError(err?.message || "Evaluation failed. Please check your inputs and try again.");
    } finally {
      setLoading(false);
    }
  }

  function handleReset() { setResult(null); setError(null); }

  return (
    <div style={{ maxWidth:1100, margin:"0 auto" }}>
      <style>{`
        .eval-grid { display:grid; grid-template-columns:3fr 2fr; gap:24px; align-items:start; }
        .field-grid { display:grid; grid-template-columns:1fr 1fr; gap:14px; }
        @media(max-width:900px){ .eval-grid{ grid-template-columns:1fr; } }
        @media(max-width:640px){ .field-grid{ grid-template-columns:1fr; } }
        input[type=number]::-webkit-inner-spin-button { -webkit-appearance:none; }
        input[type=number] { -moz-appearance:textfield; }
      `}</style>

      {/* Agentic AI processing animation */}
      <AnimatePresence>
        {loading && (
          <EvaluationProcessor
            isVisible={loading}
            sellerId={sellerId.trim() || "Seller"}
            estimatedMs={11000}
          />
        )}
      </AnimatePresence>

      <motion.div {...fadeUp(0)} style={{ marginBottom:24 }}>
        <h1 style={{ fontSize:22, fontWeight:800, color:C.text1, margin:"0 0 4px", letterSpacing:"-0.02em" }}>
          Seller Evaluation
        </h1>
        <p style={{ fontSize:13, color:C.muted, margin:0 }}>
          Enter seller metrics to run the full AI underwriting pipeline
        </p>
      </motion.div>

      <div className="eval-grid">
        {/* ── Left: form ── */}
        <div style={{ display:"flex", flexDirection:"column", gap:20 }}>

          {/* Demo profiles */}
          <motion.div {...fadeUp(0.04)} style={{ ...card(), padding:20 }}>
            <div style={{ fontSize:12, fontWeight:700, color:C.muted, textTransform:"uppercase",
              letterSpacing:"0.06em", marginBottom:12 }}>Quick Demo Profiles</div>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:10 }}>
              {DEMO_PROFILES.map(p=>(
                <button key={p.label} type="button" onClick={()=>fillDemo(p)}
                  style={{ padding:"12px 8px", borderRadius:12, border:`1.5px solid ${p.color}30`,
                    background:`${p.color}08`, cursor:"pointer", textAlign:"left", transition:"all 0.2s" }}
                  onMouseEnter={e=>{ e.currentTarget.style.background=`${p.color}15`; e.currentTarget.style.borderColor=`${p.color}60`; }}
                  onMouseLeave={e=>{ e.currentTarget.style.background=`${p.color}08`; e.currentTarget.style.borderColor=`${p.color}30`; }}
                >
                  <div style={{ width:8, height:8, borderRadius:"50%", background:p.color, marginBottom:6 }} />
                  <div style={{ fontSize:12, fontWeight:700, color:C.text1 }}>{p.label}</div>
                  <div style={{ fontSize:11, color:C.muted, marginTop:2 }}>{p.description}</div>
                </button>
              ))}
            </div>
          </motion.div>

          {/* Seller ID + Phone row */}
          <motion.div {...fadeUp(0.08)} style={{ ...card(), padding:20 }}>
            <div style={{ fontSize:13, fontWeight:700, color:C.text1, marginBottom:14 }}>Seller Identity</div>
            <div className="field-grid">
              <div>
                <label style={{ fontSize:12, fontWeight:600, color:C.text2, marginBottom:5, display:"block" }}>
                  Seller ID <span style={{ color:C.red }}>*</span>
                </label>
                <div style={{ position:"relative" }}>
                  <Search style={{ position:"absolute", left:11, top:"50%", transform:"translateY(-50%)",
                    width:14, height:14, color:C.muted }} />
                  <input value={sellerId} onChange={e=>setSellerId(e.target.value)}
                    placeholder="e.g. SELL_00123"
                    onFocus={()=>setIdFocus(true)} onBlur={()=>setIdFocus(false)}
                    style={{ ...input(idFocus), paddingLeft:34 }} />
                </div>
              </div>
              <div>
                <label style={{ fontSize:12, fontWeight:600, color:C.text2, marginBottom:5, display:"block" }}>
                  Phone Number <span style={{ color:C.muted, fontWeight:400 }}>(optional)</span>
                </label>
                <input value={phone} onChange={e=>setPhone(e.target.value)}
                  placeholder="+91 9876543210"
                  onFocus={()=>setPhoneFocus(true)} onBlur={()=>setPhoneFocus(false)}
                  style={input(phoneFocus)} />
              </div>
            </div>
          </motion.div>

          {/* Metrics by group */}
          {GROUPS.map((grp,gi) => {
            const fields = SELLER_DATA_FIELDS.filter(f=>f.group===grp.key);
            if (!fields.length) return null;
            return (
              <motion.div key={grp.key} {...fadeUp(0.1+gi*0.05)} style={{ ...card(), padding:20 }}>
                <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:16 }}>
                  <div style={{ width:6, height:6, borderRadius:"50%", background:grp.color }} />
                  <span style={{ fontSize:13, fontWeight:700, color:C.text1 }}>{grp.label}</span>
                </div>
                <div className="field-grid">
                  {fields.map(f=>(
                    <div key={f.key}>
                      <label style={{ fontSize:12, fontWeight:600, color:C.text2, marginBottom:5, display:"block" }}>
                        {f.label}
                      </label>
                      <FieldInput field={f} value={sellerData[f.key]} onChange={handleField} />
                      <div style={{ fontSize:11, color:C.muted, marginTop:3 }}>{f.hint}</div>
                    </div>
                  ))}
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* ── Right: sticky config + submit ── */}
        <div style={{ position:"sticky", top:84, display:"flex", flexDirection:"column", gap:16 }}>

          {/* Language */}
          <motion.div {...fadeUp(0.06)} style={{ ...card(), padding:20 }}>
            <label style={{ fontSize:12, fontWeight:700, color:C.text2, textTransform:"uppercase",
              letterSpacing:"0.06em", marginBottom:10, display:"block" }}>Response Language</label>
            <LanguageDropdown value={language} onChange={setLanguage} />
          </motion.div>

          {/* Submit */}
          <motion.div {...fadeUp(0.1)}>
            <form onSubmit={handleSubmit}>
              {error && (
                <div style={{ display:"flex", gap:8, alignItems:"flex-start", padding:"12px 14px",
                  background:"rgba(239,68,68,0.06)", border:"1px solid rgba(239,68,68,0.25)",
                  borderRadius:12, marginBottom:12 }}>
                  <AlertCircle style={{ width:16, height:16, color:C.red, flexShrink:0, marginTop:1 }} />
                  <p style={{ fontSize:13, color:"#DC2626", margin:0, lineHeight:1.5 }}>{error}</p>
                </div>
              )}
              <button type="submit" disabled={loading}
                style={{ width:"100%", padding:"16px", borderRadius:12, fontSize:16, fontWeight:800,
                  color:"#fff", background:loading?"#9CA3AF":"linear-gradient(135deg,#6F2DBD,#8B5CF6)",
                  border:"none", cursor:loading?"not-allowed":"pointer",
                  boxShadow:loading?"none":"0 4px 20px rgba(111,45,189,0.35)",
                  display:"flex", alignItems:"center", justifyContent:"center", gap:10,
                  transition:"all 0.2s" }}
                onMouseEnter={e=>{ if(!loading){ e.currentTarget.style.boxShadow="0 6px 28px rgba(111,45,189,0.5)"; }}}
                onMouseLeave={e=>{ if(!loading){ e.currentTarget.style.boxShadow="0 4px 20px rgba(111,45,189,0.35)"; }}}
              >
                {loading ? <><Loader2 style={{ width:20, height:20, animation:"spin 1s linear infinite" }} />Evaluating...</>
                  : <><Sparkles style={{ width:20, height:20 }} />Evaluate Loan<ArrowRight style={{ width:18, height:18 }} /></>}
              </button>
            </form>
          </motion.div>

          {/* Pipeline info */}
          <motion.div {...fadeUp(0.14)} style={{ ...card(), padding:16 }}>
            <div style={{ fontSize:11, fontWeight:700, color:C.muted, textTransform:"uppercase",
              letterSpacing:"0.06em", marginBottom:10 }}>Pipeline Steps</div>
            {["ML Risk Scoring","SHAP Explainability","Rules Engine","AI Agent (Groq)","Multilingual Response"].map((s,i)=>(
              <div key={s} style={{ display:"flex", alignItems:"center", gap:8, marginBottom:7 }}>
                <div style={{ width:18, height:18, borderRadius:6, background:"rgba(111,45,189,0.1)",
                  display:"flex", alignItems:"center", justifyContent:"center", fontSize:10,
                  fontWeight:800, color:C.purple, flexShrink:0 }}>{i+1}</div>
                <span style={{ fontSize:12, color:C.text2 }}>{s}</span>
              </div>
            ))}
          </motion.div>
        </div>
      </div>

      {/* Result */}
      <AnimatePresence>
        {result && (
          <motion.div initial={{opacity:0,y:24}} animate={{opacity:1,y:0}} transition={{duration:0.5}}
            style={{ marginTop:32 }}>
            <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:20 }}>
              <div style={{ flex:1, height:1, background:C.border }} />
              <span style={{ fontSize:12, fontWeight:700, color:C.purple, padding:"4px 14px",
                background:"rgba(111,45,189,0.08)", borderRadius:20, border:`1px solid rgba(111,45,189,0.2)` }}>
                Evaluation Result
              </span>
              <div style={{ flex:1, height:1, background:C.border }} />
            </div>
            <ResultPanel result={result} onReset={handleReset} />
          </motion.div>
        )}
      </AnimatePresence>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
