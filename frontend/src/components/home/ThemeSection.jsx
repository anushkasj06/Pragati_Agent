import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

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

export default function ThemeSection() {
  return (
    <section className="section bg-[#FAFAFC]">
      <div className="max-w-7xl mx-auto">
        <div className="grid lg:grid-cols-2 gap-12 items-center">

          {/* Left — theme statement */}
          <FadeUp>
            <span className="badge-orange mb-5 inline-block">Hackathon Theme</span>
            <h2 className="section-title mb-6">
              <span style={{ color: "#F59E0B" }}>Building for Bharat</span>
              <br />
              with the Power of{" "}
              <span style={{ color: "#6F2DBD" }}>Agentic AI</span>
            </h2>
            <p className="section-subtitle mb-8">
              Meesho Pragati Agent was built for the Meesho ScriptedBy Her 2.0 hackathon
              under the theme of inclusive, AI-powered finance for India's micro-entrepreneurs.
            </p>

            {/* PPT info strip */}
            <div className="space-y-3 mb-8">
              {[
                { label: "Theme",       value: "Building for Bharat with the Power of Agentic AI", color: "#F59E0B" },
                { label: "Target Area", value: "Meesho Finance (MPPL) and NBFC Lending Partners",   color: "#6F2DBD" },
                { label: "Team",        value: "Anushka's Team 2",                                   color: "#6F2DBD" },
                { label: "Name",        value: "Anushka Sunil Jadhav",                               color: "#6F2DBD" },
              ].map((row) => (
                <div key={row.label} className="flex items-start gap-3">
                  <span
                    className="font-bold text-sm flex-shrink-0 w-24"
                    style={{ color: row.color }}
                  >
                    {row.label}:
                  </span>
                  <span className="text-[#1A1A2E] text-sm font-medium">{row.value}</span>
                </div>
              ))}
            </div>

            <Link to="/evaluate" className="btn-primary gap-2">
              Try the Agent
              <ArrowRight className="w-4 h-4" />
            </Link>
          </FadeUp>

          {/* Right — two highlight cards */}
          <div className="space-y-5">
            <FadeUp delay={0.1}>
              <div
                className="rounded-3xl p-7 text-white"
                style={{ background: "linear-gradient(135deg, #6F2DBD 0%, #8B5CF6 100%)" }}
              >
                <div
                  className="w-10 h-10 rounded-xl mb-4 flex items-center justify-center"
                  style={{ backgroundColor: "rgba(255,255,255,0.2)" }}
                >
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                    <path d="M10 3L17 7V13L10 17L3 13V7L10 3Z" fill="white" fillOpacity="0.9"/>
                    <circle cx="10" cy="10" r="3" fill="white"/>
                  </svg>
                </div>
                <h3 className="font-bold text-xl mb-2">Agentic AI Pipeline</h3>
                <p className="text-white/80 text-sm leading-relaxed">
                  An autonomous AI agent orchestrates ML scoring, explainability, rule enforcement
                  and multilingual communication — end to end, in under 2 seconds.
                </p>
              </div>
            </FadeUp>

            <FadeUp delay={0.18}>
              <div
                className="rounded-3xl p-7 text-white"
                style={{ background: "linear-gradient(135deg, #F59E0B 0%, #E67E22 100%)" }}
              >
                <div
                  className="w-10 h-10 rounded-xl mb-4 flex items-center justify-center"
                  style={{ backgroundColor: "rgba(255,255,255,0.2)" }}
                >
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                    <path d="M10 2C5.58 2 2 5.58 2 10s3.58 8 8 8 8-3.58 8-8-3.58-8-8-8zm0 3l2 4H8l2-4zm0 9a1.5 1.5 0 110-3 1.5 1.5 0 010 3z" fill="white"/>
                  </svg>
                </div>
                <h3 className="font-bold text-xl mb-2">Building for Bharat</h3>
                <p className="text-white/80 text-sm leading-relaxed">
                  Designed from the ground up for Tier 2 and Tier 3 India — vernacular language support,
                  WhatsApp delivery, and zero requirement for a traditional credit score.
                </p>
              </div>
            </FadeUp>
          </div>
        </div>
      </div>
    </section>
  );
}
