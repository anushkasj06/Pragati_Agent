import { parseAgentJson, repairAndParseJson } from "../src/services/agentService.js";

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
});
