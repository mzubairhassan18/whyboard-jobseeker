# whyboard · jobseeker

The first demo app for [**whyboard-core**](https://github.com/mzubairhassan18/whyboard-core):
an AI detective for your job search.

Drop a CSV of your applications. Whyboard investigates it — writing read-only SQL,
comparing channels, checking timing, testing its own hypotheses — then tells you the
story behind the rejections, with a confidence level, the caveats, and every query
it ran.

**Live:** https://whyboard-jobseeker.vercel.app
(custom domain `jobseeker.whyboard.app` once DNS points at the project)

---

## How it works

```
CSV ──▶ CSVAdapter (in-memory libSQL) ──▶ Whyboard (jobseeker template)
                                              │
                            detective: grok-4-1-fast-reasoning
                            ├─ 9 read-only tools (SQL, breakdowns, trends, correlation)
                            └─ report_findings → structured findings
                                              │
                            storyteller: grok-4.6
                            └─ streamed markdown story
```

- `app/api/analyze` loads the CSV, introspects the schema and returns suggested questions.
- `app/api/chat` streams the investigation as Server-Sent Events: `thought`, `tool`,
  `tool-result`, `answer-delta`, `done`, `error`.
- The UI renders the detective's live case file (with SQL it actually runs) while the
  story types itself out.

Every request gets a fresh in-memory database. The CSV is never written to disk, never
stored in a bucket, and dies with the response.

## Run it locally

```bash
npm install
cp .env.example .env.local   # add one key
npm run dev
```

Then open http://localhost:3000 and click **"Try the sample: 24 applications"**.

Useful scripts:

| script | what it does |
| --- | --- |
| `npm run dev` | Next.js dev server |
| `npm run build` | production build |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run lint` | ESLint |
| `npm run verify` | pipeline smoke test with mock models — **no API key needed** |

`npm run verify` runs the exact `openWorkspace` helper the routes use, against
`public/sample-applications.csv`, with `MockLanguageModelV4` models. It asserts the
schema, the stream event order, the SQL trail and the findings hand-off.

## Configuration

One of these, depending on the provider:

| variable | provider | default models |
| --- | --- | --- |
| `XAI_API_KEY` | Grok (default) | `grok-4-1-fast-reasoning` / `grok-4.6` |
| `OPENAI_API_KEY` | OpenAI | library defaults |
| `AI_GATEWAY_API_KEY` | Vercel AI Gateway | library defaults |

The provider is auto-detected by whyboard-core in that order.

## Limits

- 1.5 MB / 25,000 rows per CSV.
- Questions capped at 500 characters.
- Read-only: whyboard-core rejects anything that is not a single `SELECT`/`WITH`.
- No storage, no accounts, no analytics.

## Stack

Next.js 16 (App Router, Turbopack, Cache Components) · React 19 · Tailwind CSS 4 ·
`whyboard-core` 0.1 · React Markdown · lucide-react.

The demo was built in a Next.js version with breaking changes; see `AGENTS.md` for the
local docs pointer.
