/**
 * Language Provider Context
 * Manages language state, translation fetching, and caching
 * Supports all Indian languages via Google Cloud Translation
 */

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { englishMessages } from "../locales/english.js";

const LanguageContext = createContext(null);

const API_URL =
  import.meta.env.VITE_API_URL || "http://localhost:3001";

const CATALOG_VERSION = "v1";

const SUPPORTED_LANGUAGES = [
  { code: "en", label: "English", nativeName: "English" },
  { code: "hi", label: "Hindi", nativeName: "हिन्दी" },
  { code: "mr", label: "Marathi", nativeName: "मराठी" },
  { code: "bn", label: "Bengali", nativeName: "বাংলা" },
  { code: "gu", label: "Gujarati", nativeName: "ગુજરાતી" },
  { code: "pa", label: "Punjabi", nativeName: "ਪੰਜਾਬੀ" },
  { code: "ta", label: "Tamil", nativeName: "தமிழ்" },
  { code: "te", label: "Telugu", nativeName: "తెలుగు" },
  { code: "kn", label: "Kannada", nativeName: "ಕನ್ನಡ" },
  { code: "ml", label: "Malayalam", nativeName: "മലയാളം" },
  { code: "or", label: "Odia", nativeName: "ଓଡ଼ିଆ" },
  { code: "as", label: "Assamese", nativeName: "অসমীয়া" },
  { code: "ur", label: "Urdu", nativeName: "اردو" },
];

