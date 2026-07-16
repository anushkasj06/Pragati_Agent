import { useState } from "react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import { registerSeller } from "../services/api.js";
import { SUPPORTED_LANGUAGES, SELLER_DATA_FIELDS, DEMO_PROFILES } from "../utils/constants.js";

const INITIAL_DATA = {
  seller_name: "Demo Seller",
  seller_id: "SELL_789210",
  phone_number: "",
  preferred_language: "English",
  seller_data: DEMO_PROFILES[0]?.data?.seller_data ||
    SELLER_DATA_FIELDS.reduce((acc, field) => {
      acc[field.key] = field.type === "select" ? 0 : "";
      return acc;
    }, {}),
};

function fieldLabel(label) {
  return label.replace(/\(.+\)/, "").trim();
}

function formatTitle(text) {
  return text.replace(/_/g, " ").replace(/\b\w/g, (chr) => chr.toUpperCase());
}

const SANDBOX_JOIN_CODE = "join large-president";

function buildWhatsAppAppUrl(whatsAppUrl, joinCode) {
  if (!whatsAppUrl) return "";
  const digits = whatsAppUrl.replace(/[^0-9]/g, "");
  return `https://api.whatsapp.com/send?phone=${digits}&text=${encodeURIComponent(joinCode)}`;
}

