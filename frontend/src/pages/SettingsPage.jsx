/**
 * SettingsPage — Application settings for the admin portal.
 */
import { useState } from "react";
import { motion } from "framer-motion";
import { Settings, Wifi, Brain, Database, Bell, Shield, ChevronRight,
  CheckCircle, AlertCircle, RefreshCw } from "lucide-react";
import { checkHealth } from "../services/api";

const C = { purple:"#6F2DBD", p2:"#8B5CF6", orange:"#F59E0B", green:"#22C55E",
  red:"#EF4444", text1:"#1A1A2E", text2:"#4B5563", muted:"#9CA3AF",
  border:"#E9E5F5", card:"#FFFFFF" };
const card = (x={}) => ({ background:C.card, border:`1px solid ${C.border}`,
  borderRadius:16, boxShadow:"0 2px 16px rgba(111,45,189,0.07)", ...x });
const fu = (d=0) => ({ initial:{opacity:0,y:20}, animate:{opacity:1,y:0},
  transition:{duration:0.45,delay:d,ease:[0.22,1,0.36,1]} });

/* ── Toggle switch ─────────────────────────────────────────── */
function Toggle({ checked, onChange }) {
  return (
    <button onClick={() => onChange(!checked)} style={{
      width:44, height:24, borderRadius:12, padding:2, border:"none", cursor:"pointer",
      background: checked ? C.purple : "#D1D5DB", transition:"background 0.2s",
      display:"flex", alignItems:"center",
    }}>
      <motion.div animate={{ x: checked ? 20 : 0 }} transition={{ type:"spring", stiffness:400, damping:25 }}
        style={{ width:20, height:20, borderRadius:"50%", background:"#fff",
          boxShadow:"0 1px 4px rgba(0,0,0,0.2)" }} />
    </button>
  );
}

/* ── Setting row ─────────────────────────────────────────── */
function SettingRow({ label, desc, value, onChange, type="toggle" }) {
  const [focus, setFocus] = useState(false);
  if (type === "toggle") return (
    <div style={{ display:"flex",alignItems:"center",justifyContent:"space-between",
      padding:"14px 0",borderBottom:`1px solid ${C.border}` }}>
      <div>
        <div style={{ fontSize:14,fontWeight:600,color:C.text1 }}>{label}</div>
        {desc && <div style={{ fontSize:12,color:C.muted,marginTop:2 }}>{desc}</div>}
      </div>
      <Toggle checked={value} onChange={onChange} />
    </div>
  );
  if (type === "input") return (
    <div style={{ padding:"14px 0",borderBottom:`1px solid ${C.border}` }}>
      <div style={{ fontSize:14,fontWeight:600,color:C.text1,marginBottom:6 }}>{label}</div>
      {desc && <div style={{ fontSize:12,color:C.muted,marginBottom:8 }}>{desc}</div>}
      <input value={value} onChange={e => onChange(e.target.value)}
        onFocus={() => setFocus(true)} onBlur={() => setFocus(false)}
        style={{ width:"100%",padding:"9px 12px",borderRadius:10,fontSize:13,
          border:`1.5px solid ${focus ? C.purple : C.border}`,background:"#fff",
          color:C.text1,outline:"none",boxSizing:"border-box",
          maxWidth:360,transition:"border-color 0.2s" }} />
    </div>
  );
  return null;
}

