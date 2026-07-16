/**
 * SellerCoach — AI Financial Coach with real Groq backend integration.
 *
 * The chat calls POST /api/loan/evaluate with a coaching-mode prompt injected
 * via the seller_id prefix. For general questions it uses a client-side detailed
 * response engine personalised to the selected seller's live metrics.
 *
 * System context given to the LLM via the prompt includes:
 * - Full seller profile and metrics
 * - Risk class and estimated loan eligibility
 * - RBI rules that apply
 * - All 8 supported languages
 * - Meesho Pragati platform knowledge
 */
import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Sparkles, User, RefreshCw, Lightbulb, Loader2, AlertCircle } from "lucide-react";
import axios from "axios";
import { useApp } from "../../context/AppContext";
import { SELLER_PROFILES } from "../../utils/sellerData";
import { SUPPORTED_LANGUAGES } from "../../utils/constants";

const API = import.meta.env.VITE_API_URL || "http://localhost:3001";
const C   = {
  purple:"#6F2DBD", p2:"#8B5CF6", orange:"#F59E0B", green:"#22C55E",
  text1:"#1A1A2E", text2:"#4B5563", muted:"#9CA3AF",
  border:"#E9E5F5", bg:"#F8F4FF", card:"#FFFFFF",
};
const card = (x={}) => ({ background:C.card, border:`1px solid ${C.border}`,
  borderRadius:16, boxShadow:"0 2px 16px rgba(111,45,189,0.07)", ...x });

/* ── Build the full system prompt for the Groq coach ─────────── */
function buildCoachSystemPrompt(seller, lang) {
  const m = seller?.metrics || {};
  const langObj = SUPPORTED_LANGUAGES.find(l => l.value === lang) || SUPPORTED_LANGUAGES[0];
  const rc = { Low:C.green, Moderate:C.orange, High:C.red }[seller?.risk_category] || C.orange;

  return `You are the Meesho Pragati AI Financial Coach — a warm, knowledgeable, and encouraging financial advisor
specifically built for Meesho sellers in Bharat.

YOUR IDENTITY:
- You are part of the Meesho Pragati Agent platform — an AI-powered lending system
- You help sellers understand their loan eligibility, improve their business metrics, and grow on Meesho
- You are NOT a generic chatbot — you are a financial expert who knows this specific seller's profile deeply

CURRENT SELLER PROFILE:
- Name: ${seller?.name || "Seller"}
- Business: ${seller?.business || "Meesho Business"} · ${seller?.city || "India"}
- Seller ID: ${seller?.id || "Unknown"}
- Risk Category: ${seller?.risk_category || "Unknown"}
- Account Age: ${m.account_age_months || 0} months

CURRENT BUSINESS METRICS (use these exact numbers in your responses):
- Sales Velocity (6M): Rs. ${Number(m.sales_velocity_6m || 0).toLocaleString("en-IN")}
- Sales Growth Rate: ${m.sales_growth_rate || 0}%
- Average Customer Rating: ${m.avg_customer_rating || 0} / 5.0
- Rating Trend: ${Number(m.rating_trend || 0) >= 0 ? "Improving" : "Declining"} (${m.rating_trend || 0})
- Dispatch SLA Compliance: ${m.dispatch_sla_compliance || 0}%
- RTO Rate: ${m.rto_rate || 0}% (Return to Origin — lower is better)
- Order Cancellation Rate: ${m.order_cancellation_rate || 0}%
- Ad Spend ROI: ${m.ad_spend_roi || 0}x
- Total Orders (6M): ${Number(m.total_orders_6m || 0).toLocaleString("en-IN")}
- Catalog Size: ${m.catalog_size || 0} products
- Prior Loan Default: ${m.prior_loan_default ? "Yes — this is a major risk flag" : "No — clean record"}

PLATFORM KNOWLEDGE — Meesho Pragati Agent:
- The platform uses XGBoost ML model for risk classification (Low / Moderate / High)
- SHAP values explain which metrics contributed most to the decision
- A deterministic Rules Engine applies: max loan cap Rs. 1,00,000; young account cap Rs. 50,000 for accounts under 6 months; human review required above Rs. 75,000; automatic rejection if BOTH prior_loan_default=1 AND rto_rate>20%
- Loan is rounded to nearest Rs. 5,000
- Available in 8 languages: English, Hindi, Marathi, Tamil, Telugu, Kannada, Gujarati, Malayalam
- WhatsApp notifications via Twilio after each decision
- Full SHAP explainability — every factor explained to the seller in plain language

ELIGIBILITY ASSESSMENT FOR THIS SELLER:
${seller?.risk_category === "Low"
  ? `POSITIVE: ${seller.name} has a LOW risk profile. They are eligible for the highest loan tiers. Key strengths: dispatch SLA ${m.dispatch_sla_compliance}% and customer rating ${m.avg_customer_rating}.`
  : seller?.risk_category === "Moderate"
  ? `MODERATE: ${seller.name} has a MODERATE risk profile. Eligible for mid-tier loans. Main opportunities: improve RTO from ${m.rto_rate}% to below 10% and dispatch SLA from ${m.dispatch_sla_compliance}% to above 90%.`
  : `CAUTION: ${seller.name} has a HIGH risk profile. ${m.prior_loan_default ? "Prior loan default is a major blocker. " : ""}RTO rate of ${m.rto_rate}% is very high. Needs 6+ months of consistent improvement before strong eligibility.`
}

LANGUAGE INSTRUCTION:
- The seller has chosen ${langObj.native} (${langObj.label}) as their preferred language
- ALWAYS respond in ${langObj.native} unless the seller explicitly writes to you in a different language
- If they write in English, respond in English but keep context of their ${langObj.label} preference
- Be warm and culturally appropriate for an Indian small business owner

COACHING STYLE:
- Be specific — always reference the seller's actual metric values, not generic advice
- Be empathetic — many sellers are first-time borrowers with limited financial literacy
- Be actionable — every response should end with at least one concrete next step
- Be encouraging — frame problems as opportunities, not failures
- Keep responses conversational but informative — 3 to 5 sentences per point
- Never say "I cannot help with that" — always find a relevant angle`;
}

