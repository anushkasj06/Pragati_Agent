import mongoose from "mongoose";

const conversationSchema = new mongoose.Schema(
  {
    seller_id: { type: String, required: true, index: true },
    role: {
      type: String,
      enum: ["user", "assistant", "system"],
      required: true,
    },
    message: { type: String, required: true },
    timestamp: { type: Date, default: Date.now, index: true },
    language: { type: String, default: "English" },
    metadata: { type: mongoose.Schema.Types.Mixed },
  },
  { timestamps: true }
);

conversationSchema.index({ seller_id: 1, timestamp: -1 });

export const Conversation = mongoose.model("Conversation", conversationSchema);
