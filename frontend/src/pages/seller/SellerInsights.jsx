/**
 * SellerInsights — charts driven by selectedSeller from context.
 */
import { motion } from "framer-motion";
import { TrendingUp, TrendingDown } from "lucide-react";
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { useApp } from "../../context/AppContext";
import { SELLER_PROFILES } from "../../utils/sellerData";

const C = { purple:"#6F2DBD", p2:"#8B5CF6", orange:"#F59E0B", green:"#22C55E",
  red:"#EF4444", text1:"#1A1A2E", text2:"#4B5563", muted:"#9CA3AF",
  border:"#E9E5F5", card:"#FFFFFF" };
const card = (x={}) => ({ background:C.card, border:`1px solid ${C.border}`,
  borderRadius:16, boxShadow:"0 2px 16px rgba(111,45,189,0.07)", ...x });
const fu = (d=0) => ({ initial:{opacity:0,y:20}, animate:{opacity:1,y:0},
  transition:{duration:0.45, delay:d, ease:[0.22,1,0.36,1]} });

const MONTHS = ["Feb","Mar","Apr","May","Jun","Jul"];

const TT = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background:"#fff", border:`1px solid ${C.border}`, borderRadius:12,
      padding:"10px 14px", boxShadow:"0 4px 20px rgba(111,45,189,0.1)", fontSize:13 }}>
      <div style={{ fontWeight:700, color:C.text1, marginBottom:6 }}>{label}</div>
      {payload.map(p => (
        <div key={p.name} style={{ color:p.color, fontWeight:500, marginBottom:2 }}>
          {p.name}: <strong>{p.dataKey==="sales" ? `₹${p.value.toLocaleString("en-IN")}` : p.value}</strong>
        </div>
      ))}
    </div>
  );
};

