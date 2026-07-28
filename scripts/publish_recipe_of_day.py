#!/usr/bin/env python3
"""Create one original Vietnamese recipe post and its licensed local cover image.

The article text is generated only from a short, internal recipe brief. It does
not fetch, translate, or reproduce recipes from third-party publishers. The
cover is downloaded from Wikimedia Commons only after its API metadata confirms
an allowed Creative Commons or public-domain license. The generated post keeps
full attribution and a source link in its body.
"""

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
OPENAI_URL = "https://api.openai.com/v1/responses"
COMMONS_API_URL = "https://commons.wikimedia.org/w/api.php"
MODEL = "gpt-5.6-luna"
MAX_IMAGE_BYTES = 12 * 1024 * 1024
ALLOWED_IMAGE_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp"}
ALLOWED_LICENSE_PREFIXES = (
    "cc0",
    "cc by",
    "cc-by",
    "public domain",
    "pdm",
)
BANNED_TEXT = (
    "thịt",
    "cá",
    "gà",
    "tôm",
    "trứng",
    "rượu",
    "bia",
    "dầu hào",
    "điều trị",
    "chữa",
    "giảm cân",
    "thải độc",
    "ngăn ngừa bệnh",
)


def normalized(value: str | None) -> str:
    return " ".join((value or "").split())


def yaml_string(value: str) -> str:
    """JSON strings are valid YAML strings and safely preserve Vietnamese text."""
    return json.dumps(value, ensure_ascii=False)


def markdown_text(value: str) -> str:
    return normalized(value).replace("[", "\\[").replace("]", "\\]")


def strip_html(value: str | None) -> str:
    plain = re.sub(r"<[^>]+>", "", value or "")
    return normalized(html.unescape(plain))


def request_json(
    url: str,
    *,
    headers: dict[str, str] | None = None,
    payload: dict[str, Any] | None = None,
) -> dict[str, Any]:
    data = json.dumps(payload).encode("utf-8") if payload is not None else None
    request = urllib.request.Request(
        url,
        data=data,
        headers={
            "Accept": "application/json",
            "User-Agent": "DuyNguyenRecipePublisher/1.0 (+https://duynguyen9988.github.io/duynguyen/)",
            **(headers or {}),
        },
        method="POST" if data else "GET",
    )
    with urllib.request.urlopen(request, timeout=60) as response:
        return json.loads(response.read().decode("utf-8"))


def load_briefs() -> list[dict[str, str]]:
    payload = json.loads(BRIEFS_PATH.read_text(encoding="utf-8"))
    recipes = payload.get("recipes", [])
    if not isinstance(recipes, list) or not recipes:
        raise ValueError(f"{BRIEFS_PATH} must contain a non-empty recipes list.")

    required = {"id", "title", "brief", "imageSearch"}
    valid: list[dict[str, str]] = []
    ids: set[str] = set()
    for recipe in recipes:
        if not isinstance(recipe, dict) or not required.issubset(recipe):
            raise ValueError("Every recipe brief needs id, title, brief, and imageSearch.")
        recipe_id = normalized(str(recipe["id"]))
        if not re.fullmatch(r"[a-z0-9-]+", recipe_id):
            raise ValueError(f"Invalid recipe id: {recipe_id}")
        if recipe_id in ids:
            raise ValueError(f"Duplicate recipe id: {recipe_id}")
        ids.add(recipe_id)
        valid.append({key: normalized(str(recipe[key])) for key in required})
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


def select_recipe(recipes: list[dict[str, str]], published_ids: set[str], run_date: date) -> dict[str, str] | None:
    available = [recipe for recipe in recipes if recipe["id"] not in published_ids]
    if not available:
        return None
    digest = hashlib.sha256(run_date.isoformat().encode("utf-8")).digest()
    return available[int.from_bytes(digest[:4], "big") % len(available)]


def article_schema() -> dict[str, Any]:
    return {
        "type": "object",
        "additionalProperties": False,
        "properties": {
            "description": {"type": "string"},
            "intro": {"type": "string"},
            "ingredients": {
                "type": "array",
                "items": {
                    "type": "object",
                    "additionalProperties": False,
                    "properties": {
                        "name": {"type": "string"},
                        "amount": {"type": "string"},
                    },
                    "required": ["name", "amount"],
                },
            },
            "steps": {"type": "array", "items": {"type": "string"}},
            "tips": {"type": "array", "items": {"type": "string"}},
            "servingNote": {"type": "string"},
        },
        "required": ["description", "intro", "ingredients", "steps", "tips", "servingNote"],
    }


