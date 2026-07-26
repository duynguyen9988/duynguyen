# Blog Culture & Rules

## Content Integrity — NO FABRICATION

**Every factual claim in every post MUST be verifiable from an authoritative source.** Never guess, infer, or fabricate dates, showtimes, pricing, names, or figures.

Rules:
1. **Release dates, showtimes, pricing** — only cite if confirmed on an official page (CGV, BHD, Lotte, Wikipedia, studio press release). If the official page shows empty/loading, do NOT write anything.
2. **Quotes, reviews, ratings** — must be traceable to a named publication or critic. Never invent a quote.
3. **Statistics (budget, box office, runtime)** — only from Wikipedia or reputable trades (Variety, Deadline, THR). Cite the source inline.
4. **Local availability (lịch chiếu, rạp, giá vé)** — if you can't confirm on the official cinema chain website, don't write it. Full stop.
5. **When in doubt, omit.** A shorter truthful post beats a long fabricated one.
6. **Attribution:** link to the source URL for any factual claim (e.g., Wikipedia, CGV, official trailer). If you can't link it, don't claim it.

Penalty: any fabricated content undermines blog credibility. Always err on the side of saying nothing vs. saying something unverified.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| SSG | Hugo (Extended), v0.163.1+ |
| Theme | LoveIt (git submodule) |
| Hosting | GitHub Pages |
| CI/CD | GitHub Actions (`.github/workflows/hugo-deploy.yml`) |
| Search | Fuse.js (client-side) |
| CSS | SCSS via Hugo pipe |
| Font | System font stack (Segoe UI, Roboto, Notas Sans, sans-serif) |
| Icons | Font Awesome (free) |
| Lazy load | Lazysizes |
| Lightbox | Custom Vanilla JS (3.5KB, no deps) |
| Image processing | Hugo `.Fit` (1600x1200 max) |

## Config

- **BaseURL**: `https://duynguyen9988.github.io/duynguyen/`
- **Remote**: `git@github.com:duynguyen9988/duynguyen.git` (push via HTTPS token)
- **Branch**: `main` (auto-deploy via GH Actions)
- **Color scheme**: Primary pink `#FF2FA0`, accent blue `#2563EB`
- **Navbar**: Blue tint `rgba(37,99,235,0.7)` light / `0.78` dark, `backdrop-filter:blur(10px)`, white text/icons
- **Font stack**: `'Segoe UI', Roboto, 'Noto Sans', system-ui, sans-serif`

## Navigation

- 5 nav links (Bài viết, Thẻ, Chuyên mục, Giới thiệu, Sitemap) are in **Footer section #3** — NOT in the Navbar
- Menu is read dynamically from `hugo.toml` `[menu]` — never hardcode
- Navbar only has: blog name (left), search + dark-mode toggle (right)
- The right side of Navbar is intentionally empty for future features

## Version Badge

- Shows `commit id | dd-mm-yyyy hh:mm:ss GMT+7` in Navbar beside blog name
- Generated from `git log -1` before each build
- CI step: `mkdir -p data && git log -1 --format='...' > data/version.json`
- Local: same in `deploy.py`
- File `data/version.json` is in `.gitignore`

## Images

### Thumbnail (auto-detect)
Every post MUST have a homepage thumbnail. Detection order:
1. `featuredimagepreview` / `featuredimage` front matter param
2. `featured-image` or `featured-image-preview` page resource
3. First `![]()` Markdown image in content
4. First `<img>` in rendered HTML content

Implementation: `layouts/_partials/function/first-image.html`

### Content Images (no crop, no scroll, full visibility)
- `object-fit: contain` — never crop, never `object-fit: cover`
- `max-width: 100%; width: auto; height: auto` — natural proportions
- `max-height: 900px` desktop, `80vh` (≤992px), `70svh` (≤768px) — always fully visible
- `overflow: visible` — never hidden
- `display: block; margin-inline: auto` — centered
- `border-radius: 0` — no rounded corners on content images
- Dark mode: `opacity: 0.95`

