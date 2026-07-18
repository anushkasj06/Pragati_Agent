/**
 * SimulatorPage.jsx
 * What-If Simulator — interactive sliders to explore loan eligibility scenarios.
 * Auto-runs evaluation when significant changes are detected.
 */

import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { FlaskConical, Sliders, Info, Zap, CheckCircle, AlertCircle, Zap as ZapIcon } from "lucide-react";
import { evaluateLoan } from "../services/api";
import { useApp } from "../context/AppContext";
import { SELLER_DATA_FIELDS } from "../utils/constants";

const C = {
  purple:  "#6F2DBD",
  purple2: "#8B5CF6",
  orange:  "#F59E0B",
  green:   "#22C55E",
  red:     "#EF4444",
  text1:   "#1A1A2E",
  text2:   "#4B5563",
  muted:   "#9CA3AF",
  border:  "#E9E5F5",
  bg:      "#F8F4FF",
};

const card = (extra = {}) => ({
  background: "#FFFFFF",
  border: `1px solid ${C.border}`,
  borderRadius: 16,
  padding: 24,
  boxShadow: "0 2px 16px rgba(111,45,189,0.08)",
  ...extra,
});

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.4, delay, ease: [0.22, 1, 0.36, 1] },
});

// Add pulse animation
const pulseStyle = `
  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.5; }
  }
`;

// Only sliders (numeric, not select)
const SLIDER_FIELDS = SELLER_DATA_FIELDS.filter((f) => f.type === "number").slice(0, 8);

function buildDefaults() {
  const d = {};
  SLIDER_FIELDS.forEach((f) => {
    d[f.key] = parseFloat(f.placeholder) || (f.min + f.max) / 2;
  });
  return d;
}

function toSellerData(values) {
  return Object.fromEntries(
    SELLER_DATA_FIELDS.map((field) => {
      const rawValue = values[field.key] ?? field.placeholder;
      const value = field.type === "select"
        ? (field.key === "prior_loan_default" ? 0 : rawValue)
        : rawValue;

      return [
        field.key,
        field.isInt ? parseInt(value, 10) || 0 : parseFloat(value) || 0,
      ];
    })
  );
}

function formatSectionTitle(title) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
      <div style={{ width: 6, height: 24, borderRadius: 999, background: C.purple }} />
      <h3 style={{ fontSize: 15, fontWeight: 700, color: C.text1, margin: 0 }}>{title}</h3>
    </div>
  );
}

