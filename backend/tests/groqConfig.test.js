import {
  buildGroqRequestUrl,
  getGroqHeaders,
  getGroqModel,
  getGroqBaseUrl,
} from "../src/config/groq.js";

describe("Groq request URL builder", () => {
  it("builds the correct chat completions URL from the configured base URL", () => {
    expect(buildGroqRequestUrl("https://api.groq.com/openai/v1")).toBe(
      "https://api.groq.com/openai/v1/chat/completions"
    );
  });

  it("handles a trailing slash in the base URL", () => {
    expect(buildGroqRequestUrl("https://api.groq.com/openai/v1/")).toBe(
      "https://api.groq.com/openai/v1/chat/completions"
    );
  });
});

describe("Groq request headers", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it("includes Authorization and Content-Type headers", () => {
    process.env.GROQ_API_KEY = "test-groq-key";

    const headers = getGroqHeaders();

    expect(headers.Authorization).toBe("Bearer test-groq-key");
    expect(headers["Content-Type"]).toBe("application/json");
  });

  it("does NOT include HTTP-Referer or X-Title (Groq does not need them)", () => {
    process.env.GROQ_API_KEY = "test-groq-key";

    const headers = getGroqHeaders();

    expect(headers["HTTP-Referer"]).toBeUndefined();
    expect(headers["X-Title"]).toBeUndefined();
  });

  it("resolves model from GROQ_MODEL env var", () => {
    process.env.GROQ_MODEL = "llama-3.1-8b-instant";
    expect(getGroqModel()).toBe("llama-3.1-8b-instant");
  });

  it("resolves base URL from GROQ_API_BASE_URL env var", () => {
    process.env.GROQ_API_BASE_URL = "https://api.groq.com/openai/v1";
    expect(getGroqBaseUrl()).toBe("https://api.groq.com/openai/v1");
  });

  it("falls back to LLAMA_API_KEY when GROQ_API_KEY is not set (backward compat)", () => {
    delete process.env.GROQ_API_KEY;
    process.env.LLAMA_API_KEY = "legacy-llama-key";

    const headers = getGroqHeaders();
    expect(headers.Authorization).toBe("Bearer legacy-llama-key");
  });
});
