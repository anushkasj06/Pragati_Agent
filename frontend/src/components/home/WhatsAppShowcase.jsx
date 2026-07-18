import { motion } from "framer-motion";
import { MessageCircle, Sparkles, CheckCircle2 } from "lucide-react";

const pipelineSteps = [
  "Gather Data",
  "ML Scoring",
  "Rules Engine",
  "Groq AI Coach",
  "Approval",
];

const conversation = [
  { from: "seller", text: "Hi" },
  { from: "ai", text: "Welcome Anushka. I found your seller profile." },
  { from: "ai", text: "Would you like to apply for working capital today?" },
  { from: "seller", text: "Yes" },
  { from: "ai", text: "Running AI underwriting..." },
  { from: "ai", text: "Congratulations! You are eligible for ₹75,000." },
];

export default function WhatsAppShowcase() {
  return (
    <section style={{ padding: "52px 16px 58px", background: "linear-gradient(180deg, #FBFAFF 0%, #FFFFFF 100%)" }}>
      <div style={{ maxWidth: 1200, margin: "0 auto" }}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.55 }}
          style={{ textAlign: "center", marginBottom: 26 }}
        >
          <span style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "6px 14px", borderRadius: 999, background: "#F3ECFF", color: "#6F2DBD", fontSize: 12, fontWeight: 800, letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 16 }}>
            <Sparkles size={14} />
            Future Vision
          </span>
          <h2 style={{ fontSize: "clamp(24px, 3vw, 36px)", fontWeight: 900, color: "#111827", margin: "0 0 12px", letterSpacing: "-0.02em" }}>
            After Registration, Everything Happens on WhatsApp
          </h2>
          <p style={{ fontSize: 16, color: "#4B5563", maxWidth: 700, margin: "0 auto", lineHeight: 1.75 }}>
            A simple onboarding step opens a conversational experience where the seller receives guidance, underwriting updates, and decisions directly inside WhatsApp.
          </p>
        </motion.div>

        <div style={{ display: "grid", gap: 18, gridTemplateColumns: "1.05fr 0.95fr", alignItems: "center" }}>
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, amount: 0.25 }}
            transition={{ duration: 0.6 }}
            style={{ display: "flex", justifyContent: "center" }}
          >
            <div style={{ width: "100%", maxWidth: 360, padding: 18, borderRadius: 36, background: "linear-gradient(135deg, #111827 0%, #1F2937 100%)", boxShadow: "0 24px 70px rgba(17, 24, 39, 0.24)" }}>
              <div style={{ borderRadius: 28, overflow: "hidden", background: "#111827" }}>
                <div style={{ background: "linear-gradient(135deg, #25D366 0%, #128C7E 100%)", padding: "14px 16px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div style={{ width: 36, height: 36, borderRadius: "50%", background: "rgba(255,255,255,0.22)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <MessageCircle size={18} color="#fff" />
                    </div>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 700, color: "#fff" }}>Pragati Agent</div>
                      <div style={{ fontSize: 11, color: "rgba(255,255,255,0.8)" }}>online • WhatsApp</div>
                    </div>
                  </div>
                  <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#4ADE80", boxShadow: "0 0 0 6px rgba(74,222,128,0.16)" }} />
                </div>

                <div style={{ background: "#F8FAFC", padding: "16px 14px 18px", display: "flex", flexDirection: "column", gap: 10 }}>
                  {conversation.map((item, idx) => (
                    <motion.div
                      key={`${item.from}-${idx}`}
                      initial={{ opacity: 0, y: 10 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true, amount: 0.2 }}
                      transition={{ duration: 0.35, delay: idx * 0.08 }}
                      style={{ display: "flex", justifyContent: item.from === "seller" ? "flex-start" : "flex-end" }}
                    >
                      <div style={{ maxWidth: "80%", padding: "10px 12px", borderRadius: item.from === "seller" ? "16px 16px 16px 8px" : "16px 16px 8px 16px", background: item.from === "seller" ? "#ffffff" : "linear-gradient(135deg, #6F2DBD 0%, #2563EB 100%)", color: item.from === "seller" ? "#111827" : "#fff", boxShadow: "0 10px 24px rgba(15, 23, 42, 0.08)", fontSize: 13, lineHeight: 1.55 }}>
                        {item.text}
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.6 }}
            style={{ padding: 18, borderRadius: 20, background: "#FFFFFF", border: "1px solid #E8DDFF", boxShadow: "0 16px 38px rgba(111, 45, 189, 0.08)" }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 18 }}>
              <div style={{ width: 42, height: 42, borderRadius: 14, background: "rgba(111, 45, 189, 0.12)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <CheckCircle2 size={20} color="#6F2DBD" />
              </div>
              <div>
                <div style={{ fontSize: 12, fontWeight: 800, letterSpacing: "0.12em", textTransform: "uppercase", color: "#6F2DBD" }}>AI flow</div>
                <div style={{ fontSize: 18, fontWeight: 800, color: "#111827" }}>Conversational underwriting</div>
              </div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 20 }}>
              {pipelineSteps.map((step, index) => (
                <div key={step} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{ width: 30, height: 30, borderRadius: "50%", background: "linear-gradient(135deg, #F59E0B 0%, #FB923C 100%)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 800 }}>
                    {index + 1}
                  </div>
                  <div style={{ flex: 1, padding: "10px 12px", borderRadius: 14, background: "#F9F7FF", border: "1px solid #EFE8FF", color: "#374151", fontSize: 14, fontWeight: 600 }}>
                    {step}
                  </div>
                </div>
              ))}
            </div>

            <div style={{ padding: "14px 16px", borderRadius: 16, background: "linear-gradient(135deg, #F8F4FF 0%, #FFF7ED 100%)", border: "1px solid #E9E5F5" }}>
              <div style={{ fontSize: 13, fontWeight: 800, color: "#6F2DBD", marginBottom: 6 }}>Outcome</div>
              <div style={{ fontSize: 15, fontWeight: 700, color: "#111827", marginBottom: 6 }}>Eligible for ₹75,000 with a 94/100 risk score.</div>
              <div style={{ fontSize: 13, color: "#4B5563", lineHeight: 1.7 }}>The experience feels natural, fast, and human — while the underwriting engine runs silently behind the scenes.</div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
