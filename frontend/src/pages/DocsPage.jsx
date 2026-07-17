/**
 * DocsPage — Full system architecture + API reference page.
 */
import { useState } from "react";
import { motion } from "framer-motion";
import { GitBranch, ExternalLink, ChevronDown, ChevronRight,
  Server, Database, Brain, Zap, Globe, MessageCircle, Shield } from "lucide-react";

const C = { purple:"#6F2DBD", p2:"#8B5CF6", orange:"#F59E0B", green:"#22C55E",
  text1:"#1A1A2E", text2:"#4B5563", muted:"#9CA3AF", border:"#E9E5F5", card:"#FFFFFF" };
const API_BASE_URL = (import.meta.env.VITE_API_URL || "http://localhost:3001").replace(/\/$/, "");
const card = (x={}) => ({ background:C.card, border:`1px solid ${C.border}`,
  borderRadius:16, boxShadow:"0 2px 16px rgba(111,45,189,0.07)", ...x });
const fu = (d=0) => ({ initial:{opacity:0,y:20}, animate:{opacity:1,y:0},
  transition:{duration:0.45,delay:d,ease:[0.22,1,0.36,1]} });

/* ── Architecture flow nodes ─────────────────────────────────── */
const FLOW = [
  { icon:Globe,      label:"React Frontend",     sub:"Vite + Tailwind + Framer Motion",      color:"#6F2DBD", port:":3000" },
  { icon:Server,     label:"Express Backend",    sub:"Node.js 22 + LangChain.js + Zod",      color:"#8B5CF6", port:":3001" },
  { icon:Brain,      label:"FastAPI ML Service", sub:"XGBoost + SHAP + Scikit-learn",         color:"#A855F7", port:":5001" },
  { icon:Zap,        label:"Groq LLM Agent",     sub:"llama-3.1-8b-instant via LangChain",   color:"#F59E0B", port:"cloud" },
  { icon:Database,   label:"MongoDB Atlas",      sub:"Decisions + Conversations",             color:"#22C55E", port:"cloud" },
  { icon:MessageCircle, label:"Twilio WhatsApp", sub:"Notification pipeline",                color:"#25D366", port:"cloud" },
  { icon:Shield,     label:"Rules Engine",       sub:"Deterministic RBI-compliant policies",  color:"#EF4444", port:"inline" },
];

/* ── API endpoints table ─────────────────────────────────────── */
const ENDPOINTS = [
  { method:"GET",  path:"/health",              desc:"Liveness probe — returns service name and version",        status:"200" },
  { method:"GET",  path:"/api-docs",            desc:"Swagger UI — interactive API documentation",              status:"200" },
  { method:"GET",  path:"/api/debug/groq",      desc:"Test Groq LLM connectivity and latency",                  status:"200" },
  { method:"POST", path:"/api/loan/evaluate",   desc:"Full underwriting pipeline — ML + Rules + AI + Storage",  status:"200" },
];

const METHOD_COLOR = { GET:"#16A34A", POST:"#2563EB", PUT:"#D97706", DELETE:"#DC2626" };

/* ── Request pipeline steps ─────────────────────────────────── */
const PIPELINE_STEPS = [
  { n:"01", title:"Zod Validation",            desc:"Validates all 12 seller metrics and seller_id with strict Zod schemas. Returns 400 on any failure.", color:C.purple },
  { n:"02", title:"ML Scoring (FastAPI)",       desc:"Calls XGBoost classifier (risk class) and regressor (loan limit). SHAP TreeExplainer returns top-5 features. 3 retries with 300ms backoff.", color:C.p2 },
  { n:"03", title:"Conversation History",       desc:"Fetches last 5 conversation turns from MongoDB. Returns [] gracefully if DB is unavailable.", color:"#A855F7" },
  { n:"04", title:"Rules Engine",               desc:"Deterministic: applies ₹1L cap, young account cap (₹50K for <6 months), dual-trigger rejection, and human review flag above ₹75K.", color:C.orange },
  { n:"05", title:"Groq LLM Agent",             desc:"LangChain tools pre-invoked. Single Groq chat/completions call generates seller_message, auditor_trail and improvement_plan as JSON.", color:"#F59E0B" },
  { n:"06", title:"Translation Fallback",       desc:"If Groq returns English for a non-English language request, Google Cloud Translate is used as fallback.", color:C.green },
  { n:"07", title:"MongoDB Persistence",        desc:"Saves Decision document + 2 Conversation turns (user + assistant). All operations have graceful fallback.", color:C.green },
  { n:"08", title:"Twilio Notification",        desc:"Builds WhatsApp payload and queues notification. Does not block response. Currently in placeholder mode.", color:"#25D366" },
];

