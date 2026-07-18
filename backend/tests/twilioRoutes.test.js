import { jest } from "@jest/globals";
import request from "supertest";

const getSellerByPhoneMock = jest.fn();
const getLatestDecisionMock = jest.fn();
const getConversationHistoryMock = jest.fn();
const saveConversationMessageMock = jest.fn();
const runLoanEvaluationPipelineMock = jest.fn();
const runAgentMock = jest.fn();
const queueNotificationMock = jest.fn();

jest.unstable_mockModule("../src/services/sellerService.js", () => ({
  getSellerById: jest.fn(),
  getSellerByPhone: getSellerByPhoneMock,
}));

jest.unstable_mockModule("../src/services/decisionService.js", () => ({
  getLatestDecision: getLatestDecisionMock,
}));

jest.unstable_mockModule("../src/services/conversationService.js", () => ({
  getConversationHistory: getConversationHistoryMock,
  saveConversationMessage: saveConversationMessageMock,
  formatHistoryForAgent: jest.fn((history) => history.map((item) => `${item.role}:${item.message}`).join("\n")),
}));

jest.unstable_mockModule("../src/services/agentService.js", () => ({
  runAgent: runAgentMock,
  initializeAgent: jest.fn(),
  buildFallbackAgentResponse: jest.fn(),
}));

jest.unstable_mockModule("../src/controllers/loanController.js", () => ({
  runLoanEvaluationPipeline: runLoanEvaluationPipelineMock,
}));

jest.unstable_mockModule("../src/services/notificationService.js", () => ({
  buildLoanEvaluationWhatsAppMessage: jest.fn(() => "Evaluation result"),
  queueNotification: queueNotificationMock,
}));

jest.unstable_mockModule("../src/config/logger.js", () => ({
  logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn() },
}));

jest.unstable_mockModule("../src/config/groq.js", () => ({
  validateGroqConfig: jest.fn(),
  getGroqModel: jest.fn(() => "mock-model"),
  chatCompletion: jest.fn(),
  GroqChatModel: jest.fn(),
  setAgentInstance: jest.fn(),
}));

const { createApp } = await import("../server.js");
const app = createApp();

describe("Twilio coaching workflow", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    getSellerByPhoneMock.mockResolvedValue({
      seller_id: "SELL001",
      seller_data: { catalog_size: 100 },
      preferred_language: "English",
      phone_number: "+919999999999",
    });
    getLatestDecisionMock.mockResolvedValue({
      seller_id: "SELL001",
      final_loan_limit: 75000,
      decision_status: "Approved",
      risk_class: "Low",
      seller_message: "You are eligible",
    });
    getConversationHistoryMock.mockResolvedValue([]);
    saveConversationMessageMock.mockResolvedValue({});
    runLoanEvaluationPipelineMock.mockResolvedValue({});
    runAgentMock.mockResolvedValue({
      seller_message: "I can help with your loan and growth plan.",
      auditor_trail: "Coach response generated from the latest decision.",
      improvement_plan: ["Improve dispatch SLA"],
      is_fallback: false,
    });
    queueNotificationMock.mockResolvedValue({});
  });

  it("uses the coach workflow for normal WhatsApp messages instead of re-running evaluation", async () => {
    const res = await request(app)
      .post("/api/twilio/incoming")
      .type("form")
      .send({ From: "+919999999999", Body: "Hi" });

    expect(res.status).toBe(200);
    expect(res.text).toContain("I can help with your loan and growth plan.");
    expect(runLoanEvaluationPipelineMock).not.toHaveBeenCalled();
    expect(runAgentMock).toHaveBeenCalledWith(expect.objectContaining({
      sellerId: "SELL001",
      mode: "coach",
      latestDecision: expect.objectContaining({ decision_status: "Approved" }),
    }));
    expect(saveConversationMessageMock).toHaveBeenCalled();
  });

  it("still runs the evaluation flow for loan evaluation requests", async () => {
    const res = await request(app)
      .post("/api/twilio/incoming")
      .type("form")
      .send({ From: "+919999999999", Body: "loan evaluation" });

    expect(res.status).toBe(200);
    expect(runLoanEvaluationPipelineMock).toHaveBeenCalled();
    expect(runAgentMock).not.toHaveBeenCalled();
  });
});
