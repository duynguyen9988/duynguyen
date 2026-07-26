# Session Summary — July 26, 2026

## Objective
Diagnose and fix broken blog posts (missing featured images, missing categories, broken Unsplash URLs, broken internal cross-links), audit content structure, and implement SEO improvements.

## Important Details
- Live site: https://duynguyen9988.github.io/duynguyen/ (Hugo 0.163.1)
- **Real Unsplash ID format**: `photo-{13-digit-timestamp}-{12-char-hex}` (AI-invented IDs always 404)
- Cross-post links in Markdown content use `/posts/...` — must be `/duynguyen/posts/...` for the site's base path
- Category consolidation: `am-thuc` (Latin) and `Ẩm thực` (accented) create separate taxonomy pages in Hugo
- Pagination was all on Jul 26 → needed spreading across Jul 22–26 for SEO

## Completed
### Session 1 (commit `1271458`)
- Added `featuredimage: <unsplash-url>` to 9 posts that only had `featuredimagepreview`
- Added missing `categories: [du-lich]` to `mot-goc-nha-tho-duc-ba-saigon`
- Updated culture.md learning log

### Session 2 (commits `659eaab`, `505d3be`)
- Replaced 6 broken Unsplash 404 URLs with real IDs (verified HTTP 200 via curl)
- Blog audit: identified 4 content pillars, 6 structural issues
- Consolidated duplicate categories: `am-thuc` → `Ẩm thực` (5 posts), `cong-nghe` → `Công nghệ` (1 post) — categories reduced 12→10
- Normalized tags: `Sài Gòn` (3) + `saigon` (1) → `sai-gon`
- Staggered 31 post dates across Jul 22–26 (was all Jul 26)
- Fixed `hugo.toml`: corrected Công nghệ URL for `content/categories/cong-nghe/`

### Session 3 (current)
- **Root cause**: 10 post content files had hardcoded Markdown links like `](/posts/slug/)` without `/duynguyen/` base path → browser resolves to `https://duynguyen9988.github.io/posts/slug/` → 404
- **Fix**: Single Python script replaced `](/posts/` with `](/duynguyen/posts/` across all 10 files
- **Verification**: Build succeeded, generated HTML shows correct `/duynguyen/posts/` links

## Files Modified (session 1)
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

## Files Modified (session 2)
- `content/posts/*/index.md` — 6 files: fixed Unsplash URLs
- `content/posts/banh-mi-sai-gon/index.md` — category `am-thuc` → `Ẩm thực`
- `content/posts/ca-phe-via-he-sai-gon/index.md` — category & tag: `am-thuc` → `Ẩm thực`, tag `Sài Gòn` → `sai-gon`
- `content/posts/cho-dem-am-thuc-duong-pho-sai-gon/index.md` — tag `Sài Gòn` → `sai-gon`
- `content/posts/top-10-banh-mi-sai-gon/index.md` — category `am-thuc` → `Ẩm thực`
- `content/posts/top-10-quan-bun-bo-hue-sai-gon/index.md` — category `am-thuc` → `Ẩm thực`
- `content/posts/top-10-quan-cafe-quan-3/index.md` — category `am-thuc` → `Ẩm thực`
- `content/posts/top-10-quan-lau-sai-gon/index.md` — tag `saigon` → `sai-gon`
- `content/posts/thu-thuat-ai-cong-nghe-2026/index.md` — category `cong-nghe` → `Công nghệ`
- 31 post files — staggered dates
- `hugo.toml` — fixed Công nghệ URL
- `culture.md` — added learning log entries

## Files Modified (session 3)
- 10 post content files: fixed `](/posts/` → `](/duynguyen/posts/`
  - `cho-dem-am-thuc-duong-pho-sai-gon/index.md` (4 links)
  - `dia-diem-du-lich-viet-nam/index.md` (4 links)
  - `lam-chu-thoi-gian-quan-ly-cong-viec/index.md` (1 link)
  - `banh-mi-sai-gon/index.md` (4 links)
  - `ca-phe-via-he-sai-gon/index.md` (4 links)
  - `top-10-quan-bun-bo-hue-sai-gon/index.md` (4 links)
  - `van-hoa-giai-tri-viet-nam-2026/index.md` (2 links)
  - `top-10-quan-lau-sai-gon/index.md` (4 links)
  - `top-10-phim-bom-tan-he-2026/index.md` (2 links)
  - `thu-thuat-ai-cong-nghe-2026/index.md` (1 link)

## Key Architecture
- **Featured image resolution** (in `layouts/posts/single.html:68-90`):
  1. `$featuredImage` starts from `featuredimage` frontmatter param
  2. Overridden by `featured-image` page resource if one exists (via `.Resources.GetMatch`)
  3. Dedup logic: featured-image `<div>` is skipped if the same image also appears as first body Markdown image (compared by `RelPermalink`)
- **External URL handling** (in `layouts/_partials/plugin/img.html`): Unsplash URLs have a `Host` → `resource.html` returns falsy → image loaded directly without Hugo processing
- **Cross-post links**: Generated site always uses correct base path. Menu/sitemap/RSS/search all use `relLangURL`. The only source of broken URLs was hardcoded `/posts/` in Markdown content files — need `/duynguyen/posts/`

## Prevention Rules
1. Every post MUST have `featuredimagepreview` (homepage thumb) AND one of:
   - `featuredimage` param (same URL for external images)
   - `featured-image` page resource (for local images)
2. Always include `categories` in frontmatter
3. All internal cross-links in Markdown must use full path with base: `/duynguyen/posts/slug/`
4. Verify Unsplash URLs with `curl -sI <url> | head -1` before committing
5. Build locally before commit to verify featured image renders correctly
6. Prevent future dates in frontmatter
7. Use consistent slug format for tags/categories (Vietnamese-accented for categories, lowercase-no-accent for tags)