### Image Processing (Hugo)
- All images processed with `Fit "1600x1200"` — downscales only, no upscale
- Responsive srcset generated: 800x600, 1600x1200 (1.5x), 2400x1800 (2x)
- `loading="lazy" decoding="async"` on all `<img>` tags
- `width`/`height` attributes from processed image dimensions (only when available)
- Original image file is preserved (never deleted)

### Lightbox
- Every content image wraps in `<a href="original" target="_blank" rel="noopener" data-lightbox="original">`
- Click opens custom Vanilla JS lightbox (file: `assets/js/lightbox.js`)
- Close: × button, Esc key, click outside backdrop, Tab trap, mobile touch
- Lightbox image: `max-width: 96vw; max-height: 94vh; object-fit: contain`
- Background: `rgba(0,0,0,0.92)`
- `cursor: zoom-in` on content images, `cursor: zoom-out` on lightbox backdrop
- Graceful fallback: no JS → `target="_blank"` opens image in new tab
- Featured image on single page follows same rules

### Deduplication
- If the featured image is the SAME as the first content image, the featured-image `<div>` is skipped on the single post page to avoid showing the same image twice
- Comparison is done via resolved `RelPermalink` strings
- The first content image still gets the lightbox treatment in the content

## Post Card (homepage list)
- Flex: thumbnail 40% / content 60%
- Thumbnail: `aspect-ratio: 16/10`, `object-fit: cover`, `border-radius: 4px`
- Text-only fallback when no image exists
- Title: 2-line clamp
- Summary: 3-line clamp

## Random Posts (sidebar)
- 5 random posts, shuffled on each build
- Thumbnail: 96×96px square, `aspect-ratio: 1/1`, `object-fit: cover`
- Number overlay `01`–`05`, `font-size: clamp(2.8rem, 7vw, 4.5rem)`
- Title: 3-line clamp
- Sidebar width: `340px` (flex) / `minmax(400px, 480px)` (grid ≥1200px)

## Footer
- 3-column grid: Section #1 (empty), #2 (empty), #3 (navigation links)
- Nav links: column on desktop, horizontal flex-wrap on mobile (≤680px)
- `gap: 0.5rem` desktop, `0.75rem 1.25rem` mobile
- Hover/focus-visible: pink color with outline

## Layout
- Container: `width: calc(100% - 48px); max-width: 1500px`
- Desktop (≥1200px): CSS Grid `minmax(0, 1fr) minmax(400px, 480px)`
- Tablet: flex layout, sidebar `340px`
- Mobile (≤900px): single column, sidebar full width
- No profile/intro section on homepage

