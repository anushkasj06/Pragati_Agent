/**
 * SellerLoanGuide — Loan Application Guide + Live Evaluation.
 * Shows seller eligibility, runs backend evaluation, displays
 * detailed AI explanation with fallback warning if Groq is down.
 */
import { useState } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  CheckCircle, AlertCircle, ArrowRight, Sparkles, Clock,
  ShieldCheck, IndianRupee, Star, Truck, TrendingUp, Info,
  ChevronDown, ChevronUp, Brain, MessageCircle, Shield,
  FileText, Loader2, RotateCcw, AlertTriangle, Upload,
} from "lucide-react";
import { useApp } from "../../context/AppContext";
import { useNotifications } from "../../context/NotificationContext";
import { SELLER_PROFILES, computeHealthScore } from "../../utils/sellerData";
import { SUPPORTED_LANGUAGES } from "../../utils/constants";
import { evaluateLoan, submitLoanApplication } from "../../services/api";
import EvaluationProcessor from "../../components/EvaluationProcessor";

const C = {
  purple:"#6F2DBD", p2:"#8B5CF6", orange:"#F59E0B", green:"#22C55E",
  red:"#EF4444", text1:"#1A1A2E", text2:"#4B5563", muted:"#9CA3AF",
  border:"#E9E5F5", bg:"#F8F4FF", card:"#FFFFFF",
};
const card = (x={}) => ({ background:C.card, border:`1px solid ${C.border}`,
  borderRadius:16, boxShadow:"0 2px 16px rgba(111,45,189,0.07)", ...x });
const fu = (d=0) => ({ initial:{opacity:0,y:20}, animate:{opacity:1,y:0},
  transition:{duration:0.45, delay:d, ease:[0.22,1,0.36,1]} });

const RISK_COLOR = { Low:C.green, Moderate:C.orange, Medium:C.orange, High:C.red };

/* ── FAQ ─────────────────────────────────────────────────────── */
function FaqItem({ q, a }) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ border:`1px solid ${C.border}`, borderRadius:12, overflow:"hidden" }}>
      <button onClick={() => setOpen(!open)} style={{
        width:"100%", display:"flex", alignItems:"center", justifyContent:"space-between",
        padding:"14px 18px", background:"none", border:"none", cursor:"pointer",
        fontSize:14, fontWeight:600, color:C.text1, textAlign:"left" }}>
        {q}
        {open ? <ChevronUp style={{width:15,height:15,color:C.muted,flexShrink:0}}/>
               : <ChevronDown style={{width:15,height:15,color:C.muted,flexShrink:0}}/>}
      </button>
      {open && (
        <div style={{ padding:"0 18px 14px", fontSize:13, color:C.text2, lineHeight:1.65 }}>{a}</div>
      )}
    </div>
  );
}

/* ── SHAP Factor card ────────────────────────────────────────── */
function FactorCard({ feature, index }) {
  const pos = feature.impact?.toLowerCase() === "positive";
  return (
    <motion.div initial={{opacity:0,x:-8}} animate={{opacity:1,x:0}}
      transition={{delay:index*0.06, duration:0.3}}
      style={{ display:"flex", gap:10, padding:"12px 14px", borderRadius:12,
        background: pos?"rgba(34,197,94,0.04)":"rgba(239,68,68,0.04)",
        border:`1px solid ${pos?"rgba(34,197,94,0.18)":"rgba(239,68,68,0.18)"}` }}>
      <div style={{ width:4, borderRadius:2, flexShrink:0, background:pos?C.green:C.red }} />
      <div style={{ flex:1 }}>
        <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:3 }}>
          <span style={{ fontSize:13, fontWeight:700, color:C.text1 }}>{feature.feature}</span>
          <span style={{ fontSize:11, fontWeight:700, padding:"2px 7px", borderRadius:20, flexShrink:0,
            color:pos?"#16A34A":"#DC2626",
            background:pos?"rgba(34,197,94,0.1)":"rgba(239,68,68,0.1)" }}>
            {pos?"Positive":"Negative"}
          </span>
        </div>
        <p style={{ fontSize:12, color:C.text2, margin:0, lineHeight:1.55 }}>{feature.reason}</p>
      </div>
    </motion.div>
  );
}

