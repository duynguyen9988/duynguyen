#!/usr/bin/env python3
"""Convert a user-licensed cooking guide into a Vietnamese Hugo post.

This command is intentionally opt-in: it requires the caller to confirm they
hold translation and image-republication rights for the supplied text or URL.
It is for a source the site owner is allowed to republish, not for copying an
arbitrary publisher's article.
"""

from __future__ import annotations

import argparse
import html
import json
import os
import re
import shutil
import sys
import tempfile
import unicodedata
import urllib.parse
import urllib.request
from datetime import datetime
from html.parser import HTMLParser
from pathlib import Path
from typing import Any
from zoneinfo import ZoneInfo


ROOT = Path(__file__).resolve().parents[1]
POSTS_PATH = ROOT / "content" / "posts"
TIMEZONE = ZoneInfo("Asia/Ho_Chi_Minh")
OPENAI_URL = "https://api.openai.com/v1/responses"
MODEL = "gpt-5.6-terra"
MAX_SOURCE_CHARS = 28_000
MAX_IMAGE_BYTES = 12 * 1024 * 1024
ALLOWED_IMAGE_TYPES = {
    "image/jpeg": ".jpg",
    "image/png": ".png",
    "image/webp": ".webp",
}


def normalized(value: str | None) -> str:
    return " ".join((value or "").split())


def yaml_string(value: str) -> str:
    return json.dumps(value, ensure_ascii=False)


def clean_markdown(value: str) -> str:
    return value.replace("<!--", "").replace("-->", "").strip()


def slugify(value: str) -> str:
    normalized_value = unicodedata.normalize("NFD", value.lower()).replace("đ", "d")
    without_marks = "".join(char for char in normalized_value if unicodedata.category(char) != "Mn")
    slug = re.sub(r"[^a-z0-9]+", "-", without_marks).strip("-")
    if not slug:
        raise ValueError("Could not derive a Latin slug from the title.")
    return slug[:90].rstrip("-")


class ArticleExtractor(HTMLParser):
    """Extract readable text from an allowed source page without saving its HTML."""

    ignored_tags = {"script", "style", "noscript", "svg", "nav", "footer", "header", "aside", "form"}
    content_tags = {"p", "h2", "h3", "li", "blockquote"}
    block_tags = {"p", "h1", "h2", "h3", "h4", "li", "blockquote", "br"}

    def __init__(self) -> None:
        super().__init__(convert_charrefs=True)
        self.title = ""
        self.og_title = ""
        self.parts: list[str] = []
        self._ignore_depth = 0
        self._article_depth = 0
        self._body_depth = 0
        self._in_title = False

    def handle_starttag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        attributes = dict(attrs)
        if tag in self.ignored_tags:
            self._ignore_depth += 1
            return
        if tag == "article":
            self._article_depth += 1
        if tag == "body":
            self._body_depth += 1
        if tag == "title":
            self._in_title = True
        if tag == "meta" and attributes.get("property") == "og:title":
            self.og_title = normalized(attributes.get("content"))
        if tag in self.block_tags and self.parts and self.parts[-1] != "\n":
            self.parts.append("\n")

    def handle_endtag(self, tag: str) -> None:
        if tag in self.ignored_tags and self._ignore_depth:
            self._ignore_depth -= 1
            return
        if tag == "article" and self._article_depth:
            self._article_depth -= 1
        if tag == "body" and self._body_depth:
            self._body_depth -= 1
        if tag == "title":
            self._in_title = False
        if tag in self.block_tags and self.parts and self.parts[-1] != "\n":
            self.parts.append("\n")

    def handle_data(self, data: str) -> None:
        if self._ignore_depth:
            return
        value = normalized(data)
        if not value:
            return
        if self._in_title:
            self.title = normalized(f"{self.title} {value}")
            return
        if self._article_depth or self._body_depth:
            self.parts.append(value)

    def content(self) -> str:
        # If a page lacks an article element, body text is still the permitted
        # user-supplied source. Collapse multiple layout breaks into paragraphs.
        joined = "".join(f"{part} " if part != "\n" else "\n" for part in self.parts)
        paragraphs = [normalized(part) for part in joined.splitlines() if normalized(part)]
        return "\n\n".join(paragraphs)


def fetch_url_source(url: str) -> tuple[str, str]:
    parsed = urllib.parse.urlparse(url)
    if parsed.scheme not in {"https", "http"} or not parsed.netloc:
        raise ValueError("Source URL must be an absolute http(s) URL.")
    request = urllib.request.Request(
        url,
        headers={
            "Accept": "text/html,application/xhtml+xml",
            "User-Agent": "DuyNguyenRecipeConverter/1.0 (+https://seomoney.org/)",
        },
    )
    with urllib.request.urlopen(request, timeout=45) as response:
        content_type = response.headers.get_content_type()
        if content_type not in {"text/html", "application/xhtml+xml"}:
            raise ValueError(f"Source URL is not an HTML page: {content_type}")
        raw_html = response.read(MAX_SOURCE_CHARS * 3).decode(response.headers.get_content_charset() or "utf-8", errors="replace")
    parser = ArticleExtractor()
    parser.feed(raw_html)
    text = parser.content()
    if len(text) < 200:
        raise ValueError("Could not extract enough readable text from the source URL. Use --input or --stdin instead.")
    return parser.og_title or parser.title, text[:MAX_SOURCE_CHARS]


