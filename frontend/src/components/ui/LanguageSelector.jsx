/**
 * LanguageSelector — dropdown to choose the response language.
 * Used in the evaluation form.
 */

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Globe, ChevronDown, Check } from "lucide-react";
import { SUPPORTED_LANGUAGES } from "../../utils/constants";

export function LanguageSelector({ value, onChange, className = "", buttonClassName = "", menuClassName = "" }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  const selected = SUPPORTED_LANGUAGES.find((l) => l.value === value) || SUPPORTED_LANGUAGES[0];

  // Close on outside click
  useEffect(() => {
    function handler(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div ref={ref} className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className={`flex items-center gap-2.5 px-4 py-2.5 bg-surface-card border border-surface-border rounded-2xl text-white hover:border-brand-primary/50 transition-all duration-200 w-full ${buttonClassName}`}
      >
        <Globe className="w-4 h-4 text-brand-secondary flex-shrink-0" />
        <span className="text-sm font-medium flex-1 text-left">
          {selected.flag} {selected.native}
        </span>
        <motion.div
          animate={{ rotate: open ? 180 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <ChevronDown className="w-4 h-4 text-white/40" />
        </motion.div>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.96 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            className={`absolute top-full left-0 right-0 mt-2 glass-strong rounded-2xl border border-surface-border shadow-card-hover z-50 overflow-hidden ${menuClassName}`}
          >
            {SUPPORTED_LANGUAGES.map((lang) => (
              <button
                key={lang.value}
                type="button"
                onClick={() => { onChange(lang.value); setOpen(false); }}
                className="flex items-center gap-3 w-full px-4 py-3 text-left hover:bg-white/5 transition-colors duration-150"
              >
                <span className="text-base">{lang.flag}</span>
                <div className="flex-1">
                  <p className="text-sm font-medium text-black">{lang.native}</p>
                  <p className="text-xs text-white/40">{lang.label}</p>
                </div>
                {value === lang.value && (
                  <Check className="w-4 h-4 text-brand-primary flex-shrink-0" />
                )}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default LanguageSelector;
