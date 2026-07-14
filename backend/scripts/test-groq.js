/**
 * Groq connectivity test script.
 *
 * Usage:
 *   node scripts/test-groq.js
 *
 * Expected output:
 *   ✓ HTTP 200
 *   ✓ Assistant replied: Hello! How can I help you today?
 *   ✓ Elapsed: 412ms
 */

import "dotenv/config";
import { chatCompletion, validateGroqConfig, getGroqModel, getGroqBaseUrl } from "../src/config/groq.js";

async function main() {
  console.log("\n─── Groq Connectivity Test ─────────────────────────");

  try {
    validateGroqConfig();
  } catch (err) {
    console.error(`✗ Config error: ${err.message}`);
    process.exit(1);
  }

  console.log(`  Provider : Groq`);
  console.log(`  Model    : ${getGroqModel()}`);
  console.log(`  Base URL : ${getGroqBaseUrl()}`);
  console.log("────────────────────────────────────────────────────");

  try {
    const response = await chatCompletion([
      { role: "system", content: "You are a helpful assistant." },
      { role: "user",   content: "Say Hello" },
    ]);

    console.log(`\n✓ HTTP ${response.status_code ?? 200}`);
    console.log(`✓ Assistant replied: ${response.content}`);
    console.log(`✓ Elapsed: ${response.elapsed_ms}ms`);

    if (response.usage) {
      const u = response.usage;
      console.log(`✓ Tokens — prompt: ${u.prompt_tokens} | completion: ${u.completion_tokens} | total: ${u.total_tokens}`);
    }

    console.log("\n✓ Groq is working correctly.\n");
    process.exit(0);
  } catch (err) {
    console.error(`\n✗ Groq request failed: ${err.message}`);
    if (err.details) console.error("  Details:", JSON.stringify(err.details, null, 2));
    process.exit(1);
  }
}

main();
