#!/usr/bin/env python3
"""Create one original Vietnamese recipe post from pre-written briefs."""

from __future__ import annotations

import argparse
import hashlib
import html
import json
import os
import re
import shutil
import sys
import tempfile
import urllib.parse
import urllib.request
from datetime import date, datetime
from pathlib import Path
from typing import Any
from zoneinfo import ZoneInfo


ROOT = Path(__file__).resolve().parents[1]
BRIEFS_PATH = ROOT / "data" / "recipe-briefs.json"
CURRENT_RECIPE_PATH = ROOT / "data" / "recipe-of-day.json"
POSTS_PATH = ROOT / "content" / "posts"
TIMEZONE = ZoneInfo("Asia/Ho_Chi_Minh")
COMMONS_API_URL = "https://commons.wikimedia.org/w/api.php"
MAX_IMAGE_BYTES = 12 * 1024 * 1024
ALLOWED_IMAGE_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp"}
ALLOWED_LICENSE_PREFIXES = (
    "cc0", "cc by", "cc-by", "public domain", "pdm",
)


def normalized(value: str | None) -> str:
    return " ".join((value or "").split())


def yaml_string(value: str) -> str:
    return json.dumps(value, ensure_ascii=False)


def markdown_text(value: str) -> str:
    return normalized(value).replace("[", "\\[").replace("]", "\\]")


def strip_html(value: str | None) -> str:
    plain = re.sub(r"<[^>]+>", "", value or "")
    return normalized(html.unescape(plain))


def request_json(url: str, *, headers: dict[str, str] | None = None) -> dict[str, Any]:
    request = urllib.request.Request(
        url,
        headers={
            "Accept": "application/json",
            "User-Agent": "DuyNguyenRecipePublisher/1.0 (+https://duynguyen9988.github.io/duynguyen/)",
            **(headers or {}),
        },
    )
    with urllib.request.urlopen(request, timeout=60) as response:
        return json.loads(response.read().decode("utf-8"))


def load_briefs() -> list[dict[str, Any]]:
    payload = json.loads(BRIEFS_PATH.read_text(encoding="utf-8"))
    recipes = payload.get("recipes", [])
    if not isinstance(recipes, list) or not recipes:
        raise ValueError(f"{BRIEFS_PATH} must contain a non-empty recipes list.")

    required = {"id", "title", "brief", "imageSearch", "description", "ingredients", "steps", "tips", "servingNote"}
    valid: list[dict[str, Any]] = []
    ids: set[str] = set()
    for recipe in recipes:
        if not isinstance(recipe, dict) or not required.issubset(recipe):
            raise ValueError(f"Every recipe needs id, title, brief, imageSearch, description, ingredients, steps, tips, servingNote.")
        recipe_id = normalized(str(recipe["id"]))
        if not re.fullmatch(r"[a-z0-9-]+", recipe_id):
            raise ValueError(f"Invalid recipe id: {recipe_id}")
        if recipe_id in ids:
            raise ValueError(f"Duplicate recipe id: {recipe_id}")
        ids.add(recipe_id)
        valid.append(recipe)
    return valid


def published_recipe_ids() -> set[str]:
    recipe_ids: set[str] = set()
    for markdown_file in POSTS_PATH.glob("*/index.md"):
        front_matter = markdown_file.read_text(encoding="utf-8", errors="ignore").split("---", 2)
        if len(front_matter) < 3:
            continue
        match = re.search(r"^recipeOfDayId:\s*[\"']?([^\"'\s]+)", front_matter[1], re.MULTILINE)
        if match:
            recipe_ids.add(match.group(1))
    return recipe_ids


def select_recipe(recipes: list[dict[str, Any]], published_ids: set[str], run_date: date) -> dict[str, Any] | None:
    available = [r for r in recipes if r["id"] not in published_ids]
    if not available:
        return None
    digest = hashlib.sha256(run_date.isoformat().encode("utf-8")).digest()
    return available[int.from_bytes(digest[:4], "big") % len(available)]


