# Blog Culture & Rules

## Post Date = Current Time Only

**Post date MUST be the real current time.** Never set a future time manually.

- Run `TZ=Asia/Saigon date +"%Y-%m-%dT%H:%M:%S+07:00"` to get the correct timestamp
- Hugo hides future-dated posts by default — using a future date = post disappears until that time arrives
- No exceptions: always use `now`, never guess "this will be a 10AM post"

## Content Integrity — NO FABRICATION

**Every factual claim in every post MUST come from the user-provided Wikipedia source.** Never guess, infer, or fabricate any detail.

Rules:
1. **Only Wikipedia content.** If the source is a Wikipedia URL, every fact in the post must be extracted from that page. No outside knowledge, no inference, no fabrication.
2. **Translate faithfully.** From English Wikipedia → Vietnamese. Preserve all facts. Do not add editorial opinion, commentary, or unverified claims.
3. **No unauthoritative sources.** Do NOT cite other websites, reviews, or unofficial sources unless they are part of the Wikipedia article text.
4. **If raw text provided by user** — use only that text. Do not supplement with your own knowledge.
5. **When in doubt, omit.** A shorter truthful post beats a long fabricated one.

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
- `layouts/section.html` — `/posts/` section (overrides theme)
- `layouts/term.html` — tag/category pages (overrides theme)

**Never edit theme files directly.** Copy the template to `layouts/` for override — Hugo's lookup order prioritizes project `layouts/` over theme `layouts/`. This avoids forking/customizing the theme submodule.

## Writing Style — Viết như bài báo chuyên sâu

**Không viết kiểu liệt kê AI.** Mỗi bài blog phải được viết như một bài báo chuyên sâu (long-form journalism):

1. **Mở bài có narrative** — mở đầu bằng một câu chuyện, một góc nhìn, hoặc một câu hỏi gây tò mò, không phải "dưới đây là danh sách".
2. **Không bullet-point/lister** — hạn chế tối đa dạng "1. 2. 3." hay gạch đầu dòng liệt kê khô khan. Thông tin được lồng ghép vào đoạn văn.
3. **Có chính kiến và góc nhìn** — không chỉ là tổng hợp dữ liệu, mà có quan điểm, cảm nhận, so sánh.
4. **Chất văn** — câu văn có nhịp điệu, biết lúc dài lúc ngắn. Dùng từ ngữ gợi hình, tránh sáo rỗng.
5. **Cấu trúc bài báo** — mở bài (lead), thân bài (phân tích, đào sâu), kết bài (suy ngẫm).
6. **Nghiên cứu kỹ** — với danh sách địa điểm, mỗi mục phải có thông tin thực tế (địa chỉ, giờ, giá, review trích dẫn) — không viết chung chung.
7. **Người thật việc thật** — dẫn link/trích dẫn review thật nếu có.

Ví dụ: thay vì "Quán A có cafe ngon" → "Ngồi ở quán A vào một chiều cuối tuần, ly cafe đến mà tôi còn chưa kịp mở laptop..."

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
   - Content source: **Wikipedia URL** (en or vi) **or** raw text user pastes. **NO other URLs allowed.**
   - Tags, category, description (optional — infer from content if not given)
   - Featured image: use the Wikipedia infobox image (download as `featured-image.jpg`)

2. **Process content:**
   - If Wikipedia URL → fetch the page markdown via webfetch
   - If raw text → use directly
   - Translate English Wikipedia content to Vietnamese (natural, readable, không dịch word-by-word)
   - Preserve factual accuracy — do NOT add, infer, or fabricate any detail not in the source
   - Reorganize into logical sections (headings, paragraphs, lists) phù hợp blog

3. **Write** Hugo blog post:
   - No minimum word count — write enough to cover the source faithfully
   - Proper Markdown formatting
   - Featured image from Wikipedia (page resource at `featured-image.jpg`)
   - Vietnamese language
   - Front matter matches Hugo conventions
   - **NO fabricated claims.** Every fact must be traceable to the Wikipedia source.

4. **Create** the post at `content/posts/<slug>/index.md` with featured image.

5. **Build** (`hugo --minify`) to verify no errors.

6. **Commit + push** automatically.

### `bb` — Blog bài báo (tường thuật)

When user triggers `bb`, execute the following workflow:

1. **Ask** for:
   - Raw text hoặc URL gốc làm nguồn
   - Tags, category, description (optional — infer from content if not given)
   - Featured image (optional — skip nếu không có sẵn)

2. **Write** Hugo blog post:
   - Dạng tường thuật (narrative), giữ nguyên tinh thần bản gốc
   - Viết thành tiếng Việt tự nhiên, không dịch word-by-word
   - Cấu trúc bài báo: mở bài (lead) → thân bài → kết bài (suy ngẫm)
   - Không bullet-point/liệt kê — lồng ghép thông tin vào văn kể

3. **Create** the post at `content/posts/<slug>/index.md`. Featured image nếu có.

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