/* ── System status row ─────────────────────────────────────── */
function StatusRow({ label, online, onCheck, checking }) {
  return (
    <div style={{ display:"flex",alignItems:"center",justifyContent:"space-between",
      padding:"12px 0",borderBottom:`1px solid ${C.border}` }}>
      <div style={{ display:"flex",alignItems:"center",gap:8 }}>
        <span style={{ width:8,height:8,borderRadius:"50%",flexShrink:0,
          background: online===null?"#D1D5DB":online?C.green:C.red }} />
        <span style={{ fontSize:14,fontWeight:500,color:C.text1 }}>{label}</span>
      </div>
      <div style={{ display:"flex",alignItems:"center",gap:8 }}>
        <span style={{ fontSize:12,fontWeight:600,
          color: online===null?C.muted:online?"#16A34A":"#DC2626",
          padding:"2px 10px",borderRadius:20,
          background: online===null?"#F3F4F6":online?"rgba(34,197,94,0.1)":"rgba(239,68,68,0.1)" }}>
          {online===null?"Unknown":online?"Online":"Offline"}
        </span>
        {onCheck && (
          <button onClick={onCheck} disabled={checking}
            style={{ padding:"5px 10px",borderRadius:8,fontSize:12,fontWeight:600,
              color:C.purple,background:"rgba(111,45,189,0.08)",border:"1px solid #DDD0F5",
              cursor:"pointer",display:"flex",alignItems:"center",gap:4 }}>
            <RefreshCw style={{ width:12,height:12,
              animation:checking?"spin 1s linear infinite":"none" }} />
            Check
          </button>
        )}
      </div>
    </div>
  );
}