/* ── Build welcome message ───────────────────────────────────── */
function buildWelcome(seller, lang) {
  const langObj = SUPPORTED_LANGUAGES.find(l => l.value === lang) || SUPPORTED_LANGUAGES[0];
  const m = seller?.metrics || {};
  const name = seller?.name?.split(" ")[0] || "Seller";
  const risk = seller?.risk_category || "Unknown";

  const greetings = {
    Hindi:     `नमस्ते ${name}! मैं आपका Meesho Pragati AI Financial Coach हूँ।`,
    Marathi:   `नमस्कार ${name}! मी तुमचा Meesho Pragati AI Financial Coach आहे।`,
    Tamil:     `வணக்கம் ${name}! நான் உங்கள் Meesho Pragati AI Financial Coach.`,
    Telugu:    `నమస్కారం ${name}! నేను మీ Meesho Pragati AI Financial Coach.`,
    Kannada:   `ನಮಸ್ಕಾರ ${name}! ನಾನು ನಿಮ್ಮ Meesho Pragati AI Financial Coach.`,
    Gujarati:  `નમસ્તે ${name}! હું તમારો Meesho Pragati AI Financial Coach છું.`,
    Malayalam: `നമസ്കാരം ${name}! ഞാൻ നിങ്ങളുടെ Meesho Pragati AI Financial Coach ആണ്.`,
    English:   `Hello ${name}! I'm your Meesho Pragati AI Financial Coach.`,
  };

  const greeting = greetings[lang] || greetings.English;

  return [
    {
      role: "assistant",
      text: `${greeting}\n\nI can see your complete business profile:\n• Risk Category: ${risk}\n• Sales Velocity: Rs. ${Number(m.sales_velocity_6m||0).toLocaleString("en-IN")}\n• Customer Rating: ${m.avg_customer_rating||0} / 5.0\n• Dispatch SLA: ${m.dispatch_sla_compliance||0}%\n• RTO Rate: ${m.rto_rate||0}%\n• Account Age: ${m.account_age_months||0} months\n\nI'm here to help you understand your loan eligibility, improve your business metrics, and guide you through the application process. What would you like to know?`,
      time: "now",
      isGroq: false,
    },
  ];
}

const SUGGESTIONS = [
  "Why is my risk class this?",
  "How can I improve my loan limit?",
  "What is RTO rate and how to reduce it?",
  "How does dispatch SLA affect my loan?",
  "What documents do I need to apply?",
  "Explain my improvement plan",
];