def output_text(response: dict[str, Any]) -> str:
    direct = response.get("output_text")
    if isinstance(direct, str) and direct.strip():
        return direct
    for output in response.get("output", []):
        for content in output.get("content", []):
            if content.get("type") == "output_text" and isinstance(content.get("text"), str):
                return content["text"]
    raise ValueError("The model response did not contain text output.")


def generate_article(recipe: dict[str, str]) -> dict[str, Any]:
    api_key = os.environ.get("OPENAI_API_KEY", "").strip()
    if not api_key:
        raise RuntimeError("OPENAI_API_KEY is not configured.")

    prompt = f"""Create a final Vietnamese recipe article as JSON for this exact title:
{recipe['title']}

Internal editorial brief (do not cite, quote, or name it):
{recipe['brief']}

Requirements:
- Write original Vietnamese prose only. Do not browse, quote, translate, paraphrase, attribute, or mention any third-party recipe, publisher, chef, or website.
- The recipe serves two people and is vegetarian/vegan: do not use meat, fish, shellfish, egg, dairy, alcohol, fish sauce, oyster sauce, or health/medical claims.
- description: 120–155 Vietnamese characters, plain text.
- intro: one warm, practical paragraph of 80–120 Vietnamese words. Never claim the writer cooked, tested, tasted, visited, or reviewed it.
- ingredients: 5–12 practical ingredients with metric quantities for two people. Include ordinary cooking oil, salt, soy sauce, sugar, pepper, garlic, ginger, lime, or herbs only when they genuinely suit the dish.
- steps: 4–7 short, concrete cooking steps. Do not state unverified nutrition, food-safety temperatures, or storage durations.
- tips: exactly 3 useful, non-medical tips; no promotional wording.
- servingNote: one concise serving suggestion.
- Return JSON matching the supplied schema; no Markdown and no text outside JSON."""

    payload = {
        "model": MODEL,
        "reasoning": {"effort": "low"},
        "input": prompt,
        "text": {
            "format": {
                "type": "json_schema",
                "name": "recipe_article",
                "strict": True,
                "schema": article_schema(),
            }
        },
    }
    response = request_json(
        OPENAI_URL,
        headers={
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json",
        },
        payload=payload,
    )
    if response.get("status") not in {None, "completed"}:
        raise RuntimeError(f"OpenAI response ended with status: {response.get('status')}")
    try:
        article = json.loads(output_text(response))
    except json.JSONDecodeError as error:
        raise ValueError("The model did not return valid JSON.") from error
    validate_article(article)
    return article


def validate_article(article: dict[str, Any]) -> None:
    required = {"description", "intro", "ingredients", "steps", "tips", "servingNote"}
    if not isinstance(article, dict) or set(article) != required:
        raise ValueError("The generated article does not match the expected fields.")
    for field in ("description", "intro", "servingNote"):
        if not isinstance(article[field], str) or not normalized(article[field]):
            raise ValueError(f"Generated {field} is missing.")
    if not 80 <= len(article["description"]) <= 170:
        raise ValueError("Generated description is outside the allowed length.")
    if not 250 <= len(article["intro"]) <= 1_100:
        raise ValueError("Generated introduction is outside the allowed length.")
    if not 5 <= len(article["ingredients"]) <= 12:
        raise ValueError("Generated recipe must have 5–12 ingredients.")
    if not 4 <= len(article["steps"]) <= 7 or len(article["tips"]) != 3:
        raise ValueError("Generated recipe must have 4–7 steps and exactly 3 tips.")
    for ingredient in article["ingredients"]:
        if not isinstance(ingredient, dict) or set(ingredient) != {"name", "amount"}:
            raise ValueError("Generated ingredient has an invalid shape.")
        if not all(isinstance(ingredient[key], str) and normalized(ingredient[key]) for key in ("name", "amount")):
            raise ValueError("Generated ingredient is incomplete.")
    if not all(isinstance(item, str) and normalized(item) for item in article["steps"] + article["tips"]):
        raise ValueError("Generated steps or tips are incomplete.")

    searchable = " ".join(
        [article["description"], article["intro"], article["servingNote"]]
        + [f"{item['name']} {item['amount']}" for item in article["ingredients"]]
        + article["steps"]
        + article["tips"]
    ).lower()
    if any(phrase in searchable for phrase in BANNED_TEXT):
        raise ValueError("Generated recipe contains a prohibited animal product, alcohol, or health claim.")


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
            raise ValueError("Image exceeds the 12 MB source-image limit.")
        content_type = response.headers.get_content_type()
        if content_type not in {"image/jpeg", "image/png", "image/webp"}:
            raise ValueError(f"Unsupported source image type: {content_type}")
        size = 0
        with destination.open("wb") as image_file:
            while chunk := response.read(1024 * 1024):
                size += len(chunk)
                if size > MAX_IMAGE_BYTES:
                    raise ValueError("Image exceeds the 12 MB source-image limit.")
                image_file.write(chunk)