export default function SimulatorPage() {
  const { sellerLanguage } = useApp();
  const [values, setValues] = useState(buildDefaults);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [autoEvalTriggered, setAutoEvalTriggered] = useState(false);
  
  const prevValuesRef = useRef(buildDefaults());
  const debounceTimerRef = useRef(null);
  
  // Threshold: 10% change triggers auto-evaluation
  const SIGNIFICANT_CHANGE_THRESHOLD = 0.1;
  
  function hasSignificantChange(oldVals, newVals) {
    return SLIDER_FIELDS.some((field) => {
      const oldVal = oldVals[field.key] || 0;
      const newVal = newVals[field.key] || 0;
      
      if (oldVal === 0) return Math.abs(newVal) > 0;
      const changePercent = Math.abs((newVal - oldVal) / oldVal);
      return changePercent >= SIGNIFICANT_CHANGE_THRESHOLD;
    });
  }

  function handleSlider(key, val) {
    setValues((prev) => ({ ...prev, [key]: parseFloat(val) }));
  }

  async function runSimulation() {
    setError(null);
    setResult(null);
    setLoading(true);
    setAutoEvalTriggered(false);

    try {
      const payload = {
        seller_id: "SIMULATOR_SELLER",
        language: sellerLanguage,
        seller_data: toSellerData(values),
      };
      const response = await evaluateLoan(payload);
      setResult(response);
      prevValuesRef.current = { ...values };
    } catch (err) {
      setError(err?.message || "Simulation failed. Please check backend connectivity.");
    } finally {
      setLoading(false);
    }
  }

  // Auto-trigger evaluation on significant changes (debounced)
  useEffect(() => {
    if (hasSignificantChange(prevValuesRef.current, values)) {
      // Clear existing timer
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
      
      // Set new timer - auto-run after 800ms of inactivity
      debounceTimerRef.current = setTimeout(() => {
        setAutoEvalTriggered(true);
        setError(null);
        setResult(null);
        setLoading(true);

        (async () => {
          try {
            const payload = {
              seller_id: "SIMULATOR_SELLER",
              language: sellerLanguage,
              seller_data: toSellerData(values),
            };
            const response = await evaluateLoan(payload);
            setResult(response);
            prevValuesRef.current = { ...values };
          } catch (err) {
            setError(err?.message || "Auto-evaluation failed.");
          } finally {
            setLoading(false);
            setAutoEvalTriggered(false);
          }
        })();
      }, 800);
    }

    return () => {
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    };
  }, [values, sellerLanguage]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      <style>{pulseStyle}</style>

      {/* Header */}
      <motion.div {...fadeUp(0)}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 4 }}>
          <div style={{
            width: 42, height: 42, borderRadius: 12,
            background: "rgba(245,158,11,0.12)",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <FlaskConical style={{ width: 22, height: 22, color: C.orange }} />
          </div>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 800, color: C.text1, margin: 0, letterSpacing: "-0.02em" }}>
              What-If Simulator
            </h1>
            <p style={{ fontSize: 13, color: C.muted, margin: "2px 0 0" }}>
              Adjust seller metrics to explore how they affect loan eligibility
            </p>
          </div>
        </div>
      </motion.div>

      {/* Two-column layout */}
      <div style={{ display: "grid", gridTemplateColumns: "3fr 2fr", gap: 20, alignItems: "start" }}>

        {/* Left: Sliders */}
        <motion.div style={card()} {...fadeUp(0.08)}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 20 }}>
            <Sliders style={{ width: 17, height: 17, color: C.purple }} />
            <h2 style={{ fontSize: 16, fontWeight: 700, color: C.text1, margin: 0 }}>Seller Metrics</h2>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
            {SLIDER_FIELDS.map((field) => {
              const val = values[field.key];
              const pct = ((val - field.min) / (field.max - field.min)) * 100;
              return (
                <div key={field.key}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                    <label style={{ fontSize: 13, fontWeight: 600, color: C.text1 }}>
                      {field.label}
                    </label>
                    <span style={{
                      fontSize: 13, fontWeight: 700, color: C.purple,
                      background: "rgba(111,45,189,0.08)", padding: "2px 10px",
                      borderRadius: 20,
                    }}>
                      {field.unit === "₹" ? `₹${val.toLocaleString()}` : `${val}${field.unit}`}
                    </span>
                  </div>
                  <div style={{ position: "relative" }}>
                    <input
                      type="range"
                      min={field.min}
                      max={field.max}
                      step={field.step}
                      value={val}
                      onChange={(e) => handleSlider(field.key, e.target.value)}
                      style={{
                        width: "100%",
                        height: 6,
                        appearance: "none",
                        borderRadius: 3,
                        outline: "none",
                        cursor: "pointer",
                        background: `linear-gradient(to right, #6F2DBD ${pct}%, #E9E5F5 ${pct}%)`,
                      }}
                    />
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", marginTop: 3 }}>
                    <span style={{ fontSize: 11, color: C.muted }}>{field.min}{field.unit}</span>
                    <span style={{ fontSize: 11, color: C.muted }}>{field.hint}</span>
                    <span style={{ fontSize: 11, color: C.muted }}>{field.max}{field.unit}</span>
                  </div>
                </div>
              );
            })}
          </div>

          <div style={{ display: "flex", gap: 12, marginTop: 18, flexWrap: "wrap" }}>
            <button
              type="button"
              onClick={runSimulation}
              disabled={loading}
              style={{
                padding: "12px 18px",
                borderRadius: 14,
                border: "none",
                background: "#6F2DBD",
                color: "#fff",
                fontWeight: 700,
                cursor: loading ? "not-allowed" : "pointer",
                minWidth: 160,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
                opacity: loading ? 0.7 : 1,
              }}
            >
              <Zap style={{ width: 16, height: 16 }} />
              {loading ? "Running..." : "Run Simulation"}
            </button>
            <div style={{ alignSelf: "center", color: C.text2, fontSize: 13 }}>
              Response in {sellerLanguage} · Backend prediction + explanation
            </div>
            {autoEvalTriggered && !loading && (
              <div style={{ alignSelf: "center", fontSize: 12, color: C.green, fontWeight: 600, display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{ width: 8, height: 8, borderRadius: "50%", background: C.green, animation: "pulse 2s infinite" }} />
                Auto-evaluated on change
              </div>
            )}
          </div>
        </motion.div>

        {/* Right: Live Result Preview */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

          {error && (
            <motion.div style={{ ...card({ padding: 18, borderColor: "#FEE2E2", background: "#FFF1F2" }) }} {...fadeUp(0.08)}>
              <div style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 8 }}>
                <AlertCircle style={{ width: 18, height: 18, color: C.red }} />
                <span style={{ fontSize: 14, fontWeight: 700, color: C.red }}>Simulation Error</span>
              </div>
              <p style={{ margin: 0, fontSize: 13, color: C.text2, lineHeight: 1.6 }}>{error}</p>
            </motion.div>
          )}

          {/* Result panel */}
          {result ? (
            <motion.div style={card()} {...fadeUp(0.14)}>
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 18 }}>
                <div style={{ width: 42, height: 42, borderRadius: 14, background: result.decision.decision_status === "Approved" ? "rgba(34,197,94,0.12)" : "rgba(239,68,68,0.12)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  {result.decision.decision_status === "Approved" ? (
                    <CheckCircle style={{ width: 24, height: 24, color: C.green }} />
                  ) : (
                    <AlertCircle style={{ width: 24, height: 24, color: C.red }} />
                  )}
                </div>
                <div>
                  <div style={{ fontSize: 18, fontWeight: 800, color: C.text1 }}>
                    {result.decision.decision_status === "Approved" ? "Loan Likely Approved" : "Loan Likely Rejected"}
                  </div>
                  <div style={{ fontSize: 12, color: C.muted, marginTop: 3 }}>
                    Based on backend evaluation output for this scenario.
                  </div>
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(140px,1fr))", gap: 12, marginBottom: 18 }}>
                {[
                  { label: "Final Loan Limit", value: `₹${result.decision.loan_limit.toLocaleString("en-IN")}` },
                  { label: "Risk Class", value: result.decision.risk_class },
                  { label: "Risk Score", value: `${result.decision.risk_score}/100` },
                  { label: "Review", value: result.decision.requires_human_review ? "Human Review" : "Auto" },
                ].map((item) => (
                  <div key={item.label} style={{ padding: 14, borderRadius: 14, background: "#F8F4FF", border: `1px solid ${C.border}` }}>
                    <div style={{ fontSize: 11, color: C.muted, marginBottom: 6 }}>{item.label}</div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: C.text1 }}>{item.value}</div>
                  </div>
                ))}
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                {result.seller_message && (
                  <div style={{ ...card({ padding: 18, background: "#F8FAFF", borderColor: "#DBEAFE" }) }}>
                    {formatSectionTitle("Seller Explanation")}
                    <p style={{ margin: 0, fontSize: 13, color: C.text2, lineHeight: 1.7, whiteSpace: "pre-line" }}>
                      {result.seller_message}
                    </p>
                  </div>
                )}

                {result.improvement_plan?.length > 0 && (
                  <div style={{ ...card({ padding: 18, background: "#F7F7FF", borderColor: "#E5E7EB" }) }}>
                    {formatSectionTitle("Improvement Plan")}
                    <ol style={{ margin: 0, paddingLeft: 18, color: C.text2, fontSize: 13, lineHeight: 1.8 }}>
                      {result.improvement_plan.map((step, idx) => (
                        <li key={idx} style={{ marginBottom: 8 }}>{step}</li>
                      ))}
                    </ol>
                  </div>
                )}

                {result.top_reasoning_features?.length > 0 && (
                  <div style={{ ...card({ padding: 18, background: "#FDF6FF", borderColor: "#E9D5FF" }) }}>
                    {formatSectionTitle("Top Reasoning Features")}
                    <div style={{ display: "grid", gap: 10 }}>
                      {result.top_reasoning_features.map((feature, idx) => (
                        <div key={idx} style={{ padding: 12, borderRadius: 12, background: "#fff", border: `1px solid ${C.border}` }}>
                          <div style={{ fontSize: 13, fontWeight: 700, color: C.text1 }}>{feature.feature}</div>
                          <div style={{ fontSize: 12, color: C.text2, marginTop: 4 }}>{feature.reason}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {result.auditor_trail && (
                  <div style={{ ...card({ padding: 18, background: "#FEF3C7", borderColor: "#FDE68A" }) }}>
                    {formatSectionTitle("Auditor Trail")}
                    <p style={{ margin: 0, fontSize: 13, color: C.text2, lineHeight: 1.7, whiteSpace: "pre-line" }}>
                      {result.auditor_trail}
                    </p>
                  </div>
                )}
              </div>
            </motion.div>
          ) : (
            <motion.div style={card({ textAlign: "center", padding: 40 })} {...fadeUp(0.14)}>
              <div style={{
                width: 64, height: 64, borderRadius: 20,
                background: "rgba(111,45,189,0.12)",
                display: "flex", alignItems: "center", justifyContent: "center",
                margin: "0 auto 16px",
              }}>
                <Zap style={{ width: 30, height: 30, color: C.purple }} />
              </div>
              <h3 style={{ fontSize: 17, fontWeight: 700, color: C.text1, margin: "0 0 8px" }}>
                Ready for Simulation
              </h3>
              <p style={{ fontSize: 13, color: C.text2, margin: "0 0 12px", lineHeight: 1.7 }}>
                Adjust the slider values to explore different scenarios. When you make a <strong>significant change (≥10%)</strong>, 
                the evaluation will <strong>automatically run</strong> after a brief pause.
              </p>
              <p style={{ fontSize: 13, color: C.muted, margin: "0 0 20px", lineHeight: 1.7 }}>
                You can also click <strong>Run Simulation</strong> anytime to manually evaluate or tweak small values.
              </p>
              <div style={{
                padding: "12px 16px", borderRadius: 12,
                background: "rgba(111,45,189,0.08)",
                border: "1px solid rgba(111,45,189,0.18)",
                fontSize: 13, color: C.text1, fontWeight: 600,
              }}>
                The result will include decision, reasoning, improvement plan, and audit details in {sellerLanguage}.
              </div>
            </motion.div>
          )}

          {/* Current values summary card */}
          <motion.div style={card()} {...fadeUp(0.2)}>
            <h3 style={{ fontSize: 14, fontWeight: 700, color: C.text1, margin: "0 0 14px" }}>
              Current Scenario
            </h3>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {SLIDER_FIELDS.slice(0, 5).map((field) => (
                <div key={field.key} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: 12, color: C.text2 }}>{field.label}</span>
                  <span style={{ fontSize: 12, fontWeight: 700, color: C.purple }}>
                    {field.unit === "₹" ? `₹${values[field.key].toLocaleString()}` : `${values[field.key]}${field.unit}`}
                  </span>
                </div>
              ))}
            </div>
          </motion.div>
        </div>

      </div>
    </div>
  );
}