def permitted_license(value: str) -> bool:
    lower = normalized(value).lower()
    return any(lower.startswith(prefix) for prefix in ALLOWED_LICENSE_PREFIXES)


def commons_candidates(query: str) -> list[dict[str, Any]]:
    params = {
        "action": "query",
        "format": "json",
        "formatversion": "2",
        "generator": "search",
        "gsrsearch": query,
        "gsrnamespace": "6",
        "gsrlimit": "20",
        "prop": "imageinfo",
        "iiprop": "url|mime|extmetadata",
    }
    payload = request_json(f"{COMMONS_API_URL}?{urllib.parse.urlencode(params)}")
    pages = payload.get("query", {}).get("pages", [])
    return pages if isinstance(pages, list) else []


def image_metadata(page: dict[str, Any]) -> dict[str, str] | None:
    info_list = page.get("imageinfo", [])
    if not info_list:
        return None
    info = info_list[0]
    source_url = normalized(str(info.get("descriptionurl", "")))
    original_url = normalized(str(info.get("url", "")))
    extension = Path(urllib.parse.urlparse(original_url).path).suffix.lower()
    metadata = info.get("extmetadata", {})
    license_name = strip_html(metadata.get("LicenseShortName", {}).get("value"))
    license_url = normalized(str(metadata.get("LicenseUrl", {}).get("value", "")))
    artist = strip_html(metadata.get("Artist", {}).get("value")) or "Tác giả không nêu trong metadata"
    image_title = strip_html(metadata.get("ObjectName", {}).get("value")) or normalized(str(page.get("title", ""))).replace("File:", "")

    if not (
        source_url.startswith("https://commons.wikimedia.org/")
        and original_url.startswith("https://")
        and extension in ALLOWED_IMAGE_EXTENSIONS
        and permitted_license(license_name)
    ):
        return None
    if license_name.lower().startswith(("cc by", "cc-by")) and not license_url.startswith("https://creativecommons.org/"):
        return None
    if not license_url:
        license_url = source_url
    return {
        "originalUrl": original_url,
        "sourceUrl": source_url,
        "licenseName": license_name,
        "licenseUrl": license_url,
        "artist": artist,
        "imageTitle": image_title,
        "extension": extension,
    }


def download_image(metadata: dict[str, str], destination: Path) -> None:
    request = urllib.request.Request(
        metadata["originalUrl"],
        headers={"User-Agent": "DuyNguyenRecipePublisher/1.0 (+https://duynguyen9988.github.io/duynguyen/)"},
    )
    with urllib.request.urlopen(request, timeout=90) as response:
        content_length = response.headers.get("Content-Length")
        if content_length and int(content_length) > MAX_IMAGE_BYTES:
            raise ValueError("Image exceeds the 12 MB limit.")
        content_type = response.headers.get_content_type()
        if content_type not in {"image/jpeg", "image/png", "image/webp"}:
            raise ValueError(f"Unsupported image type: {content_type}")
        size = 0
        with destination.open("wb") as f:
            while chunk := response.read(1024 * 1024):
                size += len(chunk)
                if size > MAX_IMAGE_BYTES:
                    raise ValueError("Image exceeds the 12 MB limit.")
                f.write(chunk)


def select_image(query: str, temp_dir: Path) -> tuple[dict[str, str], Path]:
    errors: list[str] = []
    for page in commons_candidates(query):
        meta = image_metadata(page)
        if meta is None:
            continue
        target = temp_dir / f"featured-image{meta['extension']}"
        try:
            download_image(meta, target)
        except Exception as e:
            errors.append(str(e))
            continue
        return meta, target
    detail = "; ".join(errors[:3]) if errors else "No eligible Commons file found."
    raise RuntimeError(f"Could not obtain a licensed cover image for '{query}': {detail}")


