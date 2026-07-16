/**
 * LoanCard — hero card showing the loan decision result.
 * Shows loan limit, risk class, decision status, and key metrics.
 */

import { motion } from "framer-motion";
import { CheckCircle, XCircle, Clock, TrendingUp, Shield, Zap } from "lucide-react";
import RiskBadge from "./RiskBadge";
import { useAnimatedNumber } from "../../hooks/useAnimatedNumber";
import { formatRupees, formatDuration } from "../../utils/formatters";
import { DECISION_STATUS_CONFIG } from "../../utils/constants";

export function LoanCard({ result, className = "" }) {
  const { decision, execution_time_ms } = result;
  const animatedLimit = useAnimatedNumber(decision.loan_limit, 1400, 200);
  const animatedScore = useAnimatedNumber(decision.risk_score, 1000, 300);

  const statusConfig = DECISION_STATUS_CONFIG[decision.decision_status] || DECISION_STATUS_CONFIG.Approved;
  const StatusIcon = decision.decision_status === "Approved" ? CheckCircle : XCircle;

  return (
    <motion.div
      className={`glass rounded-3xl p-6 shadow-card overflow-hidden relative ${className}`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
    >
      {/* Background glow */}
      <div
        className="absolute inset-0 pointer-events-none rounded-3xl opacity-30"
        style={{
          background: `radial-gradient(ellipse at top right, ${statusConfig.bg} 0%, transparent 60%)`,
        }}
      />

      {/* Header */}
      <div className="flex items-start justify-between mb-6 relative">
        <div>
          <p className="text-white/50 text-sm font-medium mb-1">Loan Decision</p>
          <div className="flex items-center gap-3">
            <StatusIcon
              className="w-5 h-5 flex-shrink-0"
              style={{ color: statusConfig.color }}
            />
            <h2
              className="text-xl font-bold"
              style={{ color: statusConfig.color }}
            >
              {decision.decision_status}
            </h2>
          </div>
        </div>
        <RiskBadge riskClass={decision.risk_class} size="md" animate />
      </div>

      {/* Loan limit — hero number */}
      <div className="mb-6 relative">
        <p className="text-white/40 text-xs font-medium uppercase tracking-widest mb-1">
          Approved Loan Limit
        </p>
        <motion.div
          className="text-4xl font-black text-gradient-brand"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          {formatRupees(animatedLimit)}
        </motion.div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-3">
        {/* Risk score */}
        <div className="bg-white/[0.04] rounded-2xl p-3 text-center">
          <div className="flex items-center justify-center gap-1 mb-1">
            <Shield className="w-3.5 h-3.5 text-brand-secondary" />
            <p className="text-white/50 text-xs">Risk Score</p>
          </div>
          <p className="text-white font-bold text-xl">{animatedScore}</p>
          <p className="text-white/30 text-xs">/100</p>
        </div>

        {/* Human review */}
        <div className="bg-white/[0.04] rounded-2xl p-3 text-center">
          <div className="flex items-center justify-center gap-1 mb-1">
            <Clock className="w-3.5 h-3.5 text-brand-secondary" />
            <p className="text-white/50 text-xs">Review</p>
          </div>
          <p
            className="font-bold text-sm"
            style={{ color: decision.requires_human_review ? "#F59E0B" : "#22C55E" }}
          >
            {decision.requires_human_review ? "Required" : "Auto"}
          </p>
        </div>

        {/* Processing time */}
        <div className="bg-white/[0.04] rounded-2xl p-3 text-center">
          <div className="flex items-center justify-center gap-1 mb-1">
            <Zap className="w-3.5 h-3.5 text-brand-secondary" />
            <p className="text-white/50 text-xs">Processed</p>
          </div>
          <p className="text-white font-bold text-sm">{formatDuration(execution_time_ms)}</p>
        </div>
      </div>
    </motion.div>
  );
}

export default LoanCard;
