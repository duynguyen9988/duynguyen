#!/usr/bin/env python3
"""Sync the latest World Brief article and organise its text for the homepage."""

from __future__ import annotations

import argparse
import json
import sys
import urllib.request
import xml.etree.ElementTree as element_tree
from datetime import date, datetime
from email.utils import parsedate_to_datetime
from html.parser import HTMLParser
from pathlib import Path
from zoneinfo import ZoneInfo


FEED_URL = "https://nghiencuuquocte.org/feed/"
CATEGORY = "Thế giới hôm nay"
TIMEZONE = ZoneInfo("Asia/Ho_Chi_Minh")
OUTPUT_PATH = Path("data/world-brief.json")
BLOCK_TAGS = {"p", "h2", "h3", "h4"}
IGNORED_CLASS_PREFIXES = (
    "addtoany",
    "monsterinsights",
    "yarpp",
)


def normalize(value: str | None) -> str:
    return " ".join((value or "").split())


def fetch_url(url: str) -> bytes:
    request = urllib.request.Request(
        url,
        headers={
            "Accept": "application/rss+xml, application/xml;q=0.9, text/xml;q=0.8, text/html;q=0.7",
            "User-Agent": "DuyNguyenBlogWorldBrief/1.0 (+https://duynguyen9988.github.io/duynguyen/)",
        },
    )
    with urllib.request.urlopen(request, timeout=30) as response:
        return response.read()


class ArticleContentParser(HTMLParser):
    """Extract readable text blocks from the source article's entry content."""

    def __init__(self) -> None:
        super().__init__(convert_charrefs=True)
        self.entry_depth = 0
        self.ignored_depth: int | None = None
        self.current_tag: str | None = None
        self.current_text: list[str] = []
        self.current_emphasized_text: list[str] = []
        self.current_first_emphasized_text: list[str] = []
        self.current_plain_text: list[str] = []
        self.capturing_first_emphasis = False
        self.strong_depth = 0
        self.blocks: list[dict[str, str | bool]] = []

    @staticmethod
    def _classes(attrs: list[tuple[str, str | None]]) -> set[str]:
        class_value = dict(attrs).get("class") or ""
        return set(class_value.split())

    @staticmethod
    def _is_ignored(classes: set[str]) -> bool:
        return any(
            class_name.startswith(IGNORED_CLASS_PREFIXES) for class_name in classes
        )

    def handle_starttag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        classes = self._classes(attrs)

        if self.entry_depth == 0:
            if tag == "div" and "entry-content" in classes:
                self.entry_depth = 1
            return

        if tag == "div":
            self.entry_depth += 1
            if self.ignored_depth is None and self._is_ignored(classes):
                self.ignored_depth = self.entry_depth
            return

        if self.ignored_depth is not None:
            return

        if tag in BLOCK_TAGS and self.current_tag is None:
            self.current_tag = tag
            self.current_text = []
            self.current_emphasized_text = []
            self.current_first_emphasized_text = []
            self.current_plain_text = []
            self.capturing_first_emphasis = False
            self.strong_depth = 0
        elif tag == "strong" and self.current_tag is not None:
            if self.strong_depth == 0:
                self.capturing_first_emphasis = not self.current_first_emphasized_text
            self.strong_depth += 1
        elif tag == "br" and self.current_tag is not None:
            self.current_text.append(" ")

    def handle_endtag(self, tag: str) -> None:
        if self.entry_depth == 0:
            return

        if tag == "div":
            if self.ignored_depth == self.entry_depth:
                self.ignored_depth = None
            self.entry_depth -= 1
            return

        if self.ignored_depth is not None:
            return

        if tag == "strong" and self.current_tag is not None and self.strong_depth:
            self.strong_depth -= 1
            if self.strong_depth == 0:
                self.capturing_first_emphasis = False
        elif tag == self.current_tag:
            text = normalize("".join(self.current_text))
            if text:
                plain_text = normalize("".join(self.current_plain_text)).strip("|:-–— ")
                self.blocks.append(
                    {
                        "text": text,
                        "emphasized": normalize("".join(self.current_first_emphasized_text)),
                        "isEmphasized": bool(self.current_emphasized_text) and not plain_text,
                    }
                )
            self.current_tag = None
            self.current_text = []
            self.current_emphasized_text = []
            self.current_first_emphasized_text = []
            self.current_plain_text = []
            self.capturing_first_emphasis = False
            self.strong_depth = 0

    def handle_data(self, data: str) -> None:
        if self.entry_depth == 0 or self.ignored_depth is not None or self.current_tag is None:
            return

        self.current_text.append(data)
        if self.strong_depth:
            self.current_emphasized_text.append(data)
            if self.capturing_first_emphasis:
                self.current_first_emphasized_text.append(data)
        else:
            self.current_plain_text.append(data)


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


def title_for_block(block: dict[str, str | bool], position: int) -> str:
    emphasized = str(block["emphasized"]).strip().rstrip(":")
    if emphasized:
        return emphasized[0].upper() + emphasized[1:]
    return f"Tin nhanh {position}"


def parse_article(article: bytes) -> tuple[str | None, list[dict[str, object]]]:
    parser = ArticleContentParser()
    parser.feed(article.decode("utf-8", errors="replace"))
    parser.close()

    attribution: str | None = None
    quick_topics: list[dict[str, object]] = []
    focus_topics: list[dict[str, object]] = []
    current_focus_topic: dict[str, object] | None = None
    in_focus = False

    for block in parser.blocks:
        text = str(block["text"])
        if text.casefold() == "tiêu điểm":
            in_focus = True
            continue

        if attribution is None and text.casefold().startswith("nguồn:"):
            attribution = text
            continue

        if not in_focus:
            quick_topics.append(
                {
                    "title": title_for_block(block, len(quick_topics) + 1),
                    "paragraphs": [text],
                }
            )
            continue

        if bool(block["isEmphasized"]):
            current_focus_topic = {"title": text.rstrip(":"), "paragraphs": []}
            focus_topics.append(current_focus_topic)
            continue

        if current_focus_topic is None:
            current_focus_topic = {"title": "Tiêu điểm", "paragraphs": []}
            focus_topics.append(current_focus_topic)

        paragraphs = current_focus_topic["paragraphs"]
        if isinstance(paragraphs, list):
            paragraphs.append(text)

    sections: list[dict[str, object]] = []
    if quick_topics:
        sections.append({"title": "Tin nhanh", "topics": quick_topics})
    if focus_topics:
        sections.append({"title": "Tiêu điểm", "topics": focus_topics})
    return attribution, sections


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Sync the latest World Brief article content.")
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
        entry = get_entry(fetch_url(FEED_URL), expected_date)
        if entry is not None:
            attribution, sections = parse_article(fetch_url(entry["url"]))
            if not sections:
                raise ValueError("No readable article text was found")
            entry["attribution"] = attribution
            entry["sections"] = sections
    except Exception as error:  # pragma: no cover - surfaced in the workflow log
        print(f"Could not load or parse the World Brief source: {error}", file=sys.stderr)
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
        print("The latest World Brief article is already up to date.")
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
