import mongoose from "mongoose";

const applicationSchema = new mongoose.Schema(
  {
    id: { type: String, required: true, unique: true, index: true, trim: true },
    sellerId: { type: String, required: true, trim: true, uppercase: true, index: true },
    sellerName: { type: String, required: true, trim: true },
    phoneNumber: { type: String, required: true, trim: true },
    amount: { type: Number, required: true, default: 0 },
    requestedAmount: { type: Number, required: true, default: 0 },
    purpose: { type: String, default: "Working capital" },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
      required: true,
    },
    submittedAt: { type: Date, required: true, default: () => new Date() },
    reviewedAt: { type: Date },
    reviewedBy: { type: String, trim: true },
    adminNote: { type: String, trim: true, default: "" },
    decisionMessage: { type: String, trim: true, default: "Documents submitted. Awaiting admin review." },
    documents: { type: mongoose.Schema.Types.Mixed, default: {} },
    riskClass: { type: String, default: "Pending" },
    language: { type: String, trim: true, default: "English" },
    evaluation: { type: mongoose.Schema.Types.Mixed, default: null },
    businessStats: { type: mongoose.Schema.Types.Mixed, default: null },
  },
  {
    timestamps: true,
  }
);

export const Application = mongoose.model("Application", applicationSchema);
