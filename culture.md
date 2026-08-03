# Blog Culture & Rules

## Post Date = Thời Gian Đẩy Lên GitHub

**NGHIÊM CẤM đặt ngày tương lai dưới mọi hình thức.**

- `date` trong frontmatter PHẢI TRÙNG KHỚP tuyệt đối với kết quả từ lệnh date, sai 0 giây
- Chạy `TZ=Asia/Saigon date +"%Y-%m-%dT%H:%M:%S+07:00"` NGAY trước khi ghi `date` vào frontmatter — dùng chính xác kết quả đó, không tự ý sửa đổi
- Hugo mặc định ẩn bài có `date` ở tương lai. Sai số dù chỉ 1 giây cũng làm bài biến mất
- **Tuyệt đối không tự suy luận, không ước lượng, không đặt bừa, không cho phép sai số.**
- Vi phạm = lỗi nghiêm trọng

## Content Integrity — NO FABRICATION

**Every factual claim in every post MUST be traceable to evidence. Never guess, infer, or fabricate any detail.** The full pre-publish process is in [`docs/editorial-checklist.md`](docs/editorial-checklist.md); it is a human editorial gate, not a Hugo build/deploy gate.

Rules:
1. **Source-bound assignments stay source-bound.** If the user supplies a Wikipedia URL or raw text as the source, every factual claim must be extracted from that source. Do not add outside facts, inference, personal experiences or unverified commentary.
2. **Translate faithfully.** From English Wikipedia → Vietnamese. Preserve the source's meaning; do not turn it into a review, test, interview or first-hand report.
3. **Label the article honestly.** A source-bound article is a *tổng hợp có nguồn*. A review/travel/product experience needs a real first-hand experience, a stated method and evidence; it must never be simulated.
4. **Use appropriate sources for changing facts.** Prices, opening hours, product specifications, release dates, rankings and current events require a primary/official source and a date checked. Wikipedia is not sufficient on its own for those claims.
5. **If raw text is provided by user** — use only that text unless the user explicitly authorizes additional sources.
6. **When in doubt, omit.** A shorter truthful post beats a long fabricated one.

Penalty: any fabricated content undermines blog credibility. Always err on the side of saying nothing vs. saying something unverified.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| SSG | Hugo (Extended), v0.163.1+ |
| Theme | LoveIt (git submodule) |
| Hosting | GitHub Pages |
| CI/CD | GitHub Actions (`.github/workflows/hugo-deploy.yml`) |
| Search | Fuse.js (client-side, self-hosted) |
| CSS | SCSS via Hugo pipe |
| Font | System font stack (Segoe UI, Roboto, Notas Sans, sans-serif) |
| Icons | Font Awesome (free) |
| Lazy load | Native `loading="lazy"` (no lazysizes) |
| Lightbox | REMOVED (opens in new tab) |
| Image processing | Hugo `.Fit` (1600x1200 max) |

## Config

- **BaseURL**: `https://seomoney.org/`
- **Remote**: `https://github.com/duynguyen9988/duynguyen.git` (push qua HTTPS token) — remote cũ (`banhangchogao`) đã bị xóa, không bao giờ dùng lại. Chỉ làm việc giữa local repo và remote duynguyen9988/duynguyen này.
- **Branch**: `main` (auto-deploy via GH Actions)
- **Color scheme**: White background, slate gray text, blue accent `#2563EB` family (Elton-style)
- **Navbar**: White, `box-shadow`, fixed top; brand logo + name (left), search pill (center), GitHub link (right, desktop only)
- **Font stack**: `'Segoe UI', Roboto, 'Noto Sans', system-ui, sans-serif`

## Navigation

- 3 nav links (Bài viết, Giới thiệu, Sitemap) are in the **footer** (horizontal, right side) — NOT in the Navbar
- Menu is read dynamically from `hugo.toml` `[menu]` — never hardcode
- Navbar only has: blog name (left), search pill (center), GitHub link (right)
- Mobile (≤768px): GitHub link hidden; brand name hidden ≤640px

## Version Badge

- Shows `commit id | dd-mm-yyyy hh:mm:ss GMT+7` in Navbar beside blog name (legacy)
- Generated from `git log -1` before each build
- CI step: `mkdir -p data && git log -1 --format='...' > data/version.json`
- Local: same in `tools/deploy/main.go` (`go run ./tools/deploy`)
- File `data/version.json` is in `.gitignore`

