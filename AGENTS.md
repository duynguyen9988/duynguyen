# Session Summary — Jul 27, 2026

## Objective
Add micro-interactions, scroll animations, progress bar, 24 new posts (3 per category), move related posts after 1st paragraph, and SEO meta description fixes.

## Important Details
- 8 categories × 3 posts each = 24 new posts, plus 2 extra bonus posts = 73 total
- Related posts moved from bottom to after 1st paragraph: split `.Content` at first `</p>`, insert `related-posts.html` in between
- SEO is optimized manually in post content and front matter; it must not block commits, builds, or deploys.
- Google Search Console + Analytics config placeholders in `hugo.toml`

## Completed
### Session 5 (commits `87d720b` → `02a12c9`)
- CSS micro-interactions: card lift, link underline slide, pagination scale, back-to-top hover, thumbnail gradient overlay
- Scroll reveal (IntersectionObserver + stagger delay) in `theme.js`
- Reading progress gradient bar in `baseof.html`
- Typography: drop cap, letter-spacing, smooth scroll, selection color, prefers-reduced-motion
- Transition optimization: `all` → specific CSS properties
- 24 new posts (3 per category) with Wikipedia-sourced content + local featured images
- Related posts moved after 1st paragraph in `single.html`
- 33 meta descriptions fixed (cut from >160 chars to 100-150)
- Missing `slug` field added to 32 posts
- SEO remains a manual content-quality practice and does not block deployment.
- Google Search Console + Analytics config in `hugo.toml`

## Key Architecture
- **Content split** (`single.html`): `findRE "(.*?</p>)" $contentHtml 1` captures first paragraph, `strings.TrimPrefix` isolates the rest, related posts inserted between

## Prevention Rules (updated)
10. Every post MUST have `slug` in frontmatter matching the directory name
11. `categories` and `tags` must be lists (not strings) in frontmatter

## Objective
Elton-style UI (like blog.eltondata.com): flat white design, blue accent `#2563EB`, fixed white nav with search pill, 2-column card grid, minimal slate footer. All libs stay self-hosted (Fuse.js search re-enabled with local assets — zero CDN, zero external network requests except optional GA).

## Important Details
- BaseURL: `https://seomoney.org/`
- CDN disabled: `[params.cdn] data = ""` in project config → all libs from `assets/lib/`
- Search: `[params.search] enable = true` (type `fuse`) — Fuse.js + autocomplete libs served locally; search JS lives in `initSearch()` in `assets/js/theme.js`; dropdown markup ids: `#search-input`, `#search-clear`, `#search-loading`, `#search-dropdown`
- Local featured images passed as `.Name` (basename) → `resource.html` resolves → Hugo processes to WebP + width/height
- All images local page resources (`featured-image.jpg` + `resources` block in frontmatter); no `featuredimage`/`featuredimagepreview`
- Dark mode removed: `defaultTheme = "light"`, single fixed white header (`#header-desktop` id kept for TOC JS)
- Lightbox removed
- Related post thumbnails removed: text-only cards
- Smart pagination: project override adds "Trang trước/Trang kế tiếp" labels + current±2 window + ellipsis
- Image rules: NO live URLs, WebP only, all images local page resources

## Completed
### Session 4 (commits `adb4b91`, `4526eaa`, `7047e79`, `1f8434b`, `b5e47b6`, `2dbeb0e`)
- Disabled CDN: `[params.cdn] data = ""` in `hugo.toml`
- Disabled search, code copy, share in `hugo.toml`
- Removed comment button via `baseof.html` override
- Removed share icons via `single/footer.html` override
- Removed theme-switch buttons from `header.html` (desktop + mobile)
- Fixed `single.html:69-71`: `$featuredImage = .Name` (not `.RelPermalink`) → `resource.html` can match local page resource → Hugo processes to WebP + width/height
- Fixed `single.html:81`: `$firstContentImage = .Name` for dedup consistency
- Downloaded 9 Unsplash images → local `featured-image.jpg` page resources; updated frontmatter: removed `featuredimage`/`featuredimagepreview`, added `resources` block
- Removed lazysizes JS, loading SVG, `data-src`/`data-sizes` from all image templates
- Enabled WebP in `img.html`: `$res.Fit "1600x1200 webp"`
- Added CSS `aspect-ratio: 1600/1200` fallback in `_custom.scss`
- Removed related post thumbnails → text-only cards
- Removed lightbox: deleted `assets/js/lightbox.js`, removed `data-lightbox` + `<a>` wrapper from `img.html`, removed inline JS from `assets.html`
- Smart pagination: project override (`layouts/_partials/paginator.html`) with Prev/Next, current±2 window, ellipsis; bold large numbers CSS
- Updated `culture.md`: image rules (NO live URLs, WebP only, no lazyload)
- Updated AGENTS.md prevention rules

## Files Modified (session 4)
- `hugo.toml` — CDN disabled, search/copy/share disabled, light theme default
- `layouts/baseof.html` — removed comment button, simplified theme script
- `layouts/_partials/single/footer.html` — share gated by `$share.enable`
- `layouts/_partials/header.html` — theme-switch buttons removed
- `layouts/posts/single.html` — `$featuredImage = .Name`, `$firstContentImage = .Name`
- `layouts/_partials/plugin/img.html` — WebP enabled, no lazyload/loading SVG, no lightbox wrapper
- `layouts/_partials/assets.html` — lazysizes JS removed, lightbox JS removed
- `layouts/partials/related-posts.html` — text-only cards, no thumbnails
- `layouts/_partials/paginator.html` — new: Prev/Next + smart window + ellipsis
- `assets/css/_custom.scss` — aspect-ratio fallback, pagination bold style
- `assets/js/lightbox.js` — deleted
- `culture.md` — updated image rules
- `AGENTS.md` — updated everywhere
- `content/posts/<9x>/index.md` — removed featuredimage/featuredimagepreview, added resources block
- `content/posts/<9x>/featured-image.jpg` — new local page resources

