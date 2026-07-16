export function normalizePhoneNumber(phoneNumber) {
  if (!phoneNumber) return "";
  let normalized = String(phoneNumber).replace(/[^0-9]/g, "");
  if (normalized.length === 10) {
    normalized = `91${normalized}`;
  }
  return normalized.startsWith("+") ? normalized : `+${normalized}`;
}
