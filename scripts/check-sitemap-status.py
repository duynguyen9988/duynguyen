#!/usr/bin/env python3
"""Check the public sitemap and, when configured, its Search Console status."""

from __future__ import annotations

import argparse
import os
import sys
import xml.etree.ElementTree as ET
from datetime import datetime, timedelta, timezone
from pathlib import Path
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen


SITEMAP_NAMESPACE = "http://www.sitemaps.org/schemas/sitemap/0.9"
EXPECTED_ROOT = f"{{{SITEMAP_NAMESPACE}}}urlset"
USER_AGENT = "DuyNguyenSitemapMonitor/1.0 (+https://duynguyen9988.github.io/duynguyen/)"


class CheckFailed(Exception):
    """A monitored sitemap condition was not met."""


def append_summary(lines: list[str]) -> None:
    summary_file = os.environ.get("GITHUB_STEP_SUMMARY")
    if not summary_file:
        return

    with open(summary_file, "a", encoding="utf-8") as summary:
        summary.write("\n".join(lines) + "\n")


def fetch_public_sitemap(sitemap_url: str) -> tuple[int, str, int]:
    request = Request(
        sitemap_url,
        headers={
            "Accept": "application/xml, text/xml;q=0.9, */*;q=0.1",
            "User-Agent": USER_AGENT,
        },
    )

    try:
        with urlopen(request, timeout=30) as response:
            status_code = response.status
            content_type = response.headers.get("Content-Type", "")
            payload = response.read()
    except HTTPError as error:
        raise CheckFailed(f"Public sitemap returned HTTP {error.code}.") from error
    except URLError as error:
        raise CheckFailed(f"Could not request the public sitemap: {error.reason}") from error

    if status_code != 200:
        raise CheckFailed(f"Public sitemap returned HTTP {status_code}.")
    if "xml" not in content_type.lower():
        raise CheckFailed(f"Public sitemap has unexpected Content-Type: {content_type or 'missing'}.")

    try:
        root = ET.fromstring(payload)
    except ET.ParseError as error:
        raise CheckFailed(f"Public sitemap is not well-formed XML: {error}") from error

    if root.tag != EXPECTED_ROOT:
        raise CheckFailed(f"Unexpected sitemap root element: {root.tag}")

    url_count = len(root.findall(f"{{{SITEMAP_NAMESPACE}}}url"))
    if url_count == 0:
        raise CheckFailed("Public sitemap contains no URL entries.")

    return status_code, content_type, url_count


def parse_timestamp(value: str) -> datetime:
    return datetime.fromisoformat(value.replace("Z", "+00:00"))


def check_search_console(
    credentials_file: Path,
    site_url: str,
    sitemap_url: str,
    max_age_hours: int,
) -> tuple[str, int, int, bool]:
    try:
        from google.oauth2 import service_account
        from googleapiclient.discovery import build
        from googleapiclient.errors import HttpError
    except ImportError as error:
        raise CheckFailed("Google API dependencies are missing.") from error

    scopes = ["https://www.googleapis.com/auth/webmasters.readonly"]
    credentials = service_account.Credentials.from_service_account_file(
        credentials_file,
        scopes=scopes,
    )
    service = build("searchconsole", "v1", credentials=credentials, cache_discovery=False)

    try:
        sitemap = service.sitemaps().get(
            siteUrl=site_url,
            feedpath=sitemap_url,
        ).execute()
    except HttpError as error:
        raise CheckFailed(
            "Search Console API could not retrieve this sitemap "
            f"(HTTP {error.resp.status}). Check the property URL and service-account access."
        ) from error

    last_downloaded = sitemap.get("lastDownloaded")
    errors = int(sitemap.get("errors", 0))
    warnings = int(sitemap.get("warnings", 0))
    is_pending = bool(sitemap.get("isPending", False))

    if not last_downloaded:
        raise CheckFailed("Google Search Console has not successfully downloaded this sitemap yet.")
    if errors:
        raise CheckFailed(f"Google Search Console reports {errors} sitemap error(s).")
    if is_pending:
        raise CheckFailed("Google Search Console still marks this sitemap as pending.")

    try:
        age = datetime.now(timezone.utc) - parse_timestamp(last_downloaded).astimezone(timezone.utc)
    except ValueError as error:
        raise CheckFailed(f"Search Console returned an invalid lastDownloaded value: {last_downloaded}") from error

    if age > timedelta(hours=max_age_hours):
        raise CheckFailed(
            f"Google last downloaded this sitemap {age.days} day(s) ago, "
            f"over the {max_age_hours}-hour limit."
        )

    return last_downloaded, errors, warnings, is_pending


def main() -> int:
    parser = argparse.ArgumentParser(
        description="Monitor the public sitemap and its Google Search Console fetch status."
    )
    parser.add_argument(
        "--site-url",
        default="https://duynguyen9988.github.io/duynguyen/",
        help="The exact Search Console property URL.",
    )
    parser.add_argument(
        "--sitemap-url",
        default="https://duynguyen9988.github.io/duynguyen/sitemap.xml",
        help="The absolute sitemap URL submitted to Search Console.",
    )
    parser.add_argument(
        "--credentials-file",
        help="A service-account JSON key with access to the Search Console property.",
    )
    parser.add_argument(
        "--max-age-hours",
        type=int,
        default=168,
        help="Fail when Google's last successful fetch is older than this many hours.",
    )
    args = parser.parse_args()

    summary = ["## Sitemap monitor", "", "| Check | Result |", "| --- | --- |"]
    try:
        status, content_type, url_count = fetch_public_sitemap(args.sitemap_url)
        summary.append(
            f"| Public sitemap | HTTP {status}; {content_type}; {url_count} URL entries |"
        )

        if not args.credentials_file:
            summary.append("| Google Search Console | Not checked: service-account secret is not configured |")
            append_summary(summary)
            print("Public sitemap is valid. Google Search Console API is not configured yet.")
            return 0

        credentials_file = Path(args.credentials_file)
        if not credentials_file.is_file():
            raise CheckFailed("The configured Search Console credentials file does not exist.")

        last_downloaded, errors, warnings, is_pending = check_search_console(
            credentials_file,
            args.site_url,
            args.sitemap_url,
            args.max_age_hours,
        )
        summary.append(f"| Google last downloaded | {last_downloaded} |")
        summary.append(f"| Google errors / warnings | {errors} / {warnings} |")
        summary.append(f"| Pending | {is_pending} |")
        append_summary(summary)
        print(f"Google Search Console last downloaded the sitemap at {last_downloaded}.")
        return 0
    except CheckFailed as error:
        summary.append(f"| Status | **Failed:** {error} |")
        append_summary(summary)
        print(f"Sitemap monitor failed: {error}", file=sys.stderr)
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