### Session 6 — Elton-style redesign (blog.eltondata.com look)
- `assets/css/elton.scss` — NEW, imported LAST in `style.scss`; full design: white bg, blue `#2563EB` accent, fixed nav shadow, 2-col card grid (`gap: clamp(2rem,4vw,4rem)`, 1 col ≤768px), blue chips, pagination outline buttons, slate `#E2E8F0` footer
- `assets/css/_override.scss` — pink `#FF2FA0` → blue palette (links, blockquote, code, pagination, selection); bg white
- `layouts/_partials/header.html` — fully rewritten: brand logo+name | search pill (center, `#search-input` + dropdown `#search-dropdown`) | GitHub link (hidden ≤768px); single header, no mobile hamburger
- `assets/js/theme.js` — added `initSearch()` (Fuse.js branch, ported from theme) + called in `init()`
- `layouts/home.html` — flat `.elton-post-grid` + smart paginator + social CTA (GitHub/Email buttons)
- `layouts/partials/post-card.html` — elton card: title → chips → avatar+date row → image → 3-line summary
- `layouts/section.html`, `layouts/term.html` — same card grid + bold page title (term = category pages only)
- `layouts/partials/footer.html` — minimal: `© <year>` left, main menu links right
- `layouts/posts/single.html` — meta replaced with avatar + `DD/MM/YYYY` + reading time row
- `layouts/_partials/paginator.html` — "Trang trước"/"Trang kế tiếp" text labels
- `layouts/_partials/head/link.html` — favicon points to local `images/duy-nguyen-logo.webp` (theme root paths 404'd)
- `hugo.toml` — `[params.search] enable = true` (fuse, self-hosted); `iconColor`/`tileColor` → `#2563EB`
- Deleted dead partials: `layouts/partials/home/`, `layouts/partials/sidebar/`
- Verified with Playwright headless: nav fixed/white/shadow, 2-col grid desktop + 1-col ≤768px, no 404s, no JS errors, search dropdown renders suggestions

### Session 7 — remove taxonomy index pages
- `hugo.toml`: `disableKinds = ["taxonomy"]` (kills `/tags/` + `/categories/` index pages) + `[taxonomies] category = "categories"` (tags taxonomy disabled — no tag term pages either); removed "Thẻ"/"Chuyên mục" from `menu.main`
- Deleted `layouts/taxonomy.html`, `layouts/tags/taxonomy.html`
- `layouts/_partials/single/footer.html` — removed `.post-tags` section (would nil-error without tags taxonomy)
- `layouts/partials/sitemap-tree.html` — removed the Thẻ subtree
- Category chips on cards + `/categories/<slug>/` term pages still work (kind `term` unaffected by `disableKinds`)

## Key Architecture
- **Featured image resolution** (`layouts/posts/single.html:68-90`):
  1. `$featuredImage` = `.Name` (basename like `featured-image.jpg`)
  2. `resource.html` resolves via `Resources.GetMatch $featuredImage` → Hugo processes to WebP + width/height
  3. Dedup: skip featured-image `<div>` if same as first content image (compared by `.Name`)
- **Image pipeline** (`img.html`): all images → `$res.Fit "1600x1200 webp"` → WebP output with responsive srcset (800, 1600, 2400px) + width/height attributes
- **No external deps**: zero CDN, zero live URLs, zero external JS/CSS/fonts. All libs served from `assets/lib/` or project overrides
- **Smart pagination**: theme's `paginator.html` replaced with project override — Prev/Next buttons, current ±2 window, ellipsis for gap >1

## Prevention Rules
1. Every post MUST have a local `featured-image.jpg` page resource + `resources` block in frontmatter
2. NO `featuredimage` or `featuredimagepreview` params — only local page resources
3. All images must be WebP (processed by Hugo). No JPEG/PNG/GIF/SVG as final output
4. No lazysizes/loading SVG — direct `src`/`srcset` with `loading="lazy"`
5. No CDN URLs, no live image URLs — fully self-hosted
6. Internal Markdown links use `{{< relurl "slug/" >}}`, never a hard-coded `/duynguyen/` prefix; templates use `.RelPermalink`. This keeps links valid on GitHub Pages and a future custom domain. Do not use `/posts/` — permalinks strips it.
7. Always include `categories` in frontmatter — **slug format only** (lowercase, hyphens, no diacritics)
8. Build locally before commit
9. Prevent future dates — run `TZ=Asia/Saigon date` before writing
10. Every post MUST have `slug` in frontmatter matching the directory name
11. `categories` and `tags` must be lists (not strings) in frontmatter
12. **NEVER create new categories.** Only use the 8 existing canonical slug categories: `am-thuc`, `cong-nghe`, `du-lich`, `giai-tri`, `kinh-nghiem-song`, `mua-sam`, `phim`, `van-hoa`
13. Title ≤ 70 chars with keyword at front; description 100–150 chars with keyword + CTA; alt text on every image (see `culture.md` keyword strategy)
