#!/usr/bin/env python3
"""
Upload local cache files to Upstash Redis.
Usage: UPSTASH_REDIS_REST_URL=... UPSTASH_REDIS_REST_TOKEN=... python3 upload_cache.py
"""

import os
import json
import urllib.request
import urllib.error
import base64

URL = "https://delicate-hare-38429.upstash.io"
TOKEN = "AZYdAAIncDI1YmRmODJhYzZmOTU0MmQyYWUwZTVlMDBjNDc3YzI4NXAyMzg0Mjk"

if not URL or not TOKEN:
    print("Error: set UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN env vars")
    exit(1)

CACHE_DIR = os.path.join(os.path.dirname(__file__), "cache")

# Only upload files relevant to the Node.js app (skip basketball/football legacy files)
SKIP = {
    "cache/basketball/games",
    "cache/basketball/leagues",
    "cache/football/leagues",
}


def redis_set(key, value_json):
    """Send SET key value to Upstash REST API."""
    payload = json.dumps(["SET", key, value_json]).encode()
    req = urllib.request.Request(
        URL,
        data=payload,
        headers={
            "Authorization": f"Bearer {TOKEN}",
            "Content-Type": "application/json",
        },
        method="POST",
    )
    with urllib.request.urlopen(req) as res:
        return json.loads(res.read())


def main():
    files = []
    for root, _, names in os.walk(CACHE_DIR):
        for name in names:
            path = os.path.join(root, name)
            rel = os.path.relpath(path, os.path.dirname(__file__))
            # Normalise to forward slashes (consistent with Node.js keys)
            key = "./" + rel.replace(os.sep, "/")
            files.append((key, path))

    files.sort()

    for key, path in files:
        rel = key[2:]  # strip "./"
        if rel in SKIP:
            print(f"  skip  {key}")
            continue

        try:
            with open(path, "r", encoding="utf-8") as f:
                raw = f.read().strip()
            if not raw:
                print(f"  empty {key}")
                continue

            # Validate JSON
            parsed = json.loads(raw)
            # Re-serialise compactly so Upstash stores clean JSON
            value_json = json.dumps(parsed, separators=(",", ":"))

            result = redis_set(key, value_json)
            if result.get("result") == "OK":
                size = len(value_json)
                print(f"  ok    {key}  ({size:,} bytes)")
            else:
                print(f"  fail  {key}  → {result}")

        except json.JSONDecodeError as e:
            print(f"  error {key}  bad JSON: {e}")
        except urllib.error.HTTPError as e:
            print(f"  error {key}  HTTP {e.code}: {e.read().decode()}")
        except Exception as e:
            print(f"  error {key}  {e}")

    print("\nDone.")


if __name__ == "__main__":
    main()