/* ── Document Upload ─────────────────────────────────────────── */
function DocumentUpload({ seller, loanLimit, onClose, onSubmitted }) {
  const [files, setFiles] = useState({ aadhaar:null, pan:null, bank:null, gst:null });
  const [phone, setPhone] = useState(seller.phone || "");
  const [bank,  setBank]  = useState("");
  const [ifsc,  setIfsc]  = useState("");
  const [done,  setDone]  = useState(false);
  const [focus, setFocus] = useState({});
  const [loadingSubmit, setLoadingSubmit] = useState(false);
  const { addNotification } = useNotifications();

  const inp = (k) => ({
    width:"100%", padding:"10px 13px", borderRadius:10, fontSize:13,
    border:`1.5px solid ${focus[k]?C.purple:C.border}`, background:"#fff",
    color:C.text1, outline:"none", boxSizing:"border-box",
  });

  const allRequired = files.aadhaar && files.pan && files.bank && bank && ifsc && phone;

  if (done) return (
    <div style={{ textAlign:"center", padding:"32px 0" }}>
      <motion.div initial={{scale:0}} animate={{scale:1}}
        transition={{type:"spring", stiffness:200}}
        style={{ width:68, height:68, borderRadius:"50%",
          background:"rgba(34,197,94,0.1)", border:"2px solid rgba(34,197,94,0.3)",
          display:"flex", alignItems:"center", justifyContent:"center", margin:"0 auto 16px" }}>
        <CheckCircle style={{ width:34, height:34, color:C.green }} />
      </motion.div>
      <div style={{ fontSize:20, fontWeight:900, color:C.text1, marginBottom:6 }}>
        Application Submitted!
      </div>
      <p style={{ fontSize:14, color:C.text2, marginBottom:20 }}>
        Your loan application for Rs. {Number(loanLimit).toLocaleString("en-IN")} has been
        submitted. Our team will review and respond within 24 hours on WhatsApp.
      </p>
      <button onClick={onClose} className="btn-primary" style={{
        padding:"10px 24px", borderRadius:12, fontSize:14, fontWeight:700,
        color:"#fff", background:C.purple, border:"none", cursor:"pointer" }}>
        Done
      </button>
    </div>
  );

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:18 }}>
      <div style={{ fontSize:13, color:C.text2, lineHeight:1.65,
        padding:"12px 16px", borderRadius:12, background:"rgba(111,45,189,0.05)",
        border:"1px solid rgba(111,45,189,0.15)" }}>
        Upload the documents below to complete your loan application of{" "}
        <strong style={{ color:C.purple }}>Rs. {Number(loanLimit).toLocaleString("en-IN")}</strong>.
        All documents are encrypted and handled securely per RBI guidelines.
      </div>
      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(180px,1fr))", gap:12 }}>
        {[
          { key:"aadhaar", label:"Aadhaar Card",           icon:"🪪", required:true  },
          { key:"pan",     label:"PAN Card",               icon:"💳", required:true  },
          { key:"bank",    label:"Bank Statement (3M)",    icon:"🏦", required:true  },
          { key:"gst",     label:"GST Certificate",        icon:"📄", required:false },
        ].map(doc => (
          <div key={doc.key} style={{ padding:14, borderRadius:12, textAlign:"center",
            border:`1.5px dashed ${files[doc.key]?C.green:C.border}`,
            background:files[doc.key]?"rgba(34,197,94,0.04)":"#FAFAFA",
            position:"relative", cursor:"pointer" }}>
            <label htmlFor={`file-${doc.key}`} style={{ cursor:"pointer", display:"block" }}>
              <div style={{ fontSize:22, marginBottom:5 }}>{doc.icon}</div>
              <div style={{ fontSize:12, fontWeight:700, color:C.text1 }}>{doc.label}</div>
              <div style={{ fontSize:11, color:files[doc.key]?C.green:C.muted, marginTop:3 }}>
                {files[doc.key] ? files[doc.key].name : `${doc.required?"Required":"Optional"} · PDF/JPG`}
              </div>
            </label>
            <input id={`file-${doc.key}`} type="file" accept=".pdf,.jpg,.jpeg,.png"
              onChange={e => { const f=e.target.files?.[0]; if(f) setFiles(p=>({...p,[doc.key]:f})); }}
              style={{ position:"absolute", opacity:0, inset:0, cursor:"pointer" }} />
          </div>
        ))}
      </div>
      <div style={{ ...card({padding:18}) }}>
        <div style={{ fontSize:13, fontWeight:700, color:C.text1, marginBottom:14 }}>Bank & Contact</div>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(180px,1fr))", gap:12 }}>
          <div>
            <label style={{ fontSize:12, fontWeight:600, color:C.text2, marginBottom:5, display:"block" }}>
              Account Number <span style={{ color:C.red }}>*</span>
            </label>
            <input value={bank} onChange={e=>setBank(e.target.value)} placeholder="XXXX XXXX XXXX"
              onFocus={()=>setFocus(p=>({...p,bank:true}))} onBlur={()=>setFocus(p=>({...p,bank:false}))}
              style={inp("bank")} />
          </div>
          <div>
            <label style={{ fontSize:12, fontWeight:600, color:C.text2, marginBottom:5, display:"block" }}>
              IFSC Code <span style={{ color:C.red }}>*</span>
            </label>
            <input value={ifsc} onChange={e=>setIfsc(e.target.value)} placeholder="HDFC0001234"
              onFocus={()=>setFocus(p=>({...p,ifsc:true}))} onBlur={()=>setFocus(p=>({...p,ifsc:false}))}
              style={inp("ifsc")} />
          </div>
          <div>
            <label style={{ fontSize:12, fontWeight:600, color:C.text2, marginBottom:5, display:"block" }}>
              WhatsApp <span style={{ color:C.red }}>*</span>
            </label>
            <input value={phone} onChange={e=>setPhone(e.target.value)} placeholder="+91 9876543210"
              onFocus={()=>setFocus(p=>({...p,phone:true}))} onBlur={()=>setFocus(p=>({...p,phone:false}))}
              style={inp("phone")} />
          </div>
        </div>
      </div>
      <button onClick={async ()=>{
        if (!allRequired) return;
        setLoadingSubmit(true);
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
          addNotification({
            title: "Application submitted",
            message: `Your application ${application.id} is now pending admin approval.`,
            type: "pending",
          });
          setDone(true);
          onSubmitted?.(application);
        } catch (error) {
          alert(error?.message || "Unable to submit application right now.");
        } finally {
          setLoadingSubmit(false);
        }
      }} disabled={!allRequired || loadingSubmit}
        style={{ width:"100%", padding:14, borderRadius:12, fontSize:15, fontWeight:800,
          color:"#fff", background:allRequired && !loadingSubmit?"linear-gradient(135deg,#6F2DBD,#8B5CF6)":"#9CA3AF",
          border:"none", cursor:allRequired && !loadingSubmit?"pointer":"not-allowed",
          display:"flex", alignItems:"center", justifyContent:"center", gap:10,
          boxShadow:allRequired && !loadingSubmit?"0 4px 18px rgba(111,45,189,0.3)":"none" }}>
        <Upload style={{ width:18, height:18 }} />
        {loadingSubmit ? "Submitting..." : "Submit Loan Application"}
      </button>
    </div>
  );
}

