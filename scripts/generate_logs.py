"""
Generate a large, realistic sample log file for the week 1 log-parser lab.

Usage:
    python generate_logs.py --lines 2000000 --out sample.log

2 million lines is roughly 300 MB; use 10 million or more for a multi-GB file.
Lines are JSON, like the app's logs, with a few malformed lines mixed in,
the way real production logs often have.
"""

import argparse
import json
import random
from datetime import datetime, timedelta, timezone

ERRORS = ["ERR_STAGE_TIMEOUT", "ERR_CREDIT_BUREAU_UNAVAILABLE", "ERR_DOC_VALIDATION",
          "ERR_DB_CONNECTION", "ERR_FUNDING_REJECTED"]
STAGES = ["SUBMITTED", "APPROVED", "DOCS_VERIFIED", "FUNDED"]
PATHS = ["/applications", "/applications/{id}", "/applications/{id}/advance", "/health"]


def make_line(ts):
    roll = random.random()
    if roll < 0.001:
        return "### corrupted line ###"            # malformed: your parser must survive this
    if roll < 0.03:
        return json.dumps({"ts": ts.isoformat(), "level": "ERROR", "msg": "stage_failed",
                           "app_id": f"{random.randint(0, 0xFFFFFF):06x}",
                           "stage": random.choice(STAGES[1:]),
                           "error_code": random.choices(ERRORS, weights=[40, 25, 15, 10, 10])[0]})
    status = random.choices([200, 201, 400, 404, 500], weights=[70, 15, 5, 5, 5])[0]
    return json.dumps({"ts": ts.isoformat(), "level": "ERROR" if status >= 500 else "INFO",
                       "msg": "request", "method": random.choice(["GET", "POST"]),
                       "path": random.choice(PATHS), "status": status,
                       "latency_ms": round(random.lognormvariate(3.5, 0.6), 2)})


def main():
    p = argparse.ArgumentParser()
    p.add_argument("--lines", type=int, default=100_000)
    p.add_argument("--out", default="sample.log")
    a = p.parse_args()
    ts = datetime.now(timezone.utc) - timedelta(days=1)
    with open(a.out, "w") as f:
        for _ in range(a.lines):
            ts += timedelta(milliseconds=random.randint(1, 80))
            f.write(make_line(ts) + "\n")
    print(f"wrote {a.lines:,} lines to {a.out}")


if __name__ == "__main__":
    main()