export function LanguageProvider({ children }) {
  const [language, setLanguageState] = useState(
    () => localStorage.getItem("language") || "en"
  );

  const [messages, setMessages] = useState(englishMessages);
  const [isTranslating, setIsTranslating] = useState(false);
  const [translationError, setTranslationError] = useState(null);
  const translationCacheRef = useRef(new Map());
  const originalTextRef = useRef(new WeakMap());
  const originalAttributeRef = useRef(new WeakMap());
  const translationInFlightRef = useRef(false);
  const lastAppliedLanguageRef = useRef("");
  const rateLimitedLanguagesRef = useRef(new Set());

  /**
   * Load translations for target language
   * Fetches from cache first, then from backend, then saves to localStorage
   */
  const loadLanguage = useCallback(async (targetLanguage) => {
    if (targetLanguage === "en") {
      setMessages(englishMessages);
      setTranslationError(null);
      return;
    }

    const storageKey = `translations:${CATALOG_VERSION}:${targetLanguage}`;
    const cachedMessages = localStorage.getItem(storageKey);

    if (cachedMessages) {
      try {
        setMessages(JSON.parse(cachedMessages));
        setTranslationError(null);
        return;
      } catch (err) {
        console.warn("Failed to parse cached translations", err);
        localStorage.removeItem(storageKey);
      }
    }

    setIsTranslating(true);
    setTranslationError(null);

    try {
      const keys = Object.keys(englishMessages);
      const texts = Object.values(englishMessages);

      const response = await fetch(
        `${API_URL}/api/translate/batch`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            texts,
            sourceLanguage: "en",
            targetLanguage,
          }),
        }
      );

      if (!response.ok) {
        throw new Error(`Translation API returned ${response.status}`);
      }

      const data = await response.json();

      if (!data.translations || !Array.isArray(data.translations)) {
        throw new Error("Invalid translation response format");
      }

      const translatedMessages = Object.fromEntries(
        keys.map((key, index) => [
          key,
          data.translations[index] || englishMessages[key],
        ])
      );

      setMessages(translatedMessages);

      // Cache in localStorage for instant load on next visit
      localStorage.setItem(
        storageKey,
        JSON.stringify(translatedMessages)
      );
    } catch (error) {
      console.error("Translation error:", error);
      setTranslationError(error.message);

      // Fallback to English on error
      setMessages(englishMessages);
    } finally {
      setIsTranslating(false);
    }
  }, []);

  const translateDomContent = useCallback(async (targetLanguage) => {
    if (typeof window === "undefined" || !document.body) return;
    if (targetLanguage === "en") {
      lastAppliedLanguageRef.current = "en";
      return;
    }
    if (translationInFlightRef.current) return;
    if (lastAppliedLanguageRef.current === targetLanguage) return;
    if (rateLimitedLanguagesRef.current.has(targetLanguage)) return;

    translationInFlightRef.current = true;

    try {
      const root = document.body;
      const textTargets = [];
      const attributeTargets = [];
      const stack = [root];

      while (stack.length) {
        const current = stack.pop();

        if (!current || current.nodeType === Node.COMMENT_NODE) continue;

        if (current.nodeType === Node.TEXT_NODE) {
          const text = current.textContent?.trim() ?? "";
          if (!text) continue;

          const parent = current.parentElement;
          if (!parent) continue;
          if (parent.closest("[data-no-translate], script, style, noscript, svg, textarea")) continue;
          if (parent.getAttribute("aria-hidden") === "true") continue;

          const style = window.getComputedStyle(parent);
          if (style.display === "none" || style.visibility === "hidden") continue;

          if (!/[A-Za-z0-9]/.test(text)) continue;

          textTargets.push(current);
          continue;
        }

        if (current.nodeType !== Node.ELEMENT_NODE) continue;

        if (current.closest("[data-no-translate], script, style, noscript, svg, textarea")) continue;

        const style = window.getComputedStyle(current);
        if (style.display === "none" || style.visibility === "hidden") continue;

        for (const attr of ["title", "placeholder", "aria-label", "alt"]) {
          const value = current.getAttribute(attr);
          if (value && value.trim()) {
            attributeTargets.push({ element: current, attr, value });
          }
        }

        for (const child of Array.from(current.childNodes).reverse()) {
          stack.push(child);
        }
      }

      if (targetLanguage === "en") {
        for (const node of textTargets) {
          const originalText = originalTextRef.current.get(node);
          if (originalText !== undefined) {
            node.textContent = originalText;
          }
        }

        for (const target of attributeTargets) {
          const originalAttrValue = originalAttributeRef.current.get(target.element);
          if (originalAttrValue && originalAttrValue[target.attr] !== undefined) {
            target.element.setAttribute(target.attr, originalAttrValue[target.attr]);
          }
        }

        lastAppliedLanguageRef.current = "en";
        return;
      }

      const cacheKey = `domTranslations:${CATALOG_VERSION}:${targetLanguage}`;
      const persistedCache = localStorage.getItem(cacheKey);

      if (persistedCache) {
        try {
          const parsed = JSON.parse(persistedCache);
          Object.entries(parsed).forEach(([originalValue, translatedValue]) => {
            translationCacheRef.current.set(`${targetLanguage}:${originalValue}`, translatedValue);
          });
        } catch (error) {
          console.warn("Failed to parse DOM translation cache", error);
        }
      }

      const uniqueTextValues = [...new Set(textTargets.map((node) => node.textContent?.trim() || ""))].filter(Boolean);
      const uniqueAttributeValues = [...new Set(attributeTargets.map(({ value }) => value))].filter(Boolean);

      const missingTexts = uniqueTextValues.filter((text) => !translationCacheRef.current.has(`${targetLanguage}:${text}`));
      const missingAttributes = uniqueAttributeValues.filter((value) => !translationCacheRef.current.has(`${targetLanguage}:${value}`));

      if (missingTexts.length > 0 || missingAttributes.length > 0) {
        setIsTranslating(true);
        try {
          const payloadTexts = [...missingTexts, ...missingAttributes].slice(0, 40);

          for (let index = 0; index < payloadTexts.length; index += 20) {
            const batch = payloadTexts.slice(index, index + 20);
            const response = await fetch(`${API_URL}/api/translate/batch`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                texts: batch,
                sourceLanguage: "en",
                targetLanguage,
              }),
            });

            if (!response.ok) {
              if (response.status === 429) {
                rateLimitedLanguagesRef.current.add(targetLanguage);
                throw new Error("Translation API returned 429");
              }
              throw new Error(`Translation API returned ${response.status}`);
            }

            const data = await response.json();
            const translatedValues = Array.isArray(data.translations) ? data.translations : [];

            batch.forEach((value, batchIndex) => {
              const translatedValue = translatedValues[batchIndex] || value;
              translationCacheRef.current.set(`${targetLanguage}:${value}`, translatedValue);
            });
          }

          localStorage.setItem(
            cacheKey,
            JSON.stringify(Object.fromEntries(translationCacheRef.current.entries()))
          );
        } catch (error) {
          console.warn("DOM translation skipped", error.message || error);
        } finally {
          setIsTranslating(false);
        }
      }

      for (const node of textTargets) {
        const text = node.textContent?.trim() || "";
        if (!text) continue;
        if (!originalTextRef.current.has(node)) {
          originalTextRef.current.set(node, text);
        }
        const translatedValue = translationCacheRef.current.get(`${targetLanguage}:${text}`) || text;
        node.textContent = translatedValue;
      }

      for (const target of attributeTargets) {
        if (!originalAttributeRef.current.has(target.element)) {
          originalAttributeRef.current.set(target.element, {});
        }

        const originalMap = originalAttributeRef.current.get(target.element);
        if (originalMap[target.attr] === undefined) {
          originalMap[target.attr] = target.element.getAttribute(target.attr) || "";
        }

        const translatedValue = translationCacheRef.current.get(`${targetLanguage}:${target.value}`) || target.value;
        target.element.setAttribute(target.attr, translatedValue);
      }
    } finally {
      translationInFlightRef.current = false;
      lastAppliedLanguageRef.current = targetLanguage;
    }
  }, []);

  /**
   * Watch language changes and load translations
   * Also set HTML lang attribute and dir for RTL languages
   */
  useEffect(() => {
    loadLanguage(language);

    // Set HTML lang attribute for accessibility
    document.documentElement.lang = language;

    // Set text direction (RTL for Urdu)
    if (language === "ur") {
      document.documentElement.dir = "rtl";
      document.body.style.direction = "rtl";
    } else {
      document.documentElement.dir = "ltr";
      document.body.style.direction = "ltr";
    }
  }, [language, loadLanguage]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const runTranslation = () => {
      void translateDomContent(language);
    };

    runTranslation();
  }, [language, translateDomContent]);

  /**
   * Update language and persist to localStorage
   */
  function setLanguage(newLanguage) {
    if (
      !SUPPORTED_LANGUAGES.some((lang) => lang.code === newLanguage)
    ) {
      console.warn(`Unsupported language: ${newLanguage}`);
      return;
    }

    localStorage.setItem("language", newLanguage);
    setLanguageState(newLanguage);
  }

  /**
   * Translation function - returns translated text or fallback to key
   */
  function translate(key) {
    if (typeof key !== "string") {
      console.warn("Translation key must be string", key);
      return String(key);
    }

    return messages[key] ?? englishMessages[key] ?? key;
  }

  const value = useMemo(
    () => ({
      language,
      setLanguage,
      t: translate,
      isTranslating,
      translationError,
      supportedLanguages: SUPPORTED_LANGUAGES,
    }),
    [language, messages, isTranslating, translationError]
  );

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}

/**
 * Hook to access language context
 * Throws error if used outside LanguageProvider
 */
export function useLanguage() {
  const context = useContext(LanguageContext);

  if (!context) {
    throw new Error(
      "useLanguage must be used inside LanguageProvider. " +
      "Wrap your app with <LanguageProvider> in main.jsx"
    );
  }

  return context;
}
