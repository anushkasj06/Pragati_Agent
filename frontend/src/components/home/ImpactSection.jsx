import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import { Users, Building2, Handshake } from "lucide-react";

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

const IMPACT_CARDS = [
  {
    icon: Users,
    title: "For Sellers",
    subtitle: "Direct seller empowerment",
    color: "#6F2DBD",
    bg: "#F3ECFF",
    border: "#E9E5F5",
    points: [
      "Fair loans based on actual Meesho performance",
      "Full explanation for every approval or rejection",
      "Personalised improvement plan in their language",
      "No CIBIL score required for working capital",
      "WhatsApp-first delivery for easy access",
    ],
  },
  {
    icon: Building2,
    title: "For Meesho",
    subtitle: "Platform-level trust",
    color: "#F59E0B",
    bg: "#FFFBEB",
    border: "#FDE68A",
    points: [
      "Increases seller retention through financial support",
      "Reduces seller drop-off from loan rejections",
      "Creates a differentiating financial services layer",
      "Builds deep platform loyalty among Tier 2/3 sellers",
      "Scalable AI pipeline — no human underwriters needed",
    ],
  },
  {
    icon: Handshake,
    title: "For NBFC Partners",
    subtitle: "Smarter risk management",
    color: "#22C55E",
    bg: "#F0FDF4",
    border: "#BBF7D0",
    points: [
      "ML-powered risk scores with 92% accuracy",
      "Full audit trail for every credit decision",
      "SHAP-based explainability satisfies RBI requirements",
      "Deterministic rules engine prevents policy drift",
      "Human review flag for high-value loan applications",
    ],
  },
];

const METRICS = [
  { label: "Seller Metrics",   value: "12",    color: "#6F2DBD" },
  { label: "Languages",        value: "8",     color: "#8B5CF6" },
  { label: "Model Accuracy",   value: "92%",   color: "#22C55E" },
  { label: "Avg Pipeline",     value: "1.5s",  color: "#F59E0B" },
  { label: "SHAP Features",    value: "Top 5", color: "#6F2DBD" },
  { label: "Loan Rounding",    value: "5000",  color: "#F59E0B" },
];

export default function ImpactSection() {
  return (
    <section className="section bg-[#FAFAFC]">
      <div className="max-w-7xl mx-auto">

        <FadeUp className="text-center mb-14">
          <span className="badge-orange mb-4 inline-block">Impact</span>
          <h2 className="section-title mb-4">
            Real Impact for{" "}
            <span style={{ color: "#6F2DBD" }}>Real People</span>
          </h2>
          <p className="section-subtitle max-w-2xl mx-auto">
            Pragati Agent creates value across the entire Meesho lending ecosystem —
            sellers, the platform, and financial partners.
          </p>
        </FadeUp>

        {/* Three impact cards */}
        <div className="grid md:grid-cols-3 gap-6 mb-14">
          {IMPACT_CARDS.map((card, i) => {
            const Icon = card.icon;
            return (
              <FadeUp key={card.title} delay={i * 0.1}>
                <div
                  className="card h-full"
                  style={{ borderTop: `4px solid ${card.color}` }}
                >
                  <div className="flex items-center gap-3 mb-5">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                      style={{ backgroundColor: card.bg, border: `1.5px solid ${card.border}` }}
                    >
                      <Icon className="w-5 h-5" style={{ color: card.color }} />
                    </div>
                    <div>
                      <h3 className="font-bold text-[#1A1A2E] text-base leading-tight">{card.title}</h3>
                      <p className="text-[#9CA3AF] text-xs">{card.subtitle}</p>
                    </div>
                  </div>

                  <ul className="space-y-2.5">
                    {card.points.map((pt) => (
                      <li key={pt} className="flex items-start gap-2.5">
                        <div
                          className="w-1.5 h-1.5 rounded-full mt-2 flex-shrink-0"
                          style={{ backgroundColor: card.color }}
                        />
                        <span className="text-[#4B5563] text-sm leading-relaxed">{pt}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </FadeUp>
            );
          })}
        </div>

        {/* Metrics strip */}
        <FadeUp delay={0.2}>
          <div className="card">
            <p className="text-xs font-semibold text-[#9CA3AF] uppercase tracking-widest text-center mb-6">
              By the Numbers
            </p>
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-4">
              {METRICS.map((m) => (
                <div key={m.label} className="text-center">
                  <p
                    className="font-black text-2xl mb-1"
                    style={{ color: m.color }}
                  >
                    {m.value}
                  </p>
                  <p className="text-[#9CA3AF] text-xs leading-tight">{m.label}</p>
                </div>
              ))}
            </div>
          </div>
        </FadeUp>
      </div>
    </section>
  );
}
