import { csvAdapter, Whyboard } from "whyboard-core";
import type { LanguageModel } from "ai";

import type { Dataset } from "./types";

/** 1.5 MB of CSV is plenty for a job-search export and keeps the request snappy. */
export const MAX_CSV_CHARS = 1_500_000;

/** Hard stop so a pathological file cannot exhaust memory inside a serverless function. */
export const MAX_IMPORT_ROWS = 25_000;

export type { Dataset };

export type CsvCheck = { ok: true; csv: string } | { ok: false; error: string };

export function checkCsv(input: unknown): CsvCheck {
  if (typeof input !== "string") {
    return { ok: false, error: "Send the CSV as a `csv` string." };
  }
  const csv = input.trim();
  if (csv.length < 12) {
    return { ok: false, error: "That file looks empty." };
  }
  if (csv.length > MAX_CSV_CHARS) {
    return {
      ok: false,
      error: `That file is larger than ${Math.round(MAX_CSV_CHARS / 1_000_000)} MB. Try a smaller export.`,
    };
  }
  const firstLine = csv.slice(0, csv.indexOf("\n") === -1 ? csv.length : csv.indexOf("\n"));
  if (!firstLine.includes(",") && !firstLine.includes(";") && !firstLine.includes("\t")) {
    return { ok: false, error: "The first row does not look like a CSV header." };
  }
  const lines = csv.split(/\r?\n/).filter(Boolean).length;
  if (lines < 3) {
    return { ok: false, error: "A CSV needs a header and at least two rows." };
  }
  return { ok: true, csv };
}

export function tableNameFrom(filename?: string): string {
  const base = (filename || "data").replace(/\.[^.]+$/, "").toLowerCase();
  const slug = base
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 40);
  if (!slug) return "t_data";
  return /^[a-z]/.test(slug) ? slug : `t_${slug}`;
}

/**
 * Every request gets its own in-memory database. The CSV is never written to
 * disk, never stored in a bucket, and dies with the response.
 */
export async function openWorkspace(
  csv: string,
  filename?: string,
  models?: { detective?: LanguageModel; storyteller?: LanguageModel },
): Promise<Whyboard> {
  const adapter = await csvAdapter({
    source: csv,
    tableName: tableNameFrom(filename),
    importLimit: MAX_IMPORT_ROWS,
  });

  return new Whyboard({
    adapter,
    template: "jobseeker",
    maxSteps: 10,
    models,
  });
}

export async function describeWorkspace(
  workspace: Whyboard,
  filename: string,
): Promise<Dataset> {
  const schema = await workspace.schema();
  const table = schema[0];
  const questions = await workspace.questions(5);
  const info = workspace.info();

  return {
    filename,
    table: table?.name ?? tableNameFrom(filename),
    rows: table?.rowCount ?? 0,
    columns: (table?.columns ?? []).map((column) => ({
      name: column.name,
      type: column.type,
    })),
    questions,
    provider: info.provider,
    detectiveModel: info.detectiveModel,
    storytellerModel: info.storytellerModel,
  };
}
