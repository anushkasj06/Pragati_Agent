import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import {
  Globe, Eye, Scale, ShieldCheck, FileText, TrendingUp,
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

const FEATURES = [
  {
    icon: Globe,
    title: "Multilingual Support",
    desc: "Decisions and coaching delivered in Hindi, Tamil, Telugu, Kannada, Marathi, Gujarati, Malayalam, and English.",
    color: "#6F2DBD",
    bg: "#F3ECFF",
    border: "#E9E5F5",
  },
  {
    icon: Eye,
    title: "Transparent AI",
    desc: "SHAP values map every ML prediction to plain language. No black boxes — every decision is fully explained.",
    color: "#8B5CF6",
    bg: "#F5F3FF",
    border: "#EDE9FE",
  },
  {
    icon: Scale,
    title: "Fair Lending",
    desc: "Meesho sales, RTO rate, dispatch compliance and customer ratings replace the CIBIL-only bias.",
    color: "#F59E0B",
    bg: "#FFFBEB",
    border: "#FDE68A",
  },
  {
    icon: ShieldCheck,
    title: "RBI Compliant",
    desc: "Deterministic rules engine enforces regulatory caps, human review triggers and rejection policies.",
    color: "#22C55E",
    bg: "#F0FDF4",
    border: "#BBF7D0",
  },
  {
    icon: FileText,
    title: "Explainable Decisions",
    desc: "Every evaluation produces an auditor trail, top reasoning features, and a structured decision record in MongoDB.",
    color: "#6F2DBD",
    bg: "#F3ECFF",
    border: "#E9E5F5",
  },
  {
    icon: TrendingUp,
    title: "Business Coaching",
    desc: "Groq Llama AI generates a personalised 3 to 5 step improvement plan after every decision — approved or rejected.",
    color: "#F59E0B",
    bg: "#FFFBEB",
    border: "#FDE68A",
  },
];

function FeatureCard({ feature, index }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-40px" });
  const Icon = feature.icon;

  return (
    <motion.div
      ref={ref}
      className="card-hover group"
      initial={{ opacity: 0, y: 24 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ delay: index * 0.07, duration: 0.5 }}
    >
      <div
        className="w-11 h-11 rounded-xl flex items-center justify-center mb-4"
        style={{ backgroundColor: feature.bg, border: `1.5px solid ${feature.border}` }}
      >
        <Icon className="w-5 h-5" style={{ color: feature.color }} />
      </div>
      <h3 className="font-bold text-[#1A1A2E] text-base mb-2">{feature.title}</h3>
      <p className="text-[#4B5563] text-sm leading-relaxed">{feature.desc}</p>
    </motion.div>
  );
}

export default function FeatureSection() {
  return (
    <section className="section bg-white">
      <div className="max-w-7xl mx-auto">
        <FadeUp className="text-center mb-14">
          <span className="badge-purple mb-4 inline-block">Key Features</span>
          <h2 className="section-title mb-4">
            Built for <span style={{ color: "#6F2DBD" }}>Every Bharat Seller</span>
          </h2>
          <p className="section-subtitle max-w-2xl mx-auto">
            Six capabilities that make Pragati Agent the most seller-friendly
            lending platform in India.
          </p>
        </FadeUp>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {FEATURES.map((f, i) => (
            <FeatureCard key={f.title} feature={f} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
}