/* ── Collapsible section ─────────────────────────────────────── */
function Section({ title, icon:Icon, color="#6F2DBD", children, defaultOpen=true, delay=0 }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <motion.div {...fu(delay)} style={{ ...card(), overflow:"hidden" }}>
      <button onClick={() => setOpen(!open)} style={{
        width:"100%", display:"flex", alignItems:"center", gap:12, padding:"18px 22px",
        background:"none", border:"none", cursor:"pointer", borderBottom: open ? `1px solid ${C.border}` : "none",
      }}>
        <div style={{ width:36,height:36,borderRadius:10,background:`${color}12`,
          display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0 }}>
          <Icon style={{ width:18,height:18,color }} />
        </div>
        <span style={{ fontSize:15,fontWeight:700,color:C.text1,flex:1,textAlign:"left" }}>{title}</span>
        {open
          ? <ChevronDown style={{ width:16,height:16,color:C.muted }} />
          : <ChevronRight style={{ width:16,height:16,color:C.muted }} />}
      </button>
      {open && <div style={{ padding:"20px 22px" }}>{children}</div>}
    </motion.div>
  );
}

export default function DocsPage() {
  return (
    <div style={{ display:"flex",flexDirection:"column",gap:24,maxWidth:1000 }}>

      {/* Header */}
      <motion.div {...fu(0)}>
        <div style={{ display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:12 }}>
          <div style={{ display:"flex",alignItems:"center",gap:12 }}>
            <div style={{ width:44,height:44,borderRadius:12,background:"rgba(111,45,189,0.1)",
              display:"flex",alignItems:"center",justifyContent:"center" }}>
              <GitBranch style={{ width:22,height:22,color:C.purple }} />
            </div>
            <div>
              <h1 style={{ fontSize:22,fontWeight:800,color:C.text1,margin:0 }}>Architecture</h1>
              <p style={{ fontSize:13,color:C.muted,margin:"2px 0 0" }}>System design, pipeline, and API reference</p>
            </div>
          </div>
          <a href={`${API_BASE_URL}/api-docs`} target="_blank" rel="noreferrer"
            style={{ display:"inline-flex",alignItems:"center",gap:7,padding:"9px 18px",
              borderRadius:10,fontSize:13,fontWeight:600,color:"#fff",
              background:"linear-gradient(135deg,#6F2DBD,#8B5CF6)",textDecoration:"none",
              boxShadow:"0 2px 10px rgba(111,45,189,0.3)" }}>
            Swagger UI <ExternalLink style={{ width:14,height:14 }} />
          </a>
        </div>
      </motion.div>

      {/* Architecture flow */}
      <Section title="System Architecture" icon={Server} color={C.purple} delay={0.06}>
        <div style={{ display:"flex",flexDirection:"column",gap:0 }}>
          {FLOW.map((node,i) => {
            const Icon = node.icon;
            const isLast = i === FLOW.length - 1;
            return (
              <div key={node.label} style={{ display:"flex",gap:16,alignItems:"flex-start" }}>
                <div style={{ display:"flex",flexDirection:"column",alignItems:"center",flexShrink:0 }}>
                  <div style={{ width:40,height:40,borderRadius:12,
                    background:`${node.color}14`,border:`1.5px solid ${node.color}35`,
                    display:"flex",alignItems:"center",justifyContent:"center" }}>
                    <Icon style={{ width:18,height:18,color:node.color }} />
                  </div>
                  {!isLast && <div style={{ width:2,height:28,background:`linear-gradient(180deg,${node.color}40,${FLOW[i+1].color}40)`,borderRadius:1 }} />}
                </div>
                <div style={{ paddingBottom: isLast ? 0 : 20, paddingTop:8, flex:1 }}>
                  <div style={{ display:"flex",alignItems:"center",gap:10,flexWrap:"wrap" }}>
                    <span style={{ fontSize:14,fontWeight:700,color:C.text1 }}>{node.label}</span>
                    <span style={{ fontSize:11,fontWeight:600,padding:"2px 8px",borderRadius:20,
                      color:node.color,background:`${node.color}12`,border:`1px solid ${node.color}25` }}>
                      {node.port}
                    </span>
                  </div>
                  <p style={{ fontSize:13,color:C.text2,margin:"3px 0 0",lineHeight:1.5 }}>{node.sub}</p>
                </div>
              </div>
            );
          })}
        </div>
        {/* Request flow strip */}
        <div style={{ marginTop:20,padding:"14px 16px",background:"#F8F4FF",
          borderRadius:12,border:"1px solid #E9E5F5" }}>
          <div style={{ fontSize:11,fontWeight:700,color:C.muted,textTransform:"uppercase",
            letterSpacing:"0.06em",marginBottom:10 }}>Request Flow</div>
          <div style={{ display:"flex",flexWrap:"wrap",gap:6,alignItems:"center" }}>
            {["React","→","Express :3001","→","FastAPI :5001","→","XGBoost+SHAP","→","Rules Engine","→","Groq LLM","→","MongoDB","→","Twilio"].map((item,i)=>(
              <span key={i} style={item==="→"
                ? { color:C.muted,fontSize:13 }
                : { padding:"4px 10px",borderRadius:8,fontSize:12,fontWeight:600,
                    color:C.purple,background:"rgba(111,45,189,0.08)",border:"1px solid #DDD0F5" }}>
                {item}
              </span>
            ))}
          </div>
        </div>
      </Section>

      {/* Pipeline steps */}
      <Section title="Evaluation Pipeline (POST /api/loan/evaluate)" icon={Zap} color={C.orange} delay={0.1}>
        <div style={{ display:"flex",flexDirection:"column",gap:12 }}>
          {PIPELINE_STEPS.map((s,i) => (
            <motion.div key={s.n}
              initial={{ opacity:0,x:-12 }} animate={{ opacity:1,x:0 }}
              transition={{ delay:0.12+i*0.05,duration:0.35 }}
              style={{ display:"flex",gap:14,padding:"14px 16px",
                borderRadius:12,background:"#FAFAFA",border:`1px solid ${C.border}` }}>
              <div style={{ width:28,height:28,borderRadius:8,flexShrink:0,
                background:`${s.color}12`,display:"flex",alignItems:"center",
                justifyContent:"center",fontSize:11,fontWeight:800,color:s.color }}>
                {s.n}
              </div>
              <div>
                <div style={{ fontSize:13,fontWeight:700,color:C.text1,marginBottom:3 }}>{s.title}</div>
                <div style={{ fontSize:12,color:C.text2,lineHeight:1.6 }}>{s.desc}</div>
              </div>
            </motion.div>
          ))}
        </div>
      </Section>

      {/* API Endpoints */}
      <Section title="API Endpoints" icon={Globe} color={C.p2} delay={0.14}>
        <table style={{ width:"100%",borderCollapse:"collapse" }}>
          <thead>
            <tr style={{ borderBottom:`1px solid ${C.border}` }}>
              {["Method","Endpoint","Description","Status"].map(h=>(
                <th key={h} style={{ padding:"8px 12px",fontSize:12,fontWeight:700,
                  color:C.muted,textAlign:"left",whiteSpace:"nowrap" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {ENDPOINTS.map((ep,i) => (
              <tr key={ep.path} style={{ borderBottom: i<ENDPOINTS.length-1?`1px solid ${C.border}`:"none" }}>
                <td style={{ padding:"12px 12px",whiteSpace:"nowrap" }}>
                  <span style={{ padding:"3px 10px",borderRadius:6,fontSize:12,fontWeight:700,
                    color:"#fff",background:METHOD_COLOR[ep.method] }}>
                    {ep.method}
                  </span>
                </td>
                <td style={{ padding:"12px 12px",fontFamily:"monospace",fontSize:13,
                  fontWeight:600,color:C.purple,whiteSpace:"nowrap" }}>{ep.path}</td>
                <td style={{ padding:"12px 12px",fontSize:13,color:C.text2,lineHeight:1.5 }}>{ep.desc}</td>
                <td style={{ padding:"12px 12px",textAlign:"center" }}>
                  <span style={{ fontSize:12,fontWeight:700,color:"#16A34A",
                    background:"rgba(34,197,94,0.1)",padding:"2px 8px",borderRadius:20 }}>
                    {ep.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <div style={{ marginTop:16,display:"flex",gap:10,flexWrap:"wrap" }}>
          <span style={{ fontSize:12,color:C.muted }}>Base URL:</span>
          <code style={{ fontSize:12,fontFamily:"monospace",color:C.purple,
            background:"rgba(111,45,189,0.08)",padding:"2px 10px",borderRadius:6 }}>
            {API_BASE_URL}
          </code>
          <span style={{ fontSize:12,color:C.muted }}>ML Service:</span>
          <code style={{ fontSize:12,fontFamily:"monospace",color:C.p2,
            background:"rgba(139,92,246,0.08)",padding:"2px 10px",borderRadius:6 }}>
            http://localhost:5001
          </code>
        </div>
      </Section>

      {/* Tech stack */}
      <Section title="Tech Stack" icon={Database} color={C.green} delay={0.18} defaultOpen={false}>
        <div style={{ display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(200px,1fr))",gap:10 }}>
          {[
            ["React 18 + Vite","Frontend SPA",C.purple],
            ["Tailwind CSS","Design system",C.p2],
            ["Framer Motion","Animations",C.p2],
            ["Node.js 22","Backend runtime",C.purple],
            ["Express.js","HTTP framework",C.p2],
            ["LangChain.js","Agent orchestration",C.orange],
            ["Groq llama-3.1-8b","LLM inference",C.orange],
            ["XGBoost","Risk classification",C.green],
            ["SHAP","Explainability",C.green],
            ["FastAPI","ML microservice",C.green],
            ["MongoDB Atlas","Database",C.green],
            ["Mongoose","ODM layer",C.green],
            ["Zod","Input validation",C.purple],
            ["Twilio","WhatsApp API",C.green],
            ["Winston","Structured logging",C.p2],
            ["Docker Compose","Orchestration",C.p2],
          ].map(([name,desc,color])=>(
            <div key={name} style={{ display:"flex",flexDirection:"column",gap:3,
              padding:"10px 12px",borderRadius:10,
              background:`${color}06`,border:`1px solid ${color}18` }}>
              <span style={{ fontSize:13,fontWeight:700,color:C.text1 }}>{name}</span>
              <span style={{ fontSize:11,color:C.muted }}>{desc}</span>
            </div>
          ))}
        </div>
      </Section>
    </div>
  );
}
