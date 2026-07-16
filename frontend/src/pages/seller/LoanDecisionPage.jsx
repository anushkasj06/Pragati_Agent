/**
 * LoanDecisionPage — Final loan decision display.
 * Uses result passed via router state (or mock for standalone view).
 * Two tabs: Seller View (friendly) + Auditor View (professional).
 */
import { useState, useEffect } from "react";
import { useLocation, useNavigate, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  CheckCircle, XCircle, Clock, TrendingUp, Shield,
  MessageCircle, ArrowRight, RotateCcw, Star, Sparkles,
  Brain, FileText, IndianRupee, AlertTriangle,
} from "lucide-react";
import { useAnimatedNumber } from "../../hooks/useAnimatedNumber";

const C = {
  purple:"#6F2DBD", p2:"#8B5CF6", orange:"#F59E0B", green:"#22C55E",
  red:"#EF4444", amber:"#F59E0B", text1:"#1A1A2E", text2:"#4B5563",
  muted:"#9CA3AF", border:"#E9E5F5", bg:"#F8F4FF", card:"#FFFFFF",
};
const card  = (x={}) => ({ background:C.card, border:`1px solid ${C.border}`, borderRadius:16, boxShadow:"0 2px 16px rgba(111,45,189,0.07)", ...x });
const fu    = (d=0) => ({ initial:{opacity:0,y:20}, animate:{opacity:1,y:0}, transition:{duration:0.45,delay:d,ease:[0.22,1,0.36,1]} });

const RISK_COLOR  = { Low:C.green, Moderate:C.amber, Medium:C.amber, High:C.red };
const STATUS_CFG  = {
  Approved: { color:C.green,  bg:"rgba(34,197,94,0.1)",  border:"rgba(34,197,94,0.3)",  icon:CheckCircle, headline:"Congratulations!", sub:"Your loan application has been approved." },
  Rejected: { color:C.red,    bg:"rgba(239,68,68,0.1)",  border:"rgba(239,68,68,0.3)",  icon:XCircle,     headline:"Application Declined", sub:"We couldn't approve your application this time." },
  Review:   { color:C.amber,  bg:"rgba(245,158,11,0.1)", border:"rgba(245,158,11,0.3)", icon:Clock,       headline:"Under Review",         sub:"Your application is being reviewed by our team." },
};

/* ── MOCK result for standalone demo ──────────────────────── */
const MOCK = {
  seller_id: "SELL_00199",
  decision: { risk_class:"Low", risk_score:88, loan_limit:75000, requires_human_review:false, decision_status:"Approved" },
  top_reasoning_features: [
    { feature:"Dispatch SLA Compliance", impact:"Positive", reason:"Orders are dispatched on time, improving trust."    },
    { feature:"Customer Rating",         impact:"Positive", reason:"Excellent customer ratings increased trust."        },
    { feature:"Sales Velocity",          impact:"Positive", reason:"Strong sales performance increased eligibility."    },
    { feature:"RTO Rate",                impact:"Negative", reason:"High return rate increased lending risk."           },
    { feature:"Sales Growth Rate",       impact:"Positive", reason:"Positive sales growth strengthened the profile."   },
  ],
  seller_message: "आपका लोन आवेदन स्वीकृत हो गया है और आपको ₹75,000 की ऋण सीमा मिली है। आपकी उत्कृष्ट डिस्पैच SLA अनुपालन और ग्राहक रेटिंग ने आपकी पात्रता बढ़ाई है।",
  auditor_trail: "Seller SELL_00199 evaluated with Risk Class Low and risk score 88. Strong dispatch SLA compliance (97%) and customer rating (4.8) drove approval. RTO rate of 6.2% noted as minor risk factor. Rules engine approved loan at ₹75,000 — no young account cap applied (24 months). Human review not required.",
  improvement_plan: ["Reduce RTO rate from 6.2% to below 5% for a stronger profile.", "Expand catalog from 220 to 300+ products to increase loan eligibility.", "Maintain dispatch SLA above 95% consistently over next 3 months."],
  language: "Hindi",
  execution_time_ms: 771,
};

