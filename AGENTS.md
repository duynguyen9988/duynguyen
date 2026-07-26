# Session Summary — July 26, 2026

## Objective
Diagnose and fix broken blog posts on live site where some posts had thumbnails (homepage) but no images on the single post page, and one post (`mot-goc-nha-tho-duc-ba-saigon`) was missing categories.

## Important Details
- Live site: https://duynguyen9988.github.io/duynguyen/ (Hugo 0.163.1)
- Most posts use `featured-image` page resource (local `.jpg` from Wikipedia)
- 9 posts use `featuredimagepreview` (Unsplash URL) for homepage thumbnails only
- LoveIt theme: `featuredimagepreview` → homepage card; `featuredimage` or `featured-image` resource → single-post hero

## Completed
### This Session (commit `1271458`)
- Diagnosed 9 posts with `featuredimagepreview` but no `featuredimage` → text-only single post pages
- Added `featuredimage: <unsplash-url>` to all 9 posts (same URL as `featuredimagepreview`)
- Added missing `categories: [du-lich]` to `mot-goc-nha-tho-duc-ba-saigon`
- Built and verified locally (featured-image `<div>` now renders with Unsplash URL)
- Updated culture.md learning log with prevention rule
- Committed and pushed

### Previous Sessions
- SEO pass round 1: `featuredimagepreview` (Unsplash) → 9 articles (commit `ec87f98`)
- Fixed bún bò slug + Vietnamese-accented tags/categories (commit `ec87f98`)
- Internal cross-links between related posts (commit `ec87f98`)
- ML-based "Có thể bạn sẽ thích" section with TF-IDF + cosine similarity (commit `a9dec96`)
- Updated `deploy.py` + CI to run `python3 ml-related.py` before `hugo --minify` (commit `a9dec96`)

## Files Modified (this session)
- `content/posts/banh-mi-sai-gon/index.md` — added `featuredimage`
- `content/posts/ca-phe-via-he-sai-gon/index.md` — added `featuredimage`
- `content/posts/cho-dem-am-thuc-duong-pho-sai-gon/index.md` — added `featuredimage`
- `content/posts/dia-diem-du-lich-viet-nam/index.md` — added `featuredimage`
- `content/posts/lam-chu-thoi-gian-quan-ly-cong-viec/index.md` — added `featuredimage`
- `content/posts/thu-thuat-ai-cong-nghe-2026/index.md` — added `featuredimage`
- `content/posts/top-10-quan-bun-bo-hue-sai-gon/index.md` — added `featuredimage`
- `content/posts/top-10-quan-lau-sai-gon/index.md` — added `featuredimage`
- `content/posts/van-hoa-giai-tri-viet-nam-2026/index.md` — added `featuredimage`
- `content/posts/mot-goc-nha-tho-duc-ba-saigon/index.md` — added `categories`
- `culture.md` — added learning log entry

## Key Architecture
- **Featured image resolution** (in `layouts/posts/single.html:68-90`):
  1. `$featuredImage` starts from `featuredimage` frontmatter param
  2. Overridden by `featured-image` page resource if one exists (via `.Resources.GetMatch`)
  3. Dedup logic: featured-image `<div>` is skipped if the same image also appears as first body Markdown image (compared by `RelPermalink`)
- **External URL handling** (in `layouts/_partials/plugin/img.html`): Unsplash URLs have a `Host` → `resource.html` returns falsy → image loaded directly without Hugo processing
- **Posts using `featuredimagepreview` (Unsplash)** need a corresponding `featuredimage` (or `featured-image` resource) to show an image on the single post page

## Prevention Rules
1. Every post MUST have `featuredimagepreview` (homepage thumb) AND one of:
   - `featuredimage` param (same URL for external images)
   - `featured-image` page resource (for local images)
2. Always include `categories` in frontmatter
3. Build locally before commit to verify featured image renders correctly
