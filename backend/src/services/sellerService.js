import { Seller } from "../models/Seller.js";
import { createHttpError } from "../middleware/errorHandler.js";
import { normalizePhoneNumber } from "../utils/phoneUtils.js";

export async function createSeller(payload) {
  const existing = await Seller.findOne({ seller_id: payload.seller_id });
  if (existing) {
    throw createHttpError(409, `Seller ID ${payload.seller_id} already exists`);
  }

  const seller = await Seller.create({
    ...payload,
    phone_number: normalizePhoneNumber(payload.phone_number),
  });
  return seller.toObject();
}

export async function getSellerById(sellerId) {
  return Seller.findOne({ seller_id: sellerId }).lean();
}

export async function getSellerByPhone(phoneNumber) {
  const normalizedPhone = normalizePhoneNumber(phoneNumber);
  return Seller.findOne({ phone_number: normalizedPhone }).lean();
}