/* ── CircularGauge ────────────────────────────────────────── */
function CircularGauge({ value, max=100, label, size=100, color, delay=0 }) {
  const animated = useAnimatedNumber(value, 1400, delay);
  const r   = (size/2) - 8;
  const circ = 2 * Math.PI * r;
  const pct  = Math.min(1, animated / max);
  return (
    <div style={{ textAlign:"center" }}>
      <div style={{ position:"relative", width:size, height:size, margin:"0 auto" }}>
        <svg width={size} height={size} style={{ transform:"rotate(-90deg)" }}>
          <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="#F0ECF9" strokeWidth={8} />
          <motion.circle cx={size/2} cy={size/2} r={r} fill="none"
            stroke={color} strokeWidth={8} strokeLinecap="round"
            strokeDasharray={circ}
            initial={{ strokeDashoffset: circ }}
            animate={{ strokeDashoffset: circ * (1 - pct) }}
            transition={{ duration:1.4, delay: delay/1000, ease:"easeOut" }} />
        </svg>
        <div style={{ position:"absolute", inset:0, display:"flex", alignItems:"center",
          justifyContent:"center", fontSize: size > 90 ? 20 : 14, fontWeight:900, color }}>
          {animated}
        </div>
      </div>
      <div style={{ fontSize:12, color:C.muted, marginTop:6 }}>{label}</div>
    </div>
  );
}

