/**
 * Button — reusable button component with variant support.
 * Variants: primary | secondary | ghost | accent | danger
 */

import { forwardRef } from "react";
import { motion } from "framer-motion";
import { Loader2 } from "lucide-react";

const variants = {
  primary:   "btn-primary",
  secondary: "btn-secondary",
  ghost:     "btn-ghost",
  accent:    "btn-accent",
  danger:    "inline-flex items-center justify-center gap-2 px-6 py-3 rounded-2xl font-semibold text-white bg-red-500/20 border border-red-500/30 hover:bg-red-500/30 active:scale-95 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed",
};

const sizes = {
  sm:  "px-4 py-2 text-sm rounded-xl",
  md:  "",
  lg:  "px-8 py-4 text-base rounded-2xl",
  xl:  "px-10 py-5 text-lg rounded-3xl",
};

const Button = forwardRef(function Button(
  {
    children,
    variant = "primary",
    size = "md",
    loading = false,
    disabled = false,
    leftIcon,
    rightIcon,
    className = "",
    onClick,
    type = "button",
    ...props
  },
  ref
) {
  const base = variants[variant] || variants.primary;
  const sizeClass = sizes[size] || "";

  return (
    <motion.button
      ref={ref}
      type={type}
      className={`${base} ${sizeClass} ${className}`}
      disabled={disabled || loading}
      onClick={onClick}
      whileTap={{ scale: disabled || loading ? 1 : 0.96 }}
      {...props}
    >
      {loading ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : leftIcon ? (
        <span className="w-4 h-4 flex-shrink-0">{leftIcon}</span>
      ) : null}
      {children}
      {!loading && rightIcon && (
        <span className="w-4 h-4 flex-shrink-0">{rightIcon}</span>
      )}
    </motion.button>
  );
});

export default Button;
