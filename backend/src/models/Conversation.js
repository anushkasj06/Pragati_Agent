import mongoose from "mongoose";

const conversationSchema = new mongoose.Schema(
  {
    seller_id: { type: String, required: true, index: true },
    phone_number: { type: String, default: null, index: true },
    role: {
      type: String,
      enum: ["user", "assistant", "system"],
      required: true,
    },
    message: { type: String, required: true },
    timestamp: { type: Date, default: Date.now, index: true },
    language: { type: String, default: "English" },
    context_used: { type: String, default: "loan-evaluation" },
    metadata: { type: mongoose.Schema.Types.Mixed },
  },
  { timestamps: true }
);

conversationSchema.index({ seller_id: 1, timestamp: -1 });

export const Conversation = mongoose.model("Conversation", conversationSchema);
