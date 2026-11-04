import argparse
import json
import os
import sys

#from datetime import datetime, timedelta

def parse_large_file(target_file: str) -> tuple[int, int, int]:
    if not os.path.isfile(target_file):
        print(f"ERROR: File not found: {target_file}" , file=sys.stderr)
        sys.exit(1)


    print(f"Starting to Read: {target_file}")
    line_count = 0
    err_line_count = 0
    malformed_line_count = 0

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

        return line_count, malformed_line_count, err_line_count


def main():
    parser = argparse.ArgumentParser(description="Parse large file")
    parser.add_argument("log_file", help="path to log file")
    args = parser.parse_args()
    count, malformed, error = parse_large_file(args.log_file)
    if count == 0:
        print(f"Empty file: {args.log_file}")
    else:
        print(f"Total Lines: {count}")
        print(f"malformed count: {malformed} ")
        print(f"error count: {error}")


if __name__ == "__main__":
    main()