def read_source(args: argparse.Namespace) -> tuple[str, str, str]:
    if args.url:
        title, text = fetch_url_source(args.url)
        return title, text, args.source_url or args.url
    if args.input:
        path = Path(args.input).expanduser()
        if not path.is_file():
            raise ValueError(f"Input file does not exist: {path}")
        return args.title or path.stem, path.read_text(encoding="utf-8"), args.source_url
    raw_text = sys.stdin.read()
    if not normalized(raw_text):
        raise ValueError("No text received on stdin.")
    return args.title or "Hướng dẫn nấu ăn", raw_text, args.source_url


def request_json(payload: dict[str, Any], api_key: str) -> dict[str, Any]:
    request = urllib.request.Request(
        OPENAI_URL,
        data=json.dumps(payload).encode("utf-8"),
        headers={
            "Accept": "application/json",
            "Content-Type": "application/json",
            "Authorization": f"Bearer {api_key}",
            "User-Agent": "DuyNguyenRecipeConverter/1.0",
        },
        method="POST",
    )
    with urllib.request.urlopen(request, timeout=90) as response:
        return json.loads(response.read().decode("utf-8"))


def response_text(response: dict[str, Any]) -> str:
    if isinstance(response.get("output_text"), str) and response["output_text"].strip():
        return response["output_text"]
    for output in response.get("output", []):
        for content in output.get("content", []):
            if content.get("type") == "output_text" and isinstance(content.get("text"), str):
                return content["text"]
    raise ValueError("The translation model returned no text.")


def translation_schema() -> dict[str, Any]:
    return {
        "type": "object",
        "additionalProperties": False,
        "properties": {
            "title": {"type": "string"},
            "description": {"type": "string"},
            "markdown": {"type": "string"},
        },
        "required": ["title", "description", "markdown"],
    }


def translate_to_vietnamese(source_title: str, source_text: str) -> dict[str, str]:
    api_key = os.environ.get("OPENAI_API_KEY", "").strip()
    if not api_key:
        raise RuntimeError("OPENAI_API_KEY is not configured in the environment.")

    prompt = f"""Translate the following user-licensed cooking guide into polished Vietnamese for a Hugo food blog.

Source title:
{source_title}

Source text:
{source_text[:MAX_SOURCE_CHARS]}

Rules:
- Faithfully translate the source; retain ingredient quantities, safety warnings, recipe steps, and important caveats.
- Keep the cooking-guide structure in Markdown, using ## headings where appropriate. Do not add image links, HTML, promotional claims, author bylines, or a source/copyright section.
- Do not claim the translator cooked, tested, tasted, or reviewed the recipe.
- Do not invent missing facts or nutrition/medical advice.
- title: natural Vietnamese title, plain text.
- description: Vietnamese summary between 120 and 155 characters.
- markdown: translation body only, with no front matter.
- Return only JSON that matches the supplied schema."""

    payload = {
        "model": MODEL,
        "reasoning": {"effort": "low"},
        "input": prompt,
        "text": {
            "format": {
                "type": "json_schema",
                "name": "licensed_recipe_translation",
                "strict": True,
                "schema": translation_schema(),
            }
        },
    }
    output = request_json(payload, api_key)
    if output.get("status") not in {None, "completed"}:
        raise RuntimeError(f"OpenAI response ended with status: {output.get('status')}")
    try:
        translated = json.loads(response_text(output))
    except json.JSONDecodeError as error:
        raise ValueError("The translation model did not return valid JSON.") from error

    if set(translated) != {"title", "description", "markdown"}:
        raise ValueError("The translation response has an unexpected structure.")
    if not all(isinstance(value, str) and normalized(value) for value in translated.values()):
        raise ValueError("The translation response contains an empty field.")
    if not 100 <= len(translated["description"]) <= 180:
        raise ValueError("The translated description is outside the allowed length.")
    return {key: clean_markdown(value) for key, value in translated.items()}


def download_image(url: str, destination_dir: Path) -> tuple[Path, str]:
    parsed = urllib.parse.urlparse(url)
    if parsed.scheme not in {"https", "http"} or not parsed.netloc:
        raise ValueError("Image URL must be an absolute http(s) URL.")
    request = urllib.request.Request(
        url,
        headers={"User-Agent": "DuyNguyenRecipeConverter/1.0 (+https://seomoney.org/)"},
    )
    with urllib.request.urlopen(request, timeout=90) as response:
        content_type = response.headers.get_content_type()
        extension = ALLOWED_IMAGE_TYPES.get(content_type)
        if extension is None:
            raise ValueError(f"Unsupported image type: {content_type}")
        content_length = response.headers.get("Content-Length")
        if content_length and int(content_length) > MAX_IMAGE_BYTES:
            raise ValueError("Image exceeds the 12 MB limit.")
        destination = destination_dir / f"featured-image{extension}"
        downloaded = 0
        with destination.open("wb") as image_file:
            while chunk := response.read(1024 * 1024):
                downloaded += len(chunk)
                if downloaded > MAX_IMAGE_BYTES:
                    raise ValueError("Image exceeds the 12 MB limit.")
                image_file.write(chunk)
    return destination, extension


