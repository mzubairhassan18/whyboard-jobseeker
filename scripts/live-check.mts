/**
 * Live end-to-end check against a real provider. Uses whichever key is in the
 * environment (AI_GATEWAY_API_KEY, XAI_API_KEY or OPENAI_API_KEY).
 *
 *   npm run check:live
 */
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

import { describeWorkspace, openWorkspace } from "../lib/whyboard";

if (
  !process.env.AI_GATEWAY_API_KEY &&
  !process.env.XAI_API_KEY &&
  !process.env.OPENAI_API_KEY
) {
  console.error("Set AI_GATEWAY_API_KEY (or XAI_API_KEY / OPENAI_API_KEY) first.");
  process.exit(1);
}

const csv = await readFile(
  new URL("../public/sample-applications.csv", import.meta.url),
  "utf8",
);

const workspace = await openWorkspace(csv, "applications.csv");
const started = Date.now();

try {
  const dataset = await describeWorkspace(workspace, "applications.csv");
  console.log(`provider   ${dataset.provider}`);
  console.log(`detective  ${dataset.detectiveModel}`);
  console.log(`writer     ${dataset.storytellerModel}`);
  console.log(`rows       ${dataset.rows}`);
  console.log(`question   ${dataset.questions[0]}`);

  let tools = 0;
  let answer = "";
  let result;

  for await (const event of workspace.explainStream(dataset.questions[0])) {
    if (event.type === "tool") {
      tools += 1;
      console.log(`  ↳ ${event.tool} ${JSON.stringify(event.input).slice(0, 140)}`);
    }
    if (event.type === "answer-delta") answer += event.text;
    if (event.type === "error") throw new Error(event.message);
    if (event.type === "done") result = event.result;
  }

  assert.ok(result, "expected a done event");
  assert.ok(tools > 0, "expected the detective to run tools");
  assert.ok(answer.length > 120, "expected a story");
  assert.ok(result.trace.queries.length > 0, "expected SQL in the trace");

  console.log(`done       ${tools} tool calls · ${result.trace.queries.length} queries · ${Math.round((Date.now() - started) / 1000)}s`);
  console.log(`confidence ${result.confidence}`);
  console.log(`headline   ${result.headline}`);
  console.log("----------");
  console.log(result.answer);
} finally {
  await workspace.close();
}
