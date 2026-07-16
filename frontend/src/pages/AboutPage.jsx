/**
 * AboutPage — full about page for Pragati Agent.
 */
import { motion } from "framer-motion";
import { Info, Users, Target, Sparkles, ShieldCheck, Globe, Award } from "lucide-react";

const C = { purple:"#6F2DBD", p2:"#8B5CF6", orange:"#F59E0B", green:"#22C55E",
  text1:"#1A1A2E", text2:"#4B5563", muted:"#9CA3AF", border:"#E9E5F5", card:"#FFFFFF" };
const card = (x={}) => ({ background:C.card, border:`1px solid ${C.border}`,
  borderRadius:16, boxShadow:"0 2px 16px rgba(111,45,189,0.07)", ...x });
const fu = (d=0) => ({ initial:{opacity:0,y:20}, animate:{opacity:1,y:0},
  transition:{duration:0.45,delay:d,ease:[0.22,1,0.36,1]} });

const TEAM = [
  { name:"Anushka Sunil Jadhav", role:"Lead Developer — Full Stack + AI + ML", initials:"AS" },
];

const FEATURES = [
  { icon:Sparkles, title:"Agentic AI Pipeline",     desc:"LangChain + Groq Llama 3.1 orchestrated through 5 tools for autonomous underwriting.", color:C.purple },
  { icon:ShieldCheck,title:"Explainable Decisions",  desc:"SHAP values map every ML prediction to human-readable factors. No black boxes.",          color:C.green  },
  { icon:Globe,    title:"8 Indian Languages",       desc:"Hindi, Tamil, Telugu, Kannada, Marathi, Gujarati, Malayalam and English supported.",      color:C.p2     },
  { icon:Target,   title:"Fair Lending",             desc:"Meesho performance metrics replace CIBIL bias. Built for Bharat's micro-entrepreneurs.", color:C.orange },
];

