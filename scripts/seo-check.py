#!/usr/bin/env python3
"""SEO validation for Hugo blog posts. Run before build to catch issues early.
   Usage: python3 scripts/seo-check.py              # check all posts
          python3 scripts/seo-check.py content/posts/slug/index.md   # check single post
   Exit code = number of errors found (0 = clean).
"""
import os
import re
import sys
import frontmatter
from datetime import datetime, timezone


BASE = "content/posts"
MAX_DESC = 160
MIN_DESC = 50
MAX_TITLE = 70
MIN_WORDS = 300

errors = []
warnings = []


def e(msg):
    errors.append(msg)

def w(msg):
    warnings.append(msg)


def check_file(path):
    slug = os.path.basename(os.path.dirname(path))
    try:
        with open(path) as f:
            post = frontmatter.load(f)
    except Exception as ex:
        e(f"[{slug}] Parse error: {ex}")
        return

    fm = post.metadata
    content = post.content
    word_count = len(content.split())

    # --- Required frontmatter ---
    required = ["title", "description", "date", "slug", "categories", "tags"]
    for field in required:
        if field not in fm or not fm[field]:
            e(f"[{slug}] Missing required field: {field}")

    # --- Forbidden params ---
    if "featuredimage" in fm and fm["featuredimage"]:
        e(f"[{slug}] 'featuredimage' param is forbidden — use local 'featured-image' page resource instead")
    if "featuredimagepreview" in fm and fm["featuredimagepreview"]:
        e(f"[{slug}] 'featuredimagepreview' param is forbidden — use local 'featured-image' page resource instead")

    # --- Resources check ---
    resources = fm.get("resources", [])
    has_featured = any(
        r.get("name") == "featured-image" and (r.get("src") == "featured-image.jpg" or r.get("src") == "featured-image.png")
        for r in resources
    )

    # Check actual file exists (jpg or png)
    img_paths = [
        os.path.join(os.path.dirname(path), "featured-image.jpg"),
        os.path.join(os.path.dirname(path), "featured-image.png"),
    ]
    img_exists = any(os.path.exists(p) for p in img_paths)
    if not has_featured:
        e(f"[{slug}] Missing resource entry: featured-image / featured-image.jpg")

    if not img_exists:
        e(f"[{slug}] Missing file: featured-image.jpg or featured-image.png")

    # --- Description length ---
    desc = fm.get("description", "")
    dlen = len(desc)
    if dlen < MIN_DESC:
        e(f"[{slug}] Description too short ({dlen} chars, min {MIN_DESC})")
    elif dlen > MAX_DESC:
        e(f"[{slug}] Description too long ({dlen} chars, max {MAX_DESC})")

    # --- Title length ---
    title = fm.get("title", "")
    tlen = len(title)
    if tlen > MAX_TITLE:
        w(f"[{slug}] Title may be too long for SERP ({tlen} chars, max ~{MAX_TITLE})")

    # --- Slug format ---
    slug_val = fm.get("slug", "")
    if slug_val != slug:
        w(f"[{slug}] slug in frontmatter ('{slug_val}') differs from directory slug ('{slug}')")
    if not re.match(r"^[a-z0-9-]+$", slug):
        w(f"[{slug}] slug should be lowercase with hyphens only")

    # --- Categories ---
    cats = fm.get("categories", [])
    if not cats:
        e(f"[{slug}] No categories set")
    elif isinstance(cats, str):
        e(f"[{slug}] 'categories' should be a list, not a string")

    # --- Tags ---
    tags = fm.get("tags", [])
    if not tags:
        w(f"[{slug}] No tags set")
    elif isinstance(tags, str):
        e(f"[{slug}] 'tags' should be a list, not a string")

    # --- Date validity ---
    date_val = fm.get("date")
    if date_val:
        if isinstance(date_val, datetime):
            if date_val.tzinfo:
                now = datetime.now(timezone.utc)
                if date_val > now:
                    e(f"[{slug}] Date is in the future: {date_val}")
            else:
                now = datetime.now()
                if date_val > now:
                    e(f"[{slug}] Date is in the future (naive): {date_val}")

    # --- Draft ---
    if fm.get("draft", False):
        w(f"[{slug}] Post is still in draft")

    # --- External images in content ---
    external_imgs = re.findall(r'!\[.*?\]\((https?://[^)]+)\)', content)
    if external_imgs:
        for img_url in external_imgs:
            if "upload.wikimedia.org" not in img_url:
                e(f"[{slug}] External image URL found: {img_url[:100]}")

    # --- Word count ---
    if word_count < MIN_WORDS:
        w(f"[{slug}] Word count too low ({word_count} words, min {MIN_WORDS})")

    # --- Description has no placeholder text ---
    if desc and ("TODO" in desc or "placeholder" in desc.lower()):
        e(f"[{slug}] Description contains placeholder text")


def main():
    paths = sys.argv[1:] if len(sys.argv) > 1 else []
    if not paths:
        if not os.path.isdir(BASE):
            repo_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
            base = os.path.join(repo_root, "content", "posts")
            if os.path.isdir(base):
                paths = sorted(os.path.join(base, d, "index.md") for d in os.listdir(base))
            else:
                print("No posts directory found")
                sys.exit(1)
        else:
            paths = sorted(os.path.join(BASE, d, "index.md") for d in os.listdir(BASE))
    else:
        # if a file path was passed, resolve relative
        paths = [os.path.join(os.getcwd(), p) if not os.path.isabs(p) else p for p in paths]

    checked = 0
    for p in paths:
        if os.path.exists(p) and p.endswith("index.md"):
            check_file(p)
            checked += 1

    print(f"\n=== SEO Check: {checked} posts, {len(errors)} errors, {len(warnings)} warnings ===\n")

    if errors:
        print("ERRORS:")
        for item in errors:
            print(f"  ✗ {item}")
        print()

    if warnings:
        print("WARNINGS:")
        for item in warnings:
            print(f"  ⚠ {item}")
        print()

    if not errors and not warnings:
        print("  ✅ All posts pass SEO checks!")
    print()

    sys.exit(len(errors))


if __name__ == "__main__":
    main()
