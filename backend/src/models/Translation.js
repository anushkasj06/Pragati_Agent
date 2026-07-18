/**
 * Translation Model
 * Stores cached translations to reduce Google Cloud Translation API costs
 */

import mongoose from "mongoose";

const translationSchema = new mongoose.Schema(
  {
    sourceHash: {
      type: String,
      required: true,
      index: true,
    },
    sourceLanguage: {
      type: String,
      required: true,
      index: true,
      enum: ["en", "hi", "mr", "bn", "gu", "pa", "ta", "te", "kn", "ml", "or", "as", "ur"],
    },
    targetLanguage: {
      type: String,
      required: true,
      index: true,
      enum: ["en", "hi", "mr", "bn", "gu", "pa", "ta", "te", "kn", "ml", "or", "as", "ur"],
    },
    sourceText: {
      type: String,
      required: true,
    },
    translatedText: {
      type: String,
      required: true,
    },
    updatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

// Compound index for fast lookups
translationSchema.index(
  { sourceHash: 1, sourceLanguage: 1, targetLanguage: 1 },
  { unique: true }
);

export const Translation = mongoose.model("Translation", translationSchema);
