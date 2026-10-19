/**
 * Smoke test for the demo pipeline: the same `openWorkspace` helper the route
 * handlers use, driven by mock models so it runs without an API key.
 *
 *   npx tsx scripts/verify.mts
 */
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

import { MockLanguageModelV4 } from "ai/test";

import { checkCsv, describeWorkspace, openWorkspace } from "../lib/whyboard";

const csv = await readFile(
  new URL("../public/sample-applications.csv", import.meta.url),
  "utf8",
);

function usage(input: number, output: number) {
  return {
    inputTokens: { total: input, noCache: input, cacheRead: 0, cacheWrite: 0 },
    outputTokens: { total: output, text: output, reasoning: 0 },
  };
}

type Part = Record<string, unknown>;

function streamOf(parts: Part[], finishReason: "stop" | "tool-calls", inTokens: number, outTokens: number) {
  return {
    stream: new ReadableStream({
      start(controller) {
        controller.enqueue({ type: "stream-start", warnings: [] });
        for (const part of parts) controller.enqueue(part);
        controller.enqueue({
          type: "finish",
          finishReason: {
            unified: finishReason === "stop" ? "stop" : "tool-calls",
            raw: finishReason === "stop" ? "stop" : "tool_calls",
          },
          usage: usage(inTokens, outTokens),
        });
        controller.close();
      },
    }),
  };
}

function toolStream(name: string, input: unknown) {
  return streamOf(
    [
      {
        type: "tool-call",
        toolCallId: `call-${name}`,
        toolName: name,
        input: JSON.stringify(input),
      },
    ],
    "tool-calls",
    100,
    20,
  );
}

function textStream(text: string) {
  return streamOf(
    [
      { type: "text-start", id: "text-1" },
      { type: "text-delta", id: "text-1", delta: text },
      { type: "text-end", id: "text-1" },
    ],
    "stop",
    200,
    100,
  );
}

const check = checkCsv(csv);
assert.ok(check.ok, "sample CSV should pass validation");

const detective = new MockLanguageModelV4({
  modelId: "mock-detective",
  doStream: [
    toolStream("breakdown", { table: "applications", dimension: "source", limit: 10 }),
    toolStream("report_findings", {
      headline: "Every LinkedIn application died before an interview",
      answer:
        "LinkedIn is 11 of 24 applications and none of them reached an interview, while referrals converted 6 of 7.",
      confidence: "high",
      drivers: [
        {
          label: "LinkedIn applications",
          detail: "Every LinkedIn application was rejected or ghosted.",
          impact: "46% of applications, 0% success",
          evidence: "0 of 11 reached interview; referrals reached 6 of 7",
        },
      ],
      numbers: [
        { label: "Applications", value: "24" },
        { label: "LinkedIn success rate", value: "0%" },
      ],
      caveats: ["The sample is small: 24 applications."],
      suggestedNextQuestions: ["Why does the referral channel convert six times better?"],
    }),
  ],
});

const storyteller = new MockLanguageModelV4({
  modelId: "mock-storyteller",
  doStream: [
    textStream(
      "**Every LinkedIn application died before an interview**\n\nYou are not being rejected everywhere — you are being rejected on LinkedIn.\n\n### The numbers\n\n- 24 applications\n- 0% LinkedIn success rate",
    ),
  ],
});

const workspace = await openWorkspace(check.csv, "applications.csv", {
  detective,
  storyteller,
});

try {
  const dataset = await describeWorkspace(workspace, "applications.csv");

  assert.equal(dataset.rows, 24);
  assert.equal(dataset.columns.length, 9);
  assert.equal(dataset.table, "applications");
  assert.equal(dataset.questions[0], "Why am I getting rejected so often?");

  const events: string[] = [];
  let answer = "";
  let result;

  for await (const event of workspace.explainStream(dataset.questions[0])) {
    events.push(event.type);
    if (event.type === "answer-delta") answer += event.text;
    if (event.type === "done") result = event.result;
  }

  assert.ok(result, "stream should end with a done event");
  assert.ok(events.includes("tool"), "stream should report tool calls");
  assert.ok(events.includes("answer-delta"), "stream should stream answer text");
  assert.match(answer, /rejected on LinkedIn/);
  assert.equal(result.trace.queries.length, 2);
  assert.equal(result.trace.modelCalls.length, 2);
  assert.equal(result.confidence, "high");
  assert.match(result.trace.queries[0].sql.toLowerCase(), /^select/);

  console.log("ok — demo pipeline");
  console.log(`   table      ${dataset.table}`);
  console.log(`   rows       ${dataset.rows}`);
  console.log(`   columns    ${dataset.columns.map((column) => column.name).join(", ")}`);
  console.log(`   events     ${events.join(" → ")}`);
  console.log(`   queries    ${result.trace.queries.length}`);
  console.log(`   answer     ${result.answer.split("\n")[0]}`);
} finally {
  await workspace.close();
}