export default function CreateSellerPage() {
  const [form, setForm] = useState(INITIAL_DATA);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);
  const [whatsAppUrl, setWhatsAppUrl] = useState("");

  const handleChange = (event) => {
    const { name, value } = event.target;
    if (name.startsWith("seller_data.")) {
      const key = name.replace("seller_data.", "");
      setForm((prev) => ({
        ...prev,
        seller_data: { ...prev.seller_data, [key]: value },
      }));
      return;
    }

    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const resetForm = () => {
    setForm(INITIAL_DATA);
    setResult(null);
    setWhatsAppUrl("");
  };

  const isValidPhoneNumber = (phone) => {
    const normalized = phone.replace(/[^0-9]/g, "");
    return /^(?:91)?[6-9][0-9]{9}$/.test(normalized);
  };

  const validate = () => {
    if (!form.seller_name.trim()) return "Seller Name is required.";
    if (!form.seller_id.trim()) return "Seller ID is required.";
    if (!form.phone_number.trim()) return "Phone Number is required.";
    if (!isValidPhoneNumber(form.phone_number)) return "Enter a WhatsApp-compatible Indian phone number.";
    if (!form.preferred_language) return "Preferred Language is required.";
    return null;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const error = validate();
    if (error) {
      toast.error(error);
      return;
    }

    setSubmitting(true);
    setResult(null);

    try {
      const payload = {
        seller_id: form.seller_id.trim().toUpperCase(),
        seller_name: form.seller_name.trim(),
        phone_number: form.phone_number.trim(),
        preferred_language: form.preferred_language,
        seller_data: Object.fromEntries(
          Object.entries(form.seller_data).map(([key, value]) => [
            key,
            SELLER_DATA_FIELDS.find((field) => field.key === key)?.type === "select"
              ? Number(value)
              : Number(value),
          ])
        ),
      };

      const response = await registerSeller(payload);
      setResult(response);
      setWhatsAppUrl(response.whatsAppUrl || "");
      toast.success("Seller created successfully");
    } catch (err) {
      const message = err.response?.data?.error || err.message || "Unable to create seller.";
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ maxWidth: 960, margin: "0 auto", padding: "32px 24px" }}>
      <div style={{ marginBottom: 32, padding: 28, borderRadius: 24, background: "#FFFFFF", border: "1px solid #F3E0F3" }}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 18, flexWrap: "wrap" }}>
          <div>
            <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: "0.18em", textTransform: "uppercase", color: "#EC4899", marginBottom: 12 }}>
              Seller Onboarding
            </div>
            <h1 style={{ fontSize: 32, color: "#111827", margin: 0, lineHeight: 1.05 }}>
              Create Seller Profile
            </h1>
            <p style={{ fontSize: 15, color: "#4B5563", marginTop: 12, maxWidth: 680 }}>
              Add a seller profile for the ML underwriting system and WhatsApp AI Coach. This profile is stored in MongoDB and used for future loan evaluation and coaching.
            </p>
          </div>
          <div style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", minWidth: 220, padding: "16px 22px", borderRadius: 18, background: "#FCE7F3", color: "#BE185D", fontWeight: 700 }}>
            Ready for Loan Evaluation
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24, marginBottom: 24 }}>
          <div style={{ padding: 24, borderRadius: 24, background: "#FFFFFF", border: "1px solid #F3E0F3" }}>
            <h2 style={{ fontSize: 18, color: "#111827", marginBottom: 18 }}>Personal Information</h2>

            <label style={{ display: "block", marginBottom: 16 }}>
              <span style={{ display: "block", marginBottom: 8, fontSize: 14, color: "#111827", fontWeight: 700 }}>Seller Name</span>
              <input
                name="seller_name"
                value={form.seller_name}
                onChange={handleChange}
                placeholder="Enter seller name"
                style={{ width: "100%", borderRadius: 14, border: "1px solid #E5E7EB", padding: "12px 14px", fontSize: 14, color: "#111827" }}
              />
            </label>

            <label style={{ display: "block", marginBottom: 16 }}>
              <span style={{ display: "block", marginBottom: 8, fontSize: 14, color: "#111827", fontWeight: 700 }}>Seller ID</span>
              <input
                name="seller_id"
                value={form.seller_id}
                onChange={handleChange}
                placeholder="e.g. SELL_00199"
                style={{ width: "100%", borderRadius: 14, border: "1px solid #E5E7EB", padding: "12px 14px", fontSize: 14, color: "#111827" }}
              />
            </label>

            <label style={{ display: "block", marginBottom: 16 }}>
              <span style={{ display: "block", marginBottom: 8, fontSize: 14, color: "#111827", fontWeight: 700 }}>Phone Number (WhatsApp)</span>
              <input
                name="phone_number"
                value={form.phone_number}
                onChange={handleChange}
                placeholder="e.g. 919876543210"
                style={{ width: "100%", borderRadius: 14, border: "1px solid #E5E7EB", padding: "12px 14px", fontSize: 14, color: "#111827" }}
              />
            </label>

            <label style={{ display: "block", marginBottom: 16 }}>
              <span style={{ display: "block", marginBottom: 8, fontSize: 14, color: "#111827", fontWeight: 700 }}>Preferred Language</span>
              <select
                name="preferred_language"
                value={form.preferred_language}
                onChange={handleChange}
                style={{ width: "100%", borderRadius: 14, border: "1px solid #E5E7EB", padding: "12px 14px", fontSize: 14, color: "#111827" }}
              >
                {SUPPORTED_LANGUAGES.map((language) => (
                  <option key={language.value} value={language.value}>{language.label}</option>
                ))}
              </select>
            </label>
          </div>

          <div style={{ padding: 24, borderRadius: 24, background: "#FFFFFF", border: "1px solid #F3E0F3" }}>
            <h2 style={{ fontSize: 18, color: "#111827", marginBottom: 18 }}>Business Information</h2>

            {SELLER_DATA_FIELDS.map((field) => (
              <label key={field.key} style={{ display: "block", marginBottom: 16 }}>
                <span style={{ display: "block", marginBottom: 8, fontSize: 14, color: "#111827", fontWeight: 700 }}>
                  {field.label}
                </span>
                {field.type === "select" ? (
                  <select
                    name={`seller_data.${field.key}`}
                    value={form.seller_data[field.key]}
                    onChange={handleChange}
                    style={{ width: "100%", borderRadius: 14, border: "1px solid #E5E7EB", padding: "12px 14px", fontSize: 14, color: "#111827" }}
                  >
                    {field.options.map((option) => (
                      <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                  </select>
                ) : (
                  <input
                    name={`seller_data.${field.key}`}
                    value={form.seller_data[field.key]}
                    onChange={handleChange}
                    type="number"
                    placeholder={field.placeholder}
                    min={field.min}
                    max={field.max}
                    step={field.step}
                    style={{ width: "100%", borderRadius: 14, border: "1px solid #E5E7EB", padding: "12px 14px", fontSize: 14, color: "#111827" }}
                  />
                )}
              </label>
            ))}
          </div>
        </div>

        <div style={{ display: "flex", gap: 16, flexWrap: "wrap", marginBottom: 28 }}>
          <button
            type="submit"
            disabled={submitting}
            style={{
              borderRadius: 16,
              padding: "14px 22px",
              border: "none",
              background: "#EC4899",
              color: "#fff",
              fontWeight: 700,
              cursor: submitting ? "not-allowed" : "pointer",
            }}
          >
            {submitting ? "Creating..." : "Create Seller"}
          </button>
          <button
            type="button"
            onClick={resetForm}
            disabled={submitting}
            style={{
              borderRadius: 16,
              padding: "14px 22px",
              border: "1px solid #E5E7EB",
              background: "#FFFFFF",
              color: "#111827",
              cursor: submitting ? "not-allowed" : "pointer",
            }}
          >
            Reset
          </button>
        </div>
      </form>

      {result && (
        <div style={{ padding: 24, borderRadius: 24, background: "#FDF2F8", border: "1px solid #F9A8D4" }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: "#BE185D", marginBottom: 8 }}>Seller Created Successfully</div>
          <div style={{ fontSize: 16, color: "#111827", marginBottom: 8 }}>WhatsApp Connected</div>
          <div style={{ fontSize: 14, color: "#4B5563" }}>Ready for Loan Evaluation</div>
          <div style={{ marginTop: 14, fontSize: 13, color: "#6B7280" }}>
            Seller ID: {result.seller_id}
          </div>
          {whatsAppUrl && (
            <div style={{ marginTop: 16, display: "flex", flexDirection: "column", gap: 10 }}>
              <a
                href={whatsAppUrl}
                target="_blank"
                rel="noreferrer"
                style={{ color: "#EC4899", fontWeight: 700 }}
              >
                Open WhatsApp sandbox connection (web)
              </a>
              <a
                href={buildWhatsAppAppUrl(whatsAppUrl, SANDBOX_JOIN_CODE)}
                target="_blank"
                rel="noreferrer"
                style={{ color: "#EC4899", fontWeight: 700 }}
              >
                Open WhatsApp sandbox in app (pre-filled join code)
              </a>
              <div style={{ color: "#6B7280", fontSize: 13, lineHeight: 1.6 }}>
                First send <strong>{SANDBOX_JOIN_CODE}</strong> to the Twilio sandbox number. Then send <strong>EVALUATE {result.seller_id}</strong> from WhatsApp to request the loan evaluation result.
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
