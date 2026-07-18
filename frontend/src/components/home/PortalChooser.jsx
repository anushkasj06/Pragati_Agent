/**
 * PortalChooser — "Choose Your Portal" section on the landing page.
 * Two cards: Seller Portal and Admin Portal.
 */
import { useRef } from "react";
import { Link } from "react-router-dom";
import { motion, useInView } from "framer-motion";
import { User, BarChart2, ArrowRight, Sparkles, ShieldCheck } from "lucide-react";

export default function PortalChooser() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <section style={{ padding: "44px 18px 50px", background: "#FFFFFF" }} ref={ref}>
      <div style={{ maxWidth: 1120, margin: "0 auto" }}>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5 }} style={{ textAlign: "center", marginBottom: 28 }}>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 6,
            padding: "4px 14px", borderRadius: 99, fontSize: 12, fontWeight: 700,
            color: "#6F2DBD", background: "#F3ECFF", border: "1px solid #E9E5F5", marginBottom: 16 }}>
            Choose Your Portal
          </span>
          <h2 style={{ fontSize: "clamp(24px,3vw,36px)", fontWeight: 900, color: "#1A1A2E",
            letterSpacing: "-0.02em", margin: "0 0 10px" }}>
            Two Portals. One Platform.
          </h2>
          <p style={{ fontSize: 16, color: "#4B5563", maxWidth: 480, margin: "0 auto" }}>
            Sellers manage their loans. Admins oversee the entire underwriting pipeline.
          </p>
        </motion.div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: 18 }}
          className="portal-grid">
          <style>{`.portal-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:18px;align-items:stretch;}
            @media(max-width:1024px){.portal-grid{grid-template-columns:repeat(2,minmax(0,1fr));}}
            @media(max-width:760px){.portal-grid{grid-template-columns:1fr;}}`}</style>

          {/* Seller Portal */}
          <motion.div initial={{ opacity:0,y:24 }} animate={inView?{opacity:1,y:0}:{}}
            transition={{ duration:0.5,delay:0.1 }}
            style={{ background:"linear-gradient(135deg,#6F2DBD 0%,#5B21B6 100%)",
              borderRadius:20, padding:"22px 20px", color:"#fff",
              boxShadow:"0 14px 36px rgba(111,45,189,0.18)", border:"1px solid rgba(255,255,255,0.18)", height:"100%", display:"flex", flexDirection:"column" }}>
            <div style={{ width:44,height:44,borderRadius:12,background:"rgba(255,255,255,0.18)",
              display:"flex",alignItems:"center",justifyContent:"center",marginBottom:14 }}>
              <User style={{ width:22,height:22,color:"#fff" }} />
            </div>
            <div style={{ fontSize:10,fontWeight:700,letterSpacing:"0.1em",
              textTransform:"uppercase",opacity:0.65,marginBottom:6 }}>For Sellers</div>
            <h3 style={{ fontSize:20,fontWeight:900,margin:"0 0 8px",letterSpacing:"-0.01em" }}>
              Seller Portal
            </h3>
            <p style={{ fontSize:13.5,lineHeight:1.6,opacity:0.82,margin:"0 0 16px" }}>
              Apply for working capital loans, track your business health, chat with the
              AI Financial Coach, and view your loan history — all in one place.
            </p>
            <div style={{ display:"flex",flexDirection:"column",gap:7,marginBottom:16 }}>
              {["Dashboard with business KPIs","One-click loan application",
                "AI Financial Coach chat","Loan history & decisions"].map(f=>(
                <div key={f} style={{ display:"flex",alignItems:"center",gap:8 }}>
                  <Sparkles style={{ width:13,height:13,opacity:0.8,flexShrink:0 }} />
                  <span style={{ fontSize:12.5,opacity:0.86 }}>{f}</span>
                </div>
              ))}
            </div>
            <Link to="/seller" style={{ display:"inline-flex",alignItems:"center",gap:8,
              padding:"10px 16px",borderRadius:12,fontSize:13.5,fontWeight:800,
              color:"#6F2DBD",background:"#fff",textDecoration:"none",
              boxShadow:"0 2px 10px rgba(0,0,0,0.12)", marginTop:"auto" }}>
              Enter Seller Portal
              <ArrowRight style={{ width:16,height:16 }} />
            </Link>
          </motion.div>

          

          {/* Admin Portal */}
          <motion.div initial={{ opacity:0,y:24 }} animate={inView?{opacity:1,y:0}:{}}
            transition={{ duration:0.5,delay:0.18 }}
            style={{ background:"linear-gradient(135deg,#FFFFFF 0%,#F8F4FF 100%)",border:"1px solid #E9E5F5",
              borderRadius:20,padding:"22px 20px",
              boxShadow:"0 12px 30px rgba(111,45,189,0.06)", height:"100%", display:"flex", flexDirection:"column" }}>
            <div style={{ width:44,height:44,borderRadius:12,
              background:"rgba(111,45,189,0.1)",border:"1.5px solid #DDD0F5",
              display:"flex",alignItems:"center",justifyContent:"center",marginBottom:14 }}>
              <BarChart2 style={{ width:22,height:22,color:"#6F2DBD" }} />
            </div>
            <div style={{ fontSize:10,fontWeight:700,letterSpacing:"0.1em",
              textTransform:"uppercase",color:"#9CA3AF",marginBottom:6 }}>For Analysts</div>
            <h3 style={{ fontSize:20,fontWeight:900,margin:"0 0 8px",
              color:"#1A1A2E",letterSpacing:"-0.01em" }}>Admin Portal</h3>
            <p style={{ fontSize:13.5,lineHeight:1.6,color:"#4B5563",margin:"0 0 16px" }}>
              Run seller evaluations, view analytics, audit decisions, manage the
              underwriting pipeline, and monitor system health across all sellers.
            </p>
            <div style={{ display:"flex",flexDirection:"column",gap:7,marginBottom:16 }}>
              {["Analytics & KPI dashboard","Full evaluation pipeline",
                "Decision history & audits","What-If simulator"].map(f=>(
                <div key={f} style={{ display:"flex",alignItems:"center",gap:8 }}>
                  <ShieldCheck style={{ width:13,height:13,color:"#6F2DBD",flexShrink:0 }} />
                  <span style={{ fontSize:12.5,color:"#4B5563" }}>{f}</span>
                </div>
              ))}
            </div>
            <Link to="/dashboard" style={{ display:"inline-flex",alignItems:"center",gap:8,
              padding:"10px 16px",borderRadius:12,fontSize:13.5,fontWeight:800,
              color:"#fff",background:"#6F2DBD",textDecoration:"none",
              boxShadow:"0 3px 12px rgba(111,45,189,0.24)", marginTop:"auto" }}>
              Enter Admin Portal
              <ArrowRight style={{ width:16,height:16 }} />
            </Link>
          </motion.div>


          {/* Create Seller */}
          <motion.div initial={{ opacity:0,y:24 }} animate={inView?{opacity:1,y:0}:{} }
            transition={{ duration:0.5,delay:0.18 }}
            style={{ background:"linear-gradient(135deg,#128C7E 0%,#25D366 100%)",
              borderRadius:20,padding:"22px 20px",color:"#fff",
              boxShadow:"0 14px 34px rgba(18,140,126,0.16)", border:"1px solid rgba(255,255,255,0.18)", height:"100%", display:"flex", flexDirection:"column" }}>
            <div style={{ width:44,height:44,borderRadius:12,
              background:"rgba(255,255,255,0.16)",display:"flex",
              alignItems:"center",justifyContent:"center",marginBottom:14 }}>
              <Sparkles style={{ width:22,height:22,color:"#fff" }} />
            </div>
            <div style={{ fontSize:10,fontWeight:700,letterSpacing:"0.1em",
              textTransform:"uppercase",opacity:0.9,marginBottom:6 }}>Seller Onboarding</div>
            <h3 style={{ fontSize:20,fontWeight:900,margin:"0 0 8px",
              letterSpacing:"-0.01em" }}>Create Seller</h3>
            <p style={{ fontSize:13.5,lineHeight:1.6,color:"rgba(255,255,255,0.95)",margin:"0 0 16px" }}>
              Your phone number has no Meesho seller history yet, so we need to create a profile and add business history here. After that, WhatsApp can deliver your evaluation directly from your number.
            </p>
            <div style={{ display:"flex",flexDirection:"column",gap:7,marginBottom:14,alignItems:"flex-start" }}>
              {['Store seller profile in MongoDB','WhatsApp connected phone number','Ready for loan evaluation'].map((f) => (
                <div key={f} style={{ display:"flex",alignItems:"center",gap:8 }}>
                  <Sparkles style={{ width:13,height:13,color:"#fff",flexShrink:0 }} />
                  <span style={{ fontSize:12.5,color:"rgba(255,255,255,0.95)" }}>{f}</span>
                </div>
              ))}
            </div>
            <p style={{ fontSize:12.5,lineHeight:1.6,color:"rgba(255,255,255,0.92)",marginBottom:16 }}>
              If your phone number already exists in Meesho’s database, the system can suggest your details automatically — then you don't need to fill all of this manually.
            </p>
            <div style={{ display:"flex",justifyContent:"flex-end" }}>
              <Link to="/create-seller" style={{ display:"inline-flex",alignItems:"center",gap:8,
                padding:"10px 16px",borderRadius:12,fontSize:13.5,fontWeight:800,
                color:"#128C7E",background:"#fff",textDecoration:"none",
                boxShadow:"0 3px 12px rgba(0,0,0,0.12)", marginTop:"auto" }}>
                Create Seller
                <ArrowRight style={{ width:16,height:16,color:"#128C7E" }} />
              </Link>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
