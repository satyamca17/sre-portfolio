"""
Loan Application Service: a small API used as the base of the SRE portfolio.

It simulates a dealer loan/lease pipeline:
    SUBMITTED -> APPROVED -> DOCS_VERIFIED -> FUNDED

Every request writes one structured JSON log line, so the logs can be
parsed, searched and alerted on later (weeks 1, 8 and 9 of the plan).

Run:
    pip install -r requirements.txt
    python main.py
Try:
    curl -X POST localhost:8080/applications -H "Content-Type: application/json" -d "{\"dealer_id\": \"D100\", \"amount\": 25000}"
    curl localhost:8080/applications/<id>
    curl localhost:8080/health
"""

import json
import logging
import os
import random
import sys
import time
import uuid
from datetime import datetime, timezone

from flask import Flask, g, jsonify, request

STAGES = ["SUBMITTED", "APPROVED", "DOCS_VERIFIED", "FUNDED"]

# Set FAILURE_RATE=0.1 to make 10% of stage moves fail.
# Useful later for testing alerts and writing a postmortem.
FAILURE_RATE = float(os.getenv("FAILURE_RATE", "0"))

app = Flask(__name__)
applications = {}  # in-memory store; replaced by a real database in a later week


# ---------- structured logging ----------
class JsonFormatter(logging.Formatter):
    def format(self, record):
        entry = {
            "ts": datetime.now(timezone.utc).isoformat(timespec="milliseconds"),
            "level": record.levelname,
            "msg": record.getMessage(),
        }
        entry.update(getattr(record, "extra_fields", {}))
        return json.dumps(entry)


handler = logging.StreamHandler(sys.stdout)
handler.setFormatter(JsonFormatter())
log = logging.getLogger("loan-service")
log.addHandler(handler)
log.setLevel(logging.INFO)
logging.getLogger("werkzeug").setLevel(logging.WARNING)


def log_event(level, msg, **fields):
    log.log(level, msg, extra={"extra_fields": fields})


@app.before_request
def start_timer():
    g.start = time.perf_counter()


@app.after_request
def log_request(response):
    latency_ms = round((time.perf_counter() - g.start) * 1000, 2)
    level = logging.ERROR if response.status_code >= 500 else logging.INFO
    log_event(level, "request", method=request.method, path=request.path,
              status=response.status_code, latency_ms=latency_ms)
    return response


# ---------- endpoints ----------
@app.get("/health")
def health():
    return jsonify(status="ok", applications=len(applications))


@app.post("/applications")
def submit():
    body = request.get_json(silent=True) or {}
    if "dealer_id" not in body or "amount" not in body:
        return jsonify(error="dealer_id and amount are required"), 400
    app_id = str(uuid.uuid4())[:8]
    applications[app_id] = {"id": app_id, "dealer_id": body["dealer_id"],
                            "amount": body["amount"], "stage": STAGES[0]}
    log_event(logging.INFO, "application_submitted", app_id=app_id, dealer_id=body["dealer_id"])
    return jsonify(applications[app_id]), 201


@app.get("/applications/<app_id>")
def status(app_id):
    item = applications.get(app_id)
    if not item:
        return jsonify(error="not found"), 404
    return jsonify(item)


@app.post("/applications/<app_id>/advance")
def advance(app_id):
    item = applications.get(app_id)
    if not item:
        return jsonify(error="not found"), 404
    current = STAGES.index(item["stage"])
    if current == len(STAGES) - 1:
        return jsonify(error="already funded"), 409
    if random.random() < FAILURE_RATE:
        log_event(logging.ERROR, "stage_failed", app_id=app_id,
                  stage=STAGES[current + 1], error_code="ERR_STAGE_TIMEOUT")
        return jsonify(error="stage processing failed"), 500
    item["stage"] = STAGES[current + 1]
    log_event(logging.INFO, "stage_advanced", app_id=app_id, stage=item["stage"])
    return jsonify(item)


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=int(os.getenv("PORT", "8080")))
