import { useRef } from "react";
import { motion, useInView } from "framer-motion";

function FadeUp({ children, delay = 0, className = "" }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });
  return (
    <motion.div
      ref={ref}
      className={className}
      initial={{ opacity: 0, y: 24 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ delay, duration: 0.55, ease: [0.25, 0.46, 0.45, 0.94] }}
    >
      {children}
    </motion.div>
  );
}

const STACK = [
  {
    category: "Frontend",
    color: "#6F2DBD",
    bg: "#F3ECFF",
    border: "#E9E5F5",
    items: ["React 18", "Vite", "Tailwind CSS", "Framer Motion", "Recharts"],
  },
  {
    category: "Backend",
    color: "#8B5CF6",
    bg: "#F5F3FF",
    border: "#EDE9FE",
    items: ["Node.js 22", "Express.js", "LangChain.js", "Zod", "Mongoose"],
  },
  {
    category: "AI and ML",
    color: "#6F2DBD",
    bg: "#F3ECFF",
    border: "#E9E5F5",
    items: ["Groq Llama 3.1", "XGBoost", "SHAP", "FastAPI", "Scikit-learn"],
  },
  {
    category: "Data and Infra",
    color: "#F59E0B",
    bg: "#FFFBEB",
    border: "#FDE68A",
    items: ["MongoDB Atlas", "Docker Compose", "Twilio WhatsApp", "Google Translate", "Winston"],
  },
];

const REQUEST_FLOW = [
  { label: "React",          color: "#6F2DBD" },
  { label: "Express",        color: "#8B5CF6" },
  { label: "FastAPI",        color: "#6F2DBD" },
  { label: "XGBoost + SHAP", color: "#8B5CF6" },
  { label: "Rules Engine",   color: "#F59E0B" },
  { label: "Groq LLM",       color: "#22C55E" },
  { label: "MongoDB",        color: "#6F2DBD" },
  { label: "Twilio",         color: "#F59E0B" },
];

export default function TechStackSection() {
  return (
    <section className="section bg-white">
      <div className="max-w-7xl mx-auto">

        <FadeUp className="text-center mb-14">
          <span className="badge-purple mb-4 inline-block">Technology Stack</span>
          <h2 className="section-title mb-4">
            Enterprise Grade,{" "}
            <span style={{ color: "#6F2DBD" }}>Production Ready</span>
          </h2>
          <p className="section-subtitle max-w-2xl mx-auto">
            Built with battle-tested tools used by global fintech products.
            Deployable in under 5 minutes with Docker Compose.
          </p>
        </FadeUp>

        {/* Tech cards */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
          {STACK.map((cat, i) => (
            <FadeUp key={cat.category} delay={i * 0.08}>
              <div className="card h-full">
                {/* Category header */}
                <div
                  className="inline-flex items-center px-3 py-1 rounded-lg text-xs font-bold mb-4"
                  style={{ color: cat.color, backgroundColor: cat.bg, border: `1px solid ${cat.border}` }}
                >
                  {cat.category}
                </div>

                {/* Items */}
                <div className="space-y-2">
                  {cat.items.map((item) => (
                    <div
                      key={item}
                      className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium text-[#1A1A2E]"
                      style={{ backgroundColor: cat.bg }}
                    >
                      <div
                        className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                        style={{ backgroundColor: cat.color }}
                      />
                      {item}
                    </div>
                  ))}
                </div>
              </div>
            </FadeUp>
          ))}
        </div>

        {/* Request flow */}
        <FadeUp delay={0.25}>
          <div className="card">
            <p className="text-xs font-semibold text-[#9CA3AF] uppercase tracking-widest text-center mb-6">
              Request Flow
            </p>
            <div className="flex flex-wrap items-center justify-center gap-2">
              {REQUEST_FLOW.map((item, i) => (
                <div key={item.label} className="flex items-center gap-2">
                  <span
                    className="px-3 py-1.5 rounded-xl text-xs font-semibold"
                    style={{
                      color: item.color,
                      backgroundColor: item.color === "#F59E0B" ? "#FFFBEB"
                        : item.color === "#22C55E" ? "#F0FDF4" : "#F3ECFF",
                      border: `1px solid ${item.color === "#F59E0B" ? "#FDE68A"
                        : item.color === "#22C55E" ? "#BBF7D0" : "#E9E5F5"}`,
                    }}
                  >
                    {item.label}
                  </span>
                  {i < REQUEST_FLOW.length - 1 && (
                    <span className="text-[#9CA3AF] text-sm font-light">→</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </FadeUp>
      </div>
    </section>
  );
}
