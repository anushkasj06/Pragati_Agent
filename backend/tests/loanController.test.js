import { jest } from "@jest/globals";
import request from "supertest";

jest.unstable_mockModule("../src/services/mlService.js", () => ({
  scoreSeller: jest.fn().mockResolvedValue({
    risk_class: "Low",
    risk_score: 92,
    loan_limit: 80000,
    top_reasoning_features: [],
  }),
}));

jest.unstable_mockModule("../src/services/agentService.js", () => ({
  runAgent: jest.fn().mockResolvedValue({
    seller_message: "Congratulations! You are eligible.",
    auditor_trail: "Seller meets criteria with strong dispatch SLA.",
    improvement_plan: ["Maintain ratings", "Reduce RTO", "Grow catalog"],
  }),
  initializeAgent: jest.fn(),
}));

jest.unstable_mockModule("../src/services/conversationService.js", () => ({
  getConversationHistory: jest.fn().mockResolvedValue([]),
  saveConversationMessage: jest.fn().mockResolvedValue({}),
}));

jest.unstable_mockModule("../src/services/decisionService.js", () => ({
  saveDecision: jest.fn().mockResolvedValue({}),
  listDecisions: jest.fn().mockResolvedValue([
    {
      _id: { toString: () => "decision-1" },
      seller_id: "SELL001",
      timestamp: new Date("2026-07-15T00:00:00.000Z"),
      risk_class: "Low",
      risk_score: 92,
      final_loan_limit: 80000,
      requires_human_review: true,
      decision_status: "Approved",
      language: "English",
      seller_message: "Congratulations! You are eligible.",
      auditor_trail: "Seller meets criteria.",
      improvement_plan: ["Maintain ratings"],
      top_reasoning_features: [],
      execution_time_ms: 57,
    },
  ]),
}));

jest.unstable_mockModule("../src/services/notificationService.js", () => ({
  queueNotification: jest.fn().mockResolvedValue({ status: "queued" }),
}));

jest.unstable_mockModule("../src/services/translationService.js", () => ({
  ensureSellerLanguage: jest.fn().mockImplementation((msg) => Promise.resolve(msg)),
}));

const { createApp } = await import("../server.js");
const app = createApp();

describe("loanController via /api/loan/evaluate", () => {
  const validPayload = {
    seller_id: "SELL001",
    language: "English",
    seller_data: {
      sales_velocity_6m: 102589,
      sales_growth_rate: 18.58,
      rto_rate: 14.09,
      dispatch_sla_compliance: 91.69,
      avg_customer_rating: 3.9,
      rating_trend: 0.091,
      order_cancellation_rate: 7.03,
      ad_spend_roi: 2.08,
      account_age_months: 55,
      total_orders_6m: 5000,
      catalog_size: 255,
      prior_loan_default: 0,
    },
  };

  it("returns 200 with evaluation response", async () => {
    const res = await request(app).post("/api/loan/evaluate").send(validPayload);

    expect(res.status).toBe(200);
    expect(res.body.seller_id).toBe("SELL001");
    expect(res.body.decision.risk_class).toBe("Low");
    expect(res.body.seller_message).toBeTruthy();
    expect(res.body.improvement_plan).toBeInstanceOf(Array);
    expect(res.body.execution_time_ms).toBeGreaterThanOrEqual(0);
  });

  it("returns 400 for invalid payload", async () => {
    const res = await request(app)
      .post("/api/loan/evaluate")
      .send({ seller_id: "SELL001" });

    expect(res.status).toBe(400);
    expect(res.body.error).toBeDefined();
  });

  it("GET /health returns ok", async () => {
    const res = await request(app).get("/health");
    expect(res.status).toBe(200);
    expect(res.body.status).toBe("ok");
  });

  it("GET /api/loan/decisions returns saved decision history", async () => {
    const res = await request(app).get("/api/loan/decisions");

    expect(res.status).toBe(200);
    expect(res.body.decisions).toHaveLength(1);
    expect(res.body.decisions[0].seller_id).toBe("SELL001");
    expect(res.body.decisions[0].decision.loan_limit).toBe(80000);
  });
});
