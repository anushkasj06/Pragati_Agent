import mongoose from "mongoose";

const appNotificationSchema = new mongoose.Schema(
  {
    seller_id: { type: String, required: true, trim: true, uppercase: true, index: true },
    title: { type: String, required: true, trim: true },
    message: { type: String, required: true, trim: true },
    type: { type: String, enum: ["info", "pending", "success", "rejected"], default: "info" },
    link: { type: String, default: "/seller/history", trim: true },
    read: { type: Boolean, default: false },
    metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  {
    timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
  }
);

export const AppNotification = mongoose.model("AppNotification", appNotificationSchema);