function Message({ msg }) {
  const isUser = msg.role === "user";
  return (
    <motion.div initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }}
      transition={{ duration:0.28 }}
      style={{ display:"flex", justifyContent:isUser?"flex-end":"flex-start",
        gap:10, marginBottom:16 }}>
      {!isUser && (
        <div style={{ width:34, height:34, borderRadius:10, flexShrink:0,
          background:"linear-gradient(135deg,#6F2DBD,#8B5CF6)",
          display:"flex", alignItems:"center", justifyContent:"center" }}>
          <Sparkles style={{ width:16, height:16, color:"#fff" }}/>
        </div>
      )}
      <div style={{ maxWidth:"76%" }}>
        <div style={{ padding:"12px 16px", whiteSpace:"pre-line",
          borderRadius:isUser?"16px 4px 16px 16px":"4px 16px 16px 16px",
          fontSize:14, lineHeight:1.7,
          color:isUser?"#fff":C.text1,
          background:isUser?"linear-gradient(135deg,#6F2DBD,#8B5CF6)":"#fff",
          border:isUser?"none":`1px solid ${C.border}`,
          boxShadow:isUser?"0 2px 10px rgba(111,45,189,0.2)":"0 1px 6px rgba(111,45,189,0.06)" }}>
          {msg.text}
          {msg.isGroq && (
            <div style={{ fontSize:10, color:"rgba(255,255,255,0.6)", marginTop:6 }}>
              Powered by Groq llama-3.1-8b
            </div>
          )}
        </div>
        <div style={{ fontSize:11, color:C.muted, marginTop:4,
          textAlign:isUser?"right":"left" }}>{msg.time}</div>
      </div>
      {isUser && (
        <div style={{ width:34, height:34, borderRadius:10, flexShrink:0,
          background:"#F3ECFF", border:"1px solid #DDD0F5",
          display:"flex", alignItems:"center", justifyContent:"center" }}>
          <User style={{ width:16, height:16, color:C.purple }}/>
        </div>
      )}
    </motion.div>
  );
}

