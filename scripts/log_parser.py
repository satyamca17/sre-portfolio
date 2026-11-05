import argparse
import json
import os
import sys
from collections import Counter




def parse_large_file(target_file: str) -> dict:
    if not os.path.isfile(target_file):
        print(f"ERROR: File not found: {target_file}" , file=sys.stderr)
        sys.exit(1)


    print(f"Starting to Read: {target_file}")
    line_count = 0
    err_line_count = 0
    malformed_line_count = 0
    error_codes = Counter()
    status_codes=Counter()

    with open(target_file, "r", encoding="utf-8") as f:
        for line in f:
            line_count += 1
            try:
                record = json.loads(line)
            except json.JSONDecodeError:
                malformed_line_count += 1
                continue
            if record.get("level")=="ERROR":
                err_line_count += 1
            code = record.get("error_code")
            if code is not None:
                error_codes[code] += 1
            status = record.get("status")
            if status is not None:
                status_codes[status] += 1


        #return line_count, malformed_line_count, err_line_count
        return {"total_lines" : line_count,
                "malformed_lines_count": malformed_line_count,
                "error_lines_count": err_line_count,
                "error_codes": error_codes.most_common(),
                "status_codes": status_codes.most_common()}


def main():
    parser = argparse.ArgumentParser(description="Parse large file")
    parser.add_argument("log_file", help="path to log file")
    args = parser.parse_args()
    summary = parse_large_file(args.log_file)
    if summary["total_lines"]==0:
        print(f"Empty file: {args.log_file}")
        sys.exit(1)
    else:
        print(f"Total linecount: {summary['total_lines']}")
        print(f"Malformed linecount: {summary['malformed_lines_count']}")
        print(f"Error linecount: {summary['error_lines_count']}")
        print(f"Error codes: {summary['error_codes']}")
        print(f"Status codes: {summary['status_codes']}")


if __name__ == "__main__":
    main()
