/**
 * StatCard — compact metric display card.
 */

import { motion } from "framer-motion";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

export function StatCard({
  label,
  value,
  unit = "",
  icon,
  trend,       // "up" | "down" | "neutral"
  trendValue,
  color = "#5B2EFF",
  animate = false,
  delay = 0,
  className = "",
}) {
  const TrendIcon = trend === "up" ? TrendingUp : trend === "down" ? TrendingDown : Minus;
  const trendColor = trend === "up" ? "#22C55E" : trend === "down" ? "#EF4444" : "#94A3B8";

  const card = (
    <div
      className={`glass rounded-2xl p-4 border border-surface-border relative overflow-hidden ${className}`}
    >
      {/* Color accent line */}
      <div
        className="absolute top-0 left-0 right-0 h-0.5 rounded-t-2xl"
        style={{ background: `linear-gradient(90deg, ${color}, transparent)` }}
      />

      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-white/50 text-xs font-medium mb-2">{label}</p>
          <div className="flex items-baseline gap-1">
            <span className="text-2xl font-bold text-white">{value}</span>
            {unit && <span className="text-sm text-white/50">{unit}</span>}
          </div>
          {trend && trendValue && (
            <div className="flex items-center gap-1 mt-1">
              <TrendIcon className="w-3 h-3" style={{ color: trendColor }} />
              <span className="text-xs" style={{ color: trendColor }}>{trendValue}</span>
            </div>
          )}
        </div>
        {icon && (
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ backgroundColor: `${color}18`, border: `1px solid ${color}30` }}
          >
            <span style={{ color }}>{icon}</span>
          </div>
        )}
      </div>
    </div>
  );

  if (animate) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay, duration: 0.4 }}
      >
        {card}
      </motion.div>
    );
  }

  return card;
}

export default StatCard;
