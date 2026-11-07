import argparse
import json
import os
import sys
from collections import Counter
import time
import csv


def parse_large_file(target_file: str) -> dict:
    if not os.path.isfile(target_file):
        print(f"ERROR: File not found: {target_file}", file=sys.stderr)
        sys.exit(1)

    print(f"Starting to Read: {target_file}")
    line_count = 0
    err_line_count = 0
    malformed_line_count = 0
    error_codes = Counter()
    status_codes = Counter()
    latency_count = 0
    latency_total = 0.0
    latencies = []
    error_rate = 0.0

    with open(target_file, "r", encoding="utf-8") as f:
        for line in f:
            line_count += 1
            try:
                record = json.loads(line)
            except json.JSONDecodeError:
                malformed_line_count += 1
                continue
            if record.get("level") == "ERROR":
                err_line_count += 1
            code = record.get("error_code")
            if code is not None:
                error_codes[code] += 1
            status = record.get("status")
            if status is not None:
                status_codes[status] += 1
            latency = record.get("latency_ms")
            if latency is not None:
                latency_count += 1
                latency_total += latency
                latencies.append(latency)

    avg_latency = latency_total / latency_count if latency_count > 0 else 0
    p95_latency = 0

    if latencies:
        latencies.sort()
        p95_latency = latencies[int(len(latencies) * 0.95)]

    valid_lines = line_count - malformed_line_count

    if valid_lines > 0:
        error_rate = err_line_count / valid_lines

    return {"total_lines": line_count, "malformed_lines_count": malformed_line_count,
            "error_lines_count": err_line_count, "error_codes": error_codes.most_common(),
            "status_codes": status_codes.most_common(), "latency_count": latency_count, "p95_latency_ms": p95_latency,
            "avg_latency_ms": round(avg_latency, 2), "error_rate": error_rate, "valid_lines": valid_lines}


def main():
    start = time.perf_counter()
    parser = argparse.ArgumentParser(description="Parse large file")
    parser.add_argument("log_file", help="path to log file")
    parser.add_argument("--max-error-rate", type=float, default=0.05,
                        help="exit with code 1 if error rate is above this (default 0.05 = 5%%)")
    args = parser.parse_args()
    summary = parse_large_file(args.log_file)
    if summary["total_lines"] == 0:
        print(f"Empty file: {args.log_file}")
        sys.exit(1)

    if summary["valid_lines"] == 0:
        print(f"Error: no valid lines in file: {args.log_file}",
        f"({summary['malformed_lines_count']} Malformed lines)", file=sys.stderr)
        sys.exit(1)


    with open("summary.json", "w", newline="") as out:
        json.dump(summary, out, indent=2)

    with open("summary.csv", "w", newline="") as out:
        writer = csv.writer(out)
        writer.writerow(["metric", "value"])
        writer.writerow(["total linecount", summary['total_lines']])
        writer.writerow(["error linecount", summary['error_lines_count']])
        writer.writerow(["malformed lines", summary['malformed_lines_count']])
        for code, count in summary["error_codes"]:
            writer.writerow([f"error_code:{code}", count])
        for code, count in summary['status_codes']:
            writer.writerow([f"status_codes:{code}", count])
        writer.writerow(["latency count", summary['latency_count']])
        writer.writerow(["avg latency (ms)", summary['avg_latency_ms']])
        writer.writerow(["p95 latency (ms)", summary['p95_latency_ms']])
        writer.writerow(["error rate", round(summary['error_rate'], 4)])

    print(f"Total linecount: {summary['total_lines']}")
    print(f"Malformed linecount: {summary['malformed_lines_count']}")
    print(f"Error linecount: {summary['error_lines_count']}")
    print(f"Error codes: {summary['error_codes']}")
    print(f"Status codes: {summary['status_codes']}")
    print(f"Latency count: {summary['latency_count']}")
    print(f"Avg latency (ms): {summary['avg_latency_ms']}")
    print(f"p95 latency (ms): {summary['p95_latency_ms']}")
    elapsed = time.perf_counter() - start
    print(f"Completed time: {elapsed:.1f} seconds")

    if summary['error_rate'] > args.max_error_rate:
        print(f"Alert: error rate: {summary['error_rate']:.2%} exceeds threshold {args.max_error_rate:.2%}",
              file=sys.stderr)
        sys.exit(1)
    else:
        print(f"OK: error_rate {summary['error_rate']:.2%} is within threshold {args.max_error_rate:.2%}")


if __name__ == "__main__":
    main()
