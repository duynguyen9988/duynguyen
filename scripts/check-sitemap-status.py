#!/usr/bin/env python3
"""Check the public sitemap and, when configured, its Search Console status."""

from __future__ import annotations

import argparse
import json
import os
import sys
import xml.etree.ElementTree as ET
from datetime import datetime, timedelta, timezone
from pathlib import Path
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen


SITEMAP_NAMESPACE = "http://www.sitemaps.org/schemas/sitemap/0.9"
EXPECTED_ROOT = f"{{{SITEMAP_NAMESPACE}}}urlset"
USER_AGENT = "DuyNguyenSitemapMonitor/1.0 (+https://seomoney.org/)"


class CheckFailed(Exception):
    """A monitored sitemap condition was not met."""


def append_summary(lines: list[str]) -> None:
    summary_file = os.environ.get("GITHUB_STEP_SUMMARY")
    if not summary_file:
        return

    with open(summary_file, "a", encoding="utf-8") as summary:
        summary.write("\n".join(lines) + "\n")


def fetch_public_sitemap(sitemap_url: str) -> tuple[int, str, list[str]]:
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

    urls: list[str] = []
    for entry in root.findall(f"{{{SITEMAP_NAMESPACE}}}url"):
        location = entry.find(f"{{{SITEMAP_NAMESPACE}}}loc")
        if location is not None and location.text:
            urls.append(location.text.strip())

    if not urls:
        raise CheckFailed("Public sitemap contains no URL entries.")

    return status_code, content_type, urls


def parse_timestamp(value: str) -> datetime:
    return datetime.fromisoformat(value.replace("Z", "+00:00"))


def build_search_console_service(credentials_file: Path):
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
    return build("searchconsole", "v1", credentials=credentials, cache_discovery=False)


def check_search_console(
    service,
    site_url: str,
    sitemap_url: str,
    max_age_hours: int,
) -> tuple[str, int, int, bool]:
    from googleapiclient.errors import HttpError

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


def inspect_urls(
    service,
    site_url: str,
    urls: list[str],
    max_urls: int,
) -> list[dict[str, str]]:
    from googleapiclient.errors import HttpError

    results: list[dict[str, str]] = []
    for url in urls[:max_urls]:
        try:
            response = service.urlInspection().index().inspect(
                body={
                    "inspectionUrl": url,
                    "siteUrl": site_url,
                    "languageCode": "en-US",
                }
            ).execute()
            status = response.get("inspectionResult", {}).get("indexStatusResult", {})
            results.append(
                {
                    "url": url,
                    "verdict": status.get("verdict", "VERDICT_UNSPECIFIED"),
                    "coverageState": status.get("coverageState", "Unknown"),
                    "indexingState": status.get("indexingState", "INDEXING_STATE_UNSPECIFIED"),
                    "robotsTxtState": status.get("robotsTxtState", "ROBOTS_TXT_STATE_UNSPECIFIED"),
                    "pageFetchState": status.get("pageFetchState", "PAGE_FETCH_STATE_UNSPECIFIED"),
                    "lastCrawlTime": status.get("lastCrawlTime", ""),
                }
            )
        except HttpError as error:
            results.append(
                {
                    "url": url,
                    "verdict": "API_ERROR",
                    "coverageState": f"HTTP {error.resp.status}",
                    "indexingState": "",
                    "robotsTxtState": "",
                    "pageFetchState": "",
                    "lastCrawlTime": "",
                }
            )

    return results


def write_index_report(
    report_file: Path,
    site_url: str,
    sitemap_url: str,
    results: list[dict[str, str]],
) -> None:
    report_file.parent.mkdir(parents=True, exist_ok=True)
    report = {
        "generatedAt": datetime.now(timezone.utc).isoformat(),
        "siteUrl": site_url,
        "sitemapUrl": sitemap_url,
        "indexedCount": sum(result["verdict"] == "PASS" for result in results),
        "excludedCount": sum(result["verdict"] == "NEUTRAL" for result in results),
        "errorCount": sum(result["verdict"] in {"FAIL", "API_ERROR"} for result in results),
        "results": results,
    }
    report_file.write_text(json.dumps(report, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


def main() -> int:
    parser = argparse.ArgumentParser(
        description="Monitor the public sitemap and its Google Search Console fetch status."
    )
    parser.add_argument(
        "--site-url",
        default="https://seomoney.org/",
        help="The exact Search Console property URL.",
    )
    parser.add_argument(
        "--sitemap-url",
        default="https://seomoney.org/sitemap.xml",
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
    parser.add_argument(
        "--inspect-urls",
        action="store_true",
        help="Inspect each sitemap URL using the Google URL Inspection API.",
    )
    parser.add_argument(
        "--max-urls",
        type=int,
        default=500,
        help="Maximum number of sitemap URLs to inspect in one manual run.",
    )
    parser.add_argument(
        "--report-file",
        type=Path,
        default=Path("reports/google-index-report.json"),
        help="Where to write the URL Inspection report when --inspect-urls is used.",
    )
    args = parser.parse_args()

    summary = ["## Sitemap monitor", "", "| Check | Result |", "| --- | --- |"]
    try:
        status, content_type, sitemap_urls = fetch_public_sitemap(args.sitemap_url)
        summary.append(
            f"| Public sitemap | HTTP {status}; {content_type}; {len(sitemap_urls)} URL entries |"
        )

        if not args.credentials_file:
            if args.inspect_urls:
                raise CheckFailed(
                    "Cannot inspect individual URLs until the Search Console service-account secret is configured."
                )
            summary.append("| Google Search Console | Not checked: service-account secret is not configured |")
            append_summary(summary)
            print("Public sitemap is valid. Google Search Console API is not configured yet.")
            return 0

        credentials_file = Path(args.credentials_file)
        if not credentials_file.is_file():
            raise CheckFailed("The configured Search Console credentials file does not exist.")

        service = build_search_console_service(credentials_file)
        last_downloaded, errors, warnings, is_pending = check_search_console(
            service,
            args.site_url,
            args.sitemap_url,
            args.max_age_hours,
        )
        summary.append(f"| Google last downloaded | {last_downloaded} |")
        summary.append(f"| Google errors / warnings | {errors} / {warnings} |")
        summary.append(f"| Pending | {is_pending} |")

        if args.inspect_urls:
            results = inspect_urls(service, args.site_url, sitemap_urls, args.max_urls)
            write_index_report(args.report_file, args.site_url, args.sitemap_url, results)
            indexed = sum(result["verdict"] == "PASS" for result in results)
            excluded = sum(result["verdict"] == "NEUTRAL" for result in results)
            failed = sum(result["verdict"] in {"FAIL", "API_ERROR"} for result in results)
            summary.append(
                f"| URL Inspection | {len(results)} inspected: {indexed} indexed, "
                f"{excluded} excluded, {failed} errors |"
            )
            summary.append(f"| URL Inspection report | `{args.report_file}` |")
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
