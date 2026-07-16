/**
 * EvaluationProcessor — Full-screen agentic AI processing animation.
 *
 * Shows 6 sequential steps with sub-tasks, animated progress bar,
 * typewriter-style log lines, and a pulsing "thinking" indicator.
 * Feels like ChatGPT reasoning / Claude thinking.
 *
 * Props:
 *   isVisible   {boolean}   mount/unmount trigger
 *   onComplete  {function}  called when all steps finish (pass result through)
 *   sellerId    {string}
 */

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ClipboardList, Brain, Sparkles, Shield,
  Globe, MessageCircle, CheckCircle, Loader2,
} from "lucide-react";

/* ── design tokens ─────────────────────────────────────────── */
const C = {
  purple: "#6F2DBD", p2: "#8B5CF6", orange: "#F59E0B",
  green: "#22C55E", text1: "#1A1A2E", text2: "#4B5563",
  muted: "#9CA3AF", border: "#E9E5F5", bg: "#F8F4FF",
};

/* ── step definitions ─────────────────────────────────────── */
const STEPS = [
  {
    id: 1,
    icon: ClipboardList,
    title: "Gathering Seller Business Metrics",
    color: "#6F2DBD",
    duration: 1600,
    tasks: [
      { text: "Reading seller profile from database",       ms: 200  },
      { text: "Collecting marketplace behaviour data",      ms: 600  },
      { text: "Normalising 12 feature dimensions",         ms: 1000 },
      { text: "Validating data integrity",                 ms: 1400 },
    ],
  },
  {
    id: 2,
    icon: Brain,
    title: "Running ML Risk Model",
    color: "#7C3AED",
    duration: 2200,
    tasks: [
      { text: "Loading XGBoost classifier (200 estimators)", ms: 200  },
      { text: "Predicting risk class: Low / Medium / High",  ms: 700  },
      { text: "Running XGBoost regressor for loan limit",    ms: 1200 },
      { text: "Computing SHAP TreeExplainer values",         ms: 1700 },
      { text: "Ranking top 5 feature contributions",        ms: 2000 },
    ],
  },
  {
    id: 3,
    icon: Sparkles,
    title: "Agentic AI Reasoning",
    color: "#A855F7",
    duration: 2800,
    tasks: [
      { text: "Invoking seller_context_tool",               ms: 200  },
      { text: "Loading conversation history (last 5 turns)", ms: 700  },
      { text: "Understanding seller performance signals",   ms: 1200 },
      { text: "Analysing business trends via Groq Llama 3.1", ms: 1800 },
      { text: "Preparing structured JSON explanation",      ms: 2400 },
    ],
  },
  {
    id: 4,
    icon: Shield,
    title: "Applying Business Rules",
    color: "#F59E0B",
    duration: 1400,
    tasks: [
      { text: "Checking maximum loan cap (₹1,00,000)",      ms: 200  },
      { text: "Applying young account policy (<6 months)",  ms: 600  },
      { text: "Running dual-trigger rejection checks",      ms: 900  },
      { text: "Flagging for human review if required",      ms: 1200 },
    ],
  },
  {
    id: 5,
    icon: Globe,
    title: "Generating Multilingual Response",
    color: "#22C55E",
    duration: 1800,
    tasks: [
      { text: "Composing seller message in chosen language", ms: 300  },
      { text: "Writing professional auditor trail",         ms: 800  },
      { text: "Generating personalised improvement plan",   ms: 1300 },
      { text: "Applying translation fallback if needed",    ms: 1600 },
    ],
  },
  {
    id: 6,
    icon: MessageCircle,
    title: "Preparing WhatsApp Notification",
    color: "#10B981",
    duration: 900,
    tasks: [
      { text: "Building Twilio WhatsApp payload",           ms: 200  },
      { text: "Attaching loan summary",                    ms: 500  },
      { text: "Queuing guidance and recommendations",      ms: 750  },
    ],
  },
];

const TOTAL_DURATION = STEPS.reduce((s, st) => s + st.duration, 0); // ~10700ms

