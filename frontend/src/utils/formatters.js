/**
 * Formatting utilities for the Pragati Agent UI.
 */

/**
 * Format a number as Indian Rupees.
 * @param {number} amount
 * @returns {string}  e.g. "₹50,000"
 */
export function formatRupees(amount) {
  if (amount === null || amount === undefined) return "₹0";
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * Format a number with Indian locale commas.
 * @param {number} num
 * @returns {string}
 */
export function formatNumber(num) {
  if (num === null || num === undefined) return "0";
  return new Intl.NumberFormat("en-IN").format(num);
}

/**
 * Format execution time nicely.
 * @param {number} ms
 * @returns {string}  e.g. "1.2s" or "340ms"
 */
export function formatDuration(ms) {
  if (!ms) return "—";
  if (ms >= 1000) return `${(ms / 1000).toFixed(1)}s`;
  return `${ms}ms`;
}

/**
 * Capitalise first letter.
 * @param {string} str
 * @returns {string}
 */
export function capitalize(str) {
  if (!str) return "";
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

/**
 * Truncate text to a max length with ellipsis.
 * @param {string} text
 * @param {number} max
 * @returns {string}
 */
export function truncate(text, max = 120) {
  if (!text) return "";
  if (text.length <= max) return text;
  return text.slice(0, max).trimEnd() + "…";
}

/**
 * Convert a snake_case key to a readable label.
 * @param {string} key
 * @returns {string}
 */
export function keyToLabel(key) {
  return key
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

/**
 * Get percentage color class based on value and inverted flag.
 * @param {number} value   0-100
 * @param {boolean} invert  true means lower is better (e.g. RTO rate)
 * @returns {string} hex color
 */
export function getMetricColor(value, invert = false) {
  const v = invert ? 100 - value : value;
  if (v >= 75) return "#22C55E";
  if (v >= 50) return "#F59E0B";
  return "#EF4444";
}

/**
 * Format a date to a readable string.
 * @param {string|Date} date
 * @returns {string}
 */
export function formatDate(date) {
  if (!date) return "—";
  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(date));
}
