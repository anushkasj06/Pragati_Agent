import { evaluateRules, roundLoanAmount } from "../src/services/rulesEngine.js";

describe("rulesEngine", () => {
  const baseSeller = {
    account_age_months: 24,
    prior_loan_default: 0,
    rto_rate: 10,
  };

  it("caps loan at maximum ₹100000", () => {
    const result = evaluateRules({ mlLoanLimit: 150000, sellerData: baseSeller });
    expect(result.final_loan_limit).toBeLessThanOrEqual(100000);
  });

  it("caps young accounts at ₹50000", () => {
    const result = evaluateRules({
      mlLoanLimit: 80000,
      sellerData: { ...baseSeller, account_age_months: 3 },
    });
    expect(result.final_loan_limit).toBeLessThanOrEqual(50000);
  });

  it("requires human review for loans above ₹75000", () => {
    const result = evaluateRules({
      mlLoanLimit: 90000,
      sellerData: { ...baseSeller, account_age_months: 36 },
    });
    expect(result.requires_human_review).toBe(true);
  });

  it("rejects when prior default and RTO > 20%", () => {
    const result = evaluateRules({
      mlLoanLimit: 50000,
      sellerData: { ...baseSeller, prior_loan_default: 1, rto_rate: 22 },
    });
    expect(result.decision_status).toBe("Rejected");
    expect(result.final_loan_limit).toBe(0);
  });

  it("rounds loan to nearest ₹5000", () => {
    expect(roundLoanAmount(72500)).toBe(75000);
    expect(roundLoanAmount(72000)).toBe(70000);
  });

  it("approves eligible sellers", () => {
    const result = evaluateRules({ mlLoanLimit: 60000, sellerData: baseSeller });
    expect(result.decision_status).toBe("Approved");
    expect(result.final_loan_limit).toBeGreaterThan(0);
  });
});
