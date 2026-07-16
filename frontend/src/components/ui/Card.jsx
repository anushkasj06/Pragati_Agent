/**
 * Card — glassmorphism card container.
 * Variants: default | glow | accent | flat
 */

import { motion } from "framer-motion";

const variants = {
  default: "glass rounded-3xl p-6 shadow-card",
  glow:    "glass rounded-3xl p-6 shadow-card border-glow",
  accent:  "glass rounded-3xl p-6 shadow-card border-glow-accent",
  flat:    "bg-surface-card rounded-3xl p-6 border border-surface-border",
  glass2:  "glass-strong rounded-3xl p-6 shadow-card",
};

export function Card({
  children,
  variant = "default",
  className = "",
  hover = false,
  animate = false,
  delay = 0,
  onClick,
}) {
  const base = variants[variant] || variants.default;
  const hoverClass = hover
    ? "hover:border-brand-primary/30 hover:shadow-glow-sm cursor-pointer transition-all duration-300"
    : "";

  if (animate) {
    return (
      <motion.div
        className={`${base} ${hoverClass} ${className}`}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay, ease: [0.25, 0.46, 0.45, 0.94] }}
        onClick={onClick}
        whileHover={hover ? { y: -2 } : undefined}
      >
        {children}
      </motion.div>
    );
  }

  return (
    <div
      className={`${base} ${hoverClass} ${className}`}
      onClick={onClick}
    >
      {children}
    </div>
  );
}

export function CardHeader({ children, className = "" }) {
  return (
    <div className={`flex items-center justify-between mb-5 ${className}`}>
      {children}
    </div>
  );
}

export function CardTitle({ children, className = "" }) {
  return (
    <h3 className={`text-white font-semibold text-base ${className}`}>
      {children}
    </h3>
  );
}

export function CardContent({ children, className = "" }) {
  return <div className={className}>{children}</div>;
}

export default Card;
