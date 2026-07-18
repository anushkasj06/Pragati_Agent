import { formatMessage } from "../src/services/notificationService.js";

describe("notificationService formatMessage", () => {
  it("omits empty loan summary sections for onboarding messages", () => {
    const result = formatMessage({
      sellerMessage: "Welcome seller! Your profile is ready.",
      loanStatus: null,
      loanLimit: null,
      riskClass: null,
      improvementPlan: [],
    });

    expect(result).toContain("Message:");
    expect(result).toContain("Welcome seller! Your profile is ready.");
    expect(result).not.toContain("Loan Status:");
    expect(result).not.toContain("Loan Limit:");
    expect(result).not.toContain("Risk Class:");
    expect(result).not.toContain("Improvement Plan:");
  });
});
