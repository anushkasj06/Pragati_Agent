/**
 * SellerProfile — shows and edits the currently selected seller's info.
 */
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Edit3, CheckCircle, Star, Package, TrendingUp, Shield, Sparkles } from "lucide-react";
import { ResponsiveContainer, BarChart, Bar, CartesianGrid, XAxis, YAxis, Tooltip } from "recharts";
import { useApp } from "../../context/AppContext";
import { SELLER_PROFILES } from "../../utils/sellerData";

const C = { purple:"#6F2DBD", p2:"#8B5CF6", orange:"#F59E0B", green:"#22C55E", red:"#EF4444",
  text1:"#1A1A2E", text2:"#4B5563", muted:"#9CA3AF", border:"#E9E5F5", card:"#FFFFFF", bg:"#F8F4FF" };
const card = (x={}) => ({ background:C.card, border:`1px solid ${C.border}`,
  borderRadius:18, boxShadow:"0 12px 30px rgba(111,45,189,0.08)", ...x });
const fu = (d=0) => ({ initial:{opacity:0,y:20}, animate:{opacity:1,y:0},
  transition:{duration:0.45, delay:d, ease:[0.22,1,0.36,1]} });
const inp = (f=false) => ({
  width:"100%", padding:"10px 14px", borderRadius:10, fontSize:14,
  border:`1.5px solid ${f ? C.purple : C.border}`, background:"#fff",
  color:C.text1, outline:"none", boxSizing:"border-box", transition:"border-color 0.2s",
});

function Field({ label, value, onChange, type="text" }) {
  const [focus, setFocus] = useState(false);
  return (
    <div>
      <label style={{ fontSize:12, fontWeight:600, color:C.text2, marginBottom:6, display:"block" }}>{label}</label>
      <input type={type} value={value} onChange={e => onChange(e.target.value)}
        onFocus={() => setFocus(true)} onBlur={() => setFocus(false)} style={inp(focus)} />
    </div>
  );
}

const TIER_COLOR = { Silver:"#8B5CF6", Bronze:"#F59E0B", Gold:"#F59E0B", New:"#9CA3AF" };