export default function SettingsPage() {
  const [notifs,   setNotifs]   = useState(true);
  const [fallback, setFallback] = useState(true);
  const [audit,    setAudit]    = useState(true);
  const [rateLimit,setRateLimit]= useState(true);
  const [apiUrl,   setApiUrl]   = useState("http://localhost:3001");
  const [mlUrl,    setMlUrl]    = useState("http://localhost:5001");
  const [saved,    setSaved]    = useState(false);
  const [beStatus, setBeStatus] = useState(null);
  const [checking, setChecking] = useState(false);

  async function checkBackend() {
    setChecking(true);
    try { await checkHealth(); setBeStatus(true); }
    catch { setBeStatus(false); }
    finally { setChecking(false); }
  }

  function saveSettings() {
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  }

  return (
    <div style={{ display:"flex",flexDirection:"column",gap:24,maxWidth:760 }}>
      <style>{`@keyframes spin{to{transform:rotate(360deg);}}`}</style>

      {/* Header */}
      <motion.div {...fu(0)}>
        <div style={{ display:"flex",alignItems:"center",gap:12 }}>
          <div style={{ width:44,height:44,borderRadius:12,background:"rgba(111,45,189,0.1)",
            display:"flex",alignItems:"center",justifyContent:"center" }}>
            <Settings style={{ width:22,height:22,color:C.purple }} />
          </div>
          <div>
            <h1 style={{ fontSize:22,fontWeight:800,color:C.text1,margin:0 }}>Settings</h1>
            <p style={{ fontSize:13,color:C.muted,margin:"2px 0 0" }}>Configure application preferences</p>
          </div>
        </div>
      </motion.div>

      {/* System Connectivity */}
      <motion.div {...fu(0.06)} style={{ ...card(),padding:24 }}>
        <div style={{ display:"flex",alignItems:"center",gap:10,marginBottom:16 }}>
          <Wifi style={{ width:18,height:18,color:C.purple }} />
          <span style={{ fontSize:15,fontWeight:700,color:C.text1 }}>System Connectivity</span>
        </div>
        <StatusRow label="Express Backend (localhost:3001)" online={beStatus} onCheck={checkBackend} checking={checking} />
        <StatusRow label="FastAPI ML Service (localhost:5001)" online={null} />
        <StatusRow label="Groq AI (api.groq.com)" online={null} />
        <StatusRow label="MongoDB Atlas" online={null} />

        <div style={{ marginTop:16,display:"flex",flexDirection:"column",gap:4 }}>
          <SettingRow label="Backend API URL" desc="Express server base URL" value={apiUrl} onChange={setApiUrl} type="input" />
          <SettingRow label="ML Service URL"  desc="FastAPI inference service URL" value={mlUrl} onChange={setMlUrl} type="input" />
        </div>
      </motion.div>

      {/* AI Agent settings */}
      <motion.div {...fu(0.1)} style={{ ...card(),padding:24 }}>
        <div style={{ display:"flex",alignItems:"center",gap:10,marginBottom:16 }}>
          <Brain style={{ width:18,height:18,color:C.orange }} />
          <span style={{ fontSize:15,fontWeight:700,color:C.text1 }}>AI Agent Configuration</span>
        </div>
        <SettingRow label="Enable ML Fallback Score"
          desc="Use deterministic scoring when FastAPI is unavailable"
          value={fallback} onChange={setFallback} />
        <SettingRow label="Enable Groq Agent Fallback"
          desc="Return hardcoded response when Groq is unavailable"
          value={true} onChange={()=>{}} />
        <div style={{ padding:"12px 14px",borderRadius:10,background:"#FFFBEB",
          border:"1px solid #FDE68A",marginTop:8 }}>
          <div style={{ display:"flex",gap:8,alignItems:"flex-start" }}>
            <AlertCircle style={{ width:15,height:15,color:C.orange,flexShrink:0,marginTop:1 }} />
            <p style={{ fontSize:12,color:"#92400E",margin:0,lineHeight:1.5 }}>
              Model: <strong>llama-3.1-8b-instant</strong> via Groq.
              Max tokens: 512. Temperature: 0.2. One retry on 429/timeout.
            </p>
          </div>
        </div>
      </motion.div>

      {/* Notifications */}
      <motion.div {...fu(0.14)} style={{ ...card(),padding:24 }}>
        <div style={{ display:"flex",alignItems:"center",gap:10,marginBottom:16 }}>
          <Bell style={{ width:18,height:18,color:C.p2 }} />
          <span style={{ fontSize:15,fontWeight:700,color:C.text1 }}>Notifications</span>
        </div>
        <SettingRow label="WhatsApp Notifications"
          desc="Queue Twilio WhatsApp messages after each evaluation"
          value={notifs} onChange={setNotifs} />
        <SettingRow label="Audit Trail Logging"
          desc="Save auditor trail to MongoDB for every decision"
          value={audit} onChange={setAudit} />
      </motion.div>

      {/* Security */}
      <motion.div {...fu(0.18)} style={{ ...card(),padding:24 }}>
        <div style={{ display:"flex",alignItems:"center",gap:10,marginBottom:16 }}>
          <Shield style={{ width:18,height:18,color:C.green }} />
          <span style={{ fontSize:15,fontWeight:700,color:C.text1 }}>Security</span>
        </div>
        <SettingRow label="Rate Limiting"
          desc="100 requests per 15 minutes per IP (Helmet + express-rate-limit)"
          value={rateLimit} onChange={setRateLimit} />
        <SettingRow label="CORS Restriction"
          desc="Restrict API to localhost:3000 and localhost:5173"
          value={true} onChange={()=>{}} />
        <div style={{ display:"flex",flexWrap:"wrap",gap:6,marginTop:14 }}>
          {["Helmet","CORS","Rate Limit","Compression","Request Logging"].map(t=>(
            <span key={t} style={{ padding:"3px 10px",borderRadius:8,fontSize:12,fontWeight:600,
              color:C.green,background:"rgba(34,197,94,0.1)",border:"1px solid rgba(34,197,94,0.2)" }}>
              {t}
            </span>
          ))}
        </div>
      </motion.div>

      {/* Save button */}
      <motion.div {...fu(0.22)}>
        <button onClick={saveSettings} style={{
          padding:"13px 32px",borderRadius:12,fontSize:14,fontWeight:800,
          color:"#fff",background:saved?"#22C55E":"linear-gradient(135deg,#6F2DBD,#8B5CF6)",
          border:"none",cursor:"pointer",boxShadow:"0 3px 14px rgba(111,45,189,0.28)",
          display:"flex",alignItems:"center",gap:8,transition:"all 0.3s" }}>
          {saved
            ? <><CheckCircle style={{width:16,height:16}}/>Settings saved!</>
            : <><Settings style={{width:16,height:16}}/>Save Settings</>}
        </button>
      </motion.div>
    </div>
  );
}
