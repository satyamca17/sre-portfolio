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
    - Week1 review: Learned parse structured logs, understood grep , installed linux and SIGTERM(KILL) Lets process clean up , SIGTERM(KILL -9) doesn't.
    - Exit code: 0=success,1= error, 127= command not found.Scheduler, CI/CD decides pass/fail from error code.
    - fail safe: an alert that can't read its input must fail, not ok
    - understood file permissions 4=read,2=write,1=execute
  - Day 5: "Added Linux group, users and chown,640 secrets,Group-based access and the owner only chmod rule. assigned user group to group and give permission to app.conf file later assign rw permission to me"
<<<<<<< Updated upstream
  - - Day 6: Ran the loan app as a systemd service (deploy/loanapp.service).
  First start failed with status=203/EXEC: the venv path did not exist in WSL.
  Restart=on-failure turned it into a crash loop (restart counter 34) because
  RestartSec=5 never hit the default start limit. Added StartLimitBurst=3 in 60s.
  A failed python3 -m venv left a half-built venv (symlink but no pip): deleted and rebuilt it.
  Self-healing test: kill -9 on PID 1636, systemd restarted it as PID 1676, /health ok.
  "enable = start at boot, start = run now. SIGKILL is a failure so systemd restarts;
   systemctl stop sends SIGTERM and is not restarted."
=======
  - - Linux lab 4 (systemd): wrote unit files, enable vs start, journalctl -u / -f.
  Debugged 203/EXEC (wrong binary path) and Errno 98 (port conflict, two
  services on 8080). Tested self-healing: kill -9 on loanapp, systemd
  auto-restarted it in 5s with a new PID. StartLimitBurst stops crash loops.
>>>>>>> Stashed changes
