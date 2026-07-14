import { jest } from "@jest/globals";

const findMock = jest.fn();
const createMock = jest.fn();

jest.unstable_mockModule("../src/models/Conversation.js", () => ({
  Conversation: {
    find: findMock,
    create: createMock,
  },
}));

jest.unstable_mockModule("../src/config/logger.js", () => ({
  logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn() },
}));

const { getConversationHistory, saveConversationMessage } = await import("../src/services/conversationService.js");

describe("conversationService", () => {
  beforeEach(() => {
    findMock.mockReset();
    createMock.mockReset();
  });

  it("returns an empty history when the database lookup fails", async () => {
    const failingQuery = {
      sort: () => failingQuery,
      limit: () => failingQuery,
      lean: async () => {
        throw new Error("MongoDB unavailable");
      },
    };

    findMock.mockReturnValueOnce(failingQuery);

    await expect(getConversationHistory("SELL001")).resolves.toEqual([]);
  });

  it("returns null when conversation persistence fails", async () => {
    createMock.mockRejectedValueOnce(new Error("MongoDB unavailable"));

    await expect(
      saveConversationMessage({ sellerId: "SELL001", role: "user", message: "hello" })
    ).resolves.toBeNull();
  });
});