/* ── TypewriterLine ─────────────────────────────────────────── */
function TypewriterLine({ text, delay = 0 }) {
  const [shown, setShown] = useState("");
  useEffect(() => {
    setShown("");
    const t = setTimeout(() => {
      let i = 0;
      const iv = setInterval(() => {
        i++;
        setShown(text.slice(0, i));
        if (i >= text.length) clearInterval(iv);
      }, 18);
      return () => clearInterval(iv);
    }, delay);
    return () => clearTimeout(t);
  }, [text, delay]);

  return (
    <span>
      {shown}
      {shown.length < text.length && (
        <motion.span animate={{ opacity: [1, 0, 1] }}
          transition={{ duration: 0.6, repeat: Infinity }}
          style={{ display: "inline-block", width: 2, height: "1em",
            background: C.purple, borderRadius: 1, marginLeft: 2,
            verticalAlign: "middle" }} />
      )}
    </span>
  );
}

/* ── StepIcon ────────────────────────────────────────────────── */
function StepIcon({ step, status }) {
  // status: "waiting" | "active" | "done"
  const Icon = step.icon;
  const color = status === "done" ? C.green
    : status === "active" ? step.color
    : C.muted;
  const bg = status === "done" ? "rgba(34,197,94,0.12)"
    : status === "active" ? `${step.color}18`
    : "#F3F4F6";
  const border = status === "done" ? "rgba(34,197,94,0.35)"
    : status === "active" ? `${step.color}45`
    : "#E5E7EB";

  return (
    <motion.div
      style={{ width: 44, height: 44, borderRadius: 14, flexShrink: 0,
        background: bg, border: `2px solid ${border}`,
        display: "flex", alignItems: "center", justifyContent: "center",
        position: "relative" }}
      animate={status === "active" ? {
        boxShadow: [`0 0 0 0 ${step.color}30`, `0 0 0 8px ${step.color}00`],
      } : {}}
      transition={{ duration: 1.2, repeat: Infinity }}
    >
      {status === "done" ? (
        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 300, damping: 18 }}>
          <CheckCircle style={{ width: 22, height: 22, color: C.green }} />
        </motion.div>
      ) : status === "active" ? (
        <motion.div animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}>
          <Icon style={{ width: 20, height: 20, color }} />
        </motion.div>
      ) : (
        <Icon style={{ width: 20, height: 20, color }} />
      )}
    </motion.div>
  );
}

