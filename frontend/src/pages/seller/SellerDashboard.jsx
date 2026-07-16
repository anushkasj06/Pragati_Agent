/**
 * SellerDashboard — driven entirely by selectedSeller from AppContext.
 * Switch seller from the top picker → every KPI, loan estimate, and CTA updates.
 */
import { useRef } from "react";
import { Link } from "react-router-dom";
import { motion, useInView } from "framer-motion";
import {
  TrendingUp, Package, Star, Truck, RotateCcw, CreditCard,
  BookOpen, ArrowRight, ShieldCheck, Brain, Globe, MessageCircle,
  CheckCircle, Sparkles, IndianRupee, Clock,
} from "lucide-react";
import { useAnimatedNumber } from "../../hooks/useAnimatedNumber";
import { useApp } from "../../context/AppContext";
import { SELLER_PROFILES, computeHealthScore } from "../../utils/sellerData";

const C = {
  purple:"#6F2DBD", p2:"#8B5CF6", orange:"#F59E0B", green:"#22C55E",
  red:"#EF4444", text1:"#1A1A2E", text2:"#4B5563", muted:"#9CA3AF",
  border:"#E9E5F5", bg:"#F8F4FF", card:"#FFFFFF",
};
const card = (x={}) => ({ background:C.card, border:`1px solid ${C.border}`,
  borderRadius:16, boxShadow:"0 2px 16px rgba(111,45,189,0.07)", ...x });
const fu = (d=0) => ({ initial:{opacity:0,y:20}, animate:{opacity:1,y:0},
  transition:{duration:0.45,delay:d,ease:[0.22,1,0.36,1]} });

const RISK_COLOR = { Low: C.green, Moderate: C.orange, High: C.red };

