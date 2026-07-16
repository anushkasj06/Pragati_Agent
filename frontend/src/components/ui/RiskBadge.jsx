/**
 * RiskBadge — displays risk class with color-coded styling.
 * Sizes: sm | md | lg
 */

import { motion } from "framer-motion";
import { ShieldCheck, ShieldAlert, ShieldX } from "lucide-react";
import { RISK_CLASS_CONFIG } from "../../utils/constants";

const icons = {
  Low:      ShieldCheck,
  Moderate: ShieldAlert,
  Medium:   ShieldAlert,
  High:     ShieldX,
};

const sizes = {
  sm: { badge: "text-xs px-2.5 py-1 gap-1.5",   icon: "w-3 h-3" },
  md: { badge: "text-sm px-3.5 py-1.5 gap-2",   icon: "w-4 h-4" },
  lg: { badge: "text-base px-5 py-2.5 gap-2.5", icon: "w-5 h-5" },
};

export function RiskBadge({ riskClass, size = "md", animate = false }) {
  const config = RISK_CLASS_CONFIG[riskClass] || RISK_CLASS_CONFIG.Moderate;
  const s = sizes[size] || sizes.md;
  const Icon = icons[riskClass] || ShieldAlert;

  const badge = (
    <div
      className={`inline-flex items-center rounded-full font-semibold ${s.badge}`}
      style={{
        color:           config.color,
        backgroundColor: config.bg,
        border:          `1px solid ${config.border}`,
        boxShadow:       `0 0 12px ${config.glow}`,
      }}
    >
      <Icon className={s.icon} />
      {config.label}
    </div>
  );

  if (animate) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: "spring", stiffness: 200, damping: 15 }}
        className="inline-flex"
      >
        {badge}
      </motion.div>
    );
  }

  return badge;
}

export default RiskBadge;
