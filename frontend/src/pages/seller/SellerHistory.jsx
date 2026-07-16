/**
 * SellerHistory — loan history driven by selectedSeller from context.
 */
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { ClipboardList, ChevronDown, ChevronUp, IndianRupee, Calendar } from "lucide-react";
import { useApp } from "../../context/AppContext";
import { SELLER_PROFILES } from "../../utils/sellerData";
import { getLoanApplications } from "../../services/api";

const C = { purple:"#6F2DBD", orange:"#F59E0B", green:"#22C55E", red:"#EF4444",
  text1:"#1A1A2E", text2:"#4B5563", muted:"#9CA3AF", border:"#E9E5F5", card:"#FFFFFF" };
const card = (x={}) => ({ background:C.card, border:`1px solid ${C.border}`,
  borderRadius:16, boxShadow:"0 2px 16px rgba(111,45,189,0.07)", ...x });
const fu = (d=0) => ({ initial:{opacity:0,y:20}, animate:{opacity:1,y:0},
  transition:{duration:0.45, delay:d, ease:[0.22,1,0.36,1]} });

const S_CFG = {
  Approved: { color:"#16A34A", bg:"rgba(34,197,94,0.1)",  border:"rgba(34,197,94,0.25)"  },
  Review:   { color:"#D97706", bg:"rgba(245,158,11,0.1)", border:"rgba(245,158,11,0.25)" },
  Rejected: { color:"#DC2626", bg:"rgba(239,68,68,0.1)",  border:"rgba(239,68,68,0.25)"  },
};

