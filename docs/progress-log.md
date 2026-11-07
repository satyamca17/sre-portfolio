# Progress log

One short entry per study day: what I built, what broke, and the technical term for what I learned.

## Week 1

- Day 1: Created the repo and ran the loan application service locally.Successfully setup locally installed
  requirements.txt,created ven and upgraded pip. Connection refused on port 8080  
  and I confirmed with netstat -ano|findstr:8080 , started the service and I confirmed with Health check endpoint, now
  netstat -ano | findstr: 8080 is listening.
- Now I submitted application with json parse and I got reply with all details and status Submitted. I re run curl
  advance few time till got Error. Before running Curl advance I stopped Server and restarted with failure rate =0.5
- Learned to check witch PID is running using tasklist /FI "PID eq #listening id (From netstat -ano | findstr :8080 - "
  no space between : and 8080"")"
  - 
  - Day 2 : Built the log parser for 20M lines (~3 GB) using streaming. The first version used substring matching and
    under-counted errors by ~60% (580K vs 1.55M) because the log level is uppercase. I fixed it by parsing each line as
    JSON and checking the level field. I added input validation (isfile), exit codes and argparse, and tested the edge
    cases: missing file, folder, empty file.
    - 
    - Day 3 : “My first version counted 580K errors. By breaking errors down by type, I proved it had only caught stage
      failures and missed all 971K HTTP 500s. The correct count was 1.55M.”
      "Averages hide tail latency. In my log analysis, the average was 40 ms but p95 was 89 ms, so I’d always alert on
      percentiles"
    - 
    - Day 4: "calculated error rate and compare with max_error_rate, alert logged successfully. worked on division by
              0 "
              "Exit code 127 means command not found, usually a PATH problem in cron or scheduled jobs.”
               “Checking a port immediately after starting a service can miss it. That’s a race condition, which is why health checks
                need startup delays.”
               “I stop services with SIGTERM first and confirm with ss and curl that the port is closed.”