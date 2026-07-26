# Session Summary — Jul 26, 2026

## Objective
Eliminate CDN deps, external image URLs & unused features (search, dark mode, share, comment, lightbox) to fix CLS jank — fully self-hosted with zero external network requests.

## Important Details
- BaseURL: `https://duynguyen9988.github.io/duynguyen/`
- CDN enabled by theme's `hugo.toml:650` `data = "jsdelivr.yml"` → `init.html` loads `assets/data/cdn/jsdelivr.yml` in production → all libs from `cdn.jsdelivr.net`. Fix: add `[params.cdn] data = ""` in project config
- Local featured images passed as `.RelPermalink` (full path) → `resource.html` uses `Resources.GetMatch` expecting basename → nil → no Hugo processing → CLS. Fix: use `.Name` (basename)
- 9 Unsplash URLs → no width/height → CSS `aspect-ratio: 1600/1200` fallback but actual ratio may differ → residual jank. Fix: download all to `featured-image.jpg`, add `resources` block, remove `featuredimage`/`featuredimagepreview`
- Dark mode removed: `defaultTheme = "light"`, header buttons deleted, baseof script simplified
- Lightbox removed: delete `assets/js/lightbox.js`, remove `data-lightbox` + `<a>` wrapper from `img.html`, remove inline JS from `assets.html`
- Related post thumbnails removed: text-only cards
- Smart pagination: project override adds Prev/Next + current±2 window + ellipsis
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
6. All internal cross-links use full path: `/duynguyen/posts/slug/`
7. Always include `categories` in frontmatter
8. Build locally before commit
9. Prevent future dates — run `TZ=Asia/Saigon date` before writing
