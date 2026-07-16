import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema(
  {
    seller_id: { type: String, required: true, index: true, trim: true, uppercase: true },
    phone_number: { type: String, required: true, trim: true },
    from_number: { type: String, required: true, trim: true },
    body: { type: String, required: true },
    status: { type: String, enum: ["queued", "sent", "failed"], default: "queued" },
    retry_count: { type: Number, default: 0 },
    error: { type: String },
    twilio_sid: { type: String },
    sent_at: { type: Date },
    metadata: { type: mongoose.Schema.Types.Mixed },
  },
  {
    timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
  }
);

export const Notification = mongoose.model("Notification", notificationSchema);