## Images

### Thumbnail (auto-detect)
Every post MUST have a homepage thumbnail from its `featured-image.jpg` page resource.
Post cards and random posts sidebar use `.Resources.GetMatch "featured-image"` directly + `img.html` partial for WebP processing.

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
- `width`/`height` attributes from processed image dimensions
- Original image file is preserved (never deleted)
- **ALL images MUST be WebP** — `$res.Fit (printf "%s webp" $fit)` in `img.html`

### Image Sourcing Rules
1. **NO live URLs**: Every image in every post MUST be a local page resource (`featured-image.jpg` or `featured-image.png`) — no `featuredimage` param, no `featuredimagepreview` param, no Unsplash/CDN URLs in frontmatter
2. **WebP only**: Hugo processes local images → WebP output. Do NOT use JPEG, PNG, GIF, or SVG as final output format
3. **Content images** (Markdown `![]()` in body): If sourced from web, download to page bundle, reference by filename only. `render-image.html` passes `$src` → `img.html` → Hugo processes to WebP + width/height
4. **No loading SVG**: No placeholder images, no lazyload wrappers, no `data-src` patterns. All images use direct `src`/`srcset` with `loading="lazy"`

### Lightbox — REMOVED
- Lightbox feature was removed to eliminate JS dependency and CLS risk
- Images open in new tab via `target="_blank"` (native browser behavior)

### Deduplication
- If the featured image is the SAME as the first content image, the featured-image `<div>` is skipped on the single post page to avoid showing the same image twice
- Comparison is done via `.Name` (basename) strings

## Post Card (homepage/section/term grids) — Elton style
- Vertical order: **title → category chips → author+date row → image → summary**
- Title: `1.5rem` (24px) bold; hover turns blue
- Chips: tiny blue pills `#EFF6FF` bg / `#1D4ED8` text, `rounded-full`, hover `#DBEAFE`
- Meta row: 36px round avatar + author name (left), date `DD/MM/YYYY` (right), slate `#64748B`
- Image: `aspect-ratio: 16/10`, `object-fit: cover`, full width, below the meta row
- Summary: 3-line clamp (`-webkit-line-clamp: 3`)
- Grid: 2 columns, `gap: clamp(2rem, 4vw, 4rem)`; 1 column ≤768px
- No card borders/shadows — flat typographic cards separated by whitespace

## Random Posts (sidebar, single page only)
- 5 random posts, shuffled on each build
- Thumbnail: 96×96px square, `aspect-ratio: 1/1`, `object-fit: cover`
- Number overlay `01`–`05`, `font-size: clamp(2.8rem, 7vw, 4.5rem)`
- Title: 3-line clamp
- Sidebar: `minmax(260px, 300px)` right column of `.single-reading-layout`; hidden ≤1180px

## Footer — Elton style
- Background `#E2E8F0` (`bg-slate-200`), flex `space-between`, wrap
- Left: `© <year> Duy Nguyen Blog`; right: 3 main nav links (Bài viết, Giới thiệu, Sitemap), horizontal
- Hover: blue `#2563EB`

## Layout
- Page column: `max-width: 1100px`, centered; nav is `position: fixed` with `box-shadow`
- Homepage: flat 2-column card grid (NO hero, NO sidebar, NO category blocks)
- Section/term pages: same card grid with a bold page title
- Taxonomy (categories) index: flat chip grid with post counts
- Single post: `.single-reading-layout` grid `minmax(0,1fr) + sidebar(260-300px)`; sidebar hidden ≤1180px
- No profile/intro section on homepage

