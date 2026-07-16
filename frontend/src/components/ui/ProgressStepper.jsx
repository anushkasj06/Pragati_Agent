/**
 * ProgressStepper — visualises the Gather→Score→Reason→Decide→Act workflow.
 */

import { motion } from "framer-motion";
import {
  ClipboardList, Brain, Sparkles, Shield, TrendingUp, Check,
} from "lucide-react";
import { WORKFLOW_STEPS } from "../../utils/constants";

const iconMap = {
  ClipboardList, Brain, Sparkles, Shield, TrendingUp,
};

const stepStates = {
  completed: {
    bg:     "bg-brand-primary",
    border: "border-brand-primary",
    text:   "text-white",
    label:  "text-brand-secondary",
  },
  active: {
    bg:     "bg-brand-primary/20",
    border: "border-brand-primary",
    text:   "text-brand-primary",
    label:  "text-white",
  },
  pending: {
    bg:     "bg-surface-card",
    border: "border-surface-border",
    text:   "text-white/30",
    label:  "text-white/30",
  },
};

export function ProgressStepper({ currentStep = 0, className = "" }) {
  return (
    <div className={`flex items-center justify-between w-full ${className}`}>
      {WORKFLOW_STEPS.map((step, idx) => {
        const state =
          idx < currentStep
            ? "completed"
            : idx === currentStep
            ? "active"
            : "pending";
        const s = stepStates[state];
        const Icon = iconMap[step.icon] || Brain;
        const isLast = idx === WORKFLOW_STEPS.length - 1;

        return (
          <div key={step.key} className="flex items-center flex-1">
            {/* Step node */}
            <div className="flex flex-col items-center gap-1.5 flex-shrink-0">
              <motion.div
                className={`w-10 h-10 rounded-2xl border-2 ${s.bg} ${s.border} flex items-center justify-center transition-all duration-300`}
                animate={state === "active" ? { boxShadow: ["0 0 0px rgba(91,46,255,0)", "0 0 20px rgba(91,46,255,0.4)", "0 0 0px rgba(91,46,255,0)"] } : {}}
                transition={{ duration: 2, repeat: Infinity }}
              >
                {state === "completed" ? (
                  <Check className="w-4 h-4 text-white" />
                ) : (
                  <Icon className={`w-4 h-4 ${s.text}`} />
                )}
              </motion.div>
              <div className="text-center">
                <p className={`text-xs font-semibold ${s.label} transition-colors duration-300`}>
                  {step.label}
                </p>
              </div>
            </div>

            {/* Connector line */}
            {!isLast && (
              <div className="flex-1 mx-2 h-px relative overflow-hidden">
                <div className="w-full h-full bg-surface-border rounded" />
                {idx < currentStep && (
                  <motion.div
                    className="absolute inset-y-0 left-0 bg-gradient-brand rounded"
                    initial={{ width: "0%" }}
                    animate={{ width: "100%" }}
                    transition={{ duration: 0.5, delay: idx * 0.1 }}
                  />
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

/**
 * Compact vertical stepper — used in sidebars.
 */
export function VerticalStepper({ currentStep = 0, className = "" }) {
  return (
    <div className={`flex flex-col ${className}`}>
      {WORKFLOW_STEPS.map((step, idx) => {
        const state = idx < currentStep ? "completed" : idx === currentStep ? "active" : "pending";
        const s = stepStates[state];
        const Icon = iconMap[step.icon] || Brain;
        const isLast = idx === WORKFLOW_STEPS.length - 1;

        return (
          <div key={step.key} className="flex items-start gap-3">
            <div className="flex flex-col items-center">
              <motion.div
                className={`w-8 h-8 rounded-xl border-2 ${s.bg} ${s.border} flex items-center justify-center flex-shrink-0 transition-all duration-300`}
              >
                {state === "completed" ? (
                  <Check className="w-3.5 h-3.5 text-white" />
                ) : (
                  <Icon className={`w-3.5 h-3.5 ${s.text}`} />
                )}
              </motion.div>
              {!isLast && (
                <div className="w-px h-8 bg-surface-border mt-1" />
              )}
            </div>
            <div className="pt-1 pb-6">
              <p className={`text-sm font-semibold ${s.label}`}>{step.label}</p>
              <p className="text-xs text-white/40 mt-0.5">{step.description}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default ProgressStepper;