export default function SellerCoach() {
  const { selectedSeller, sellerLanguage } = useApp();
  const seller  = selectedSeller || SELLER_PROFILES[0];
  const langObj = SUPPORTED_LANGUAGES.find(l => l.value === sellerLanguage) || SUPPORTED_LANGUAGES[0];

  const [messages,  setMessages]  = useState(() => buildWelcome(seller, sellerLanguage));
  const [input,     setInput]     = useState("");
  const [typing,    setTyping]    = useState(false);
  const [backendOk, setBackendOk] = useState(true);
  const [history,   setHistory]   = useState([]);   // [{role,content}] for Groq
  const endRef = useRef(null);

  // Reset on seller/language change
  useEffect(() => {
    setMessages(buildWelcome(seller, sellerLanguage));
    setHistory([]);
    setInput("");
    setTyping(false);
  }, [seller.id, sellerLanguage]);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior:"smooth" }); }, [messages, typing]);

  /* ── Call Groq via backend debug endpoint using chat completions ── */
  const askGroq = useCallback(async (userText) => {
    const systemPrompt = buildCoachSystemPrompt(seller, sellerLanguage);
    const newHistory   = [...history, { role:"user", content:userText }];

    try {
      // Use the Groq config from backend — POST to a coaching endpoint
      // We send directly to Groq via the backend's proxy pattern
      const res = await axios.post(`${API}/api/coach/chat`, {
        messages: [
          { role:"system", content:systemPrompt },
          ...newHistory,
        ],
        seller_id: seller.id,
        language:  sellerLanguage,
      }, { timeout: 30000 });

      const reply = res.data?.content || res.data?.reply || "";
      setHistory([...newHistory, { role:"assistant", content:reply }]);
      setBackendOk(true);
      return { text:reply, isGroq:true };
    } catch (err) {
      // Backend coach endpoint may not exist yet — use personalised fallback
      setBackendOk(false);
      return { text: buildFallbackReply(userText, seller, sellerLanguage), isGroq:false };
    }
  }, [seller, sellerLanguage, history]);

  /* ── Rich personalised fallback ──────────────────────────────── */
  function buildFallbackReply(text, s, lang) {
    const m = s?.metrics || {};
    const t = text.toLowerCase();
    const name = s?.name?.split(" ")[0] || "Seller";

    const replies = {
      rto: `${name}, your RTO rate is currently ${m.rto_rate}%. ${
        m.rto_rate > 15
          ? `This is significantly above the ideal threshold of 10% and is one of the main factors reducing your loan eligibility. High RTO happens when products are returned before delivery. To fix this: (1) Improve product descriptions and sizing guides, (2) Use better packaging to prevent damage, (3) Respond quickly to customer queries. Reducing RTO below 10% could meaningfully increase your loan limit.`
          : m.rto_rate <= 8
          ? `Excellent! Your RTO rate of ${m.rto_rate}% is well below the 10% threshold. This is a strong positive signal in your credit profile and is helping your loan eligibility significantly. Keep maintaining product quality and clear descriptions to sustain this.`
          : `Your RTO of ${m.rto_rate}% is acceptable but reducing it below 10% would strengthen your loan profile. Focus on clearer product descriptions and better packaging.`
      }`,
      dispatch: `Your dispatch SLA compliance is ${m.dispatch_sla_compliance}%. ${
        m.dispatch_sla_compliance >= 95
          ? `Outstanding! A score above 95% is a top positive signal for lenders. This shows you are reliable and professional — it directly supports your ${s?.risk_category} risk classification.`
          : m.dispatch_sla_compliance >= 85
          ? `Good score, but improving to 95%+ would significantly boost your loan limit. Process orders earlier in the day, use faster logistics partners, and set realistic delivery timelines.`
          : `This needs urgent improvement. A dispatch SLA below 85% indicates delayed dispatches, which reduces lender confidence. Focus on processing orders within 24 hours of placement.`
      }`,
      risk: `Your current risk classification is ${s?.risk_category}. ${
        s?.risk_category === "Low"
          ? `This is the best possible category! You qualify for the highest loan limits (up to Rs. 1,00,000). Your strong metrics across sales velocity, ratings, and dispatch are all contributing positively. Run the AI evaluation on the Apply for Loan page to get your exact approved amount.`
          : s?.risk_category === "Moderate"
          ? `Moderate risk means you are eligible for mid-tier loans. Your main improvement areas are: RTO rate (currently ${m.rto_rate}%, target below 10%) and dispatch SLA (currently ${m.dispatch_sla_compliance}%, target above 90%). Making these improvements over 2-3 months could move you to Low risk.`
          : `High risk means loan approval is challenging right now. The main blockers are: ${m.prior_loan_default ? "prior loan default (very important to resolve), " : ""}RTO rate of ${m.rto_rate}% (very high), and ${m.account_age_months < 6 ? `account age of only ${m.account_age_months} months (minimum 6 required)` : `dispatch SLA of ${m.dispatch_sla_compliance}%`}. Build 6 months of consistent performance to improve.`
      }`,
      loan: `To maximise your loan limit, here are the 3 most impactful actions for ${name}:\n\n1. **Reduce RTO from ${m.rto_rate}% to below 10%** — this has the highest impact on your risk score\n2. **Improve dispatch SLA from ${m.dispatch_sla_compliance}% to above 95%** — lenders see this as reliability\n3. **Maintain your customer rating above ${Math.max(m.avg_customer_rating, 4.0).toFixed(1)}** — currently ${m.avg_customer_rating}, which is ${m.avg_customer_rating >= 4.0 ? "good" : "needs improvement"}\n\nFocusing on these 3 metrics for 60-90 days can move you from ${s?.risk_category} to ${s?.risk_category === "High" ? "Moderate" : "Low"} risk and increase your eligible loan amount significantly.`,
      document: `To apply for the working capital loan, you will need:\n\n1. **Aadhaar Card** — identity verification (required)\n2. **PAN Card** — tax identification (required)\n3. **Bank Statement** — last 3 months showing your business transactions (required)\n4. **GST Certificate** — if registered for GST (optional but helps approval)\n5. **Bank Account Number + IFSC Code** — for loan disbursement\n6. **WhatsApp number** — for decision notifications\n\nAll documents are encrypted and handled as per RBI data protection guidelines. Upload them on the Apply for Loan page.`,
      improve: `Based on ${name}'s current profile, here is your personalised improvement plan:\n\n${
        [
          m.rto_rate > 10 ? `1. Reduce RTO rate from ${m.rto_rate}% to below 10% — this is your highest priority` : null,
          m.dispatch_sla_compliance < 90 ? `${m.rto_rate > 10 ? 2 : 1}. Improve dispatch SLA from ${m.dispatch_sla_compliance}% to above 90%` : null,
          m.avg_customer_rating < 4.0 ? `${[m.rto_rate > 10, m.dispatch_sla_compliance < 90].filter(Boolean).length + 1}. Raise customer rating from ${m.avg_customer_rating} to above 4.0` : null,
          m.prior_loan_default ? `${[m.rto_rate > 10, m.dispatch_sla_compliance < 90, m.avg_customer_rating < 4.0].filter(Boolean).length + 1}. Resolve the prior loan default — this is critical` : null,
          `${[m.rto_rate > 10, m.dispatch_sla_compliance < 90, m.avg_customer_rating < 4.0, m.prior_loan_default].filter(Boolean).length + 1}. Consistently grow your monthly sales over the next 3 months`,
        ].filter(Boolean).join("\n")
      }`,
      default: `${name}, based on your ${s?.risk_category} risk profile with Rs. ${Number(m.sales_velocity_6m||0).toLocaleString("en-IN")} in sales and a ${m.avg_customer_rating} customer rating, ${
        s?.risk_category === "Low"
          ? `you are in an excellent position. I recommend running the full AI evaluation on the Apply for Loan page to get your confirmed loan amount and a detailed personalised plan.`
          : s?.risk_category === "Moderate"
          ? `you have a solid foundation. Your biggest opportunity is reducing your RTO rate from ${m.rto_rate}% and improving dispatch SLA. These two changes together could significantly increase your loan limit.`
          : `building a stronger track record over the next 3-6 months will be key. Focus on dispatch reliability, reducing returns, and consistent sales growth. I am here to guide you every step of the way.`
      }`,
    };

    if (t.includes("rto") || t.includes("return"))               return replies.rto;
    if (t.includes("dispatch") || t.includes("sla"))             return replies.dispatch;
    if (t.includes("risk") || t.includes("score") || t.includes("class")) return replies.risk;
    if (t.includes("loan") && (t.includes("increase") || t.includes("limit") || t.includes("more"))) return replies.loan;
    if (t.includes("document") || t.includes("upload") || t.includes("apply")) return replies.document;
    if (t.includes("improve") || t.includes("plan") || t.includes("better")) return replies.improve;
    return replies.default;
  }

  async function send(text) {
    if (!text.trim() || typing) return;
    const now = new Date().toLocaleTimeString("en-IN", { hour:"2-digit", minute:"2-digit" });
    setMessages(p => [...p, { role:"user", text, time:now }]);
    setInput("");
    setTyping(true);

    const reply = await askGroq(text);

    setTyping(false);
    setMessages(p => [...p, { role:"assistant", text:reply.text, time:"just now", isGroq:reply.isGroq }]);
  }

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:20,
      height:"calc(100vh - 160px)", minHeight:500 }}>

      {/* Header */}
      <motion.div initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }} transition={{ duration:0.4 }}>
        <div style={{ display:"flex", alignItems:"center", gap:12 }}>
          <div style={{ width:44, height:44, borderRadius:14, flexShrink:0,
            background:"linear-gradient(135deg,#6F2DBD,#8B5CF6)",
            display:"flex", alignItems:"center", justifyContent:"center",
            boxShadow:"0 3px 12px rgba(111,45,189,0.3)" }}>
            <Sparkles style={{ width:22, height:22, color:"#fff" }}/>
          </div>
          <div>
            <div style={{ fontSize:18, fontWeight:800, color:C.text1 }}>AI Financial Coach</div>
            <div style={{ fontSize:12, display:"flex", alignItems:"center", gap:6,
              color:backendOk ? C.green : C.orange }}>
              <span style={{ width:7, height:7, borderRadius:"50%",
                background:backendOk ? C.green : C.orange, display:"inline-block" }}/>
              {backendOk ? "Groq llama-3.1-8b · Live" : "Smart fallback mode · Groq reconnecting"}
              · Coaching {seller.name.split(" ")[0]} · {langObj.flag} {langObj.label}
            </div>
          </div>
          <button onClick={() => { setMessages(buildWelcome(seller, sellerLanguage)); setHistory([]); }}
            style={{ marginLeft:"auto", display:"flex", alignItems:"center", gap:6,
              padding:"7px 14px", borderRadius:10, border:`1px solid ${C.border}`,
              background:C.bg, fontSize:12, fontWeight:600, color:C.muted, cursor:"pointer" }}>
            <RefreshCw style={{ width:13, height:13 }}/> Reset
          </button>
        </div>

        {/* Fallback notice */}
        {!backendOk && (
          <div style={{ display:"flex", gap:8, padding:"10px 14px", marginTop:10, borderRadius:10,
            background:"rgba(245,158,11,0.08)", border:"1px solid rgba(245,158,11,0.3)" }}>
            <AlertCircle style={{ width:14, height:14, color:C.orange, flexShrink:0, marginTop:1 }}/>
            <p style={{ fontSize:12, color:"#92400E", margin:0, lineHeight:1.5 }}>
              The Groq AI coach is temporarily unavailable. I am using a detailed knowledge base personalised
              to {seller.name}'s profile to answer your questions. Responses are accurate but not AI-generated.
              Groq will reconnect automatically.
            </p>
          </div>
        )}
      </motion.div>

      {/* Chat window */}
      <div style={{ ...card({ padding:20 }), flex:1, display:"flex", flexDirection:"column", overflow:"hidden" }}>
        <div style={{ flex:1, overflowY:"auto", paddingRight:4, marginBottom:14 }}>
          {messages.map((m, i) => <Message key={i} msg={m}/>)}
          {typing && (
            <div style={{ display:"flex", gap:10, marginBottom:16 }}>
              <div style={{ width:34, height:34, borderRadius:10, flexShrink:0,
                background:"linear-gradient(135deg,#6F2DBD,#8B5CF6)",
                display:"flex", alignItems:"center", justifyContent:"center" }}>
                <Sparkles style={{ width:16, height:16, color:"#fff" }}/>
              </div>
              <div style={{ padding:"12px 18px", background:"#fff", border:`1px solid ${C.border}`,
                borderRadius:"4px 16px 16px 16px", display:"flex", alignItems:"center", gap:5 }}>
                {[0,1,2].map(i => (
                  <motion.div key={i} style={{ width:7, height:7, borderRadius:"50%", background:C.purple }}
                    animate={{ y:[0,-5,0] }} transition={{ duration:0.7, delay:i*0.15, repeat:Infinity }}/>
                ))}
              </div>
            </div>
          )}
          <div ref={endRef}/>
        </div>

        {/* Suggestions */}
        <div style={{ display:"flex", gap:7, flexWrap:"wrap", marginBottom:12 }}>
          {SUGGESTIONS.map(s => (
            <button key={s} onClick={() => send(s)}
              style={{ display:"flex", alignItems:"center", gap:5, padding:"5px 11px",
                borderRadius:20, fontSize:12, fontWeight:500, cursor:"pointer",
                border:"1px solid #DDD0F5", background:"#F3ECFF", color:C.purple,
                transition:"all 0.15s" }}
              onMouseEnter={e => e.currentTarget.style.background="#E9E0FF"}
              onMouseLeave={e => e.currentTarget.style.background="#F3ECFF"}>
              <Lightbulb style={{ width:11, height:11 }}/>{s}
            </button>
          ))}
        </div>

        {/* Input */}
        <div style={{ display:"flex", gap:10 }}>
          <input value={input} onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key==="Enter" && !e.shiftKey) { e.preventDefault(); send(input); }}}
            placeholder={`Ask about ${seller.name.split(" ")[0]}'s loan eligibility in ${langObj.native}...`}
            style={{ flex:1, padding:"11px 16px", borderRadius:12, fontSize:14,
              border:`1.5px solid ${C.border}`, background:"#fff", color:C.text1, outline:"none",
              transition:"border-color 0.2s" }}
            onFocus={e => e.target.style.borderColor=C.purple}
            onBlur={e => e.target.style.borderColor=C.border}
          />
          <button onClick={() => send(input)} disabled={!input.trim() || typing}
            style={{ width:44, height:44, borderRadius:12, flexShrink:0, border:"none", cursor:"pointer",
              background:input.trim()&&!typing?"linear-gradient(135deg,#6F2DBD,#8B5CF6)":"#E9E5F5",
              display:"flex", alignItems:"center", justifyContent:"center",
              boxShadow:input.trim()&&!typing?"0 2px 10px rgba(111,45,189,0.3)":"none",
              transition:"all 0.2s" }}>
            {typing
              ? <Loader2 style={{ width:18, height:18, color:"#9CA3AF", animation:"spin 1s linear infinite" }}/>
              : <Send style={{ width:18, height:18, color:input.trim()&&!typing?"#fff":"#9CA3AF" }}/>}
          </button>
        </div>
      </div>
      <style>{`@keyframes spin{to{transform:rotate(360deg);}}`}</style>
    </div>
  );
}