## CSS Override Rules
- Project overrides in `assets/css/_custom.scss` (legacy), `assets/css/_override.scss` (variables) and `assets/css/elton.scss` (design — imported LAST, wins the cascade)
- Template overrides in `layouts/` (mirror theme's `_partials/` structure)
- Header override: `layouts/_partials/header.html` (Elton nav: brand + search pill + GitHub link)
- Head links (favicon): `layouts/_partials/head/link.html`
- Assets override: `layouts/_partials/assets.html`
- Image processing: `layouts/_partials/plugin/img.html`
- Markdown render hook: `layouts/_markup/render-image.html`
- Single post: `layouts/posts/single.html`
- Post card: `layouts/partials/post-card.html`
- Random posts: `layouts/partials/random-posts.html`
- Footer: `layouts/partials/footer.html`
- Search JS: `initSearch()` in `assets/js/theme.js` (Fuse.js, self-hosted)

## Build & Deploy

### Local
```bash
go run ./tools/deploy   # version.json + related.json + hugo --minify
hugo server          # dev server (no version.json, graceful fallback)
```

### CI (GitHub Actions)
`.github/workflows/hugo-deploy.yml`:
1. `actions/checkout@v6` with `submodules: recursive` + `fetch-depth: 0`
2. `actions/setup-go@v6` (go 1.24) — Go toolchain for the ML pipeline
3. Generate version info: `mkdir -p data && git log -1 --format='...' > data/version.json`
4. Generate related posts: `go run ./tools/ml-related`
5. Build: `hugo --minify`
6. Upload + deploy via `actions/upload-pages-artifact@v5` + `actions/deploy-pages@v5`

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
- [x] Review Spider-Man: Brand New Day (2026) không spoiler (2026-08-01)
- [x] Top 10 quán mì Quảng ngon ở Sài Gòn (2026-08-01)
- [x] Cẩm nang du lịch Đà Lạt tự túc 3N2Đ (2026-08-01)
- [x] Thủ tục xin visa Hàn Quốc 5 năm diện thu nhập 8.000 USD (2026-08-01)
- [x] SEO overhaul: title ≤70 + description 90–160 cho 31 bài; internal links inline ~100 bài (script bigram + thủ công); bỏ chặn AhrefsBot/MJ12bot/BLEXBot trong robots.txt; mở rộng 3 bài mỏng bằng Wikipedia (nhà thờ Đức Bà, cơm chiên rau củ, bánh mì nấm tỏi) (2026-08-02)
- [x] Cẩm nang du lịch Nha Trang tự túc 3N2Đ 2026 (2026-08-02)
- [x] Review Xứ Sở Thần Tiên (The Land of Sometimes) 2026 không spoiler (2026-08-02)
- [x] Review Thư Tình Gửi Ngoại (Dear You) 2026 không spoiler — hiện tượng phòng vé TQ 2 tỷ NDT, khởi chiếu VN 7/8 (2026-08-03)
- [x] Blog nhỏ đặt AdSense khi người dùng chặn quảng cáo: còn cơ hội? (2026-08-02)
- [x] Cẩm nang du lịch Hội An tự túc 2N1Đ 2026 (2026-08-02)
- [x] Cẩm nang du lịch Sapa tự túc 3N2Đ 2026 (2026-08-02)
- [x] Lịch nghỉ lễ 2/9/2026: nghỉ 5 ngày liên tục + gợi ý điểm đến du lịch Quốc khánh (2026-08-03)
- [x] Top 10 quán cơm tấm ngon Sài Gòn 2026: địa chỉ, giá, giờ mở (2026-08-03)
- [x] Cách chọn laptop sinh viên 2026: cấu hình theo ngành + ngân sách (2026-08-03)
- [x] Cẩm nang du lịch Vũng Tàu tự túc 2N1Đ 2026 (2026-08-03)
- [x] Top 10 podcast Việt Nam 2026 (2026-08-03)
- [x] Xây dựng thói quen tốt với Atomic Habits (2026-08-03)
- [x] Săn sale 9/9 2026: mẹo shopping Shopee, Lazada, Tiki (2026-08-03)
- [x] Review Ma Xưởng Hòm (Danur: The Last Chapter) 2026 không spoiler (2026-08-03)
- [x] Múa rối nước: lịch sử, nghệ thuật và địa điểm xem ở Hà Nội (2026-08-03)

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

### `pp` — Blog dựa trên chủ đề (tự research)

When user triggers `pp`, execute the following workflow:

1. **Ask** for:
   - Chủ đề (topic) — bắt buộc
   - Tags, category, description (optional — infer từ nội dung nếu không có)
   - Featured image (optional — tự tìm ảnh minh họa phù hợp, ưu tiên Wikipedia Commons)

2. **Research & write**:
   - Tự websearch/research để thu thập thông tin về chủ đề
   - Chỉ dùng nguồn đáng tin cậy (Wikipedia, báo chí chính thống, trang chủ)
   - Viết thành tiếng Việt tự nhiên, phong cách bài báo chuyên sâu (xem Writing Style bên dưới)
   - Cấu trúc: mở bài (lead) → thân bài (phân tích, đào sâu) → kết bài (suy ngẫm)
   - Không bullet-point/liệt kê — lồng ghép thông tin vào văn kể
   - **Không bịa đặt, không suy luận thiếu căn cứ** — mọi dữ kiện phải có nguồn
   - Dẫn nguồn nếu có thể (hyperlink trong bài)

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

### 2026-07-26 — `1271458`
- **What failed**: 9 posts had homepage thumbnails (via `featuredimagepreview`) but showed ZERO images on the single post page — text-only display
- **Root cause**: `featuredimagepreview` only supplies the homepage/card thumbnail. The single post page needs `featuredimage` (frontmatter param) or a `featured-image` page resource to show a hero image. Missing `featuredimage` → no featured image div rendered.
- **Fix**: Added `featuredimage: <unsplash-url>` matching the existing `featuredimagepreview` for all 9 posts. Also added missing `categories` to `mot-goc-nha-tho-duc-ba-saigon`.
- **Prevention**: Every post MUST have both `featuredimagepreview` (homepage thumb) AND one of:
  - `featuredimage` param (same URL, for external images)
  - `featured-image` page resource (for local images)
  Always include `categories` in frontmatter.

### 2026-07-26 — current session
- **What failed**: 6 of 9 Unsplash URLs were fake/AI-invented photo IDs (e.g. `photo-xk2w6brrQNQ`) returning HTTP 404 → broken images on both homepage cards and single post pages
- **Root cause**: AI-generated Unsplash photo IDs (10-char random strings, no timestamp-hex format `{13digit}-{12hex}`) that don't exist on Unsplash's servers. Real Unsplash IDs follow the format `photo-{13-digit-timestamp}-{12-char-hex}` e.g. `photo-1509042239860-f550ce710b93`.
- **Fix**: Replaced all 6 fake IDs with real ones confirmed HTTP 200: coffee (`1509042239860-f550ce710b93`), street food (`1490645935967-10de6ba17061`), productivity (`1484480974693-6ca0a78fb36b`), AI (`1485827404703-89b55fcc595e`), food (`1476124369491-e7addf5db371`), entertainment (`1536440136628-849c177e76a1`)
- **Prevention**: Every image URL in frontmatter MUST be verified with `curl -sI <url> | head -1` to confirm HTTP 200 before commit. Never accept AI-generated photo IDs without checking first. Real Unsplash IDs always have the `{timestamp}-{hex}` format (13 digits + hyphen + 12 hex chars).

## Bộ Từ Khóa Chiến Lược (SEO Research — 2026-08-01)

Blog DA thấp → chỉ nhắm long-tail có intent rõ, cạnh tranh thấp. KHÔNG đánh head term
("review phim", "du lịch Đà Lạt") trực diện với báo lớn — đánh qua biến thể dài hơn.

### 5 cụm từ khóa dễ hứng organic nhất

1. **Review phim mới + năm + góc nhìn** — thắng bằng freshness, phải đăng trong 48h ra mắt:
   `review <tên phim> <năm> không spoiler`, `<tên phim> <năm> có đáng xem không`
2. **Top địa phương + món cụ thể** (Sài Gòn food): `top 10 <món> sài gòn`,
   `quán <món> <quận>`, `cà phê view <địa điểm>`, `<món> <quận> ngon nhất`
3. **Cẩm nang tự túc**: `<địa điểm> tự túc`, `<địa điểm> <N> ngày <N> đêm chi phí`,
   `lịch trình <địa điểm>`, `kinh nghiệm du lịch <địa điểm> <năm>`
4. **So sánh + năm**: `<A> vs <B> <năm>`, `nên mua <A> hay <B>` (iPhone/Samsung, Shopee/Lazada/Tiki)
5. **Evergreen văn hóa/lịch sử**: `<món/loại hình> lịch sử văn hóa` — volume ổn định, cạnh tranh trung bình

### Chuẩn SEO mỗi bài mới (bắt buộc)

- Title ≤ 70 ký tự, keyword ở đầu, có năm/địa điểm khi cần
- Description 100–150 ký tự, chứa keyword chính + CTA
- H2 chứa biến thể keyword; H1 = title
- Nội dung ≥ 800 từ; có info box (thông tin phim/quán) + phần điểm cộng/trừ → bắt featured snippet
- Ít nhất 1 internal link tới bài cùng chủ đề
- Featured image local WebP + alt chứa keyword
- Ngày đăng = ngày push (quy tắc hiện hành)
