import { jest } from "@jest/globals";
import request from "supertest";

jest.unstable_mockModule("../src/services/mlService.js", () => ({
  scoreSeller: jest.fn().mockResolvedValue({
    risk_class: "Low",
    risk_score: 91,
    loan_limit: 85000,
    top_reasoning_features: [],
  }),
}));

jest.unstable_mockModule("../src/services/agentService.js", () => ({
  initializeAgent: jest.fn(),
  runAgent: jest.fn(),
}));

const { createApp } = await import("../server.js");
const app = createApp();

describe("seller profile routes", () => {
  it("lists selectable sellers", async () => {
    const res = await request(app).get("/api/sellers");

    expect(res.status).toBe(200);
    expect(res.body.sellers).toHaveLength(3);
    expect(res.body.sellers[0].metrics).toBeDefined();
  });

  it("filters sellers by risk category", async () => {
    const res = await request(app).get("/api/sellers?risk=High");

    expect(res.status).toBe(200);
    expect(res.body.sellers).toHaveLength(1);
    expect(res.body.sellers[0].risk_category).toBe("High");
  });

  it("returns a backend estimate for a seller", async () => {
    const res = await request(app).get("/api/sellers/SELL_LOW_001/estimate");

    expect(res.status).toBe(200);
    expect(res.body.seller_id).toBe("SELL_LOW_001");
    expect(res.body.decision.loan_limit).toBe(85000);
  });
});
