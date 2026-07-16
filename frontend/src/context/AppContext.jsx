/**
 * AppContext — global state for the Pragati Agent frontend.
 * Stores the latest evaluation result, backend health, and UI state.
 */

import { createContext, useContext, useReducer, useCallback } from "react";
import { checkHealth, evaluateLoan } from "../services/api";
import { DEFAULT_SELLER } from "../utils/sellerData";

function loadStoredSeller() {
  try {
    const raw = localStorage.getItem("pragati:selectedSeller");
    return raw ? JSON.parse(raw) : DEFAULT_SELLER;
  } catch {
    return DEFAULT_SELLER;
  }
}

// ---------------------------------------------------------------------------
// Initial state
// ---------------------------------------------------------------------------
const initialState = {
  // Backend health
  backendOnline:  null,   // null = unchecked, true = online, false = offline
  backendChecked: false,

  // Evaluation lifecycle
  isEvaluating:  false,
  evaluationResult: null,  // last successful response
  evaluationError:  null,  // last error
  selectedSeller: loadStoredSeller(),
  sellerLanguage: loadStoredSeller()?.language || "English",

  // UI state
  currentStep:  0,         // 0=form, 1=processing, 2=result
  activeTab:    "decision",
};

// ---------------------------------------------------------------------------
// Reducer
// ---------------------------------------------------------------------------
function reducer(state, action) {
  switch (action.type) {
    case "SET_BACKEND_STATUS":
      return { ...state, backendOnline: action.payload, backendChecked: true };

    case "SET_SELECTED_SELLER":
      return { ...state, selectedSeller: action.payload,
        sellerLanguage: action.payload?.language || state.sellerLanguage };

    case "SET_SELLER_LANGUAGE":
      return {
        ...state,
        sellerLanguage: action.payload,
        selectedSeller: state.selectedSeller ? { ...state.selectedSeller, language: action.payload } : state.selectedSeller,
      };

    case "EVALUATION_START":
      return { ...state, isEvaluating: true, evaluationError: null, currentStep: 1 };

    case "EVALUATION_SUCCESS":
      return {
        ...state,
        isEvaluating: false,
        evaluationResult: action.payload,
        evaluationError: null,
        currentStep: 2,
      };

    case "EVALUATION_ERROR":
      return {
        ...state,
        isEvaluating: false,
        evaluationError: action.payload,
        currentStep: 0,
      };

    case "RESET_EVALUATION":
      return {
        ...state,
        evaluationResult: null,
        evaluationError: null,
        currentStep: 0,
      };

    case "SET_ACTIVE_TAB":
      return { ...state, activeTab: action.payload };

    case "SET_STEP":
      return { ...state, currentStep: action.payload };

    default:
      return state;
  }
}

// ---------------------------------------------------------------------------
// Context
// ---------------------------------------------------------------------------
const AppContext = createContext(null);

export function AppProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, initialState);

  /** Check backend health once on mount */
  const pingBackend = useCallback(async () => {
    try {
      await checkHealth();
      dispatch({ type: "SET_BACKEND_STATUS", payload: true });
    } catch {
      dispatch({ type: "SET_BACKEND_STATUS", payload: false });
    }
  }, []);

  /** Run full loan evaluation pipeline */
  const runEvaluation = useCallback(async (formData) => {
    dispatch({ type: "EVALUATION_START" });
    try {
      const result = await evaluateLoan(formData);
      dispatch({ type: "EVALUATION_SUCCESS", payload: result });
      return result;
    } catch (err) {
      dispatch({ type: "EVALUATION_ERROR", payload: err });
      throw err;
    }
  }, []);

  /** Reset to form */
  const resetEvaluation = useCallback(() => {
    dispatch({ type: "RESET_EVALUATION" });
  }, []);

  /** Set active result tab */
  const setActiveTab = useCallback((tab) => {
    dispatch({ type: "SET_ACTIVE_TAB", payload: tab });
  }, []);

  const setSelectedSeller = useCallback((seller) => {
    try {
      if (seller) localStorage.setItem("pragati:selectedSeller", JSON.stringify(seller));
      else localStorage.removeItem("pragati:selectedSeller");
    } catch { }
    dispatch({ type: "SET_SELECTED_SELLER", payload: seller });
  }, []);

  const setSellerLanguage = useCallback((lang) => {
    try {
      const updatedSeller = state.selectedSeller ? { ...state.selectedSeller, language: lang } : null;
      if (updatedSeller) {
        localStorage.setItem("pragati:selectedSeller", JSON.stringify(updatedSeller));
      }
    } catch {}
    dispatch({ type: "SET_SELLER_LANGUAGE", payload: lang });
  }, [state.selectedSeller]);

  return (
    <AppContext.Provider value={{
      ...state,
      pingBackend, runEvaluation, resetEvaluation, setActiveTab,
      setSelectedSeller, setSellerLanguage,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
}