def select_image(query: str, temp_dir: Path) -> tuple[dict[str, str], Path]:
    errors: list[str] = []
    for page in commons_candidates(query):
        metadata = image_metadata(page)
        if metadata is None:
            continue
        target = temp_dir / f"featured-image{metadata['extension']}"
        try:
            download_image(metadata, target)
        except Exception as error:
            errors.append(str(error))
            continue
        return metadata, target
    detail = "; ".join(errors[:3]) if errors else "No eligible Commons file found."
    raise RuntimeError(f"Could not obtain a licensed cover image for '{query}': {detail}")


def build_markdown(recipe: dict[str, str], article: dict[str, Any], image: dict[str, str], published_at: datetime) -> str:
    ingredients = "\n".join(
        f"- {markdown_text(item['name'])}: {markdown_text(item['amount'])}" for item in article["ingredients"]
    )
    steps = "\n".join(f"{index}. {markdown_text(step)}" for index, step in enumerate(article["steps"], start=1))
    tips = "\n".join(f"- {markdown_text(tip)}" for tip in article["tips"])
    license_html = (
        f"Ảnh bìa: <a href=\"{image['sourceUrl']}\" rel=\"noopener noreferrer\">"
        f"{html.escape(image['imageTitle'])}</a> — {html.escape(image['artist'])}, Wikimedia Commons, "
        f"<a href=\"{image['licenseUrl']}\" rel=\"license noopener noreferrer\">{html.escape(image['licenseName'])}</a>."
    )
    return f"""---
title: {yaml_string(recipe['title'])}
description: {yaml_string(normalized(article['description']))}
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

> **Công thức hôm nay** là nội dung được tạo tự động từ brief biên tập nội bộ. Bài không thay thế một trải nghiệm nấu thực tế; hãy nêm nếm và điều chỉnh theo khẩu vị của bạn.

{normalized(article['intro'])}

## Nguyên liệu cho 2 người

{ingredients}

## Cách làm

{steps}

## Mẹo nhỏ

{tips}

## Khi dùng món

{normalized(article['servingNote'])}

## Ảnh và bản quyền

{license_html}
"""


def write_current_recipe(recipe: dict[str, str], article: dict[str, Any], published_at: datetime) -> None:
    payload = {
        "entry": {
            "title": recipe["title"],
            "description": normalized(article["description"]),
            "slug": recipe["id"],
            "pagePath": f"/posts/{recipe['id']}",
            "publishedAt": published_at.isoformat(),
            "displayDate": published_at.strftime("%d/%m/%Y"),
        }
    }
    CURRENT_RECIPE_PATH.write_text(json.dumps(payload, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Publish an original, licensed recipe of the day.")
    parser.add_argument("--date", type=date.fromisoformat, help="Run date in Asia/Ho_Chi_Minh (YYYY-MM-DD).")
    parser.add_argument("--dry-run", action="store_true", help="Validate the generation and image lookup without writing files.")
    parser.add_argument("--self-check", action="store_true", help="Validate local recipe briefs without calling external services.")
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    os.chdir(ROOT)
    recipes = load_briefs()
    if args.self_check:
        print(f"Validated {len(recipes)} original recipe briefs.")
        return 0

    now = datetime.now(TIMEZONE)
    run_date = args.date or now.date()
    published_at = now if args.date is None else datetime.combine(run_date, datetime.min.time(), TIMEZONE).replace(hour=7, minute=5)
    recipe = select_recipe(recipes, published_recipe_ids(), run_date)
    if recipe is None:
        print("Every configured recipe brief has already been published; nothing to do.")
        return 0
    target_dir = POSTS_PATH / recipe["id"]
    if target_dir.exists():
        raise RuntimeError(f"Refusing to overwrite existing post directory: {target_dir}")

    article = generate_article(recipe)
    with tempfile.TemporaryDirectory(prefix="recipe-of-day-") as temp:
        image, downloaded_image = select_image(recipe["imageSearch"], Path(temp))
        if args.dry_run:
            print(f"Validated: {recipe['title']} with {image['licenseName']} cover image; no files were written.")
            return 0
        target_dir.mkdir(parents=True)
        shutil.move(str(downloaded_image), target_dir / downloaded_image.name)
        (target_dir / "index.md").write_text(build_markdown(recipe, article, image, published_at), encoding="utf-8")
        write_current_recipe(recipe, article, published_at)

    print(f"Published recipe source files: {target_dir.relative_to(ROOT)}")
    return 0


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except Exception as error:
        print(f"Recipe publishing stopped: {error}", file=sys.stderr)
        raise SystemExit(1)
