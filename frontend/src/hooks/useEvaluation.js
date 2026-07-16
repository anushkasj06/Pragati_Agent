/**
 * useEvaluation — form submission hook for the loan evaluation pipeline.
 * Reads/writes through AppContext. Handles toast notifications.
 */

import { useCallback } from "react";
import toast from "react-hot-toast";
import { useApp } from "../context/AppContext";

export function useEvaluation() {
  const { isEvaluating, evaluationResult, evaluationError, runEvaluation, resetEvaluation } = useApp();

  const submit = useCallback(
    async (formData) => {
      const toastId = toast.loading("Analyzing your business profile…", {
        style: { background: "#171723", color: "#fff", border: "1px solid rgba(255,255,255,0.08)" },
      });

      try {
        const result = await runEvaluation(formData);
        toast.success("Evaluation complete!", {
          id: toastId,
          style: { background: "#171723", color: "#fff", border: "1px solid rgba(91,46,255,0.4)" },
        });
        return result;
      } catch (err) {
        const msg = err?.message || "Evaluation failed. Please try again.";
        toast.error(msg, {
          id: toastId,
          duration: 5000,
          style: { background: "#171723", color: "#fff", border: "1px solid rgba(255,77,141,0.4)" },
        });
        throw err;
      }
    },
    [runEvaluation]
  );

  return { submit, isEvaluating, evaluationResult, evaluationError, resetEvaluation };
}
