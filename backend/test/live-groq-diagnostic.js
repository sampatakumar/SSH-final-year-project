import dotenv from "dotenv";
dotenv.config();

import Groq from "groq-sdk";

async function runLiveDiagnostic() {
  const apiKey = process.env.GROQ_API_KEY;
  const configuredModel = process.env.GROQ_MODEL || "openai/gpt-oss-120b";

  console.log("==================================================");
  console.log(" GROQ LIVE DIAGNOSTIC & GPT-OSS-120B VERIFIER");
  console.log("==================================================");
  console.log(`Configured Model : ${configuredModel}`);
  console.log(`API Key Present  : ${Boolean(apiKey && apiKey.trim())}`);

  if (!apiKey || !apiKey.trim()) {
    console.error("❌ ERROR: GROQ_API_KEY is not set in environment.");
    process.exit(1);
  }

  const groq = new Groq({ apiKey });

  // 1. Check Model Discovery
  console.log("\n[1/3] Querying Groq GET /openai/v1/models ...");
  try {
    const modelList = await groq.models.list();
    const availableIds = modelList.data.map((m) => m.id);
    console.log(`✓ Discovery successful. ${availableIds.length} models available.`);

    const is120bAvailable = availableIds.includes("openai/gpt-oss-120b");
    const is20bAvailable = availableIds.includes("openai/gpt-oss-20b");

    console.log(`  - openai/gpt-oss-120b available: ${is120bAvailable ? "✓ YES" : "❌ NO"}`);
    console.log(`  - openai/gpt-oss-20b  available: ${is20bAvailable ? "✓ YES" : "❌ NO"}`);

    // 2. Test Completion on primary model
    const testModel = is120bAvailable ? "openai/gpt-oss-120b" : availableIds[0];
    console.log(`\n[2/3] Testing completion with model: ${testModel} ...`);

    const start = Date.now();
    const completion = await groq.chat.completions.create({
      model: testModel,
      messages: [
        {
          role: "system",
          content: "You are Smart Skill Hub AI. Respond with valid JSON: {\"status\": \"ok\", \"model\": \"...\"}",
        },
        {
          role: "user",
          content: "Perform connection self-test.",
        },
      ],
      temperature: 0.1,
      max_tokens: 100,
    });

    const durationMs = Date.now() - start;
    const content = completion.choices?.[0]?.message?.content || "";
    console.log(`✓ Completion succeeded in ${durationMs}ms:`);
    console.log(`  Output: ${content.trim()}`);

    // 3. Test structured JSON contract validation
    console.log("\n[3/3] Testing structured JSON parsing & validation ...");
    try {
      const parsed = JSON.parse(content.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim());
      console.log(`✓ Parsed structured output successfully:`, parsed);
    } catch (e) {
      console.warn(`⚠ Output was not direct JSON (raw string returned).`);
    }

    console.log("\n==================================================");
    console.log(" ✓ ALL LIVE GROQ VERIFICATIONS COMPLETED");
    console.log("==================================================");
  } catch (err) {
    console.error("❌ Live Groq test failed:", err.message);
    process.exit(1);
  }
}

runLiveDiagnostic();