def attribution_html(args: argparse.Namespace) -> str:
    return (
        f"Bài gốc: <a href=\"{html.escape(args.source_url)}\" rel=\"noopener noreferrer\">{html.escape(args.source_name)}</a> "
        f"({html.escape(args.source_license)}). Ảnh bìa: "
        f"<a href=\"{html.escape(args.image_source_url)}\" rel=\"noopener noreferrer\">{html.escape(args.image_credit)}</a> "
        f"({html.escape(args.image_license)}). Bản dịch tiếng Việt và tái xuất bản được đăng theo quyền sử dụng do biên tập viên xác nhận."
    )


def build_markdown(translated: dict[str, str], args: argparse.Namespace, slug: str, image_extension: str, now: datetime) -> str:
    attribution = attribution_html(args)
    return f"""---
title: {yaml_string(translated['title'])}
description: {yaml_string(translated['description'])}
date: {now.isoformat()}
slug: {slug}
categories:
  - am-thuc
tags:
  - hướng dẫn nấu ăn
  - công thức hôm nay
translationSource: {yaml_string(args.source_url)}
translationSourceLicense: {yaml_string(args.source_license)}
imageSource: {yaml_string(args.image_source_url)}
imageLicense: {yaml_string(args.image_license)}
license: {yaml_string(attribution)}
resources:
  - name: featured-image
    src: featured-image{image_extension}
draft: false
---

> **Bản dịch có cấp quyền** · Đây là bản dịch tiếng Việt của một hướng dẫn nấu ăn mà biên tập viên đã xác nhận quyền dịch và tái xuất bản.

{translated['markdown']}

## Nguồn và bản quyền

{attribution}
"""


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Translate a user-licensed cooking guide into a Vietnamese Hugo post.",
        epilog="Use only text, source pages, and images you are authorized to translate and republish.",
    )
    source = parser.add_mutually_exclusive_group(required=True)
    source.add_argument("--url", help="Permitted source-page URL to fetch and translate.")
    source.add_argument("--input", help="UTF-8 plain-text or Markdown file containing permitted source text.")
    source.add_argument("--stdin", action="store_true", help="Read permitted source text from stdin.")
    parser.add_argument("--title", help="Source title when using --input or --stdin.")
    parser.add_argument("--source-name", required=True, help="Rights holder or permitted source name.")
    parser.add_argument("--source-url", help="Canonical source URL; required with --input/--stdin.")
    parser.add_argument("--source-license", required=True, help="Republishing/translation license or permission reference.")
    parser.add_argument("--image-url", required=True, help="Original image URL that you are licensed to use.")
    parser.add_argument("--image-source-url", required=True, help="Canonical page or license page for the cover image.")
    parser.add_argument("--image-credit", required=True, help="Required creator or rights-holder credit for the image.")
    parser.add_argument("--image-license", required=True, help="Image license or permission reference.")
    parser.add_argument(
        "--confirm-rights",
        action="store_true",
        help="Required confirmation that you hold translation and image-republication rights.",
    )
    parser.add_argument("--dry-run", action="store_true", help="Translate and download without writing a post.")
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    if not args.confirm_rights:
        raise RuntimeError("Refusing to proceed without --confirm-rights.")
    if args.stdin and args.input:
        raise ValueError("Choose only one source input mode.")
    if (args.input or args.stdin) and not args.source_url:
        raise ValueError("--source-url is required when using --input or --stdin.")
    os.chdir(ROOT)

    source_title, source_text, canonical_url = read_source(args)
    args.source_url = canonical_url
    if len(normalized(source_text)) < 200:
        raise ValueError("Source text is too short to form a complete cooking guide.")
    translated = translate_to_vietnamese(source_title, source_text)

    slug = slugify(translated["title"])
    target_dir = POSTS_PATH / slug
    if target_dir.exists():
        raise RuntimeError(f"Refusing to overwrite existing post directory: {target_dir}")
    now = datetime.now(TIMEZONE)

    with tempfile.TemporaryDirectory(prefix="recipe-converter-") as temp:
        image_file, extension = download_image(args.image_url, Path(temp))
        if args.dry_run:
            print(f"Validated licensed translation: {translated['title']}; no files were written.")
            return 0
        target_dir.mkdir(parents=True)
        shutil.move(str(image_file), target_dir / image_file.name)
        (target_dir / "index.md").write_text(
            build_markdown(translated, args, slug, extension, now),
            encoding="utf-8",
        )

    print(f"Created licensed recipe post: {target_dir.relative_to(ROOT)}")
    return 0


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except Exception as error:
        print(f"rc stopped: {error}", file=sys.stderr)
        raise SystemExit(1)
