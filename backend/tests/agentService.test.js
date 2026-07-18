import {
  buildCoachFallbackResponse,
  buildFallbackAgentResponse,
  normalizeCoachAgentOutput,
  parseAgentJson,
  repairAndParseJson,
} from "../src/services/agentService.js";

describe("agentService JSON parsing", () => {
  it("parses clean JSON response", () => {
    const raw = `{"seller_message":"Hello","auditor_trail":"Review complete.","improvement_plan":["Improve ratings"]}`;
    const result = parseAgentJson(raw);
    expect(result.seller_message).toBe("Hello");
    expect(result.improvement_plan).toHaveLength(1);
  });

  it("parses JSON wrapped in markdown fences", () => {
    const raw = '```json\n{"seller_message":"Hi","auditor_trail":"OK","improvement_plan":[]}\n```';
    const result = parseAgentJson(raw);
    expect(result.seller_message).toBe("Hi");
  });

  it("repairs trailing commas in JSON", () => {
    const raw = '{"seller_message":"Hi","auditor_trail":"OK","improvement_plan":[],}';
    const result = repairAndParseJson(raw);
    expect(result.seller_message).toBe("Hi");
  });

  it("throws on completely invalid JSON", () => {
    expect(() => parseAgentJson("not json at all")).toThrow();
  });

  it("builds a deterministic fallback response when Groq is unavailable", () => {
    const result = buildFallbackAgentResponse({
      sellerId:    "seller-1",
      mlResult:    { risk_class: "Low", risk_score: 82, loan_limit: 50000 },
      rulesResult: { final_loan_limit: 45000, decision_status: "Approved" },
      language:    "English",
    });

    expect(result.seller_message).toContain("approved");
    expect(result.improvement_plan).toHaveLength(5);
    expect(result.auditor_trail).toContain("45000");
  });

  it("fallback response includes language tag", () => {
    const result = buildFallbackAgentResponse({
      sellerId:    "seller-2",
      mlResult:    { risk_class: "High", risk_score: 40, loan_limit: 10000 },
      rulesResult: { final_loan_limit: 0, decision_status: "Rejected" },
      language:    "Hindi",
    });

    expect(result.seller_message).toContain("Hindi");
    expect(result.auditor_trail).toContain("Rejected");
  });

  it("coach fallback answers the current user request instead of repeating the same loan message", () => {
    const improvementReply = buildCoachFallbackResponse({
      sellerId: "seller-3",
      latestDecision: { decision_status: "Approved", final_loan_limit: 75000, risk_class: "Low" },
      language: "English",
      userMessage: "hi help with improvement plan",
    });

    expect(improvementReply.seller_message).toContain("improvement plan");
    expect(improvementReply.seller_message).toContain("dispatch");
    expect(improvementReply.seller_message).not.toContain("Congratulations");
  });

  it("coach fallback gives a short acknowledgement for greetings and thanks", () => {
    const thankYouReply = buildCoachFallbackResponse({
      sellerId: "seller-4",
      latestDecision: { decision_status: "Approved", final_loan_limit: 50000, risk_class: "Low" },
      language: "English",
      userMessage: "thank you",
    });

    expect(thankYouReply.seller_message).toContain("thank you");
    expect(thankYouReply.seller_message).toContain("happy");
  });

  it("rewrites generic approval-style coach replies into a helpful response in Hindi", () => {
    const rewritten = normalizeCoachAgentOutput({
      agentOutput: {
        seller_message: "Congratulations on your loan approval! To maintain and potentially increase your loan limit, focus on improving your Ad Spend ROI and Dispatch SLA Compliance.",
        auditor_trail: "Generic approval text",
        improvement_plan: ["Improve ROI", "Improve dispatch"],
      },
      sellerId: "seller-5",
      language: "Hindi",
      mode: "coach",
      userMessage: "hi help me with improvement plan",
      latestDecision: { decision_status: "Approved", final_loan_limit: 75000, risk_class: "Low" },
    });

    expect(rewritten.seller_message).toContain("सुधार");
    expect(rewritten.seller_message).not.toContain("Congratulations");
  });
});