export default function SellerLoanGuide() {
  const { selectedSeller, sellerLanguage } = useApp();
  const seller  = selectedSeller || SELLER_PROFILES[0];
  const metrics = seller.metrics;
  const health  = computeHealthScore(metrics);
  const langObj = SUPPORTED_LANGUAGES.find(l => l.value === sellerLanguage) || SUPPORTED_LANGUAGES[0];
  const rc      = RISK_COLOR[seller.risk_category] || C.orange;

  // Client-side estimate
  const salesCap = Math.min(metrics.sales_velocity_6m * 0.5, 100000);
  const mult     = { Low:1.0, Moderate:0.55, High:0.20 }[seller.risk_category] || 0.55;
  const estLimit = Math.round((salesCap * mult * (metrics.prior_loan_default ? 0.3 : 1)) / 5000) * 5000;

  // Live evaluation state
  const [loading,   setLoading]   = useState(false);
  const [result,    setResult]    = useState(null);
  const [error,     setError]     = useState(null);
  const [showApply, setShowApply] = useState(false);

  const ELIGIBILITY = [
    { label:"Sales Velocity",   value:`Rs. ${Number(metrics.sales_velocity_6m).toLocaleString("en-IN")}`, good:metrics.sales_velocity_6m >= 30000, icon:IndianRupee },
    { label:"Customer Rating",  value:`${metrics.avg_customer_rating} / 5.0`,         good:metrics.avg_customer_rating >= 3.5,  icon:Star        },
    { label:"Dispatch SLA",     value:`${metrics.dispatch_sla_compliance}%`,           good:metrics.dispatch_sla_compliance>=80, icon:Truck       },
    { label:"RTO Rate",         value:`${metrics.rto_rate}%`,                          good:metrics.rto_rate <= 15,              icon:TrendingUp  },
    { label:"Account Age",      value:`${metrics.account_age_months} months`,          good:metrics.account_age_months >= 6,     icon:Clock       },
    { label:"Prior Default",    value:metrics.prior_loan_default?"Has defaulted":"None", good:!metrics.prior_loan_default,        icon:ShieldCheck },
  ];

  async function runEvaluation() {
    setError(null); setLoading(true); setResult(null);
    try {
      const intKeys = ["prior_loan_default","account_age_months","total_orders_6m","catalog_size"];
      const seller_data = {};
      Object.entries(metrics).forEach(([k,v]) => {
        seller_data[k] = intKeys.includes(k) ? parseInt(v,10)||0 : parseFloat(v)||0;
      });
      const res = await evaluateLoan({ seller_id:seller.id, language:sellerLanguage,
        phone_number:seller.phone, seller_data });
      setResult(res);
    } catch (err) {
      setError(err?.message || "Evaluation failed. Please check backend connectivity.");
    } finally { setLoading(false); }
  }

  const dec = result?.decision;
  const ok  = dec?.decision_status === "Approved";

  return (
    <div style={{ maxWidth:1040, margin:"0 auto" }}>
      <style>{`.guide-grid{display:grid;grid-template-columns:3fr 2fr;gap:22px;align-items:start;}
        @media(max-width:860px){.guide-grid{grid-template-columns:1fr;}}`}</style>

      <AnimatePresence>
        {loading && <EvaluationProcessor isVisible={loading} sellerId={seller.id} estimatedMs={11000}/>}
      </AnimatePresence>

      {/* Hero banner */}
      <motion.div {...fu(0)} style={{ ...card({padding:0,overflow:"hidden",marginBottom:22}) }}>
        <div style={{ background:"linear-gradient(135deg,#6F2DBD,#8B5CF6)", padding:"24px 28px" }}>
          <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:12 }}>
            <div style={{ width:44, height:44, borderRadius:12,
              background:"rgba(255,255,255,0.18)", display:"flex", alignItems:"center", justifyContent:"center" }}>
              <IndianRupee style={{ width:22, height:22, color:"#fff" }}/>
            </div>
            <div>
              <div style={{ fontSize:18, fontWeight:900, color:"#fff" }}>Working Capital Loan � {seller.name}</div>
              <div style={{ fontSize:12, color:"rgba(255,255,255,0.7)" }}>
                {seller.business} � {seller.id} � Response in {langObj.flag} {langObj.native}
              </div>
            </div>
            <div style={{ marginLeft:"auto", padding:"5px 14px", borderRadius:20,
              background:"rgba(255,255,255,0.18)", fontSize:12, fontWeight:700, color:"#fff" }}>
              {seller.risk_category === "High" ? "Eligibility Pending"
                : `Pre-Eligible: Rs. ${estLimit.toLocaleString("en-IN")}`}
            </div>
          </div>
          <p style={{ fontSize:13, color:"rgba(255,255,255,0.82)", lineHeight:1.7, margin:0, maxWidth:640 }}>
            {seller.summary}
          </p>
        </div>
        <div style={{ display:"flex", flexWrap:"wrap" }}>
          {[["No CIBIL Required","#22C55E"],["AI Decision in 2 mins","#6F2DBD"],
            ["Up to Rs. 1 Lakh","#F59E0B"],["8 Indian Languages","#8B5CF6"]].map(([t,c],i)=>(
            <div key={t} style={{ flex:"1 1 140px", padding:"11px 18px",
              borderTop:"1px solid #E9E5F5", borderRight:i<3?"1px solid #E9E5F5":"none",
              display:"flex", alignItems:"center", gap:7 }}>
              <div style={{ width:7, height:7, borderRadius:"50%", background:c }}/>
              <span style={{ fontSize:12, fontWeight:600, color:C.text1 }}>{t}</span>
            </div>
          ))}
        </div>
      </motion.div>

      <div className="guide-grid">
        {/* Left */}
        <div style={{ display:"flex", flexDirection:"column", gap:20 }}>

          {/* Live eligibility */}
          <motion.div {...fu(0.06)} style={{ ...card({padding:22}) }}>
            <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:14 }}>
              <Sparkles style={{ width:16, height:16, color:C.purple }}/>
              <span style={{ fontSize:15, fontWeight:700, color:C.text1 }}>Your Eligibility Snapshot</span>
              <span style={{ marginLeft:"auto", fontSize:11, fontWeight:700, padding:"3px 10px",
                borderRadius:20, color:rc, background:`${rc}12`, border:`1px solid ${rc}30` }}>
                {seller.risk_category} Risk � Score {health}
              </span>
            </div>
            <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(155px,1fr))", gap:10 }}>
              {ELIGIBILITY.map((e,i)=>{
                const Icon = e.icon;
                return (
                  <motion.div key={e.label} initial={{opacity:0,y:8}} animate={{opacity:1,y:0}}
                    transition={{delay:0.08+i*0.05}}
                    style={{ padding:"12px 14px", borderRadius:12,
                      background:e.good?"rgba(34,197,94,0.04)":"rgba(239,68,68,0.04)",
                      border:`1px solid ${e.good?"rgba(34,197,94,0.2)":"rgba(239,68,68,0.2)"}` }}>
                    <div style={{ display:"flex", alignItems:"center", gap:6, marginBottom:5 }}>
                      <Icon style={{ width:13, height:13, color:e.good?C.green:C.red }}/>
                      <span style={{ fontSize:11, color:C.muted }}>{e.label}</span>
                    </div>
                    <div style={{ fontSize:15, fontWeight:800, color:e.good?C.green:C.red }}>{e.value}</div>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>

          {/* Result section � shown after evaluation */}
          <AnimatePresence>
            {result && (
              <motion.div initial={{opacity:0,y:20}} animate={{opacity:1,y:0}} transition={{duration:0.5}}>

                {/* Fallback warning */}
                {result.is_fallback && (
                  <motion.div initial={{opacity:0}} animate={{opacity:1}}
                    style={{ display:"flex", gap:10, padding:"12px 16px", borderRadius:12,
                      background:"rgba(245,158,11,0.08)", border:"1.5px solid rgba(245,158,11,0.35)",
                      marginBottom:16 }}>
                    <AlertTriangle style={{ width:18, height:18, color:C.orange, flexShrink:0 }}/>
                    <div>
                      <div style={{ fontSize:13, fontWeight:700, color:"#92400E" }}>
                        AI Engine Temporarily Unavailable � Fallback Mode
                      </div>
                      <div style={{ fontSize:12, color:"#A16207", marginTop:2, lineHeight:1.5 }}>
                        The Groq AI service was unreachable during this evaluation. The decision
                        (risk score, loan limit) is accurate from the ML model. The explanation
                        below is a system-generated summary, not a full AI response.
                        Please retry for a detailed multilingual explanation.
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* Decision hero */}
                <div style={{ ...card({padding:0,overflow:"hidden",marginBottom:16}) }}>
                  <div style={{ height:4, background:ok
                    ?"linear-gradient(90deg,#22C55E,#16A34A)"
                    :"linear-gradient(90deg,#EF4444,#DC2626)" }}/>
                  <div style={{ padding:"20px 24px", display:"flex", gap:18, flexWrap:"wrap", alignItems:"flex-start" }}>
                    <div style={{ display:"flex", alignItems:"center", gap:12, flex:1, minWidth:200 }}>
                      <div style={{ width:48, height:48, borderRadius:14,
                        background:`${ok?C.green:C.red}12`,
                        display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                        {ok ? <CheckCircle style={{ width:24, height:24, color:C.green }}/>
                             : <AlertCircle style={{ width:24, height:24, color:C.red }}/>}
                      </div>
                      <div>
                        <div style={{ fontSize:22, fontWeight:900, color:ok?C.green:C.red }}>
                          {ok ? "Loan Approved" : "Application Declined"}
                        </div>
                        <div style={{ fontSize:12, color:C.muted }}>
                          {langObj.flag} {langObj.label} � {result.execution_time_ms}ms
                        </div>
                      </div>
                    </div>
                    <div style={{ display:"flex", gap:10, flexWrap:"wrap" }}>
                      {[
                        {l:"Loan Limit", v:`Rs. ${dec?.loan_limit?.toLocaleString("en-IN")}`, c:C.purple},
                        {l:"Risk Score", v:`${dec?.risk_score}/100`, c:RISK_COLOR[dec?.risk_class]||C.orange},
                        {l:"Risk Class", v:dec?.risk_class, c:RISK_COLOR[dec?.risk_class]||C.orange},
                        {l:"Review",     v:dec?.requires_human_review?"Required":"Auto",
                          c:dec?.requires_human_review?C.orange:C.green},
                      ].map(k=>(
                        <div key={k.l} style={{ padding:"9px 14px", borderRadius:11,
                          background:C.bg, border:`1px solid ${C.border}`, textAlign:"center", minWidth:80 }}>
                          <div style={{ fontSize:10, color:C.muted, marginBottom:3 }}>{k.l}</div>
                          <div style={{ fontSize:13, fontWeight:800, color:k.c }}>{k.v}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Three result panels */}
                <div style={{ display:"grid", gap:16, gridTemplateColumns:"repeat(auto-fit,minmax(280px,1fr))" }}>

                  {/* SHAP Factors */}
                  <div style={{ ...card({padding:20}) }}>
                    <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:14 }}>
                      <Brain style={{ width:16, height:16, color:C.purple }}/>
                      <span style={{ fontSize:14, fontWeight:700, color:C.text1 }}>Why This Decision</span>
                    </div>
                    <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
                      {(result.top_reasoning_features||[]).map((f,i)=>(
                        <FactorCard key={i} feature={f} index={i}/>
                      ))}
                    </div>
                  </div>

                  {/* AI explanation */}
                  <div style={{ ...card({padding:20}) }}>
                    <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:12 }}>
                      <MessageCircle style={{ width:16, height:16, color:C.purple }}/>
                      <span style={{ fontSize:14, fontWeight:700, color:C.text1 }}>AI Explanation</span>
                      <span style={{ marginLeft:"auto", fontSize:11, fontWeight:700, padding:"2px 8px",
                        borderRadius:20, color:C.purple, background:"rgba(111,45,189,0.08)",
                        border:"1px solid #DDD0F5" }}>
                        {langObj.flag} {langObj.label}
                      </span>
                    </div>
                    <p style={{ fontSize:14, color:C.text1, lineHeight:1.85, margin:"0 0 14px" }}>
                      {result.seller_message}
                    </p>
                    <div style={{ height:1, background:C.border, margin:"12px 0" }}/>
                    <div style={{ fontSize:11, fontWeight:700, color:C.muted, textTransform:"uppercase",
                      letterSpacing:"0.06em", marginBottom:8 }}>Auditor Trail</div>
                    <p style={{ fontSize:11, color:C.text2, lineHeight:1.7, fontFamily:"monospace", margin:0 }}>
                      {result.auditor_trail}
                    </p>
                  </div>

                  {/* Improvement plan */}
                  <div style={{ ...card({padding:20}) }}>
                    <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:14 }}>
                      <TrendingUp style={{ width:16, height:16, color:C.orange }}/>
                      <span style={{ fontSize:14, fontWeight:700, color:C.text1 }}>Improvement Plan</span>
                    </div>
                    {(result.improvement_plan||[]).map((item,i)=>(
                      <div key={i} style={{ display:"flex", gap:10, alignItems:"flex-start", marginBottom:10 }}>
                        <div style={{ width:24, height:24, borderRadius:7, flexShrink:0,
                          background:"rgba(245,158,11,0.12)", border:"1px solid rgba(245,158,11,0.3)",
                          display:"flex", alignItems:"center", justifyContent:"center",
                          fontSize:11, fontWeight:800, color:C.orange }}>{i+1}</div>
                        <p style={{ fontSize:13, color:C.text1, lineHeight:1.65, margin:0, paddingTop:3 }}>{item}</p>
                      </div>
                    ))}
                    <Link to="/seller/coach" style={{ display:"flex", alignItems:"center", gap:8,
                      padding:"10px 14px", borderRadius:12, fontSize:13, fontWeight:700,
                      color:C.purple, background:"#F3ECFF", border:"1px solid #DDD0F5",
                      textDecoration:"none", marginTop:6 }}>
                      <MessageCircle style={{ width:14, height:14 }}/> Ask AI Coach
                      <ArrowRight style={{ width:13, height:13, marginLeft:"auto" }}/>
                    </Link>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* FAQ */}
          <motion.div {...fu(result?0.02:0.14)} style={{ ...card({padding:22}) }}>
            <div style={{ fontSize:15, fontWeight:700, color:C.text1, marginBottom:14 }}>
              Frequently Asked Questions
            </div>
            <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
              {[
                {q:"Do I need a CIBIL score?", a:"No. We use your Meesho business performance � sales, ratings, dispatch SLA, and RTO � as your credit signal. No traditional credit check required."},
                {q:"How long does evaluation take?", a:"Under 2 minutes. Our pipeline runs XGBoost risk scoring, SHAP explainability, a rules engine, and Groq AI reasoning automatically."},
                {q:"What if I get rejected?", a:"You receive a full explanation in your language plus a personalised 3�5 step improvement plan showing exactly what to improve and by how much."},
                {q:"Can I apply in Hindi or Tamil?", a:"Yes. We support 8 Indian languages. Select your language in the top navigation bar before applying."},
                {q:"What is the maximum loan amount?", a:"Up to Rs. 1,00,000 based on your Meesho performance. Final amount is determined by our AI model and rules engine."},
              ].map(f=><FaqItem key={f.q} q={f.q} a={f.a}/>)}
            </div>
          </motion.div>
        </div>

        {/* Right sticky */}
        <div style={{ position:"sticky", top:80, display:"flex", flexDirection:"column", gap:14 }}>

          {/* Run evaluation CTA */}
          <motion.div {...fu(0.08)} style={{ ...card({padding:22}) }}>
            <div style={{ fontSize:13, fontWeight:700, color:C.text1, marginBottom:8 }}>
              Run Full AI Evaluation
            </div>
            <p style={{ fontSize:13, color:C.text2, lineHeight:1.65, marginBottom:16 }}>
              Get a complete risk assessment with detailed AI explanation in{" "}
              <strong style={{ color:C.purple }}>{langObj.native}</strong>.
              Includes SHAP factor analysis and personalised improvement plan.
            </p>
            {error && (
              <div style={{ display:"flex", gap:8, padding:"10px 12px", borderRadius:10,
                background:"rgba(239,68,68,0.06)", border:"1px solid rgba(239,68,68,0.2)", marginBottom:12 }}>
                <AlertCircle style={{ width:14, height:14, color:C.red, flexShrink:0, marginTop:1 }}/>
                <p style={{ fontSize:12, color:"#DC2626", margin:0 }}>{error}</p>
              </div>
            )}
            <button onClick={runEvaluation} disabled={loading}
              style={{ width:"100%", padding:"14px", borderRadius:12, fontSize:15, fontWeight:800,
                color:"#fff", background:loading?"#9CA3AF":"linear-gradient(135deg,#6F2DBD,#8B5CF6)",
                border:"none", cursor:loading?"not-allowed":"pointer",
                display:"flex", alignItems:"center", justifyContent:"center", gap:10,
                boxShadow:loading?"none":"0 4px 20px rgba(111,45,189,0.3)" }}>
              {loading
                ?<><Loader2 style={{ width:18, height:18, animation:"spin 1s linear infinite" }}/>Evaluating...</>
                :<><Sparkles style={{ width:18, height:18 }}/>Run AI Evaluation</>}
            </button>
            {result && (
              <button onClick={()=>{setResult(null);setError(null);}} style={{
                marginTop:8, width:"100%", padding:"9px", borderRadius:10, fontSize:13,
                fontWeight:600, color:C.muted, background:"transparent",
                border:`1px solid ${C.border}`, cursor:"pointer",
                display:"flex", alignItems:"center", justifyContent:"center", gap:6 }}>
                <RotateCcw style={{ width:13, height:13 }}/> Re-evaluate
              </button>
            )}
          </motion.div>

          {/* Apply Now � only when approved */}
          {result && ok && (
            <motion.div initial={{opacity:0,y:10}} animate={{opacity:1,y:0}}>
              <button onClick={()=>setShowApply(true)}
                style={{ width:"100%", padding:"13px", borderRadius:12, fontSize:14, fontWeight:800,
                  color:"#fff", background:"linear-gradient(135deg,#22C55E,#16A34A)",
                  border:"none", cursor:"pointer",
                  display:"flex", alignItems:"center", justifyContent:"center", gap:9,
                  boxShadow:"0 4px 18px rgba(34,197,94,0.3)" }}>
                <Upload style={{ width:17, height:17 }}/>
                Apply Now � Submit Documents
              </button>
            </motion.div>
          )}

          {/* Talk to AI Coach */}
          <motion.div {...fu(0.14)}>
            <Link to="/seller/coach" style={{ display:"flex", alignItems:"center", gap:10,
              padding:"13px 16px", borderRadius:12, fontSize:14, fontWeight:700,
              color:C.purple, background:"#F3ECFF", border:"1.5px solid #DDD0F5", textDecoration:"none" }}>
              <MessageCircle style={{ width:17, height:17 }}/>
              Talk to AI Financial Coach
              <ArrowRight style={{ width:14, height:14, marginLeft:"auto" }}/>
            </Link>
          </motion.div>

          {/* Estimate card */}
          {!result && (
            <motion.div {...fu(0.12)} style={{ ...card({padding:20,
              background:"linear-gradient(135deg,#F3ECFF,#EDE4FF)"})}}>
              <div style={{ fontSize:13, fontWeight:700, color:C.purple, marginBottom:10 }}>
                Pre-Approval Estimate
              </div>
              <div style={{ fontSize:34, fontWeight:900, color:C.purple, marginBottom:4 }}>
                {seller.risk_category==="High" ? "Pending" : `Rs. ${estLimit.toLocaleString("en-IN")}`}
              </div>
              <div style={{ fontSize:11, color:C.muted, marginBottom:14 }}>
                {seller.risk_category==="High" ? "Improve metrics to unlock eligibility"
                  : "Client-side estimate � run evaluation for exact limit"}
              </div>
              <div style={{ display:"flex", flexDirection:"column", gap:7 }}>
                {[["Risk Class", seller.risk_category, rc],
                  ["Health Score", `${health}/100`, rc],
                  ["Account Age", `${metrics.account_age_months} months`, C.purple]].map(([l,v,c])=>(
                  <div key={l} style={{ display:"flex", justifyContent:"space-between" }}>
                    <span style={{ fontSize:12, color:C.text2 }}>{l}</span>
                    <span style={{ fontSize:12, fontWeight:700, color:c }}>{v}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </div>
      </div>

      {/* Document upload modal */}
      <AnimatePresence>
        {showApply && (
          <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}
            style={{ position:"fixed", inset:0, background:"rgba(11,7,30,0.65)",
              backdropFilter:"blur(8px)", zIndex:200,
              display:"flex", alignItems:"center", justifyContent:"center", padding:20 }}>
            <motion.div initial={{scale:0.93,opacity:0}} animate={{scale:1,opacity:1}}
              exit={{scale:0.93,opacity:0}} transition={{duration:0.3}}
              style={{ background:"#fff", borderRadius:24, width:"100%", maxWidth:640,
                maxHeight:"90vh", overflow:"auto", padding:28,
                boxShadow:"0 24px 60px rgba(0,0,0,0.3)" }}>
              <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:20 }}>
                <FileText style={{ width:20, height:20, color:C.purple }}/>
                <div>
                  <div style={{ fontSize:17, fontWeight:800, color:C.text1 }}>Loan Application</div>
                  <div style={{ fontSize:12, color:C.muted }}>
                    {seller.name} � Rs. {dec?.loan_limit?.toLocaleString("en-IN")} approved
                  </div>
                </div>
                <button onClick={()=>setShowApply(false)}
                  style={{ marginLeft:"auto", width:32, height:32, borderRadius:9,
                    background:"#F8F4FF", border:"1px solid #E9E5F5", fontSize:18,
                    display:"flex", alignItems:"center", justifyContent:"center",
                    cursor:"pointer", color:C.muted }}>�</button>
              </div>
              <DocumentUpload seller={seller} loanLimit={dec?.loan_limit||0}
                onClose={()=>setShowApply(false)} onSubmitted={() => setShowApply(false)} />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <style>{`@keyframes spin{to{transform:rotate(360deg);}}`}</style>
    </div>
  );
}