/* ── Hero status card ─────────────────────────────────────── */
function HeroCard({ result }) {
  const { decision, execution_time_ms } = result;
  const cfg  = STATUS_CFG[decision.decision_status] || STATUS_CFG.Review;
  const Icon = cfg.icon;
  const rc   = RISK_COLOR[decision.risk_class] || C.amber;
  const loanAnimated = useAnimatedNumber(decision.loan_limit, 1600, 300);

  const illustrations = {
    Approved: (
      <div style={{ position:"relative", width:120, height:120, flexShrink:0 }}>
        <motion.div animate={{ scale:[1,1.08,1] }} transition={{ duration:3, repeat:Infinity, ease:"easeInOut" }}
          style={{ width:120, height:120, borderRadius:28, background:"linear-gradient(135deg,#22C55E18,#22C55E06)",
            border:"2px solid rgba(34,197,94,0.25)", display:"flex", alignItems:"center", justifyContent:"center" }}>
          <motion.div initial={{ scale:0 }} animate={{ scale:1 }} transition={{ type:"spring", stiffness:200, delay:0.3 }}>
            <CheckCircle style={{ width:56, height:56, color:C.green }} />
          </motion.div>
        </motion.div>
        {["top-1 right-1","bottom-1 left-2","top-1/2 -right-2"].map((pos,i) => (
          <motion.div key={i} style={{ position:"absolute", width:14, height:14, borderRadius:"50%",
            background: i===0?"#22C55E":i===1?"#4ADE80":"#86EFAC" }}
            className={pos}
            animate={{ y:[-3,3,-3], opacity:[0.7,1,0.7] }}
            transition={{ duration:2+i*0.4, repeat:Infinity, delay:i*0.3 }} />
        ))}
      </div>
    ),
    Rejected: (
      <div style={{ width:120, height:120, borderRadius:28, background:"rgba(239,68,68,0.08)",
        border:"2px solid rgba(239,68,68,0.2)", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
        <XCircle style={{ width:56, height:56, color:C.red }} />
      </div>
    ),
    Review: (
      <div style={{ width:120, height:120, borderRadius:28, background:"rgba(245,158,11,0.08)",
        border:"2px solid rgba(245,158,11,0.2)", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
        <motion.div animate={{ rotate:[0,10,-10,0] }} transition={{ duration:2, repeat:Infinity }}>
          <Clock style={{ width:56, height:56, color:C.amber }} />
        </motion.div>
      </div>
    ),
  };

  return (
    <motion.div {...fu(0)} style={{ ...card({padding:0, overflow:"hidden"}) }}>
      <div style={{ height:4, background: `linear-gradient(90deg,${cfg.color},${cfg.color}60)` }} />
      <div style={{ padding:"28px 32px", display:"flex", gap:28, alignItems:"flex-start", flexWrap:"wrap" }}>
        {illustrations[decision.decision_status]}
        <div style={{ flex:1, minWidth:200 }}>
          <div style={{ fontSize:26, fontWeight:900, color:cfg.color, letterSpacing:"-0.02em", marginBottom:4 }}>
            {cfg.headline}
          </div>
          <div style={{ fontSize:15, color:C.text2, marginBottom:20 }}>{cfg.sub}</div>
          {decision.decision_status === "Approved" && (
            <div style={{ marginBottom:16 }}>
              <div style={{ fontSize:11, color:C.muted, fontWeight:600, textTransform:"uppercase",
                letterSpacing:"0.07em", marginBottom:4 }}>Approved Loan Limit</div>
              <div style={{ fontSize:40, fontWeight:900, color:C.purple, letterSpacing:"-0.03em", lineHeight:1 }}>
                ₹{loanAnimated.toLocaleString("en-IN")}
              </div>
            </div>
          )}
          <div style={{ display:"flex", flexWrap:"wrap", gap:10 }}>
            {[
              { l:"Risk Class",  v:decision.risk_class,              c:rc       },
              { l:"Risk Score",  v:`${decision.risk_score} / 100`,   c:rc       },
              { l:"Review",      v:decision.requires_human_review?"Required":"Auto", c:decision.requires_human_review?C.amber:C.green },
              { l:"Processed",   v:`${execution_time_ms}ms`,         c:C.muted  },
            ].map(k => (
              <div key={k.l} style={{ padding:"8px 14px", borderRadius:10, background:C.bg,
                border:`1px solid ${C.border}`, textAlign:"center", minWidth:80 }}>
                <div style={{ fontSize:10, color:C.muted, marginBottom:3 }}>{k.l}</div>
                <div style={{ fontSize:13, fontWeight:800, color:k.c }}>{k.v}</div>
              </div>
            ))}
          </div>
        </div>
        {/* Gauges */}
        <div style={{ display:"flex", gap:24, flexShrink:0, flexWrap:"wrap" }}>
          <CircularGauge value={decision.risk_score} max={100} label="Risk Score" color={rc} size={96} delay={400} />
          {decision.loan_limit > 0 && (
            <CircularGauge value={Math.round((decision.loan_limit/100000)*100)} max={100}
              label="Limit %" color={C.purple} size={96} delay={600} />
          )}
        </div>
      </div>
    </motion.div>
  );
}

/* ── Seller View ──────────────────────────────────────────── */
function SellerView({ result }) {
  const { seller_message, improvement_plan, top_reasoning_features, decision } = result;
  const positives = (top_reasoning_features||[]).filter(f => f.impact?.toLowerCase() === "positive");
  const RISK_C  = RISK_COLOR[decision.risk_class] || C.amber;
  const score   = useAnimatedNumber(decision.risk_score, 1200, 200);

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:18 }}>

      {/* Seller message */}
      <motion.div {...fu(0.05)} style={{ ...card({padding:22}) }}>
        <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:14 }}>
          <div style={{ width:34, height:34, borderRadius:10, background:"rgba(111,45,189,0.1)",
            display:"flex", alignItems:"center", justifyContent:"center" }}>
            <MessageCircle style={{ width:17, height:17, color:C.purple }} />
          </div>
          <span style={{ fontSize:15, fontWeight:700, color:C.text1 }}>Your Decision Message</span>
          {result.language !== "English" && (
            <span style={{ marginLeft:"auto", fontSize:11, fontWeight:700, padding:"2px 8px",
              borderRadius:20, color:C.purple, background:"rgba(111,45,189,0.08)",
              border:"1px solid #DDD0F5" }}>{result.language}</span>
          )}
        </div>
        <p style={{ fontSize:15, color:C.text1, lineHeight:1.85, margin:0 }}>{seller_message}</p>
      </motion.div>

      {/* Business health */}
      <motion.div {...fu(0.09)} style={{ ...card({padding:22}) }}>
        <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:16 }}>
          <Sparkles style={{ width:17, height:17, color:C.orange }} />
          <span style={{ fontSize:15, fontWeight:700, color:C.text1 }}>Business Health</span>
        </div>
        <div style={{ display:"flex", alignItems:"center", gap:24, flexWrap:"wrap" }}>
          <CircularGauge value={decision.risk_score} max={100} label="Overall Score" color={RISK_C} size={110} />
          <div style={{ flex:1, minWidth:200 }}>
            <div style={{ fontSize:13, color:C.text2, lineHeight:1.7, marginBottom:12 }}>
              Your business health score of <strong style={{ color:RISK_C }}>{score}/100</strong> places
              you in the <strong style={{ color:RISK_C }}>{decision.risk_class} Risk</strong> category.
              {decision.risk_class === "Low" && " This is excellent and qualifies you for a higher loan limit."}
              {decision.risk_class === "Moderate" && " With targeted improvements, you can reach Low Risk status."}
              {decision.risk_class === "High" && " Focus on the improvement plan below to strengthen your profile."}
            </div>
            <div style={{ height:8, background:"#F0ECF9", borderRadius:4, overflow:"hidden" }}>
              <motion.div initial={{ width:0 }} animate={{ width:`${decision.risk_score}%` }}
                transition={{ duration:1.4, delay:0.3, ease:"easeOut" }}
                style={{ height:"100%", background:`linear-gradient(90deg,${C.purple},${RISK_C})`, borderRadius:4 }} />
            </div>
            <div style={{ display:"flex", justifyContent:"space-between", marginTop:4 }}>
              <span style={{ fontSize:10, color:C.muted }}>0</span>
              <span style={{ fontSize:10, color:C.muted }}>100</span>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Top positive factors */}
      {positives.length > 0 && (
        <motion.div {...fu(0.13)} style={{ ...card({padding:22}) }}>
          <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:14 }}>
            <Star style={{ width:17, height:17, color:C.orange }} />
            <span style={{ fontSize:15, fontWeight:700, color:C.text1 }}>Your Strengths</span>
          </div>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(200px,1fr))", gap:10 }}>
            {positives.map((f,i) => (
              <div key={i} style={{ padding:"12px 14px", borderRadius:12,
                background:"rgba(34,197,94,0.05)", border:"1px solid rgba(34,197,94,0.2)" }}>
                <div style={{ display:"flex", alignItems:"center", gap:6, marginBottom:5 }}>
                  <CheckCircle style={{ width:13, height:13, color:C.green, flexShrink:0 }} />
                  <span style={{ fontSize:12, fontWeight:700, color:C.text1 }}>{f.feature}</span>
                </div>
                <p style={{ fontSize:12, color:C.text2, margin:0, lineHeight:1.5 }}>{f.reason}</p>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Improvement plan */}
      {(improvement_plan||[]).length > 0 && (
        <motion.div {...fu(0.17)} style={{ ...card({padding:22}) }}>
          <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:14 }}>
            <TrendingUp style={{ width:17, height:17, color:C.orange }} />
            <span style={{ fontSize:15, fontWeight:700, color:C.text1 }}>Your Improvement Plan</span>
            <span style={{ marginLeft:"auto", fontSize:11, color:C.muted }}>
              Follow these to improve your next evaluation
            </span>
          </div>
          <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
            {improvement_plan.map((item, i) => (
              <motion.div key={i} initial={{ opacity:0, x:-10 }} animate={{ opacity:1, x:0 }}
                transition={{ delay: 0.18 + i * 0.07 }}
                style={{ display:"flex", gap:14, alignItems:"flex-start", padding:"14px 16px",
                  borderRadius:12, background:C.bg, border:`1px solid ${C.border}` }}>
                <div style={{ width:30, height:30, borderRadius:10, flexShrink:0,
                  background:"linear-gradient(135deg,#6F2DBD18,#8B5CF610)",
                  border:"1.5px solid rgba(111,45,189,0.2)",
                  display:"flex", alignItems:"center", justifyContent:"center",
                  fontSize:13, fontWeight:900, color:C.purple }}>{i+1}</div>
                <p style={{ fontSize:14, color:C.text1, margin:0, lineHeight:1.65, paddingTop:4 }}>{item}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Future suggestions */}
      <motion.div {...fu(0.21)} style={{ ...card({padding:22, background:"linear-gradient(135deg,#F3ECFF,#EDE4FF)"}) }}>
        <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:12 }}>
          <Brain style={{ width:17, height:17, color:C.purple }} />
          <span style={{ fontSize:15, fontWeight:700, color:C.purple }}>AI Future Suggestions</span>
        </div>
        <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
          {["Re-evaluate in 3 months after implementing the improvement plan.",
            "Chat with your AI Financial Coach to get personalised guidance.",
            "Track your business metrics weekly in the Business Insights section."].map((s,i) => (
            <div key={i} style={{ display:"flex", alignItems:"flex-start", gap:8 }}>
              <div style={{ width:5, height:5, borderRadius:"50%", background:C.purple, marginTop:7, flexShrink:0 }} />
              <span style={{ fontSize:13, color:C.text2 }}>{s}</span>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}

/* ── Auditor View ─────────────────────────────────────────── */
function AuditorView({ result }) {
  const { decision, auditor_trail, top_reasoning_features, execution_time_ms, seller_id } = result;
  const rc = RISK_COLOR[decision.risk_class] || C.amber;

  const rows = [
    { label:"Seller ID",         value:seller_id,                                       mono:true   },
    { label:"Decision Status",   value:decision.decision_status,                        color:decision.decision_status==="Approved"?C.green:C.red },
    { label:"Risk Class",        value:decision.risk_class,                             color:rc     },
    { label:"Risk Score",        value:`${decision.risk_score} / 100`,                  color:rc     },
    { label:"ML Loan Limit",     value:`₹${decision.loan_limit?.toLocaleString("en-IN")}`, color:C.purple },
    { label:"Final Loan Limit",  value:`₹${decision.loan_limit?.toLocaleString("en-IN")}`, color:C.purple },
    { label:"Human Review",      value:decision.requires_human_review ? "Required" : "Not Required", color:decision.requires_human_review?C.amber:C.green },
    { label:"Execution Time",    value:`${execution_time_ms}ms`,                        color:C.muted },
    { label:"Language",          value:result.language,                                 color:C.muted },
  ];

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:18 }}>

      {/* Decision table */}
      <motion.div {...fu(0.05)} style={{ ...card({padding:0, overflow:"hidden"}) }}>
        <div style={{ padding:"16px 22px", borderBottom:`1px solid ${C.border}` }}>
          <div style={{ display:"flex", alignItems:"center", gap:8 }}>
            <Shield style={{ width:17, height:17, color:C.purple }} />
            <span style={{ fontSize:15, fontWeight:700, color:C.text1 }}>Decision Summary</span>
            <span style={{ marginLeft:"auto", padding:"3px 10px", borderRadius:20, fontSize:11,
              fontWeight:700, color:C.muted, background:C.bg, border:`1px solid ${C.border}` }}>
              Internal
            </span>
          </div>
        </div>
        <table style={{ width:"100%", borderCollapse:"collapse" }}>
          <tbody>
            {rows.map((row, i) => (
              <tr key={row.label} style={{ borderBottom: i < rows.length-1 ? `1px solid ${C.border}` : "none",
                background: i % 2 === 0 ? "#fff" : "#FDFCFF" }}>
                <td style={{ padding:"11px 22px", fontSize:13, fontWeight:600, color:C.text2,
                  width:"40%", whiteSpace:"nowrap" }}>{row.label}</td>
                <td style={{ padding:"11px 22px", fontSize:13, fontWeight:700,
                  color: row.color || C.text1,
                  fontFamily: row.mono ? "monospace" : "inherit" }}>{row.value}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </motion.div>

      {/* Reasoning features */}
      <motion.div {...fu(0.09)} style={{ ...card({padding:22}) }}>
        <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:16 }}>
          <Brain style={{ width:17, height:17, color:C.purple }} />
          <span style={{ fontSize:15, fontWeight:700, color:C.text1 }}>SHAP Reasoning Features</span>
          <span style={{ marginLeft:"auto", fontSize:11, color:C.muted }}>Top 5 by magnitude</span>
        </div>
        <table style={{ width:"100%", borderCollapse:"collapse" }}>
          <thead>
            <tr style={{ background:"#FAFAFA", borderBottom:`1px solid ${C.border}` }}>
              {["Feature","Impact","Explanation"].map(h => (
                <th key={h} style={{ padding:"9px 14px", fontSize:12, fontWeight:700,
                  color:C.muted, textAlign:"left" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {(top_reasoning_features||[]).map((f, i) => {
              const pos = f.impact?.toLowerCase() === "positive";
              return (
                <tr key={i} style={{ borderBottom: i < (top_reasoning_features||[]).length-1
                  ? `1px solid ${C.border}` : "none",
                  background: i%2===0 ? "#fff" : "#FDFCFF" }}>
                  <td style={{ padding:"11px 14px", fontSize:13, fontWeight:700, color:C.text1,
                    whiteSpace:"nowrap" }}>{f.feature}</td>
                  <td style={{ padding:"11px 14px" }}>
                    <span style={{ padding:"3px 10px", borderRadius:20, fontSize:11, fontWeight:700,
                      color: pos ? "#16A34A" : "#DC2626",
                      background: pos ? "rgba(34,197,94,0.1)" : "rgba(239,68,68,0.1)",
                      border: `1px solid ${pos ? "rgba(34,197,94,0.25)" : "rgba(239,68,68,0.25)"}` }}>
                      {f.impact}
                    </span>
                  </td>
                  <td style={{ padding:"11px 14px", fontSize:12, color:C.text2, lineHeight:1.5 }}>
                    {f.reason}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </motion.div>

      {/* Auditor trail */}
      <motion.div {...fu(0.13)} style={{ ...card({padding:22}) }}>
        <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:14 }}>
          <FileText style={{ width:17, height:17, color:C.purple }} />
          <span style={{ fontSize:15, fontWeight:700, color:C.text1 }}>Auditor Trail</span>
        </div>
        <div style={{ padding:"14px 16px", background:C.bg, borderRadius:12, border:`1px solid ${C.border}` }}>
          <p style={{ fontSize:13, color:C.text2, lineHeight:1.85, margin:0, fontFamily:"monospace" }}>
            {auditor_trail}
          </p>
        </div>
      </motion.div>
    </div>
  );
}

/* ── Main page ────────────────────────────────────────────── */
export default function LoanDecisionPage() {
  const location  = useLocation();
  const navigate  = useNavigate();
  const [tab, setTab] = useState("seller");

  // Accept result from router state or use mock
  const result = location.state?.result || MOCK;

  return (
    <div style={{ maxWidth:960, margin:"0 auto" }}>
      <style>{`.decision-layout{display:grid;grid-template-columns:1fr;gap:20px;}`}</style>

      {/* Breadcrumb + actions */}
      <motion.div {...fu(0)} style={{ display:"flex", alignItems:"center", justifyContent:"space-between",
        flexWrap:"wrap", gap:12, marginBottom:8 }}>
        <div>
          <h1 style={{ fontSize:22, fontWeight:800, color:C.text1, margin:0 }}>Loan Decision</h1>
          <p style={{ fontSize:13, color:C.muted, margin:"3px 0 0" }}>
            Evaluation result for <strong style={{ color:C.purple }}>{result.seller_id}</strong>
          </p>
        </div>
        <div style={{ display:"flex", gap:10 }}>
          <button onClick={() => navigate("/seller/apply")} style={{
            display:"flex", alignItems:"center", gap:7, padding:"9px 18px", borderRadius:10,
            fontSize:13, fontWeight:600, color:C.purple, background:"rgba(111,45,189,0.08)",
            border:"1px solid #DDD0F5", cursor:"pointer" }}>
            <RotateCcw style={{ width:13, height:13 }} /> New Evaluation
          </button>
          <Link to="/seller/coach" style={{
            display:"inline-flex", alignItems:"center", gap:7, padding:"9px 18px", borderRadius:10,
            fontSize:13, fontWeight:600, color:"#fff",
            background:"linear-gradient(135deg,#6F2DBD,#8B5CF6)",
            textDecoration:"none", boxShadow:"0 2px 10px rgba(111,45,189,0.28)" }}>
            <MessageCircle style={{ width:13, height:13 }} /> Ask AI Coach
          </Link>
        </div>
      </motion.div>

      {/* Hero card */}
      <HeroCard result={result} />

      {/* Tabs */}
      <motion.div {...fu(0.08)} style={{ display:"flex", gap:4, background:C.bg,
        borderRadius:14, padding:4, marginTop:4 }}>
        {[["seller","Seller View","MessageCircle"],["auditor","Auditor View","Shield"]].map(([k,l,_]) => (
          <button key={k} type="button" onClick={() => setTab(k)}
            style={{ flex:1, padding:"10px 8px", borderRadius:11, fontSize:13, fontWeight:700,
              border:"none", cursor:"pointer", transition:"all 0.2s",
              background: tab===k ? "#fff" : "transparent",
              color: tab===k ? C.purple : C.muted,
              boxShadow: tab===k ? "0 2px 10px rgba(111,45,189,0.1)" : "none" }}>
            {l}
          </button>
        ))}
      </motion.div>

      {/* Tab content */}
      <div style={{ marginTop:4 }}>
        <AnimatePresence mode="wait">
          <motion.div key={tab} initial={{ opacity:0, y:10 }} animate={{ opacity:1, y:0 }}
            exit={{ opacity:0 }} transition={{ duration:0.25 }}>
            {tab === "seller"
              ? <SellerView result={result} />
              : <AuditorView result={result} />}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Bottom CTA */}
      <motion.div {...fu(0.2)} style={{ marginTop:24, display:"flex", gap:12,
        justifyContent:"center", flexWrap:"wrap" }}>
        <Link to="/seller" style={{ display:"inline-flex", alignItems:"center", gap:8,
          padding:"12px 24px", borderRadius:12, fontSize:14, fontWeight:700,
          color:C.purple, background:C.bg, border:`1px solid ${C.border}`,
          textDecoration:"none" }}>
          Back to Dashboard
        </Link>
        <Link to="/seller/history" style={{ display:"inline-flex", alignItems:"center", gap:8,
          padding:"12px 24px", borderRadius:12, fontSize:14, fontWeight:700,
          color:"#fff", background:"linear-gradient(135deg,#6F2DBD,#8B5CF6)",
          textDecoration:"none", boxShadow:"0 3px 14px rgba(111,45,189,0.28)" }}>
          View All History <ArrowRight style={{ width:15, height:15 }} />
        </Link>
      </motion.div>
    </div>
  );
}
