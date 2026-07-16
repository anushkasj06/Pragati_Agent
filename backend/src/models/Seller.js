import mongoose from "mongoose";
import { SUPPORTED_LANGUAGES } from "../utils/constants.js";

const sellerSchema = new mongoose.Schema(
  {
    seller_id: {
      type: String,
      required: true,
      unique: true,
      index: true,
      trim: true,
      uppercase: true,
    },
    seller_name: { type: String, required: true, trim: true },
    phone_number: { type: String, required: true, trim: true },
    preferred_language: {
      type: String,
      enum: SUPPORTED_LANGUAGES,
      default: "English",
      required: true,
    },
    seller_data: { type: mongoose.Schema.Types.Mixed, required: true },
  },
  {
    timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
  }
);

export const Seller = mongoose.model("Seller", sellerSchema);
