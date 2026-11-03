# Lab 1: Log parser (week 1–2) — write this yourself

**Goal:** a production-ready Python script that reads a very large log file and
prints a summary. Write it in `scripts/log_parser.py`.

## Setup

```
python generate_logs.py --lines 2000000 --out sample.log
```

## Requirements

1. Read the file **line by line** (do not load it all into memory). It must work on multi-GB files.
2. Skip malformed lines without crashing, and count how many were skipped.
3. Report:
   - total lines, error lines, malformed lines
   - count of each `error_code`, highest first
   - count of each HTTP `status`
   - average and p95 `latency_ms`
4. Save the summary as `summary.json` and `summary.csv`.
5. Take the file path as a command-line argument (`argparse`).
6. Print how long the run took.

## Stretch goals

- `--since` / `--until` options to filter by time window
- Exit with code 1 if the error rate is above a threshold (`--max-error-rate 0.05`).
  This is how a script becomes an **alert**.

## Interview words to practise while you build

streaming / generators · memory-efficient processing · exception handling ·
percentile (p95) latency · error rate · exit codes

## When done

Add 3–4 lines to `docs/progress-log.md`: what you built, what broke, and the technical term for each thing you learned.
