import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import {
  ArrowLeft,
  ArrowRight,
  BarChart3,
  Bot,
  CheckCircle2,
  ChevronRight,
  CircleDollarSign,
  Clock3,
  Database,
  Info,
  MessageCircle,
  Package,
  ShieldCheck,
  Smartphone,
  Sparkles,
  Star,
  TrendingUp,
  Zap,
} from "lucide-react";
import { registerSeller } from "../services/api.js";
import { useApp } from "../context/AppContext.jsx";
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

function buildInitialFormState(preferredLanguage = INITIAL_DATA.preferred_language) {
  return {
    ...INITIAL_DATA,
    preferred_language: preferredLanguage || INITIAL_DATA.preferred_language,
  };
}

const SANDBOX_JOIN_CODE = "join large-president";
const APP_FONT = "Inter, system-ui, sans-serif";

function buildWhatsAppAppUrl(whatsAppUrl, joinCode) {
  if (!whatsAppUrl) return "";
  const digits = whatsAppUrl.replace(/[^0-9]/g, "");
  return `https://api.whatsapp.com/send?phone=${digits}&text=${encodeURIComponent(joinCode)}`;
}

const PERSONAL_FIELDS = [
  {
    key: "seller_name",
    label: "Seller Name",
    placeholder: "Enter seller name",
    helper: "This helps the assistant greet the seller and personalize the experience.",
  },
  {
    key: "seller_id",
    label: "Seller ID",
    placeholder: "e.g. SELL_00199",
    helper: "A unique seller reference keeps the profile easy to track in MongoDB.",
  },
  {
    key: "phone_number",
    label: "WhatsApp Number",
    placeholder: "e.g. 919876543210",
    helper: "This number will become your AI Financial Assistant on WhatsApp.",
  },
  {
    key: "preferred_language",
    label: "Preferred Language",
    placeholder: "Select",
    helper: "The assistant will respond in the language that feels most natural to the seller.",
  },
];

const METRIC_FIELDS = [
  {
    key: "sales_velocity_6m",
    label: "Sales Velocity",
    description: "Total sales generated in the last six months.",
    icon: TrendingUp,
    unit: "₹",
  },
  {
    key: "dispatch_sla_compliance",
    label: "Dispatch SLA",
    description: "Percentage of orders dispatched on time.",
    icon: Clock3,
    unit: "%",
  },
  {
    key: "rto_rate",
    label: "RTO Rate",
    description: "Percentage of returned shipments.",
    icon: Package,
    unit: "%",
  },
  {
    key: "avg_customer_rating",
    label: "Customer Rating",
    description: "Average satisfaction score from buyers.",
    icon: Star,
    unit: "★",
  },
  {
    key: "sales_growth_rate",
    label: "Sales Growth",
    description: "How quickly the business is scaling.",
    icon: BarChart3,
    unit: "%",
  },
  {
    key: "total_orders_6m",
    label: "Total Orders",
    description: "Volume of orders processed across the period.",
    icon: Package,
    unit: "orders",
  },
];

const TRUST_OPTIONS = [
  { value: 0, label: "Never Defaulted", description: "A clean past record helps strengthen trust." },
  { value: 1, label: "Previously Defaulted", description: "This can lower confidence and increase review depth." },
];

const TREND_OPTIONS = [
  { value: 0.2, label: "Improving", description: "The business is gaining strength." },
  { value: 0.0, label: "Stable", description: "Recent performance is steady." },
  { value: -0.15, label: "Declining", description: "Signals may need attention." },
];

