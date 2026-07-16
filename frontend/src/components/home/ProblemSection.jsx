import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import { XCircle, CheckCircle } from "lucide-react";

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

const PROBLEMS = [
  { text: "Sellers rejected without any explanation"   },
  { text: "Only CIBIL score considered, not Meesho performance" },
  { text: "Rigid rules ignore strong e-commerce metrics" },
  { text: "No vernacular language support for Bharat sellers"  },
  { text: "No path to improve eligibility after rejection"     },
  { text: "Zero personalized coaching or guidance"             },
];

const SOLUTIONS = [
  { text: "Full AI explanation for every decision"          },
  { text: "Meesho sales, RTO, dispatch metrics as credit signal" },
  { text: "XGBoost + SHAP scoring based on seller performance"  },
  { text: "Responses in Hindi, Tamil, Telugu and 5 more languages" },
  { text: "Actionable improvement plan with every evaluation"    },
  { text: "Groq Llama AI coaching after every decision"         },
];

export default function ProblemSection() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <section className="section bg-white" ref={ref}>
      <div className="max-w-7xl mx-auto">

        {/* Header */}
        <FadeUp className="text-center mb-14">
          <span className="badge-orange mb-4 inline-block">The Problem</span>
          <h2 className="section-title mb-4">
            Traditional Lending Fails{" "}
            <span className="text-primary">Bharat's Best Sellers</span>
          </h2>
          <p className="section-subtitle max-w-2xl mx-auto">
            Hardworking Meesho sellers get rejected every day because traditional lenders
            don't understand e-commerce performance metrics.
          </p>
        </FadeUp>

        {/* Two column — Problems vs Solutions */}
        <div className="grid md:grid-cols-2 gap-8">

          {/* Problems */}
          <FadeUp delay={0.1}>
            <div className="card-purple-top h-full" style={{ borderTopColor: "#EF4444" }}>
              <div className="flex items-center gap-2 mb-6">
                <div className="w-8 h-8 rounded-xl bg-red-50 flex items-center justify-center">
                  <XCircle className="w-4 h-4 text-danger" />
                </div>
                <h3 className="font-bold text-text-primary text-lg">Today's Reality</h3>
              </div>
              <div className="space-y-3">
                {PROBLEMS.map((p, i) => (
                  <motion.div
                    key={i}
                    className="flex items-start gap-3 p-3 bg-red-50 rounded-xl border border-red-100"
                    initial={{ opacity: 0, x: -12 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.15 + i * 0.07 }}
                  >
                    <XCircle className="w-4 h-4 text-danger flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-red-800 font-medium leading-relaxed">{p.text}</p>
                  </motion.div>
                ))}
              </div>
            </div>
          </FadeUp>

          {/* Solutions */}
          <FadeUp delay={0.2}>
            <div className="card-purple-top h-full">
              <div className="flex items-center gap-2 mb-6">
                <div className="w-8 h-8 rounded-xl bg-lighter-purple flex items-center justify-center">
                  <CheckCircle className="w-4 h-4 text-primary" />
                </div>
                <h3 className="font-bold text-text-primary text-lg">Pragati Agent Solution</h3>
              </div>
              <div className="space-y-3">
                {SOLUTIONS.map((s, i) => (
                  <motion.div
                    key={i}
                    className="flex items-start gap-3 p-3 bg-lighter-purple rounded-xl border border-border-purple"
                    initial={{ opacity: 0, x: 12 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.15 + i * 0.07 }}
                  >
                    <CheckCircle className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-primary font-medium leading-relaxed">{s.text}</p>
                  </motion.div>
                ))}
              </div>
            </div>
          </FadeUp>
        </div>
      </div>
    </section>
  );
}