## CSS Override Rules
- Project overrides in `assets/css/_custom.scss` and `assets/css/_override.scss`
- Template overrides in `layouts/` (mirror theme's `_partials/` structure)
- Header override: `layouts/_partials/header.html`
- Assets override: `layouts/_partials/assets.html`
- Image processing: `layouts/_partials/plugin/img.html`
- Markdown render hook: `layouts/_markup/render-image.html`
- Single post: `layouts/posts/single.html`
- Post card: `layouts/partials/post-card.html`
- Random posts: `layouts/partials/random-posts.html`
- Footer: `layouts/partials/footer.html`

## Build & Deploy

### Local
```bash
python3 deploy.py   # generates data/version.json then runs hugo --minify
hugo server          # dev server (no version.json, graceful fallback)
```

### CI (GitHub Actions)
`.github/workflows/hugo-deploy.yml`:
1. `actions/checkout@v4` with `fetch-depth: 0` and `submodules: recursive`
2. Generate version info: `mkdir -p data && git log -1 --format='...' > data/version.json`
3. Build: `hugo --minify`
4. Upload + deploy via `actions/deploy-pages@v4`

### Push
```bash
git push https://<user>:<token>@github.com/duynguyen9988/duynguyen.git main
```

## Known Issues & Fixes

### CI: `data/version.json: No such file or directory`
- **Cause**: The `data/` directory doesn't exist in the CI runner's working tree
- **Fix**: Always run `mkdir -p data` before writing version.json
- **Lesson**: GitHub Actions checks out only tracked files. Auto-generated directories must be created explicitly.

### Hugo SCSS: `Incompatible units: 'px' and 'vh'`
- **Cause**: Hugo's embedded LibSass compiler can't evaluate CSS `min(75vh, 900px)`
- **Fix**: Use separate properties per breakpoint instead of `min()`:
  ```scss
  max-height: 900px;      // desktop
  @media (max-width: 992px) { max-height: 80vh; }
  @media (max-width: 768px) { max-height: 70svh; }
  ```

### Hugo API deprecation: `.Site.Data` → `hugo.Data`
- **Cause**: `.Site.Data` deprecated in Hugo v0.156.0
- **Fix**: Use `hugo.Data.version` instead of `.Site.Data.version`
- Same for `.Site.LanguageCode` → `.Site.Language.Locale`

## Post Sort Order

All listing pages (homepage, section, taxonomy) display posts newest-first via `.ByDate.Reverse` in the respective templates:
- `layouts/home.html` — homepage
- `themes/LoveIt/layouts/section.html` — `/posts/` section
- `themes/LoveIt/layouts/term.html` — tag/category pages

## Post Ideas

Track generated blog posts here:

- [x] Top 10 quán chay ngon ở Sài Gòn TP HCM năm 2026 (2026-07-26)
- [x] Cập nhật GitHub Actions 2026 (2026-07-26)
- [x] Tổng quan tài liệu Hugo (2026-07-26)
- [x] Thời Khắc Công Bố / Disclosure Day (2026-07-26)
- [x] Delete /bai-viet-dau-tien/ (hello world) (2026-07-26)

## Shortcuts

### `gg` — Generate blog post

When user triggers `gg`, execute the following workflow:

1. **Ask** for:
   - Title (required)
   - Frontmatter fields: `tags`, `description`, `date` (default today), `resources` (featured image if any)
   - **Content source**: URL to fetch from (e.g. Wikipedia) **or** raw text to use as source material

2. **Write** a complete Hugo blog post with:
   - Minimum **2000 words** in main content
   - Proper Markdown formatting (headings, paragraphs, lists, images with `![]()` syntax)
   - Featured image if provided (download and add as page resource with `resources` front matter)
   - Lightbox-compatible images (use Markdown `![]()` syntax — the render hook handles the rest)
   - Vietnamese language
   - Front matter matches Hugo conventions

3. **Create** the post at `content/posts/<slug>/index.md` and save any featured image as `featured-image.jpg` in the same directory.

4. **Build** (`hugo --minify`) to verify no errors.

5. **Commit + push** automatically.

### Category creation workflow

When user says "tạo category mới: <tên>":

1. Create `content/categories/<slug>/_index.md` with:
   - Human-readable `title`
   - SEO-optimized `description` (1 câu, ngắn gọn, có keyword)
2. Create a companion blog post with that category — ask user for title + content source, or auto-generate if not specified
3. Build, commit, push — all tự động, không đợi nhắc

## Delete Post — SEO Rules

When deleting a post:

1. Add `aliases` to the replacement post's front matter pointing to the old URL → Hugo generates 301 redirect pages
   ```yaml
   aliases:
     - /old-url/
   ```
2. Delete the old post file from `content/`
3. Verify the alias page renders correctly (check `public/<old-url>/index.html`)
4. Build, commit, push

## Learning Log

Whenever a PR/CI fails and is fixed successfully, append a new entry here with:
- Date and commit
- What failed
- Root cause
- How it was fixed
- How to prevent in future

### 2026-07-26 — `a53e398` → `0ce1b8b`
- **What failed**: CI step `git log ... > data/version.json` → `data/version.json: No such file or directory`
- **Root cause**: The `data/` directory is in `.gitignore` and doesn't exist in the CI runner's working tree. GitHub Actions only has tracked files checked out.
- **Fix**: Added `mkdir -p data &&` before the git log command in `.github/workflows/hugo-deploy.yml`
- **Prevention**: Any step that writes to an auto-generated directory must create it first. CI runners don't have untracked/ignored directories.
