/**
 * Language Selector Component
 * Dropdown to switch between supported languages
 * Displays native language names for better UX
 */

import { useLanguage } from "../i18n/LanguageProvider";
import { Globe } from "lucide-react";

export default function LanguageSelector() {
  const {
    language,
    setLanguage,
    isTranslating,
    supportedLanguages,
  } = useLanguage();

  const currentLanguage = supportedLanguages.find(
    (lang) => lang.code === language
  );

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 8,
        padding: "8px 12px",
        borderRadius: 8,
        background: "rgba(111, 45, 189, 0.08)",
        border: "1px solid rgba(111, 45, 189, 0.2)",
      }}
    >
      <Globe
        style={{
          width: 16,
          height: 16,
          color: "#6F2DBD",
        }}
      />

      <select
        value={language}
        onChange={(e) => setLanguage(e.target.value)}
        disabled={isTranslating}
        style={{
          border: "none",
          background: "transparent",
          color: "#1A1A2E",
          fontWeight: 600,
          fontSize: 13,
          cursor: isTranslating ? "not-allowed" : "pointer",
          outline: "none",
          opacity: isTranslating ? 0.6 : 1,
        }}
        aria-label="Select language"
      >
        {supportedLanguages.map((lang) => (
          <option key={lang.code} value={lang.code}>
            {lang.nativeName} ({lang.label})
          </option>
        ))}
      </select>

      {isTranslating && (
        <span
          style={{
            fontSize: 11,
            color: "#F59E0B",
            fontWeight: 600,
            whiteSpace: "nowrap",
            marginLeft: 4,
          }}
        >
          Translating...
        </span>
      )}
    </div>
  );
}
