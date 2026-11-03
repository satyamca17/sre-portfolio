# Progress log

One short entry per study day: what I built, what broke, and the technical term for what I learned.


## Week 1

- Day 1: Created the repo and ran the loan application service locally.Successfully setup locally installed requirements.txt,created ven and upgraded pip. Connection refused on port 80880  
and I confirmed with netstat -ano|findstr:8080 , started the service and I confirmed with Health check endpoint, now netstat -ano | findstr: 8080 is listening.
- Now I submitted application with json parse and I got reply with all details and status Submitted. I re run curl advance few time till got Error. Before running Curl advance I stopped Server and restarted with failure rate =0.5 
- Learned to check witch PID is running using tasklist /F1 "PID eq #listening id (From netstat -ano | findstr :8080 - "no space between : and 8080"")"