export default function SellerProfile() {
  const { selectedSeller } = useApp();
  const seller = selectedSeller || SELLER_PROFILES[0];

  const [form, setForm] = useState({
    name: seller.name, email: seller.email,
    phone: seller.phone, business: seller.business,
    city: seller.city, state: seller.state, gst: seller.gst,
  });
  const [saved, setSaved] = useState(false);
  const set = k => v => setForm(p => ({ ...p, [k]: v }));

  // Re-sync form when seller changes
  useEffect(() => {
    setForm({ name: seller.name, email: seller.email,
      phone: seller.phone, business: seller.business,
      city: seller.city, state: seller.state, gst: seller.gst });
    setSaved(false);
  }, [seller.id]);

  const metrics = seller.metrics || {};
  const tc = TIER_COLOR[seller.tier] || "#9CA3AF";
  const tierPct = seller.tier_pct || 20;
  const chartData = [
    { name: "Rating", value: Number(metrics.avg_customer_rating || 0) },
    { name: "Orders", value: Math.min(Number(metrics.total_orders_6m || 0) / 1000, 80) },
    { name: "Growth", value: Math.max(Number(metrics.sales_growth_rate || 0), 0) },
    { name: "SLA", value: Number(metrics.dispatch_sla_compliance || 0) },
  ];

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:22, maxWidth:900 }}>
      <style>{`.prof-grid{display:grid;grid-template-columns:3fr 2fr;gap:20px;align-items:start;}
        .field-grid{display:grid;grid-template-columns:1fr 1fr;gap:14px;}
        @media(max-width:760px){.prof-grid{grid-template-columns:1fr;}.field-grid{grid-template-columns:1fr;}}`}</style>

      <motion.div {...fu(0)}>
        <div style={{ fontSize:20, fontWeight:800, color:C.text1, marginBottom:2 }}>My Profile</div>
        <div style={{ fontSize:13, color:C.muted }}>{seller.name} · {seller.id}</div>
      </motion.div>

      <motion.div {...fu(0.04)} style={{ ...card(), padding:18, background:"linear-gradient(135deg, #F8F4FF 0%, #ffffff 100%)" }}>
        <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:14 }}>
          <div style={{ width:38, height:38, borderRadius:12, background:"rgba(111,45,189,0.12)", display:"flex", alignItems:"center", justifyContent:"center" }}>
            <Sparkles style={{ width:18, height:18, color:C.purple }} />
          </div>
          <div>
            <div style={{ fontSize:13, fontWeight:700, color:C.muted, textTransform:"uppercase", letterSpacing:"0.06em" }}>Performance pulse</div>
            <div style={{ fontSize:15, fontWeight:800, color:C.text1 }}>Strong business momentum with room to grow in delivery reliability</div>
          </div>
        </div>
        <div style={{ height:180 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E9E5F5" />
              <XAxis dataKey="name" tick={{ fontSize:12, fill:C.muted }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize:12, fill:C.muted }} axisLine={false} tickLine={false} />
              <Tooltip />
              <Bar dataKey="value" radius={[8, 8, 4, 4]} fill="#8B5CF6" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </motion.div>

      <div className="prof-grid">
        <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
          <motion.div {...fu(0.06)} style={{ ...card(), padding:24 }}>
            <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:20 }}>
              <div style={{ width:56, height:56, borderRadius:16, flexShrink:0,
                background:"linear-gradient(135deg,#6F2DBD,#8B5CF6)",
                display:"flex", alignItems:"center", justifyContent:"center",
                fontSize:20, fontWeight:900, color:"#fff" }}>{seller.initials}</div>
              <div>
                <div style={{ fontSize:16, fontWeight:800, color:C.text1 }}>{seller.name}</div>
                <div style={{ display:"flex", alignItems:"center", gap:5, marginTop:3 }}>
                  <CheckCircle style={{ width:13, height:13, color:C.green }} />
                  <span style={{ fontSize:12, color:C.green, fontWeight:600 }}>Verified Seller</span>
                </div>
              </div>
              <span style={{ marginLeft:"auto", fontSize:11, fontWeight:800, padding:"3px 10px",
                borderRadius:99, color:tc, background:`${tc}15` }}>{seller.tier}</span>
            </div>
            <div style={{ fontSize:12, fontWeight:700, color:C.muted, textTransform:"uppercase",
              letterSpacing:"0.05em", marginBottom:14 }}>Personal Info</div>
            <div className="field-grid">
              <Field label="Full Name"    value={form.name}     onChange={set("name")} />
              <Field label="Email"        value={form.email}    onChange={set("email")}   type="email" />
              <Field label="Phone"        value={form.phone}    onChange={set("phone")}   type="tel" />
              <Field label="Business"     value={form.business} onChange={set("business")} />
            </div>
          </motion.div>

          <motion.div {...fu(0.1)} style={{ ...card(), padding:24 }}>
            <div style={{ fontSize:12, fontWeight:700, color:C.muted, textTransform:"uppercase",
              letterSpacing:"0.05em", marginBottom:14 }}>Location & GST</div>
            <div className="field-grid">
              <Field label="City"  value={form.city}  onChange={set("city")} />
              <Field label="State" value={form.state} onChange={set("state")} />
              <div style={{ gridColumn:"1/-1" }}>
                <Field label="GST Number" value={form.gst} onChange={set("gst")} />
              </div>
            </div>
            <button onClick={() => { setSaved(true); setTimeout(()=>setSaved(false),2500); }}
              style={{ marginTop:20, width:"100%", padding:"12px",
                borderRadius:12, fontSize:14, fontWeight:700, color:"#fff",
                background: saved ? "#22C55E" : "linear-gradient(135deg,#6F2DBD,#8B5CF6)",
                border:"none", cursor:"pointer", boxShadow:"0 3px 14px rgba(111,45,189,0.28)",
                display:"flex", alignItems:"center", justifyContent:"center", gap:8, transition:"all 0.3s" }}>
              {saved ? <><CheckCircle style={{width:16,height:16}}/>Saved!</> : <><Edit3 style={{width:16,height:16}}/>Save Changes</>}
            </button>
          </motion.div>
        </div>

        <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
          <motion.div {...fu(0.08)} style={{ ...card(), padding:22 }}>
            <div style={{ fontSize:13, fontWeight:700, color:C.text1, marginBottom:14 }}>Live Seller Stats</div>
            {[
              { icon:Star, label:"Avg Rating", value:`${metrics.avg_customer_rating || 0} / 5.0`, color:C.orange },
              { icon:Package, label:"Total Orders", value:Number(metrics.total_orders_6m || 0).toLocaleString("en-IN"), color:C.p2 },
              { icon:TrendingUp, label:"Sales Growth", value:`${metrics.sales_growth_rate > 0 ? "+" : ""}${metrics.sales_growth_rate || 0}%`, color:metrics.sales_growth_rate >= 0 ? C.green : C.red },
              { icon:Shield, label:"Risk Class", value:`${seller.risk_category || "Moderate"} Risk`, color:{ Low:C.green, Moderate:C.orange, High:C.red }[seller.risk_category] || C.orange },
            ].map(s => {
              const Icon = s.icon;
              return (
                <div key={s.label} style={{ display:"flex", alignItems:"center", gap:10,
                  padding:"10px 0", borderBottom:`1px solid ${C.border}` }}>
                  <div style={{ width:32, height:32, borderRadius:9, flexShrink:0,
                    background:`${s.color}12`, display:"flex", alignItems:"center", justifyContent:"center" }}>
                    <Icon style={{ width:16, height:16, color:s.color }} />
                  </div>
                  <span style={{ fontSize:13, color:C.text2, flex:1 }}>{s.label}</span>
                  <span style={{ fontSize:13, fontWeight:700, color:s.color }}>{s.value}</span>
                </div>
              );
            })}
          </motion.div>

          <motion.div {...fu(0.12)} style={{ ...card(), padding:22,
            background:"linear-gradient(135deg,#F3ECFF,#EDE4FF)" }}>
            <div style={{ fontSize:13, fontWeight:700, color:C.purple, marginBottom:10 }}>
              Seller Tier — {seller.tier}
            </div>
            <div style={{ fontSize:12, color:C.muted, marginBottom:14 }}>
              {100 - tierPct} points to next tier
            </div>
            <div style={{ height:8, background:"#DDD0F5", borderRadius:4, overflow:"hidden" }}>
              <motion.div initial={{ width:0 }} animate={{ width:`${tierPct}%` }}
                transition={{ duration:1.2, delay:0.4, ease:"easeOut" }}
                style={{ height:"100%", background:"linear-gradient(90deg,#6F2DBD,#8B5CF6)", borderRadius:4 }} />
            </div>
            <div style={{ display:"flex", justifyContent:"space-between", marginTop:4 }}>
              <span style={{ fontSize:11, color:C.muted }}>{seller.tier}</span>
              <span style={{ fontSize:11, color:C.muted, fontWeight:700 }}>{tierPct}%</span>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
