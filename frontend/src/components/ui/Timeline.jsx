/**
 * Timeline — vertical timeline component for auditor trail steps.
 */

import { motion } from "framer-motion";
import { CheckCircle, Circle } from "lucide-react";

export function Timeline({ items, className = "" }) {
  return (
    <div className={`space-y-0 ${className}`}>
      {items.map((item, idx) => {
        const isLast = idx === items.length - 1;
        return (
          <motion.div
            key={idx}
            className="flex gap-4"
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: idx * 0.08, duration: 0.3 }}
          >
            {/* Icon + connector */}
            <div className="flex flex-col items-center">
              <div
                className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5"
                style={{
                  backgroundColor: item.color ? `${item.color}20` : "rgba(91,46,255,0.15)",
                  border: `1px solid ${item.color ? `${item.color}40` : "rgba(91,46,255,0.3)"}`,
                }}
              >
                {item.icon || (
                  item.completed
                    ? <CheckCircle className="w-4 h-4" style={{ color: item.color || "#5B2EFF" }} />
                    : <Circle className="w-4 h-4" style={{ color: item.color || "#5B2EFF" }} />
                )}
              </div>
              {!isLast && (
                <div className="w-px flex-1 bg-surface-border my-1" />
              )}
            </div>

            {/* Content */}
            <div className={`flex-1 ${isLast ? "" : "pb-6"}`}>
              {item.label && (
                <p className="text-white/50 text-xs font-medium uppercase tracking-widest mb-1">
                  {item.label}
                </p>
              )}
              <p className="text-white/80 text-sm leading-relaxed">{item.content}</p>
              {item.meta && (
                <p className="text-white/30 text-xs mt-1">{item.meta}</p>
              )}
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}

export default Timeline;