def build_markdown(recipe: dict[str, Any], image: dict[str, str], published_at: datetime) -> str:
    ingredients = "\n".join(
        f"- {markdown_text(item['name'])}: {markdown_text(item['amount'])}" for item in recipe["ingredients"]
    )
    steps = "\n".join(f"{i}. {markdown_text(s)}" for i, s in enumerate(recipe["steps"], start=1))
    tips = "\n".join(f"- {markdown_text(t)}" for t in recipe["tips"])
    license_html = (
        f"Ảnh bìa: <a href=\"{image['sourceUrl']}\" rel=\"noopener noreferrer\">"
        f"{html.escape(image['imageTitle'])}</a> — {html.escape(image['artist'])}, Wikimedia Commons, "
        f"<a href=\"{image['licenseUrl']}\" rel=\"license noopener noreferrer\">{html.escape(image['licenseName'])}</a>."
    )
    return f"""---
title: {yaml_string(recipe['title'])}
description: {yaml_string(normalized(recipe['description']))}
date: {published_at.isoformat()}
slug: {recipe['id']}
categories:
  - am-thuc
tags:
  - công thức hôm nay
  - món chay
  - bữa ăn tại nhà
recipeOfDayId: {recipe['id']}
automatedRecipe: true
license: {yaml_string(license_html)}
resources:
  - name: featured-image
    src: featured-image{image['extension']}
draft: false
---

> **Công thức hôm nay** là nội dung được tạo từ brief biên tập nội bộ. Bài không thay thế một trải nghiệm nấu thực tế; hãy nêm nếm và điều chỉnh theo khẩu vị của bạn.

{normalized(recipe['brief'])}

## Nguyên liệu cho 2 người

{ingredients}

## Cách làm

{steps}

## Mẹo nhỏ

{tips}

## Khi dùng món

{normalized(recipe['servingNote'])}

## Ảnh và bản quyền

{license_html}
"""


def write_current_recipe(recipe: dict[str, Any], published_at: datetime) -> None:
    payload = {
        "entry": {
            "title": recipe["title"],
            "description": normalized(recipe["description"]),
            "slug": recipe["id"],
            "pagePath": f"/{recipe['id']}",
            "publishedAt": published_at.isoformat(),
            "displayDate": published_at.strftime("%d/%m/%Y"),
        }
    }
    CURRENT_RECIPE_PATH.write_text(json.dumps(payload, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Publish a recipe of the day from pre-written briefs.")
    parser.add_argument("--date", type=date.fromisoformat, help="Run date in Asia/Ho_Chi_Minh (YYYY-MM-DD).")
    parser.add_argument("--dry-run", action="store_true", help="Validate the selection and image lookup without writing files.")
    parser.add_argument("--self-check", action="store_true", help="Validate recipe briefs without external calls.")
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    os.chdir(ROOT)
    recipes = load_briefs()
    if args.self_check:
        print(f"Validated {len(recipes)} pre-written recipe briefs.")
        return 0

    now = datetime.now(TIMEZONE)
    run_date = args.date or now.date()
    published_at = now
    recipe = select_recipe(recipes, published_recipe_ids(), run_date)
    if recipe is None:
        print("Every recipe brief has already been published; nothing to do.")
        return 0
    target_dir = POSTS_PATH / recipe["id"]
    if target_dir.exists():
        raise RuntimeError(f"Refusing to overwrite existing post directory: {target_dir}")

    with tempfile.TemporaryDirectory(prefix="recipe-of-day-") as tmp:
        image, downloaded_image = select_image(recipe["imageSearch"], Path(tmp))
        if args.dry_run:
            print(f"Validated: {recipe['title']} with {image['licenseName']} cover image; no files were written.")
            return 0
        target_dir.mkdir(parents=True)
        shutil.move(str(downloaded_image), target_dir / downloaded_image.name)
        (target_dir / "index.md").write_text(build_markdown(recipe, image, published_at), encoding="utf-8")
        write_current_recipe(recipe, published_at)

    print(f"Published recipe source files: {target_dir.relative_to(ROOT)}")
    return 0


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except Exception as e:
        print(f"Recipe publishing stopped: {e}", file=sys.stderr)
        raise SystemExit(1)