/* ── StepRow ─────────────────────────────────────────────────── */
function StepRow({ step, status, activeTasks, isLast }) {
  const isDone   = status === "done";
  const isActive = status === "active";

  return (
    <div style={{ display: "flex", gap: 16, alignItems: "flex-start" }}>
      {/* Left — icon + connector */}
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", flexShrink: 0 }}>
        <StepIcon step={step} status={status} />
        {!isLast && (
          <div style={{ width: 2, flex: 1, minHeight: 24, marginTop: 4,
            background: isDone
              ? "linear-gradient(180deg,#22C55E,#22C55E40)"
              : "rgba(229,231,235,0.8)",
            borderRadius: 1, transition: "background 0.5s" }} />
        )}
      </div>

      {/* Right — content */}
      <div style={{ flex: 1, paddingBottom: isLast ? 0 : 20, paddingTop: 10 }}>
        {/* Title row */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
          <span style={{
            fontSize: 14, fontWeight: 700,
            color: isDone ? C.text1 : isActive ? C.text1 : C.muted,
            transition: "color 0.3s",
          }}>
            {step.title}
          </span>
          {isDone && (
            <motion.span initial={{ opacity: 0, scale: 0.7 }} animate={{ opacity: 1, scale: 1 }}
              style={{ fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 20,
                color: "#16A34A", background: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.25)" }}>
              Done
            </motion.span>
          )}
          {isActive && (
            <motion.div animate={{ opacity: [1, 0.4, 1] }} transition={{ duration: 1.2, repeat: Infinity }}
              style={{ display: "flex", gap: 3 }}>
              {[0,1,2].map(i => (
                <motion.span key={i} style={{ width: 4, height: 4, borderRadius: "50%",
                  background: step.color, display: "block" }}
                  animate={{ y: [0, -4, 0] }}
                  transition={{ duration: 0.6, delay: i * 0.15, repeat: Infinity }} />
              ))}
            </motion.div>
          )}
        </div>

        {/* Sub-tasks */}
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          <AnimatePresence>
            {activeTasks.map((task, i) => (
              <motion.div key={task.text}
                initial={{ opacity: 0, x: -8, height: 0 }}
                animate={{ opacity: 1, x: 0, height: "auto" }}
                transition={{ duration: 0.25, delay: i * 0.04 }}
                style={{ display: "flex", alignItems: "center", gap: 7 }}>
                <motion.div
                  initial={{ scale: 0 }} animate={{ scale: 1 }}
                  transition={{ delay: i * 0.04, type: "spring", stiffness: 300 }}
                  style={{ width: 14, height: 14, borderRadius: "50%", flexShrink: 0,
                    background: isDone ? "rgba(34,197,94,0.15)" : `${step.color}12`,
                    display: "flex", alignItems: "center", justifyContent: "center" }}>
                  {isDone
                    ? <CheckCircle style={{ width: 9, height: 9, color: C.green }} />
                    : <motion.span style={{ width: 5, height: 5, borderRadius: "50%",
                        background: step.color, display: "block" }}
                        animate={{ opacity: [0.4, 1, 0.4] }}
                        transition={{ duration: 1.5, delay: i * 0.2, repeat: Infinity }} />}
                </motion.div>
                <span style={{ fontSize: 12, color: isDone ? C.text2 : "#6B7280", lineHeight: 1.4 }}>
                  {isDone ? task.text : <TypewriterLine text={task.text} delay={i * 60} />}
                </span>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

/* ── Main component ─────────────────────────────────────────── */
export default function EvaluationProcessor({ isVisible, sellerId = "Seller", estimatedMs = 8000 }) {
  const [currentStep,   setCurrentStep]   = useState(0);   // 0-based index
  const [currentTasks,  setCurrentTasks]  = useState([]);
  const [completedSteps,setCompletedSteps]= useState([]);
  const [elapsed,       setElapsed]       = useState(0);
  const [globalProgress,setGlobalProgress]= useState(0);
  const startRef = useRef(null);
  const timerRef = useRef(null);
  const stepTimers = useRef([]);

  /* clear all timers */
  const clearAll = useCallback(() => {
    clearInterval(timerRef.current);
    stepTimers.current.forEach(clearTimeout);
    stepTimers.current = [];
  }, []);

  useEffect(() => {
    if (!isVisible) {
      clearAll();
      setCurrentStep(0);
      setCurrentTasks([]);
      setCompletedSteps([]);
      setElapsed(0);
      setGlobalProgress(0);
      return;
    }

    startRef.current = Date.now();

    /* Elapsed ticker */
    timerRef.current = setInterval(() => {
      const e = Date.now() - startRef.current;
      setElapsed(e);
      setGlobalProgress(Math.min(99, (e / estimatedMs) * 100));
    }, 80);

    /* Schedule each step */
    let offset = 0;
    STEPS.forEach((step, si) => {
      /* activate step */
      const t1 = setTimeout(() => {
        setCurrentStep(si);
        setCurrentTasks([]);
      }, offset);
      stepTimers.current.push(t1);

      /* show sub-tasks progressively */
      step.tasks.forEach((task) => {
        const t2 = setTimeout(() => {
          setCurrentTasks(prev => [...prev, task]);
        }, offset + task.ms);
        stepTimers.current.push(t2);
      });

      /* complete step */
      const t3 = setTimeout(() => {
        setCompletedSteps(prev => [...prev, si]);
      }, offset + step.duration - 50);
      stepTimers.current.push(t3);

      offset += step.duration;
    });

    return () => clearAll();
  }, [isVisible, estimatedMs, clearAll]);

  if (!isVisible) return null;

  const elapsedSec    = (elapsed / 1000).toFixed(1);
  const remainingSec  = Math.max(0, ((estimatedMs - elapsed) / 1000)).toFixed(0);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      style={{ position: "fixed", inset: 0, zIndex: 300,
        background: "rgba(11,7,30,0.82)", backdropFilter: "blur(10px)",
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: "20px" }}
    >
      <motion.div
        initial={{ scale: 0.93, opacity: 0, y: 24 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        style={{ background: "#ffffff", borderRadius: 24, width: "100%", maxWidth: 580,
          maxHeight: "92vh", overflow: "hidden", display: "flex", flexDirection: "column",
          boxShadow: "0 32px 80px rgba(0,0,0,0.4)" }}
      >
        {/* ── Header ── */}
        <div style={{ background: "linear-gradient(135deg,#6F2DBD,#8B5CF6)",
          padding: "22px 28px", flexShrink: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}>
            {/* Pulsing orb */}
            <div style={{ position: "relative", width: 40, height: 40, flexShrink: 0 }}>
              <motion.div
                style={{ position: "absolute", inset: 0, borderRadius: "50%",
                  background: "rgba(255,255,255,0.25)" }}
                animate={{ scale: [1, 1.35, 1], opacity: [0.6, 0, 0.6] }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
              />
              <div style={{ position: "absolute", inset: 4, borderRadius: "50%",
                background: "rgba(255,255,255,0.3)",
                display: "flex", alignItems: "center", justifyContent: "center" }}>
                <motion.div animate={{ rotate: 360 }}
                  transition={{ duration: 3, repeat: Infinity, ease: "linear" }}>
                  <Sparkles style={{ width: 16, height: 16, color: "#fff" }} />
                </motion.div>
              </div>
            </div>
            <div>
              <div style={{ fontSize: 17, fontWeight: 800, color: "#fff", lineHeight: 1.2 }}>
                AI Agent Processing
              </div>
              <div style={{ fontSize: 12, color: "rgba(255,255,255,0.72)", marginTop: 1 }}>
                Evaluating {sellerId} · Groq llama-3.1-8b-instant
              </div>
            </div>
            <div style={{ marginLeft: "auto", textAlign: "right" }}>
              <div style={{ fontSize: 20, fontWeight: 900, color: "#fff",
                letterSpacing: "-0.02em", lineHeight: 1 }}>
                {Math.round(globalProgress)}%
              </div>
              <div style={{ fontSize: 11, color: "rgba(255,255,255,0.6)", marginTop: 1 }}>
                ~{remainingSec}s left
              </div>
            </div>
          </div>

          {/* Global progress bar */}
          <div style={{ height: 6, background: "rgba(255,255,255,0.2)",
            borderRadius: 3, overflow: "hidden" }}>
            <motion.div
              style={{ height: "100%", borderRadius: 3,
                background: "linear-gradient(90deg,rgba(255,255,255,0.9),rgba(255,255,255,0.6))" }}
              animate={{ width: `${globalProgress}%` }}
              transition={{ duration: 0.3, ease: "linear" }}
            />
          </div>

          {/* Step dots */}
          <div style={{ display: "flex", gap: 6, marginTop: 10, justifyContent: "center" }}>
            {STEPS.map((s, i) => (
              <motion.div key={s.id}
                style={{ height: 4, borderRadius: 2,
                  background: completedSteps.includes(i) ? "#fff"
                    : i === currentStep ? "rgba(255,255,255,0.7)"
                    : "rgba(255,255,255,0.2)" }}
                animate={{ width: completedSteps.includes(i) ? 24
                  : i === currentStep ? 16 : 8 }}
                transition={{ duration: 0.3 }}
              />
            ))}
          </div>
        </div>

        {/* ── Steps scroll area ── */}
        <div style={{ flex: 1, overflowY: "auto", padding: "24px 28px" }}>
          {STEPS.map((step, si) => {
            const isDone   = completedSteps.includes(si);
            const isActive = si === currentStep && !isDone;
            const status   = isDone ? "done" : isActive ? "active" : "waiting";

            // Which tasks to show
            const tasksToShow = isDone
              ? step.tasks          // show all when done
              : isActive
                ? currentTasks      // show as they appear
                : [];               // nothing yet

            return (
              <StepRow key={step.id} step={step} status={status}
                activeTasks={tasksToShow} isLast={si === STEPS.length - 1} />
            );
          })}
        </div>

        {/* ── Footer ── */}
        <div style={{ padding: "14px 28px", borderTop: "1px solid #E9E5F5",
          flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "space-between",
          background: "#FAFAFA" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}>
              <Loader2 style={{ width: 14, height: 14, color: C.purple }} />
            </motion.div>
            <span style={{ fontSize: 12, color: C.text2 }}>
              Processing
              {STEPS[currentStep] && (
                <span style={{ color: C.purple, fontWeight: 600 }}>
                  {" "}— Step {currentStep + 1} of {STEPS.length}
                </span>
              )}
            </span>
          </div>
          <div style={{ fontSize: 12, color: C.muted }}>
            {elapsedSec}s elapsed
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