export default function AboutPage() {
  return (
    <div style={{ display:"flex",flexDirection:"column",gap:24,maxWidth:900 }}>

      {/* Header */}
      <motion.div {...fu(0)}>
        <div style={{ display:"flex",alignItems:"center",gap:12 }}>
          <div style={{ width:44,height:44,borderRadius:12,background:"rgba(111,45,189,0.1)",
            display:"flex",alignItems:"center",justifyContent:"center" }}>
            <Info style={{ width:22,height:22,color:C.purple }} />
          </div>
          <div>
            <h1 style={{ fontSize:22,fontWeight:800,color:C.text1,margin:0 }}>About Pragati Agent</h1>
            <p style={{ fontSize:13,color:C.muted,margin:"2px 0 0" }}>
              Meesho ScriptedBy Her 2.0 — Hackathon Project 2026
            </p>
          </div>
        </div>
      </motion.div>

      {/* Hero card — PPT style */}
      <motion.div {...fu(0.06)} style={{ ...card({padding:0,overflow:"hidden"}) }}>
        <div style={{ background:"linear-gradient(135deg,#6F2DBD 0%,#8B5CF6 100%)",
          padding:"32px 36px",color:"#fff" }}>
          <div style={{ display:"flex",alignItems:"center",gap:12,marginBottom:16 }}>
            <div style={{ width:48,height:48,borderRadius:14,background:"rgba(255,255,255,0.18)",
              display:"flex",alignItems:"center",justifyContent:"center" }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path d="M12 3L21 7.5V16.5L12 21L3 16.5V7.5L12 3Z" fill="white" fillOpacity="0.95"/>
                <circle cx="12" cy="12" r="4" fill="white"/>
              </svg>
            </div>
            <div>
              <div style={{ fontSize:20,fontWeight:900,letterSpacing:"-0.01em" }}>Meesho Pragati Agent</div>
              <div style={{ fontSize:13,opacity:0.75 }}>Agentic AI for Inclusive Seller Lending in Bharat</div>
            </div>
          </div>
          <p style={{ fontSize:15,lineHeight:1.75,opacity:0.88,margin:0,maxWidth:680 }}>
            An autonomous AI agent that analyzes a seller's real business performance on Meesho,
            recommends fair working capital, provides transparent financial decisions, and continuously
            coaches sellers to grow their business — instead of rejecting them just because they don't
            have a traditional bank credit score.
          </p>
        </div>

        {/* Info rows — PPT style */}
        <div style={{ padding:"20px 36px" }}>
          {[
            { label:"Theme",       value:"Building for Bharat with the Power of Agentic AI", accent:C.orange },
            { label:"Target Area", value:"Meesho Finance (MPPL) and NBFC Lending Partners",  accent:C.purple },
            { label:"Team",        value:"Anushka's Team 2",                                  accent:C.purple },
            { label:"Name",        value:"Anushka Sunil Jadhav",                              accent:C.purple },
          ].map(row=>(
            <div key={row.label} style={{ display:"flex",alignItems:"flex-start",gap:8,
              padding:"10px 0",borderBottom:`1px solid ${C.border}` }}
              className="last:border-0">
              <span style={{ fontSize:14,fontWeight:800,color:row.accent,flexShrink:0,minWidth:90 }}>
                {row.label}:
              </span>
              <span style={{ fontSize:14,color:C.text1,fontWeight:500 }}>{row.value}</span>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Key features */}
      <motion.div {...fu(0.1)}>
        <div style={{ fontSize:13,fontWeight:700,color:C.muted,textTransform:"uppercase",
          letterSpacing:"0.05em",marginBottom:14 }}>Key Capabilities</div>
        <div style={{ display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(200px,1fr))",gap:14 }}>
          {FEATURES.map((f,i) => {
            const Icon = f.icon;
            return (
              <motion.div key={f.title} {...fu(0.12+i*0.06)} style={{ ...card(),padding:20 }}>
                <div style={{ width:38,height:38,borderRadius:10,marginBottom:12,
                  background:`${f.color}10`,border:`1px solid ${f.color}20`,
                  display:"flex",alignItems:"center",justifyContent:"center" }}>
                  <Icon style={{ width:18,height:18,color:f.color }} />
                </div>
                <div style={{ fontSize:14,fontWeight:700,color:C.text1,marginBottom:5 }}>{f.title}</div>
                <div style={{ fontSize:13,color:C.text2,lineHeight:1.6 }}>{f.desc}</div>
              </motion.div>
            );
          })}
        </div>
      </motion.div>

      {/* Team */}
      <motion.div {...fu(0.18)}>
        <div style={{ fontSize:13,fontWeight:700,color:C.muted,textTransform:"uppercase",
          letterSpacing:"0.05em",marginBottom:14 }}>Team</div>
        {TEAM.map(m=>(
          <div key={m.name} style={{ ...card(),padding:20,display:"flex",alignItems:"center",gap:16 }}>
            <div style={{ width:56,height:56,borderRadius:16,flexShrink:0,
              background:"linear-gradient(135deg,#6F2DBD,#8B5CF6)",
              display:"flex",alignItems:"center",justifyContent:"center",
              fontSize:18,fontWeight:900,color:"#fff",
              boxShadow:"0 3px 14px rgba(111,45,189,0.28)" }}>{m.initials}</div>
            <div>
              <div style={{ fontSize:16,fontWeight:800,color:C.text1 }}>{m.name}</div>
              <div style={{ fontSize:13,color:C.muted,marginTop:3 }}>{m.role}</div>
            </div>
            <div style={{ marginLeft:"auto",padding:"5px 12px",borderRadius:20,
              fontSize:12,fontWeight:700,color:C.purple,
              background:"rgba(111,45,189,0.08)",border:"1px solid #DDD0F5" }}>
              Hackathon 2026
            </div>
          </div>
        ))}
      </motion.div>

      {/* Hackathon badge */}
      <motion.div {...fu(0.22)} style={{ ...card({padding:24,
        background:"linear-gradient(135deg,#FFFBEB,#FEF3C7)",
        border:"1px solid #FDE68A"}) }}>
        <div style={{ display:"flex",alignItems:"center",gap:12 }}>
          <Award style={{ width:28,height:28,color:C.orange,flexShrink:0 }} />
          <div>
            <div style={{ fontSize:15,fontWeight:800,color:"#92400E" }}>
              Meesho ScriptedBy Her 2.0
            </div>
            <div style={{ fontSize:13,color:"#A16207",marginTop:2 }}>
              She Codes, She Conquers — National Hackathon for Women in Tech
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
