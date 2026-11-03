# SRE Portfolio: Loan Application Platform

A small loan/lease application service, built and operated the way a production
SRE team would run it: containerised, provisioned with code, deployed through a
pipeline, monitored, and measured against SLOs.

The domain mirrors real work I support: a dealer loan and lease pipeline
(submission → approval → document verification → funding) processing thousands
of applications a day.

## Roadmap

| Week | Milestone | Status |
|---|---|---|
| 1–2 | Python service with structured JSON logs; log-parser automation | 🟡 In progress |
| 3–4 | Docker image; AWS multi-AZ network (VPC, subnets, ALB) built by hand | ⬜ |
| 5 | AWS infrastructure rewritten as Terraform modules with remote state | ⬜ |
| 6–7 | Deployed on Kubernetes: autoscaling, rolling updates, health probes | ⬜ |
| 8 | CI/CD with GitHub Actions; Prometheus metrics, Grafana dashboards, alerts | ⬜ |
| 9 | SLOs and error budget, runbook, failure test and blameless postmortem | ⬜ |

## Repository layout

```
app/        Python service (Flask)
scripts/    Operations automation (log generator, log parser)
docs/       Progress log; later SLOs, runbooks and postmortems
```

Folders for `terraform/`, `k8s/`, `.github/workflows/` and `monitoring/` are
added as each milestone starts.

## Run locally

```
cd app
pip install -r requirements.txt
python main.py
```

```
curl -X POST localhost:8080/applications -H "Content-Type: application/json" -d '{"dealer_id": "D100", "amount": 25000}'
curl localhost:8080/applications/<id>
curl -X POST localhost:8080/applications/<id>/advance
curl localhost:8080/health
```

Set `FAILURE_RATE=0.1` to make 10% of stage moves fail, which is used to test
alerting and incident response.

## Tech stack (planned)

Python · Linux · Docker · AWS · Terraform · Kubernetes · GitHub Actions ·
Prometheus · Grafana
