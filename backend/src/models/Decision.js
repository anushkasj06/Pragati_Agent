import mongoose from "mongoose";

const reasoningFeatureSchema = new mongoose.Schema(
  {
    feature: String,
    impact: String,
    reason: String,
  },
  { _id: false }
);

const decisionSchema = new mongoose.Schema(
  {
    seller_id: { type: String, required: true, index: true },
    timestamp: { type: Date, default: Date.now, index: true },
    seller_features: { type: mongoose.Schema.Types.Mixed, required: true },
    risk_class: { type: String, required: true },
    risk_score: { type: Number, required: true },
    ml_loan_limit: { type: Number, required: true },
    final_loan_limit: { type: Number, required: true },
    requires_human_review: { type: Boolean, default: false },
    decision_status: { type: String, enum: ["Approved", "Rejected"], required: true },
    top_reasoning_features: [reasoningFeatureSchema],
    seller_message: { type: String, required: true },
    auditor_trail: { type: String, required: true },
    improvement_plan: [{ type: String }],
    execution_time_ms: { type: Number },
    language: { type: String, default: "English" },
  },
  { timestamps: true }
);

export const Decision = mongoose.model("Decision", decisionSchema);
