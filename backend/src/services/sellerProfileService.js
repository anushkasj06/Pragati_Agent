import { SELLER_PROFILES } from "../data/sellerProfiles.js";

export function listSellerProfiles(riskCategory) {
  if (!riskCategory || riskCategory === "All") return SELLER_PROFILES;

  const normalized = riskCategory.toLowerCase();
  return SELLER_PROFILES.filter(
    (seller) => seller.risk_category.toLowerCase() === normalized
  );
}

export function getSellerProfile(sellerId) {
  return SELLER_PROFILES.find(
    (seller) => seller.id.toLowerCase() === String(sellerId).toLowerCase()
  );
}
