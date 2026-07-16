import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import {
  ClipboardList, Brain, Sparkles, Shield, CheckCircle, MessageCircle,
} from "lucide-react";

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

const STEPS = [
  {
    step: "01",
    icon: ClipboardList,
    label: "Gather Seller Data",
    desc: "12 business metrics collected — sales velocity, RTO rate, dispatch SLA, customer rating, catalog size, and credit history. Validated with strict Zod schemas.",
    tech: ["12 Metrics", "Zod Validation"],
    color: "#6F2DBD",
  },
  {
    step: "02",
    icon: Brain,
    label: "ML Risk Scoring",
    desc: "XGBoost classifier predicts risk class. XGBoost regressor predicts loan limit. SHAP identifies the top 5 features driving each decision.",
    tech: ["XGBoost", "SHAP", "92% Accuracy"],
    color: "#8B5CF6",
  },
  {
    step: "03",
    icon: Sparkles,
    label: "Agentic AI Reasoning",
    desc: "Groq Llama 3.1 processes the ML output, SHAP features, seller language and conversation history to generate a plain-language explanation.",
    tech: ["Groq Llama 3.1", "LangChain"],
    color: "#6F2DBD",
  },
  {
    step: "04",
    icon: Shield,
    label: "Business Rules Engine",
    desc: "Deterministic RBI-compliant policy layer. Applies loan caps, young account limits, default rejection triggers and human review flags — no AI randomness.",
    tech: ["RBI Compliant", "Deterministic", "Auditable"],
    color: "#F59E0B",
  },
  {
    step: "05",
    icon: CheckCircle,
    label: "Loan Decision",
    desc: "Final loan limit, risk class, decision status and reasoning features are returned. Every decision is stored in MongoDB with full audit trail.",
    tech: ["Transparent", "MongoDB"],
    color: "#22C55E",
  },
  {
    step: "06",
    icon: MessageCircle,
    label: "WhatsApp Guidance",
    desc: "Personalised 3 to 5 point improvement plan in the seller's language. Twilio WhatsApp notification sent with the decision and next steps.",
    tech: ["Twilio", "8 Languages"],
    color: "#F59E0B",
  },
];

function StepCard({ step, index }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-40px" });
  const Icon = step.icon;
  const isOrange = step.color === "#F59E0B";
  const isGreen  = step.color === "#22C55E";

  return (
    <motion.div
      ref={ref}
      className="card-hover relative"
      initial={{ opacity: 0, y: 28 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ delay: index * 0.08, duration: 0.5 }}
    >
      {/* Purple left border accent */}
      <div
        className="absolute left-0 top-6 bottom-6 w-1 rounded-full"
        style={{ background: step.color }}
      />

      <div className="pl-4">
        {/* Step number + icon */}
        <div className="flex items-center gap-3 mb-4">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{
              backgroundColor: isOrange ? "#FEF3C7" : isGreen ? "#DCFCE7" : "#F3ECFF",
              border: `1.5px solid ${isOrange ? "#FDE68A" : isGreen ? "#BBF7D0" : "#E9E5F5"}`,
            }}
          >
            <Icon className="w-5 h-5" style={{ color: step.color }} />
          </div>
          <span
            className="text-2xl font-black"
            style={{ color: `${step.color}30` }}
          >
            {step.step}
          </span>
        </div>

        <h3 className="font-bold text-text-primary text-base mb-2">{step.label}</h3>
        <p className="text-text-secondary text-sm leading-relaxed mb-4">{step.desc}</p>

        {/* Tech tags */}
        <div className="flex flex-wrap gap-2">
          {step.tech.map((t) => (
            <span
              key={t}
              className="px-2.5 py-1 rounded-lg text-xs font-semibold"
              style={{
                color: step.color,
                backgroundColor: isOrange ? "#FEF3C7" : isGreen ? "#DCFCE7" : "#F3ECFF",
                border: `1px solid ${isOrange ? "#FDE68A" : isGreen ? "#BBF7D0" : "#E9E5F5"}`,
              }}
            >
              {t}
            </span>
          ))}
        </div>
      </div>
    </motion.div>
  );
}

export default function SolutionSection() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <section className="section bg-[#FAFAFC]" ref={ref}>
      <div className="max-w-7xl mx-auto">

        <FadeUp className="text-center mb-14">
          <span className="badge-purple mb-4 inline-block">The Architecture</span>
          <h2 className="section-title mb-4">
            Six Steps.{" "}
            <span className="text-primary">Complete Transparency.</span>
          </h2>
          <p className="section-subtitle max-w-2xl mx-auto">
            Every loan evaluation follows the same transparent, auditable pipeline.
            No black boxes. Every decision explained.
          </p>
        </FadeUp>

        {/* Flow arrow connector */}
        <FadeUp delay={0.1} className="hidden lg:flex items-center justify-center gap-1 mb-10">
          {STEPS.map((s, i) => (
            <div key={s.label} className="flex items-center gap-1">
              <span
                className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-white border border-border-purple text-text-primary shadow-card"
              >
                {s.label}
              </span>
              {i < STEPS.length - 1 && (
                <span className="text-text-muted text-sm">→</span>
              )}
            </div>
          ))}
        </FadeUp>

        {/* Cards grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {STEPS.map((step, i) => (
            <StepCard key={step.label} step={step} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
}