export default function CreateSellerPage() {
  const { sellerLanguage } = useApp();
  const [form, setForm] = useState(() => buildInitialFormState(sellerLanguage));
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);
  const [whatsAppUrl, setWhatsAppUrl] = useState("");
  const [step, setStep] = useState(1);
  const [activeTooltip, setActiveTooltip] = useState(null);

  useEffect(() => {
    setForm((prev) => ({
      ...prev,
      preferred_language: sellerLanguage || prev.preferred_language || INITIAL_DATA.preferred_language,
    }));
  }, [sellerLanguage]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    if (name.startsWith("seller_data.")) {
      const key = name.replace("seller_data.", "");
      let parsedValue = value;
      if (value === "") {
        parsedValue = "";
      } else if (key === "prior_loan_default") {
        parsedValue = Number(value);
      } else if (!Number.isNaN(Number(value))) {
        parsedValue = Number(value);
      }
      setForm((prev) => ({
        ...prev,
        seller_data: { ...prev.seller_data, [key]: parsedValue },
      }));
      return;
    }

    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const resetForm = () => {
    setForm(buildInitialFormState(sellerLanguage));
    setResult(null);
    setWhatsAppUrl("");
    setStep(1);
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

  const handleSubmit = (event) => {
    event.preventDefault();

    if (step < 3) {
      setStep(3);
      toast.success("Please review the final onboarding details and tap Complete AI Onboarding.");
      return;
    }

    toast.success("Tap Complete AI Onboarding to create the seller profile.");
  };

  const handleCompleteOnboarding = async (event) => {
    event?.preventDefault?.();

    if (step < 3) {
      setStep(3);
      toast.success("Please review the final onboarding details and tap Complete AI Onboarding.");
      return;
    }

    const error = validate();
    if (error) {
      toast.error(error);
      return;
    }

    setSubmitting(true);
    setResult(null);

    try {
      const selectedLanguage = form.preferred_language || sellerLanguage || "English";
      const payload = {
        seller_id: form.seller_id.trim().toUpperCase(),
        seller_name: form.seller_name.trim(),
        phone_number: form.phone_number.trim(),
        preferred_language: selectedLanguage,
        seller_data: Object.fromEntries(
          Object.entries(form.seller_data).map(([key, value]) => [key, Number(value)])
        ),
      };

      setForm((prev) => ({ ...prev, preferred_language: selectedLanguage }));

      const response = await registerSeller(payload);
      setResult(response);
      setWhatsAppUrl(response.whatsAppUrl || "");
      toast.success("Seller profile created. Follow the WhatsApp steps below to finish onboarding.");
    } catch (err) {
      const status = err?.status || err?.response?.status;
      const message =
        status === 409
          ? "This Seller ID already exists. Please choose a different Seller ID."
          : err?.response?.data?.error || err?.message || "Unable to create seller.";
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  const preview = useMemo(() => {
    const dispatch = Number(form.seller_data.dispatch_sla_compliance || 0);
    const rating = Number(form.seller_data.avg_customer_rating || 0);
    const rto = Number(form.seller_data.rto_rate || 0);
    const sales = Number(form.seller_data.sales_velocity_6m || 0);
    const score = Math.max(45, Math.min(96, Math.round(58 + dispatch / 2 + rating * 6 - rto + sales / 15000)));

    let risk = "Moderate";
    let eligibility = "₹45,000";
    let health = "Good";

    if (dispatch >= 95 && rating >= 4.3 && rto <= 8) {
      risk = "Low";
      eligibility = "₹75,000";
      health = "Excellent";
    } else if (dispatch >= 88 && rating >= 3.8 && rto <= 12) {
      risk = "Moderate";
      eligibility = "₹55,000";
      health = "Strong";
    } else {
      risk = "High";
      eligibility = "₹30,000";
      health = "Needs Care";
    }

    return { score, risk, eligibility, health };
  }, [form.seller_data]);

  const progressPercent = step === 1 ? 33 : step === 2 ? 66 : 100;

  const renderStepContent = () => {
    if (step === 1) {
      return (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>
          <div style={{ display: "grid", gap: 14 }}>
            {PERSONAL_FIELDS.map((field) => (
              <label key={field.key} style={{ display: "block" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8, marginBottom: 8 }}>
                  <span style={{ fontSize: 14, color: "#111827", fontWeight: 700 }}>{field.label}</span>
                  <div style={{ color: "#6F2DBD", cursor: "help", position: "relative" }} onMouseEnter={() => setActiveTooltip(field.label)} onMouseLeave={() => setActiveTooltip(null)}>
                    <Info size={14} />
                    {activeTooltip === field.label && (
                      <div style={{ position: "absolute", right: 0, top: 22, width: 220, padding: "10px 12px", borderRadius: 12, background: "#111827", color: "#fff", fontSize: 12, lineHeight: 1.5, boxShadow: "0 10px 20px rgba(0,0,0,0.16)", zIndex: 10 }}>
                        {field.helper}
                      </div>
                    )}
                  </div>
                </div>
                {field.key === "preferred_language" ? (
                  <select
                    name={field.key}
                    value={form[field.key]}
                    onChange={handleChange}
                    style={{ width: "100%", borderRadius: 14, border: "1px solid #DDD6FE", padding: "12px 14px", fontSize: 14, color: "#111827", background: "#FCFBFF", outline: "none" }}
                  >
                    {SUPPORTED_LANGUAGES.map((language) => (
                      <option key={language.value} value={language.value}>{language.label}</option>
                    ))}
                  </select>
                ) : (
                  <input
                    name={field.key}
                    value={form[field.key]}
                    onChange={handleChange}
                    placeholder={field.placeholder}
                    style={{ width: "100%", borderRadius: 14, border: "1px solid #DDD6FE", padding: "12px 14px", fontSize: 14, color: "#111827", background: "#FCFBFF", outline: "none" }}
                  />
                )}
              </label>
            ))}
          </div>
        </motion.div>
      );
    }

    if (step === 2) {
      return (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>
          <div style={{ display: "grid", gap: 12 }}>
            {METRIC_FIELDS.map((field) => {
              const Icon = field.icon;
              const value = form.seller_data[field.key];
              return (
                <div key={field.key} style={{ padding: 14, borderRadius: 16, border: "1px solid #EEE7FF", background: "#FCFBFF" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, marginBottom: 8 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <div style={{ width: 36, height: 36, borderRadius: 12, background: "rgba(111,45,189,0.10)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <Icon size={17} color="#6F2DBD" />
                      </div>
                      <div>
                        <div style={{ fontSize: 14, fontWeight: 700, color: "#111827" }}>{field.label}</div>
                        <div style={{ fontSize: 12, color: "#6B7280", lineHeight: 1.5 }}>{field.description}</div>
                      </div>
                    </div>
                    <div style={{ color: "#6F2DBD", cursor: "help", position: "relative" }} onMouseEnter={() => setActiveTooltip(field.label)} onMouseLeave={() => setActiveTooltip(null)}>
                      <Info size={14} />
                      {activeTooltip === field.label && (
                        <div style={{ position: "absolute", right: 0, top: 24, width: 220, padding: "10px 12px", borderRadius: 12, background: "#111827", color: "#fff", fontSize: 12, lineHeight: 1.5, boxShadow: "0 10px 20px rgba(0,0,0,0.16)", zIndex: 10 }}>
                          {field.description}
                        </div>
                      )}
                    </div>
                  </div>
                  <input
                    name={`seller_data.${field.key}`}
                    value={value}
                    onChange={handleChange}
                    type="number"
                    placeholder="Enter value"
                    style={{ width: "100%", borderRadius: 12, border: "1px solid #DDD6FE", padding: "10px 12px", fontSize: 14, color: "#111827", background: "#fff", outline: "none" }}
                  />
                </div>
              );
            })}
          </div>
        </motion.div>
      );
    }

    return (
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>
        <div style={{ display: "grid", gap: 14 }}>
          <div style={{ padding: 14, borderRadius: 16, border: "1px solid #EEE7FF", background: "#FCFBFF" }}>
            <div style={{ fontSize: 13, fontWeight: 800, color: "#6F2DBD", marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.12em" }}>Business Trust</div>
            <div style={{ fontSize: 14, fontWeight: 700, color: "#111827", marginBottom: 10 }}>Prior Loan Default</div>
            <div style={{ display: "grid", gap: 10 }}>
              {TRUST_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => handleChange({ target: { name: "seller_data.prior_loan_default", value: option.value } })}
                  style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", gap: 3, padding: "12px 14px", borderRadius: 12, border: form.seller_data.prior_loan_default === option.value ? "1px solid #6F2DBD" : "1px solid #E5E7EB", background: form.seller_data.prior_loan_default === option.value ? "rgba(111,45,189,0.08)" : "#fff", textAlign: "left" }}
                >
                  <span style={{ fontSize: 13, fontWeight: 700, color: "#111827" }}>{option.label}</span>
                  <span style={{ fontSize: 12, color: "#6B7280" }}>{option.description}</span>
                </button>
              ))}
            </div>
          </div>

          <div style={{ padding: 14, borderRadius: 16, border: "1px solid #EEE7FF", background: "#FCFBFF" }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: "#111827", marginBottom: 10 }}>Account Age</div>
            <input
              type="range"
              min="1"
              max="60"
              value={Number(form.seller_data.account_age_months || 1)}
              onChange={(event) => handleChange({ target: { name: "seller_data.account_age_months", value: event.target.value } })}
              style={{ width: "100%", accentColor: "#6F2DBD" }}
            />
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "#6B7280", marginTop: 6 }}>
              <span>1 month</span>
              <span style={{ fontWeight: 700, color: "#5B21B6" }}>{Number(form.seller_data.account_age_months || 1)} months</span>
              <span>60 months</span>
            </div>
          </div>

          <div style={{ padding: 14, borderRadius: 16, border: "1px solid #EEE7FF", background: "#FCFBFF" }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: "#111827", marginBottom: 10 }}>Catalog Size</div>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <button type="button" onClick={() => handleChange({ target: { name: "seller_data.catalog_size", value: Math.max(5, Number(form.seller_data.catalog_size || 5) - 10) } })} style={{ width: 38, height: 38, borderRadius: 12, border: "1px solid #DDD6FE", background: "#fff" }}>−</button>
              <div style={{ flex: 1, borderRadius: 12, border: "1px solid #DDD6FE", padding: "12px 14px", textAlign: "center", fontWeight: 800, color: "#5B21B6", background: "#fff" }}>{Number(form.seller_data.catalog_size || 5)}</div>
              <button type="button" onClick={() => handleChange({ target: { name: "seller_data.catalog_size", value: Math.min(500, Number(form.seller_data.catalog_size || 5) + 10) } })} style={{ width: 38, height: 38, borderRadius: 12, border: "1px solid #DDD6FE", background: "#fff" }}>+</button>
            </div>
          </div>

          <div style={{ padding: 14, borderRadius: 16, border: "1px solid #EEE7FF", background: "#FCFBFF" }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: "#111827", marginBottom: 10 }}>Rating Trend</div>
            <div style={{ display: "grid", gap: 10 }}>
              {TREND_OPTIONS.map((option) => (
                <button
                  key={option.label}
                  type="button"
                  onClick={() => handleChange({ target: { name: "seller_data.rating_trend", value: option.value } })}
                  style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 14px", borderRadius: 12, border: Number(form.seller_data.rating_trend || 0) === option.value ? "1px solid #6F2DBD" : "1px solid #E5E7EB", background: Number(form.seller_data.rating_trend || 0) === option.value ? "rgba(111,45,189,0.08)" : "#fff" }}
                >
                  <span style={{ fontSize: 13, fontWeight: 700, color: "#111827" }}>{option.label}</span>
                  <span style={{ fontSize: 12, color: "#6B7280" }}>{option.description}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </motion.div>
    );
  };

  return (
    <div style={{ maxWidth: 1280, margin: "0 auto", padding: "32px 24px 56px", background: "linear-gradient(180deg, #FCFBFF 0%, #F8F4FF 100%)", minHeight: "100vh", fontFamily: APP_FONT }}>
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45 }} style={{ marginBottom: 24, padding: 24, borderRadius: 24, background: "linear-gradient(135deg, #FFFFFF 0%, #F8F4FF 100%)", border: "1px solid #E9E5F5", boxShadow: "0 16px 42px rgba(111,45,189,0.08)" }}>
        <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", gap: 20 }}>
          <div style={{ maxWidth: 680 }}>
            <div style={{ fontSize: 12, fontWeight: 800, letterSpacing: "0.18em", textTransform: "uppercase", color: "#6F2DBD", marginBottom: 10 }}>
              Seller Onboarding
            </div>
            <h1 style={{ fontSize: 28, color: "#111827", margin: 0, lineHeight: 1.2 }}><b>Create Your AI Seller Profile</b></h1>
            <p style={{ fontSize: 15, color: "#4B5563", marginTop: 10, lineHeight: 1.8 }}>
              Complete a one-time onboarding so Pragati Agent can understand your business and provide AI-powered loan recommendations through WhatsApp.
            </p>
          </div>
          <div style={{ minWidth: 260, padding: 16, borderRadius: 18, background: "linear-gradient(135deg, rgba(111,45,189,0.10) 0%, rgba(37,211,102,0.12) 100%)", border: "1px solid rgba(111,45,189,0.12)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
              <Sparkles size={16} color="#6F2DBD" />
              <span style={{ fontSize: 13, fontWeight: 800, color: "#5B21B6" }}>Why do I need to fill this information?</span>
            </div>
            <div style={{ fontSize: 13, color: "#374151", lineHeight: 1.7 }}>
              This manual onboarding exists only for this demo. In the real Meesho ecosystem, the AI Agent will automatically retrieve sales history, orders, ratings, dispatch, returns, and catalog data from the seller account.
            </div>
          </div>
        </div>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} style={{ marginBottom: 24, padding: 20, borderRadius: 22, background: "#FFFFFF", border: "1px solid #E9E5F5", boxShadow: "0 12px 24px rgba(111,45,189,0.05)" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, marginBottom: 16 }}>
          <div style={{ fontSize: 14, fontWeight: 800, color: "#111827" }}>Your onboarding journey</div>
          <div style={{ fontSize: 12, color: "#6B7280" }}>{progressPercent}% complete</div>
        </div>
        <div style={{ position: "relative", height: 8, borderRadius: 999, background: "#EEE7FF", overflow: "hidden" }}>
          <motion.div initial={{ width: 0 }} animate={{ width: `${progressPercent}%` }} transition={{ duration: 0.4 }} style={{ height: "100%", borderRadius: 999, background: "linear-gradient(90deg, #6F2DBD 0%, #25D366 100%)" }} />
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", gap: 12, marginTop: 16 }}>
          {[
            "Create Seller Profile",
            "Store Profile in MongoDB",
            "Connect WhatsApp Number",
            "AI Underwriting Ready",
            "Future Loan Requests Through WhatsApp",
          ].map((stepName, index) => (
            <div key={stepName} style={{ display: "flex", alignItems: "center", gap: 8, color: index < 4 ? "#5B21B6" : "#6B7280", fontSize: 12, fontWeight: 700 }}>
              <div style={{ width: 24, height: 24, borderRadius: "50%", background: index < 4 ? "rgba(111,45,189,0.12)" : "#F3F4F6", display: "flex", alignItems: "center", justifyContent: "center" }}>
                {index + 1}
              </div>
              <span>{stepName}</span>
              {index < 4 && <ChevronRight size={14} color="#C4B5FD" />}
            </div>
          ))}
        </div>
      </motion.div>

      <div style={{ display: "grid", gridTemplateColumns: "1.1fr 0.9fr", gap: 24, alignItems: "start" }}>
        <div>
          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} style={{ padding: 24, borderRadius: 24, background: "#FFFFFF", border: "1px solid #E9E5F5", boxShadow: "0 10px 28px rgba(111,45,189,0.05)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, marginBottom: 18 }}>
                <div>
                  <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: "0.16em", textTransform: "uppercase", color: "#6F2DBD" }}>Step {step}</div>
                  <h2 style={{ fontSize: 18, color: "#111827", margin: "4px 0 0" }}>{step === 1 ? "Personal Information" : step === 2 ? "Business Health" : "Business Trust"}</h2>
                </div>
                <div style={{ padding: "7px 10px", borderRadius: 999, background: "rgba(37,211,102,0.12)", color: "#128C7E", fontSize: 12, fontWeight: 700 }}>
                  Guided onboarding
                </div>
              </div>
              {renderStepContent()}
            </motion.div>

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
              <button type="button" onClick={() => setStep((prev) => Math.max(1, prev - 1))} disabled={step === 1} style={{ display: "inline-flex", alignItems: "center", gap: 8, borderRadius: 16, padding: "12px 18px", border: "1px solid #DDD6FE", background: "#FFFFFF", color: "#5B21B6", cursor: step === 1 ? "not-allowed" : "pointer", opacity: step === 1 ? 0.7 : 1 }}>
                <ArrowLeft size={16} />
                Back
              </button>
              {step < 3 ? (
                <button type="button" onClick={() => setStep((prev) => Math.min(3, prev + 1))} style={{ display: "inline-flex", alignItems: "center", gap: 8, borderRadius: 16, padding: "12px 18px", border: "none", background: "linear-gradient(135deg, #6F2DBD 0%, #5B21B6 100%)", color: "#fff", fontWeight: 700 }}>
                  Continue
                  <ArrowRight size={16} />
                </button>
              ) : (
                <button type="button" onClick={handleCompleteOnboarding} disabled={submitting} style={{ display: "inline-flex", alignItems: "center", gap: 8, borderRadius: 16, padding: "12px 22px", border: "none", background: "linear-gradient(135deg, #6F2DBD 0%, #5B21B6 100%)", color: "#fff", fontWeight: 700, cursor: submitting ? "not-allowed" : "pointer", boxShadow: "0 10px 24px rgba(111,45,189,0.18)" }}>
                  {submitting ? "Creating..." : "Complete AI Onboarding"}
                </button>
              )}
            </div>
            <div style={{ fontSize: 13, color: "#6B7280", lineHeight: 1.7 }}>
              This profile is securely stored in MongoDB and linked with your WhatsApp number for future AI-powered loan assistance.
            </div>
          </form>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          {/* <motion.div initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.4 }} style={{ padding: 20, borderRadius: 24, background: "linear-gradient(135deg, #FFFFFF 0%, #F8F4FF 100%)", border: "1px solid #E9E5F5", boxShadow: "0 14px 32px rgba(111,45,189,0.06)", position: "relative" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
              <Bot size={18} color="#6F2DBD" />
              <div style={{ fontSize: 16, fontWeight: 800, color: "#111827" }}>Your AI Financial Profile</div>
            </div>
            <div style={{ padding: 14, borderRadius: 16, background: "#fff", border: "1px solid #EEE7FF", marginBottom: 12 }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "#6B7280", marginBottom: 8 }}>
                <span>Business Health</span>
                <span>{"★".repeat(Math.max(1, Math.min(5, Math.round(preview.score / 20))))}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                <span style={{ fontSize: 13, color: "#374151" }}>Estimated Risk</span>
                <span style={{ fontSize: 13, fontWeight: 800, color: preview.risk === "Low" ? "#128C7E" : preview.risk === "Moderate" ? "#F59E0B" : "#EF4444" }}>{preview.risk}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                <span style={{ fontSize: 13, color: "#374151" }}>Estimated Loan Eligibility</span>
                <span style={{ fontSize: 14, fontWeight: 800, color: "#111827" }}>{preview.eligibility}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: 13, color: "#374151" }}>Preferred Language</span>
                <span style={{ fontSize: 13, fontWeight: 800, color: "#5B21B6" }}>{form.preferred_language}</span>
              </div>
            </div>
            <div style={{ padding: 14, borderRadius: 16, background: "linear-gradient(135deg, rgba(111,45,189,0.08) 0%, rgba(37,211,102,0.10) 100%)", border: "1px solid rgba(111,45,189,0.12)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                <Smartphone size={15} color="#6F2DBD" />
                <span style={{ fontSize: 13, fontWeight: 800, color: "#111827" }}>WhatsApp</span>
              </div>
              <div style={{ fontSize: 13, color: "#374151", lineHeight: 1.7 }}>
                The number entered will become the seller’s AI assistant channel for future requests and onboarding follow-ups.
              </div>
            </div>
          </motion.div> */}

          <motion.div initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.45 }} style={{ padding: 20, borderRadius: 24, background: "#FFFFFF", border: "1px solid #E9E5F5", boxShadow: "0 12px 28px rgba(111,45,189,0.05)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
              <Zap size={18} color="#6F2DBD" />
              <div style={{ fontSize: 16, fontWeight: 800, color: "#111827" }}>What happens after this?</div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {[
                { label: "Meesho Seller Account", icon: Bot },
                { label: "Business History Automatically Retrieved", icon: Database },
                { label: "ML Underwriting Model", icon: BarChart3 },
                { label: "Agentic AI Reasoning", icon: Sparkles },
                { label: "Policy Engine", icon: ShieldCheck },
                { label: "Loan Decision", icon: CircleDollarSign },
                { label: "Personalized WhatsApp Response", icon: MessageCircle },
              ].map((item, index) => {
                const Icon = item.icon;
                return (
                  <div key={item.label} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", borderRadius: 14, background: index % 2 === 0 ? "#FCFBFF" : "#F8F4FF", border: "1px solid #EEE7FF" }}>
                    <div style={{ width: 30, height: 30, borderRadius: 10, background: "rgba(111,45,189,0.10)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <Icon size={14} color="#6F2DBD" />
                    </div>
                    <span style={{ fontSize: 13, color: "#374151", fontWeight: 600 }}>{item.label}</span>
                  </div>
                );
              })}
            </div>
          </motion.div>
        </div>
      </div>

      {result && (
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45 }} style={{ marginTop: 24, padding: 24, borderRadius: 24, background: "linear-gradient(135deg, #F8F4FF 0%, #FCFBFF 100%)", border: "1px solid #E9E5F5", boxShadow: "0 12px 32px rgba(111,45,189,0.06)" }}>
          <div style={{ display: "grid", gap: 24, gridTemplateColumns: "1.1fr 0.9fr", alignItems: "center" }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
                <CheckCircle2 size={20} color="#128C7E" />
                <div style={{ fontSize: 14, fontWeight: 800, color: "#5B21B6", textTransform: "uppercase", letterSpacing: "0.14em" }}>Success</div>
              </div>
              <h2 style={{ fontSize: 26, color: "#111827", margin: "0 0 10px" }}>Your Seller Profile is Ready</h2>
              <div style={{ display: "grid", gap: 10, marginBottom: 16 }}>
                {[
                  "Profile stored in MongoDB",
                  "WhatsApp onboarding link prepared",
                  "Twilio sandbox instructions ready",
                  "Loan evaluation can now be requested",
                ].map((item) => (
                  <div key={item} style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 14, color: "#374151" }}>
                    <CheckCircle2 size={16} color="#128C7E" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
              <div style={{ fontSize: 14, color: "#4B5563", lineHeight: 1.8, marginBottom: 12 }}>
                {result.next_step || "Loan evaluation available"}
              </div>
              <div style={{ padding: "12px 14px", borderRadius: 14, background: "#FFFFFF", border: "1px solid #EEE7FF" }}>
                <div style={{ fontSize: 13, fontWeight: 800, color: "#111827", marginBottom: 8 }}>Connect the WhatsApp sandbox</div>
                <div style={{ fontSize: 13, color: "#4B5563", lineHeight: 1.7 }}>
                  1. Open the WhatsApp sandbox link below.<br />
                  2. Send <strong>{result.sandboxJoinCode || SANDBOX_JOIN_CODE}</strong> to join the sandbox.<br />
                  3. Then send <strong>EVALUATE {result.seller_id}</strong> from WhatsApp to trigger the AI underwriting result.
                </div>
              </div>
            </div>
            <div style={{ padding: 16, borderRadius: 22, background: "#111827", boxShadow: "0 16px 40px rgba(17,24,39,0.2)" }}>
              <div style={{ padding: 12, borderRadius: 16, background: "linear-gradient(135deg, #25D366 0%, #128C7E 100%)", display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <MessageCircle size={16} color="#fff" />
                  <span style={{ fontSize: 13, fontWeight: 700, color: "#fff" }}>Pragati Agent</span>
                </div>
                <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#fff" }} />
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 10, background: "#F8FAFC", padding: 12, borderRadius: 16 }}>
                {[
                  { from: "seller", text: "Hi" },
                  { from: "agent", text: "Welcome! Your seller profile is ready." },
                  { from: "agent", text: "Open the sandbox link and join the WhatsApp flow." },
                  { from: "agent", text: `Send EVALUATE ${result.seller_id}` },
                ].map((item, index) => (
                  <motion.div key={`${item.text}-${index}`} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.08, duration: 0.25 }} style={{ display: "flex", justifyContent: item.from === "seller" ? "flex-start" : "flex-end" }}>
                    <div style={{ maxWidth: "80%", padding: "9px 11px", borderRadius: item.from === "seller" ? "12px 12px 12px 6px" : "12px 12px 6px 12px", background: item.from === "seller" ? "#fff" : "linear-gradient(135deg, #6F2DBD 0%, #2563EB 100%)", color: item.from === "seller" ? "#111827" : "#fff", fontSize: 13, boxShadow: "0 8px 18px rgba(15,23,42,0.08)" }}>
                      {item.text}
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}
