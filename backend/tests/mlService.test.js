import { jest } from "@jest/globals";

const mockPost = jest.fn();

jest.unstable_mockModule("axios", () => ({
  default: {
    create: () => ({ post: mockPost }),
  },
}));

jest.unstable_mockModule("../src/config/logger.js", () => ({
  logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn() },
}));

const { scoreSeller } = await import("../src/services/mlService.js");

describe("mlService", () => {
  beforeEach(() => {
    mockPost.mockReset();
  });

  it("returns ML scoring result on success", async () => {
    mockPost.mockResolvedValueOnce({
      data: {
        risk_class: "Low",
        risk_score: 92,
        loan_limit: 75000,
        top_reasoning_features: [{ feature: "RTO Rate", impact: "Positive", reason: "Low RTO" }],
      },
    });

    const result = await scoreSeller("SELL001", {
      sales_velocity_6m: 50000,
      prior_loan_default: 0,
    });

    expect(result.risk_class).toBe("Low");
    expect(result.risk_score).toBe(92);
    expect(result.loan_limit).toBe(75000);
    expect(result.top_reasoning_features).toHaveLength(1);
  });

  it("returns a deterministic fallback result after retries when the service is unavailable", async () => {
    mockPost.mockRejectedValue(new Error("timeout"));

    const result = await scoreSeller("SELL001", {
      sales_velocity_6m: 50000,
      prior_loan_default: 0,
    });

    expect(result.risk_class).toBeDefined();
    expect(result.loan_limit).toBeGreaterThanOrEqual(0);
    expect(mockPost).toHaveBeenCalledTimes(3);
  });
});