function HistoryCard({ item, index }) {
  const [open, setOpen] = useState(false);
  const cfg = S_CFG[item.status] || S_CFG.Review;
  const amtColor = item.status === "Approved" ? C.green
    : item.status === "Rejected" ? C.red : C.orange;
  return (
    <motion.div {...fu(index * 0.08)} style={{ ...card(), overflow:"hidden" }}>
      <div style={{ padding:"18px 20px", cursor:"pointer", userSelect:"none" }}
        onClick={() => setOpen(!open)}>
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between",
          flexWrap:"wrap", gap:10 }}>
          <div style={{ display:"flex", alignItems:"center", gap:14 }}>
            <div style={{ width:42, height:42, borderRadius:12, flexShrink:0,
              background:`${amtColor}10`,
              display:"flex", alignItems:"center", justifyContent:"center" }}>
              <IndianRupee style={{ width:20, height:20, color:amtColor }} />
            </div>
            <div>
              <div style={{ fontSize:14, fontWeight:700, color:C.text1 }}>{item.id}</div>
              <div style={{ display:"flex", alignItems:"center", gap:6, marginTop:2 }}>
                <Calendar style={{ width:12, height:12, color:C.muted }} />
                <span style={{ fontSize:12, color:C.muted }}>{item.date}</span>
                <span style={{ fontSize:11, color:C.muted }}>· {item.language}</span>
              </div>
            </div>
          </div>
          <div style={{ display:"flex", alignItems:"center", gap:12 }}>
            <div style={{ textAlign:"right" }}>
              <div style={{ fontSize:16, fontWeight:900, color:C.purple }}>{item.amount}</div>
              <div style={{ fontSize:11, color:C.muted }}>Requested</div>
            </div>
            <span style={{ padding:"4px 12px", borderRadius:20, fontSize:12, fontWeight:700,
              color:cfg.color, background:cfg.bg, border:`1px solid ${cfg.border}` }}>
              {item.status}
            </span>
            {open
              ? <ChevronUp style={{ width:16, height:16, color:C.muted }} />
              : <ChevronDown style={{ width:16, height:16, color:C.muted }} />}
          </div>
        </div>
      </div>

      {open && (
        <motion.div initial={{ height:0, opacity:0 }} animate={{ height:"auto", opacity:1 }}
          transition={{ duration:0.3 }} style={{ borderTop:`1px solid ${C.border}`, overflow:"hidden" }}>
          <div style={{ padding:"18px 20px", display:"flex", gap:20, flexWrap:"wrap" }}>
            <div style={{ flex:2, minWidth:240 }}>
              <div style={{ fontSize:12, fontWeight:700, color:C.muted, textTransform:"uppercase",
                letterSpacing:"0.05em", marginBottom:8 }}>AI Decision Message</div>
              <p style={{ fontSize:14, color:C.text1, lineHeight:1.7, margin:0 }}>{item.sellerMsg}</p>
              <div style={{ marginTop:12, fontSize:12, color:C.muted }}>
                Documents uploaded: {item.documentCount ?? 0}
              </div>
            </div>
            <div style={{ flex:1, minWidth:200 }}>
              <div style={{ fontSize:12, fontWeight:700, color:C.muted, textTransform:"uppercase",
                letterSpacing:"0.05em", marginBottom:8 }}>Improvement Plan</div>
              {item.plan.map((p, i) => (
                <div key={i} style={{ display:"flex", gap:8, alignItems:"flex-start", marginBottom:8 }}>
                  <div style={{ width:20, height:20, borderRadius:6, flexShrink:0,
                    background:"rgba(111,45,189,0.1)", display:"flex", alignItems:"center",
                    justifyContent:"center", fontSize:10, fontWeight:800, color:C.purple }}>{i + 1}</div>
                  <span style={{ fontSize:13, color:C.text2, lineHeight:1.5 }}>{p}</span>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}

export default function SellerHistory() {
  const { selectedSeller } = useApp();
  const seller  = selectedSeller || SELLER_PROFILES[0];
  const [history, setHistory] = useState(seller.loan_history || []);

  useEffect(() => {
    let mounted = true;
    getLoanApplications({ seller_id: seller.id }).then((apps) => {
      if (!mounted) return;
      const mapped = (apps || []).map((app) => ({
        id: app.id,
        date: new Date(app.submittedAt).toLocaleDateString("en-IN"),
        amount: `₹${Number(app.amount || app.requestedAmount || 0).toLocaleString("en-IN")}`,
        status: app.status === "approved" ? "Approved" : app.status === "rejected" ? "Rejected" : "Review",
        sellerMsg: app.decisionMessage || "Application submitted and pending review.",
        plan: app.status === "approved" ? ["Documents approved", "Loan will be disbursed soon", "Track settlement updates in notifications"] : ["Upload all mandatory documents", "Wait for admin review", "Check notifications for status updates"],
        language: app.language || "English",
        documentCount: app.documents ? Object.keys(app.documents).length : 0,
      }));
      setHistory(mapped);
    }).catch(() => {});
    return () => { mounted = false; };
  }, [seller.id]);

  const approved = history.filter(h => h.status === "Approved").length;
  const rejected = history.filter(h => h.status === "Rejected").length;
  const review   = history.filter(h => h.status === "Review").length;

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:20 }}>
      <motion.div {...fu(0)}>
        <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:4 }}>
          <div style={{ width:42, height:42, borderRadius:12, background:"rgba(111,45,189,0.1)",
            display:"flex", alignItems:"center", justifyContent:"center" }}>
            <ClipboardList style={{ width:22, height:22, color:C.purple }} />
          </div>
          <div>
            <div style={{ fontSize:20, fontWeight:800, color:C.text1 }}>Loan History</div>
            <div style={{ fontSize:13, color:C.muted }}>
              {seller.name} · {history.length} application{history.length !== 1 ? "s" : ""} on record
            </div>
          </div>
        </div>
      </motion.div>

      {/* Summary strip */}
      <motion.div {...fu(0.06)} style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:12 }}>
        {[
          { label:"Total Applications", value:history.length, color:C.purple },
          { label:"Approved",           value:approved,        color:C.green  },
          { label:"Rejected",           value:rejected,        color:C.red    },
        ].map(s => (
          <div key={s.label} style={{ background:C.card, border:`1px solid ${C.border}`,
            borderRadius:14, padding:"16px 20px", textAlign:"center",
            boxShadow:"0 2px 10px rgba(111,45,189,0.06)" }}>
            <div style={{ fontSize:24, fontWeight:900, color:s.color }}>{s.value}</div>
            <div style={{ fontSize:12, color:C.muted, marginTop:2 }}>{s.label}</div>
          </div>
        ))}
      </motion.div>

      {/* History cards */}
      {history.length === 0 ? (
        <motion.div {...fu(0.1)} style={{ ...card({ padding:40 }), textAlign:"center" }}>
          <div style={{ fontSize:32, marginBottom:12 }}>📋</div>
          <div style={{ fontSize:16, fontWeight:700, color:C.text1, marginBottom:6 }}>No loan history yet</div>
          <div style={{ fontSize:14, color:C.muted }}>
            {seller.name} hasn't submitted any loan applications yet.
          </div>
        </motion.div>
      ) : (
        <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
          {history.map((item, i) => <HistoryCard key={item.id} item={item} index={i} />)}
        </div>
      )}
    </div>
  );
}