export default function SellerInsights() {
  const { selectedSeller } = useApp();
  const seller  = selectedSeller || SELLER_PROFILES[0];
  const metrics = seller.metrics;
  const ins     = seller.insights;

  const salesData = MONTHS.map((month, i) => ({
    month,
    sales:  ins.monthly_sales[i]  || 0,
    orders: ins.monthly_orders[i] || 0,
  }));

  const barData = [
    { name:"Dispatch SLA",  score: metrics.dispatch_sla_compliance },
    { name:"Cust. Rating",  score: Math.round(metrics.avg_customer_rating * 20) },
    { name:"Sales Growth",  score: Math.max(0, Math.min(100, Math.round((metrics.sales_growth_rate + 20) / 0.6))) },
    { name:"Ad ROI",        score: Math.round((metrics.ad_spend_roi / 5) * 100) },
    { name:"Catalog",       score: Math.round((metrics.catalog_size / 500) * 100) },
  ];

  const pieData = ins.categories.map((c, i) => ({
    ...c,
    color: [C.purple, C.p2, C.orange, C.muted][i] || C.muted,
  }));

  const topKpis = [
    { label:"Total Revenue (6M)", value:`₹${ins.monthly_sales.reduce((a,b)=>a+b,0).toLocaleString("en-IN")}`, trend:metrics.sales_growth_rate>=0?`+${metrics.sales_growth_rate}%`:`${metrics.sales_growth_rate}%`, up:metrics.sales_growth_rate>=0, color:C.purple },
    { label:"Total Orders (6M)",  value:ins.monthly_orders.reduce((a,b)=>a+b,0).toLocaleString("en-IN"),       trend:"+12%",              up:true,                          color:C.p2     },
    { label:"Avg Rating",         value:`${metrics.avg_customer_rating} ★`,                                    trend:metrics.rating_trend>=0?`+${metrics.rating_trend}`:`${metrics.rating_trend}`, up:metrics.rating_trend>=0, color:C.orange },
    { label:"RTO Rate",           value:`${metrics.rto_rate}%`,                                                 trend:metrics.rto_rate<=10?"Low":"High", up:metrics.rto_rate<=10,   color:metrics.rto_rate<=10?C.green:C.red },
    { label:"SLA Compliance",     value:`${metrics.dispatch_sla_compliance}%`,                                  trend:metrics.dispatch_sla_compliance>=90?"Strong":"Improve", up:metrics.dispatch_sla_compliance>=90, color:C.green },
  ];

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:24 }}>
      <style>{`.ins-grid{display:grid;grid-template-columns:3fr 2fr;gap:20px;}
        @media(max-width:860px){.ins-grid{grid-template-columns:1fr;}}`}</style>

      <motion.div {...fu(0)}>
        <div style={{ fontSize:20, fontWeight:800, color:C.text1, marginBottom:2 }}>Business Insights</div>
        <div style={{ fontSize:13, color:C.muted }}>
          {seller.name} · {seller.business} · {seller.id}
        </div>
      </motion.div>

      {/* KPIs */}
      <motion.div {...fu(0.05)}>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(140px,1fr))", gap:14 }}>
          {topKpis.map(k => (
            <div key={k.label} style={{ ...card({ padding:"16px 18px" }), borderTop:`3px solid ${k.color}20` }}>
              <div style={{ fontSize:20, fontWeight:900, color:k.color, marginBottom:4 }}>{k.value}</div>
              <div style={{ fontSize:12, color:C.text2, marginBottom:4 }}>{k.label}</div>
              <div style={{ display:"flex", alignItems:"center", gap:4, fontSize:11, fontWeight:600,
                color: k.up ? "#16A34A" : "#DC2626" }}>
                {k.up ? <TrendingUp style={{width:12,height:12}}/> : <TrendingDown style={{width:12,height:12}}/>}
                {k.trend}
              </div>
            </div>
          ))}
        </div>
      </motion.div>

      <div className="ins-grid">
        {/* Sales trend */}
        <motion.div {...fu(0.1)} style={{ ...card(), padding:22 }}>
          <div style={{ fontSize:15, fontWeight:700, color:C.text1, marginBottom:4 }}>Sales Trend</div>
          <div style={{ fontSize:12, color:C.muted, marginBottom:18 }}>Monthly revenue — last 6 months</div>
          <ResponsiveContainer width="100%" height={210}>
            <AreaChart data={salesData} margin={{top:5,right:10,left:-20,bottom:0}}>
              <defs>
                <linearGradient id="gS" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#6F2DBD" stopOpacity={0.22}/>
                  <stop offset="95%" stopColor="#6F2DBD" stopOpacity={0.02}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#F0ECF9" />
              <XAxis dataKey="month" tick={{fontSize:12,fill:C.muted}} axisLine={false} tickLine={false}/>
              <YAxis tick={{fontSize:11,fill:C.muted}} axisLine={false} tickLine={false}
                tickFormatter={v=>`₹${(v/1000).toFixed(0)}K`}/>
              <Tooltip content={<TT/>}/>
              <Area type="monotone" dataKey="sales" stroke="#6F2DBD" strokeWidth={2.5} fill="url(#gS)"/>
            </AreaChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Category mix */}
        <motion.div {...fu(0.14)} style={{ ...card(), padding:22 }}>
          <div style={{ fontSize:15, fontWeight:700, color:C.text1, marginBottom:4 }}>Category Mix</div>
          <div style={{ fontSize:12, color:C.muted, marginBottom:12 }}>Revenue by category</div>
          <ResponsiveContainer width="100%" height={160}>
            <PieChart>
              <Pie data={pieData} cx="50%" cy="50%" innerRadius={45} outerRadius={70}
                paddingAngle={3} dataKey="value">
                {pieData.map((e, i) => <Cell key={i} fill={e.color}/>)}
              </Pie>
              <Tooltip formatter={(v, n) => [`${v}%`, n]}
                contentStyle={{borderRadius:10,border:`1px solid ${C.border}`,fontSize:12}}/>
            </PieChart>
          </ResponsiveContainer>
          <div style={{ display:"flex", flexWrap:"wrap", gap:"6px 14px", marginTop:10 }}>
            {pieData.map(p => (
              <div key={p.name} style={{ display:"flex", alignItems:"center", gap:6, fontSize:12 }}>
                <span style={{ width:9, height:9, borderRadius:"50%", background:p.color, flexShrink:0 }}/>
                <span style={{ color:C.text2 }}>{p.name}</span>
                <span style={{ fontWeight:700, color:C.text1 }}>{p.value}%</span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Performance metrics bar */}
      <motion.div {...fu(0.18)} style={{ ...card(), padding:22 }}>
        <div style={{ fontSize:15, fontWeight:700, color:C.text1, marginBottom:4 }}>Performance Metrics</div>
        <div style={{ fontSize:12, color:C.muted, marginBottom:18 }}>Key metrics — current snapshot</div>
        <ResponsiveContainer width="100%" height={180}>
          <BarChart data={barData} layout="vertical" margin={{top:0,right:16,left:20,bottom:0}}>
            <CartesianGrid strokeDasharray="3 3" stroke="#F0ECF9" horizontal={false}/>
            <XAxis type="number" tick={{fontSize:11,fill:C.muted}} axisLine={false}
              tickLine={false} domain={[0,100]}/>
            <YAxis type="category" dataKey="name" tick={{fontSize:12,fill:C.text2}}
              axisLine={false} tickLine={false} width={110}/>
            <Tooltip formatter={v=>[`${v}%`,"Score"]}
              contentStyle={{borderRadius:10,border:`1px solid ${C.border}`,fontSize:12}}/>
            <Bar dataKey="score" fill="#6F2DBD" radius={[0,6,6,0]}/>
          </BarChart>
        </ResponsiveContainer>
      </motion.div>
    </div>
  );
}
