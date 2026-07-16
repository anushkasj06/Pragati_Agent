/**
 * useBackendHealth — polls backend liveness on mount and exposes status.
 */

import { useEffect } from "react";
import { useApp } from "../context/AppContext";

export function useBackendHealth() {
  const { backendOnline, backendChecked, pingBackend } = useApp();

  useEffect(() => {
    if (!backendChecked) {
      pingBackend();
    }
  }, [backendChecked, pingBackend]);

  return { backendOnline, backendChecked };
}
