#!/usr/bin/env python3
"""Sync the latest external World Brief link from its public RSS feed.

Only RSS metadata is stored: title, publication time, and canonical URL. The
article body and description are deliberately not copied into this repository.
"""

from __future__ import annotations

import argparse
import json
import sys
import urllib.request
import xml.etree.ElementTree as element_tree
from datetime import date, datetime
from email.utils import parsedate_to_datetime
from pathlib import Path
from zoneinfo import ZoneInfo


FEED_URL = "https://nghiencuuquocte.org/feed/"
CATEGORY = "Thế giới hôm nay"
TIMEZONE = ZoneInfo("Asia/Ho_Chi_Minh")
OUTPUT_PATH = Path("data/world-brief.json")


def normalize(value: str | None) -> str:
    return " ".join((value or "").split())


def fetch_feed() -> bytes:
    request = urllib.request.Request(
        FEED_URL,
        headers={
            "Accept": "application/rss+xml, application/xml;q=0.9, text/xml;q=0.8",
            "User-Agent": "DuyNguyenBlogWorldBrief/1.0 (+https://duynguyen9988.github.io/duynguyen/)",
        },
    )
    with urllib.request.urlopen(request, timeout=30) as response:
        return response.read()


def get_entry(feed: bytes, expected_date: date) -> dict[str, str] | None:
    root = element_tree.fromstring(feed)
    matches: list[dict[str, str]] = []

    for item in root.findall("./channel/item"):
        categories = {normalize(category.text) for category in item.findall("category")}
        if CATEGORY not in categories:
            continue

        published_at = parsedate_to_datetime(normalize(item.findtext("pubDate"))).astimezone(TIMEZONE)
        if published_at.date() != expected_date:
            continue

        title = normalize(item.findtext("title"))
        url = normalize(item.findtext("link"))
        if title and url:
            matches.append(
                {
                    "title": title,
                    "url": url,
                    "publishedAt": published_at.isoformat(),
                    "displayDate": published_at.strftime("%d/%m/%Y"),
                }
            )

    return max(matches, key=lambda entry: entry["publishedAt"], default=None)


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Sync the external World Brief RSS metadata.")
    parser.add_argument(
        "--date",
        type=date.fromisoformat,
        help="Target date in Asia/Ho_Chi_Minh (YYYY-MM-DD); defaults to today.",
    )
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    expected_date = args.date or datetime.now(TIMEZONE).date()

    try:
        entry = get_entry(fetch_feed(), expected_date)
    except Exception as error:  # pragma: no cover - surfaced in the workflow log
        print(f"Could not load or parse {FEED_URL}: {error}", file=sys.stderr)
        return 1

    if entry is None:
        print(f"No '{CATEGORY}' RSS item published on {expected_date.isoformat()}; nothing to update.")
        return 0

    payload = {
        "source": {
            "name": "Nghiên cứu Quốc tế",
            "feed": FEED_URL,
            "category": CATEGORY,
        },
        "entry": entry,
    }

    existing = None
    if OUTPUT_PATH.exists():
        existing = json.loads(OUTPUT_PATH.read_text(encoding="utf-8"))
    if existing == payload:
        print("The latest World Brief link is already up to date.")
        return 0

    OUTPUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    OUTPUT_PATH.write_text(
        json.dumps(payload, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )
    print(f"Updated {OUTPUT_PATH} with: {entry['title']}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