function KpiCard({ label, value, target, unit="", color, bgColor, icon:Icon, note, delay }) {
  const animated = useAnimatedNumber(typeof target==="number" ? target : 0, 1200, delay * 180);
  const display  = typeof target==="number" ? `${animated.toLocaleString("en-IN")}${unit}` : value;
  return (
    <motion.div {...fu(delay * 0.1)} style={{ ...card(), padding:20 }}>
      <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", marginBottom:14 }}>
        <div style={{ width:42, height:42, borderRadius:12, background:bgColor,
          display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
          <Icon style={{ width:20, height:20, color }} />
        </div>
        {note && (
          <span style={{ fontSize:11, fontWeight:600, padding:"2px 8px", borderRadius:20,
            color: note.up ? "#16A34A" : "#DC2626",
            background: note.up ? "rgba(34,197,94,0.1)" : "rgba(239,68,68,0.1)" }}>
            {note.text}
          </span>
        )}
      </div>
      <div style={{ fontSize:26, fontWeight:900, color:C.text1, letterSpacing:"-0.02em", lineHeight:1 }}>{display}</div>
      <div style={{ fontSize:13, color:C.text2, marginTop:6, fontWeight:500 }}>{label}</div>
    </motion.div>
  );
}

function HealthGauge({ score }) {
  const animated = useAnimatedNumber(score, 1400, 200);
  const color = score >= 80 ? C.green : score >= 55 ? C.orange : C.red;
  const label = score >= 80 ? "Excellent" : score >= 55 ? "Good" : "Needs Work";
  const r = 34, circ = 2 * Math.PI * r;
  return (
    <div style={{ display:"flex", alignItems:"center", gap:16 }}>
      <div style={{ position:"relative", width:80, height:80, flexShrink:0 }}>
        <svg width="80" height="80" viewBox="0 0 80 80">
          <circle cx="40" cy="40" r={r} fill="none" stroke="#E9E5F5" strokeWidth="8"/>
          <motion.circle cx="40" cy="40" r={r} fill="none" stroke={color}
            strokeWidth="8" strokeLinecap="round"
            strokeDasharray={circ}
            initial={{ strokeDashoffset: circ }}
            animate={{ strokeDashoffset: circ * (1 - score / 100) }}
            transition={{ duration:1.4, delay:0.3, ease:"easeOut" }}
            style={{ transform:"rotate(-90deg)", transformOrigin:"center" }}
          />
        </svg>
        <div style={{ position:"absolute", inset:0, display:"flex", alignItems:"center",
          justifyContent:"center", fontSize:16, fontWeight:900, color }}>
          {animated}
        </div>
      </div>
      <div>
        <div style={{ fontSize:18, fontWeight:800, color:C.text1 }}>Business Health</div>
        <div style={{ fontSize:13, fontWeight:700, color, marginTop:2 }}>{label}</div>
        <div style={{ fontSize:12, color:C.muted, marginTop:2 }}>Based on 6-month data</div>
      </div>
    </div>
  );
}

const WHY = [
  { icon:Brain,        title:"AI Powered",           desc:"XGBoost + Groq Llama decides eligibility based on your real Meesho data.",        color:C.purple },
  { icon:ShieldCheck,  title:"Fair Lending",          desc:"No CIBIL required. Your Meesho performance is your credit score.",               color:C.green  },
  { icon:CheckCircle,  title:"Transparent Decisions", desc:"Every approval or rejection includes a full explanation in your language.",      color:C.p2     },
  { icon:Globe,        title:"8 Indian Languages",    desc:"Hindi, Tamil, Telugu, Kannada, Marathi, Gujarati, Malayalam and English.",       color:C.orange },
  { icon:MessageCircle,title:"Financial Coaching",    desc:"AI coach helps you understand and improve loan eligibility over time.",          color:C.purple },
  { icon:IndianRupee,  title:"Instant Capital",        desc:"Working capital sanctioned within minutes, directly to your account.",          color:C.green  },
];

export default function SellerDashboard() {
  const refWhy = useRef(null);
  const inWhy  = useInView(refWhy, { once:true, margin:"-60px" });
  const { selectedSeller, setSelectedSeller } = useApp();

  // Always have a valid seller
  const seller  = selectedSeller || SELLER_PROFILES[0];
  const metrics = seller.metrics;
  const health  = computeHealthScore(metrics);
  const rc      = RISK_COLOR[seller.risk_category] || C.orange;

  // Estimated loan limit (rough client-side calculation matching rules engine)
  const salesCap    = Math.min(metrics.sales_velocity_6m * 0.5, 100000);
  const mult        = seller.risk_category === "Low" ? 1.0 : seller.risk_category === "Moderate" ? 0.55 : 0.2;
  const estLimit    = Math.round((salesCap * mult * (metrics.prior_loan_default ? 0.3 : 1)) / 5000) * 5000;
  const animLimit   = useAnimatedNumber(estLimit, 1400, 300);

  const kpis = [
    { label:"Monthly Sales",     target:metrics.sales_velocity_6m,       unit:"",      color:C.purple, bgColor:"rgba(111,45,189,0.1)", icon:IndianRupee, note:{up:metrics.sales_growth_rate>=0, text:`${metrics.sales_growth_rate>0?"+":""}${metrics.sales_growth_rate}%`}, delay:0 },
    { label:"Orders (6 months)", target:metrics.total_orders_6m,          unit:"",      color:C.p2,     bgColor:"rgba(139,92,246,0.1)", icon:Package,     note:{up:true, text:"Orders"},                                                                                    delay:1 },
    { label:"Customer Rating",   value:`${metrics.avg_customer_rating}★`, target:null,  color:C.orange, bgColor:"rgba(245,158,11,0.1)", icon:Star,        note:{up:metrics.rating_trend>=0, text:metrics.rating_trend>=0?`+${metrics.rating_trend}`:`${metrics.rating_trend}`}, delay:2 },
    { label:"Dispatch SLA",      value:`${metrics.dispatch_sla_compliance}%`, target:null, color:C.green,  bgColor:"rgba(34,197,94,0.1)",  icon:Truck,    note:{up:metrics.dispatch_sla_compliance>=90, text:metrics.dispatch_sla_compliance>=90?"Strong":"Improve"},         delay:3 },
    { label:"RTO Rate",          value:`${metrics.rto_rate}%`,            target:null,  color:metrics.rto_rate<=10?C.green:metrics.rto_rate<=16?C.orange:C.red, bgColor:"rgba(239,68,68,0.1)", icon:RotateCcw, note:{up:metrics.rto_rate<=10, text:metrics.rto_rate<=10?"Healthy":"High"}, delay:4 },
    { label:"Catalog Size",      target:metrics.catalog_size,             unit:" items",color:C.purple, bgColor:"rgba(111,45,189,0.1)", icon:BookOpen,    note:{up:true, text:"Active"},                                                                                    delay:5 },
  ];

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:24 }}>
      <style>{`
        .kpi-grid  { display:grid; grid-template-columns:repeat(3,1fr); gap:16px; }
        .why-grid  { display:grid; grid-template-columns:repeat(3,1fr); gap:16px; }
        @media(max-width:900px) { .kpi-grid,.why-grid { grid-template-columns:1fr 1fr; } }
        @media(max-width:560px) { .kpi-grid,.why-grid { grid-template-columns:1fr; } }
      `}</style>

      {/* ── Seller switcher ── */}
      <motion.div {...fu(0)} style={{ ...card(), padding:20 }}>
        <div style={{ fontSize:12, fontWeight:700, color:C.muted, textTransform:"uppercase",
          letterSpacing:"0.06em", marginBottom:12 }}>Switch Seller Profile</div>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(220px,1fr))", gap:10 }}>
          {SELLER_PROFILES.map(s => {
            const active = seller.id === s.id;
            const col    = RISK_COLOR[s.risk_category] || C.orange;
            return (
              <button key={s.id} type="button" onClick={() => setSelectedSeller(s)}
                style={{ textAlign:"left", padding:14, borderRadius:14, cursor:"pointer",
                  border:`1.5px solid ${active ? col : C.border}`,
                  background: active ? `${col}10` : "#fff", transition:"all 0.2s" }}>
                <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:4 }}>
                  <div style={{ width:32, height:32, borderRadius:9, flexShrink:0,
                    background:`linear-gradient(135deg,${C.purple},${C.p2})`,
                    display:"flex", alignItems:"center", justifyContent:"center",
                    fontSize:12, fontWeight:800, color:"#fff" }}>{s.initials}</div>
                  <div style={{ minWidth:0 }}>
                    <div style={{ fontSize:13, fontWeight:800, color:C.text1, whiteSpace:"nowrap",
                      overflow:"hidden", textOverflow:"ellipsis" }}>{s.name}</div>
                    <div style={{ fontSize:11, color:C.muted }}>{s.business}</div>
                  </div>
                  <span style={{ marginLeft:"auto", fontSize:11, fontWeight:800, flexShrink:0,
                    color:col, background:`${col}15`, padding:"2px 8px", borderRadius:99 }}>
                    {s.risk_category}
                  </span>
                </div>
                <div style={{ fontSize:11, color:C.muted }}>{s.id} · {s.city}</div>
              </button>
            );
          })}
        </div>
      </motion.div>

      {/* ── Greeting hero ── */}
      <motion.div {...fu(0.04)} style={{ ...card(), padding:0, overflow:"hidden" }}>
        <div style={{ background:"linear-gradient(135deg,#6F2DBD,#8B5CF6)", padding:"28px 32px" }}>
          <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", flexWrap:"wrap", gap:16 }}>
            <div>
              <div style={{ fontSize:22, fontWeight:900, color:"#fff", marginBottom:4 }}>
                Hello, {seller.name.split(" ")[0]}
              </div>
              <div style={{ fontSize:14, color:"rgba(255,255,255,0.75)" }}>
                {seller.business} · {seller.city} · {seller.id}
              </div>
            </div>
            <HealthGauge score={health} />
          </div>
        </div>
        {/* Loan eligibility banner */}
        <div style={{ padding:"14px 32px", background:"#FFFBEB", borderTop:"1px solid #FDE68A",
          display:"flex", alignItems:"center", justifyContent:"space-between", flexWrap:"wrap", gap:12 }}>
          <div style={{ display:"flex", alignItems:"center", gap:10 }}>
            <Sparkles style={{ width:18, height:18, color:C.orange }} />
            <span style={{ fontSize:14, fontWeight:600, color:"#92400E" }}>
              {seller.risk_category === "High"
                ? "Improve your metrics to unlock working capital eligibility."
                : <>Estimated eligibility: <strong style={{ color:C.orange }}>Rs. {animLimit.toLocaleString("en-IN")}</strong> — apply to confirm</>}
            </span>
          </div>
          <Link to="/seller/loan-guide" style={{ display:"inline-flex", alignItems:"center", gap:7,
            padding:"9px 20px", borderRadius:10, fontSize:13, fontWeight:700,
            color:"#fff", background:C.orange, textDecoration:"none",
            boxShadow:"0 2px 10px rgba(245,158,11,0.35)" }}>
            Apply Now <ArrowRight style={{ width:14, height:14 }} />
          </Link>
        </div>
      </motion.div>

      {/* ── KPI cards ── */}
      <motion.div {...fu(0.08)}>
        <div style={{ fontSize:13, fontWeight:700, color:C.text2, marginBottom:12,
          textTransform:"uppercase", letterSpacing:"0.05em" }}>Business Performance</div>
        <div className="kpi-grid">
          {kpis.map(k => <KpiCard key={k.label} {...k} />)}
        </div>
      </motion.div>

      {/* ── Big CTA ── */}
      <motion.div {...fu(0.14)} style={{ ...card({ borderRadius:20 }), padding:0, overflow:"hidden" }}>
        <div style={{ display:"flex", alignItems:"center", flexWrap:"wrap" }}>
          <div style={{ flex:2, padding:"32px 36px", minWidth:260 }}>
            <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:14 }}>
              <div style={{ width:40, height:40, borderRadius:12, background:"rgba(111,45,189,0.1)",
                display:"flex", alignItems:"center", justifyContent:"center" }}>
                <CreditCard style={{ width:20, height:20, color:C.purple }} />
              </div>
              <span style={{ fontSize:12, fontWeight:700, color:C.purple,
                textTransform:"uppercase", letterSpacing:"0.06em" }}>Loan Application</span>
            </div>
            <h2 style={{ fontSize:24, fontWeight:900, color:C.text1, margin:"0 0 10px",
              letterSpacing:"-0.02em", lineHeight:1.2 }}>
              Apply for Working Capital Loan
            </h2>
            <p style={{ fontSize:14, color:C.text2, lineHeight:1.7, margin:"0 0 24px", maxWidth:420 }}>
              {seller.summary}
            </p>
            <div style={{ display:"flex", gap:12, flexWrap:"wrap" }}>
              <Link to="/seller/loan-guide" style={{ display:"inline-flex", alignItems:"center", gap:8,
                padding:"13px 28px", borderRadius:12, fontSize:15, fontWeight:800,
                color:"#fff", background:C.purple, textDecoration:"none",
                boxShadow:"0 4px 18px rgba(111,45,189,0.32)" }}>
                <Sparkles style={{ width:18, height:18 }} />
                Apply for Loan
                <ArrowRight style={{ width:16, height:16 }} />
              </Link>
              <Link to="/seller/coach" style={{ display:"inline-flex", alignItems:"center", gap:8,
                padding:"13px 24px", borderRadius:12, fontSize:14, fontWeight:600,
                color:C.purple, background:"#F3ECFF", border:"1.5px solid #DDD0F5", textDecoration:"none" }}>
                <MessageCircle style={{ width:16, height:16 }} />
                Talk to AI Coach
              </Link>
            </div>
          </div>
          {/* Right illustration */}
          <div style={{ flex:1, minWidth:180, background:"linear-gradient(135deg,#F3ECFF,#EDE4FF)",
            display:"flex", alignItems:"center", justifyContent:"center", padding:32,
            borderLeft:"1px solid #E9E5F5" }}>
            <div style={{ textAlign:"center" }}>
              <div style={{ fontSize:38, fontWeight:900, color:C.purple, letterSpacing:"-0.03em" }}>
                {seller.risk_category === "High" ? "Improve" : `Rs. ${animLimit.toLocaleString("en-IN")}`}
              </div>
              <div style={{ fontSize:12, color:C.muted, marginTop:4 }}>
                {seller.risk_category === "High" ? "Eligibility pending" : "Estimated limit"}
              </div>
              <div style={{ fontSize:13, fontWeight:800, color:rc, marginTop:6 }}>
                {seller.risk_category} Risk
              </div>
              <div style={{ display:"flex", flexDirection:"column", gap:6, marginTop:16, textAlign:"left" }}>
                {["No CIBIL check","AI-powered decision","Decision in 2 mins"].map(t => (
                  <div key={t} style={{ display:"flex", alignItems:"center", gap:7 }}>
                    <CheckCircle style={{ width:14, height:14, color:C.green, flexShrink:0 }} />
                    <span style={{ fontSize:12, color:C.text2, fontWeight:500 }}>{t}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* ── Why Pragati ── */}
      <div ref={refWhy}>
        <motion.div initial={{ opacity:0, y:20 }} animate={inWhy ? { opacity:1, y:0 } : {}}
          transition={{ duration:0.4 }}
          style={{ fontSize:13, fontWeight:700, color:C.text2, marginBottom:12,
            textTransform:"uppercase", letterSpacing:"0.05em" }}>
          Why Pragati Agent?
        </motion.div>
        <div className="why-grid">
          {WHY.map((w, i) => {
            const Icon = w.icon;
            return (
              <motion.div key={w.title}
                initial={{ opacity:0, y:20 }} animate={inWhy ? { opacity:1, y:0 } : {}}
                transition={{ duration:0.4, delay:i * 0.07 }}
                style={{ ...card(), padding:20, borderTop:`3px solid ${w.color}20` }}>
                <div style={{ width:38, height:38, borderRadius:10, marginBottom:12,
                  background:`${w.color}12`, border:`1px solid ${w.color}25`,
                  display:"flex", alignItems:"center", justifyContent:"center" }}>
                  <Icon style={{ width:18, height:18, color:w.color }} />
                </div>
                <div style={{ fontSize:14, fontWeight:700, color:C.text1, marginBottom:6 }}>{w.title}</div>
                <div style={{ fontSize:13, color:C.text2, lineHeight:1.6 }}>{w.desc}</div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
