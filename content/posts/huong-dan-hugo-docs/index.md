---
title: 'Tổng quan tài liệu Hugo: Từ Quick Start đến nâng cao'
date: 2026-07-26T09:19:00+07:00
draft: false
description: 'Khám phá toàn bộ tài liệu Hugo mới nhất 2026: hướng dẫn cài đặt, quản lý nội dung, templates, shortcodes, image processing, multilingual và nhiều hơn nữa.'
tags:
  - hugo
  - tutorial
  - documentation
categories:
  - Lập trình
resources:
  - name: featured-image
    src: featured-image.jpg
aliases:
  - /huong-dan-hugo/
---

Hugo là một trong những static site generator nhanh nhất và linh hoạt nhất hiện nay, được viết bằng Go và phát triển bởi cộng đồng mã nguồn mở dưới sự dẫn dắt của Bjørn Erik Pedersen (bepsays) và Steve Francia (spf13). Với hơn 89.000 sao trên GitHub, Hugo đã trở thành lựa chọn hàng đầu cho hàng triệu trang web trên toàn thế giới, từ blog cá nhân đến trang web doanh nghiệp, tài liệu sản phẩm và cổng thông tin điện tử. Bài viết này sẽ tổng quan toàn bộ tài liệu Hugo mới nhất tính đến năm 2026, giúp bạn có cái nhìn toàn diện về framework mạnh mẽ này.

## Giới thiệu về Hugo

Hugo là một framework tạo website tĩnh được viết bằng Go, nổi tiếng với tốc độ xây dựng cực nhanh. Không giống như các SSG khác như Jekyll được viết bằng Ruby hay Gatsby được viết bằng JavaScript, Hugo biên dịch toàn bộ website chỉ trong vài mili giây nhờ cơ chế đa luồng và bộ nhớ đệm thông minh. Hugo hiện đang ở phiên bản 0.164.0 tính đến tháng 7 năm 2026 và liên tục được cập nhật với nhiều tính năng mới qua mỗi phiên bản.

Một trong những điểm mạnh nhất của Hugo là khả năng xử lý hàng nghìn trang chỉ trong vài giây, trong khi các SSG khác có thể mất vài phút hoặc thậm chí hàng chục phút cho cùng một khối lượng công việc. Điều này đặc biệt quan trọng đối với các website lớn có hàng nghìn bài viết, nơi thời gian build có thể ảnh hưởng trực tiếp đến quy trình phát triển và triển khai.

Một số đặc điểm nổi bật của Hugo bao gồm:

- **Tốc độ build siêu nhanh**: hàng ngàn trang được render trong vài giây nhờ cơ chế đa luồng và bộ nhớ đệm thông minh. Hugo chỉ rebuild những trang có thay đổi, giúp tiết kiệm thời gian phát triển đáng kể.
- **Hỗ trợ đa ngôn ngữ**: xây dựng website đa ngôn ngữ với cấu hình single-host hoặc multihost, hỗ trợ dịch nội dung và giao diện một cách linh hoạt.
- **Quản lý nội dung linh hoạt**: hỗ trợ Markdown, HTML, AsciiDoc, Pandoc, reStructuredText và Emacs Org Mode, cho phép bạn chọn định dạng phù hợp nhất với nhu cầu.
- **Hệ thống template mạnh mẽ**: sử dụng ngôn ngữ template Go với đầy đủ hàm và phương thức, bao gồm các block template, partials, shortcodes và render hooks.
- **Hugo Pipes**: xử lý assets như SCSS, JavaScript, images ngay trong quá trình build mà không cần công cụ bên ngoài như Webpack hay Gulp.
- **Image Processing**: tự động resize, crop, xoay ảnh với các tham số linh hoạt, hỗ trợ định dạng WebP và AVIF.
- **Modules**: quản lý theme và dependency giống như Go modules, hỗ trợ import từ Git, Gitea và GitLab.

## Cài đặt Hugo

Hugo có thể cài đặt trên nhiều nền tảng khác nhau:

### macOS
```bash
brew install hugo
```

### Linux (Homebrew)
```bash
brew install hugo
```

### Windows (Chocolatey)
```bash
choco install hugo-extended
```

### Binary trực tiếp
Tải binary từ [GitHub Releases](https://github.com/gohugoio/hugo/releases) và thêm vào PATH.

Có hai phiên bản Hugo:
- **Hugo Extended**: hỗ trợ biên dịch SCSS/Sass qua Hugo Pipes (khuyên dùng)
- **Hugo Standard**: phiên bản gọn nhẹ, không hỗ trợ SCSS

## Quick Start

Sau khi cài đặt, bạn có thể tạo project Hugo đầu tiên chỉ với vài dòng lệnh:

```bash
hugo new project quickstart
cd quickstart
git init
git submodule add https://github.com/theNewDynamic/gohugo-theme-ananke themes/ananke
echo "theme = 'ananke'" >> hugo.toml
hugo server
```

Sau đó truy cập URL hiển thị trong terminal để xem website của bạn. Lệnh `hugo new project` tạo ra cấu trúc thư mục chuẩn của Hugo bao gồm:

- `content/`: chứa nội dung website
- `layouts/`: chứa template tùy chỉnh
- `assets/`: chứa các assets cần xử lý (SCSS, JS, images)
- `static/`: chứa file tĩnh (copy thẳng vào output)
- `themes/`: chứa theme (dưới dạng git submodule)
- `hugo.toml`: file cấu hình chính

## Cấu trúc thư mục

Hugo sử dụng cấu trúc thư mục có tổ chức để quản lý nội dung:

```
content/
├── posts/
│   ├── bai-viet-dau-tien.md
│   └── huong-dan-hugo.md
├── about.md
└── categories/
    ├── am-thuc/
    │   └── _index.md
    └── lap-trinh/
        └── _index.md
```

Mỗi thư mục trong `content/` tương ứng với một section trong website. Hugo tự động tạo URL dựa trên cấu trúc thư mục, giúp việc tổ chức nội dung trở nên trực quan và dễ quản lý.

## Quản lý nội dung

Hugo cung cấp nhiều công cụ mạnh mẽ để quản lý nội dung website:

### Front Matter
Front Matter là metadata của trang, được viết ở đầu file nội dung trong cặp `---` hoặc `+++`:

```yaml
---
title: 'Bài viết của tôi'
date: 2026-07-26T10:00:00+07:00
draft: false
description: 'Mô tả SEO của bài viết'
tags:
  - hugo
  - tutorial
categories:
  - Lập trình
---
```

Hugo hỗ trợ nhiều định dạng front matter: TOML, YAML, JSON. Ngoài các trường mặc định, bạn có thể định nghĩa các trường tùy chỉnh trong front matter và sử dụng chúng trong template thông qua `.Params`. Ví dụ, bạn có thể thêm trường `featuredimage` để chỉ định ảnh đại diện cho bài viết, hoặc trường `weight` để kiểm soát thứ tự hiển thị.

### Page Bundles
Hugo hỗ trợ hai loại page bundles:
- **Leaf bundle**: thư mục chứa `index.md` và các resource đi kèm (ảnh, file PDF, v.v.)
- **Branch bundle**: thư mục chứa `_index.md` cho các section, có thể chứa resource dùng chung

Page bundles cho phép bạn tổ chức nội dung và resource một cách logic, giúp dễ dàng quản lý ảnh, file đính kèm cho từng bài viết mà không cần phải đặt tất cả vào thư mục `static/`. Khi sử dụng page bundle, ảnh được đặt cùng thư mục với file nội dung và Hugo tự động xử lý đường dẫn.

### Archetypes
Archetypes là template cho nội dung mới. Khi bạn chạy `hugo new content posts/my-post.md`, Hugo sử dụng archetype để tạo file với front matter mẫu:

```bash
hugo new content posts/my-post.md
```

Bạn có thể tạo archetype tùy chỉnh trong thư mục `archetypes/`:

```yaml
---
title: '{{ replace .File.ContentBaseName "-" " " | title }}'
date: {{ .Date }}
draft: true
description: ''
tags: []
categories: []
---
```

Archetypes hỗ trợ đa ngôn ngữ và có thể được phân loại theo section, giúp tiết kiệm thời gian khi tạo nội dung mới.

### Taxonomies
Hugo hỗ trợ taxonomy mặc định là categories và tags, nhưng bạn có thể tạo taxonomy tùy chỉnh như `series`, `authors`, `genres` v.v. Taxonomy giúp phân loại và nhóm nội dung, tạo ra các trang tổng hợp tự động. Khi bạn gán taxonomy cho một trang, Hugo tự động tạo trang danh sách cho taxonomy đó.

Cấu hình taxonomy tùy chỉnh trong `hugo.toml`:

```toml
[taxonomies]
  category = "categories"
  tag = "tags"
  series = "series"
```

### Shortcodes
Shortcodes là các macro đơn giản giúp chèn nội dung động vào bài viết mà không cần viết template phức tạp:

```markdown
{{</* figure src="image.jpg" title="Chú thích ảnh" */>}}
{{</* youtube dQw4w9WgXcQ */>}}
{{</* gist spf13 7896402 */>}}
{{</* tweet 123456789 */>}}
```

Bạn cũng có thể tạo shortcodes tùy chỉnh bằng template HTML trong thư mục `layouts/shortcodes/`. Shortcodes hỗ trợ tham số vị trí và tham số named, cùng với nội dung inline.

### Content Adapters
Từ phiên bản Hugo 0.157.0, Hugo giới thiệu Content Adapters cho phép tạo nội dung động khi build. Đây là tính năng mạnh mẽ cho phép bạn tạo trang từ nguồn dữ liệu bên ngoài (API, CSV, JSON) mà không cần file nội dung vật lý.

### Diagrams và Mathematics
Hugo hỗ trợ vẽ diagram thông qua fenced code blocks và render hooks. Bạn có thể sử dụng Mermaid, GoAT, hoặc các thư viện diagram khác. Ngoài ra, Hugo cũng hỗ trợ toán học thông qua LaTeX markup, với nhiều engine khác nhau như KaTeX và MathJax.

## Templates và Layouts

Hugo sử dụng hệ thống template Go với cú pháp `{{ }}`. Hệ thống template của Hugo rất linh hoạt với lookup order thông minh, cho phép project override theme template một cách dễ dàng:

1. Layout từ project (`layouts/`) — ưu tiên cao nhất
2. Layout từ theme (`themes/<theme>/layouts/`) — fallback
3. Layout mặc định của Hugo — fallback cuối cùng

### Các loại template chính:

```go-html-template
{{- define "main" -}}
<main>
  <h1>{{ .Title }}</h1>
  <div class="content">
    {{ .Content }}
  </div>
</main>
{{- end -}}
```

Hugo hỗ trợ nhiều loại template khác nhau:
- **Single page templates**: render một trang cụ thể (ví dụ `_default/single.html`)
- **List page templates**: render danh sách trang (ví dụ `_default/list.html`)
- **Homepage template**: render trang chủ
- **Section templates**: render section (ví dụ `posts/`)
- **Taxonomy templates**: render taxonomy (categories, tags)
- **Partial templates**: template tái sử dụng với `partial` và `partialCached`

### Các hàm và biến template quan trọng

Hugo cung cấp hàng trăm hàm và biến trong template:

```go-html-template
{{- /* Biến trang */ -}}
{{ .Title }}       {{- /* Tiêu đề */ -}}
{{ .Content }}     {{- /* Nội dung render */ -}}
{{ .Date }}        {{- /* Ngày xuất bản */ -}}
{{ .Params.tags }} {{- /* Front matter tùy chỉnh */ -}}

{{- /* Biến site */ -}}
{{ .Site.Title }}      {{- /* Tên site */ -}}
{{ .Site.RegularPages }} {{- /* Tất cả trang */ -}}
{{ hugo.Data.version }} {{- /* Dữ liệu từ data/ */ -}}

{{- /* Hàm xử lý */ -}}
{{ .Pages.ByDate.Reverse }}  {{- /* Sắp xếp theo ngày */ -}}
{{ where .Pages "Section" "posts" }} {{- /* Lọc theo section */ -}}
{{ .Content | truncate 200 }}        {{- /* Cắt ngắn nội dung */ -}}
```

### Render Hooks
Render hooks cho phép override cách Markdown được render thành HTML. Đây là tính năng cực kỳ mạnh mẽ cho phép bạn kiểm soát hoàn toàn output HTML:

**Hooks cho image** (`layouts/_markup/render-image.html`):
```go-html-template
<figure>
  <img src="{{ .Destination }}" alt="{{ .Text }}" loading="lazy">
  {{- with .Title -}}
  <figcaption>{{ . }}</figcaption>
  {{- end -}}
</figure>
```

**Hooks cho link** (`layouts/_markup/render-link.html`):
```go-html-template
<a href="{{ .Destination }}"{{ with .Title }} title="{{ . }}"{{ end }}>
  {{ .Text | safeHTML }}
</a>
```

**Hooks cho code block** (`layouts/_markup/render-codeblock.html`): cho phép tùy chỉnh syntax highlighting, thêm nút copy, hoặc tích hợp với các thư viện diagram như Mermaid.

### Partial Caching
Hugo cho phép cache partial template để tối ưu hiệu suất:

```go-html-template
{{ partialCached "sidebar.html" . "sidebar" }}
```

Partial caching đặc biệt hữu ích cho các thành phần không thay đổi giữa các trang như header, footer, sidebar. Bạn có thể dùng thêm khóa variant để cache nhiều phiên bản khác nhau.

## Hugo Pipes

Hugo Pipes là một trong những tính năng mạnh mẽ nhất của Hugo, cho phép xử lý assets ngay trong quá trình build mà không cần công cụ bên ngoài như Gulp, Webpack hay Vite. Hugo Pipes sử dụng Go native để xử lý, vừa nhanh vừa không phụ thuộc vào Node.js.

### SCSS/Sass
```go-html-template
{{ $style := resources.Get "scss/main.scss" | resources.ToCSS | resources.Minify }}
<link rel="stylesheet" href="{{ $style.RelPermalink }}">
```

Bạn có thể cấu hình output style (nested, expanded, compact, compressed) và include path:

```go-html-template
{{ $opts := dict "outputStyle" "compressed" "includePaths" (slice "node_modules") }}
{{ $style := resources.Get "scss/main.scss" | resources.ToCSS $opts | resources.Minify }}
```

### JavaScript
```go-html-template
{{ $js := resources.Get "js/main.js" | resources.Minify | resources.Fingerprint }}
<script src="{{ $js.RelPermalink }}" integrity="{{ $js.Data.Integrity }}"></script>
```

Hugo hỗ trợ:
- **Minify**: nén JavaScript và CSS
- **Fingerprint**: tạo hash cho cache busting
- **Concat**: gộp nhiều file thành một
- **PostCSS**: xử lý với PostCSS plugins
- **Babel**: transpile ES6+ xuống ES5

### Image Processing
Hugo có hệ thống xử lý ảnh mạnh mẽ tích hợp sẵn, hỗ trợ các định dạng JPEG, PNG, GIF, TIFF, WebP và AVIF:

```go-html-template
{{ $image := .Resources.Get "photo.jpg" }}

{{- /* Fit: resize giữ tỷ lệ, vừa khít khung */ -}}
{{ $fit := $image.Fit "800x600" }}

{{- /* Fill: crop để vừa khít khung */ -}}
{{ $fill := $image.Fill "800x600 center" }}

{{- /* Resize: thay đổi kích thước, giữ tỷ lệ */ -}}
{{ $resize := $image.Resize "800x" }}

{{- /* Crop: cắt ảnh theo vùng */ -}}
{{ $crop := $image.Crop "800x600 top" }}

<img src="{{ $resize.RelPermalink }}" width="{{ $resize.Width }}" height="{{ $resize.Height }}">
```

Các tùy chọn xử lý ảnh bao gồm:
- Chất lượng: `q85` (JPEG/WebP quality)
- Định dạng: `webp`, `avif` (chuyển đổi định dạng)
- Góc xoay: `r90` (rotate)
- Màu nền: `#ffffff` (cho ảnh trong suốt)
- Anchor: `Smart`, `Center`, `TopLeft`, `Top`, `TopRight`, `Left`, `Right`, `BottomLeft`, `Bottom`, `BottomRight`
- Filter: `Gaussian`, `Lanczos`, v.v.

### Asset Bundling
```go-html-template
{{ $libs := resources.Get "js/lib1.js" | resources.Minify }}
{{ $app := resources.Get "js/app.js" | resources.Minify }}
{{ $bundle := slice $libs $app | resources.Concat "js/bundle.js" }}
```

### PostCSS
```go-html-template
{{ $css := resources.Get "css/main.css" | resources.PostCSS | resources.Minify }}
```

Hugo tự động tìm và sử dụng file `postcss.config.js` trong thư mục project.

## Hỗ trợ đa ngôn ngữ

Hugo có hệ thống đa ngôn ngữ mạnh mẽ, hỗ trợ:

- **Single-host**: tất cả ngôn ngữ trên cùng một domain
- **Multihost**: mỗi ngôn ngữ một domain riêng
- **Translation**: dịch nội dung và giao diện
- **i18n**: quản lý chuỗi đa ngôn ngữ

Cấu hình đa ngôn ngữ trong `hugo.toml`:

```toml
[languages]
  [languages.vi]
    locale = 'vi'
    languageName = 'Tiếng Việt'
    weight = 1
  [languages.en]
    locale = 'en'
    languageName = 'English'
    weight = 2
```

## Configuration

Hugo sử dụng file cấu hình `hugo.toml` (hoặc `hugo.yaml`, `hugo.json`) để quản lý toàn bộ thiết lập website:

```toml
baseURL = 'https://example.org/'
locale = 'vi'
title = 'Website của tôi'
theme = 'mytheme'

[params]
  description = 'Mô tả website'
  dateformat = '2006-01-02'

[params.page]
  toc = { enable = false }
  code = { copy = true }

[menu]
  [[menu.main]]
    weight = 1
    identifier = 'posts'
    name = 'Bài viết'
    url = '/posts/'
```

Các thiết lập quan trọng khác:
- **`baseURL`**: URL gốc của website, bắt buộc cho SEO
- **`locale`**: ngôn ngữ mặc định
- **`theme`**: theme đang sử dụng
- **`params`**: tham số tùy chỉnh, truy cập qua `.Site.Params`
- **`menu`**: định nghĩa menu điều hướng
- **`pagination`**: số lượng trang mỗi trang
- **`sitemap`**: cấu hình sitemap.xml
- **`outputFormats`**: định dạng output tùy chỉnh
- **`cascade`**: kế thừa front matter cho các trang con

## Hệ thống Modules

Hugo Modules là tính năng quản lý dependency mạnh mẽ, cho phép quản lý theme và thư library giống như Go modules. Thay vì sử dụng git submodule cho theme, bạn có thể khai báo theme như một module và Hugo tự động tải về:

```bash
hugo mod init github.com/user/project
hugo mod get github.com/theNewDynamic/hugo-module-tnd-seo
```

Cấu hình module trong `hugo.toml`:

```toml
[module]
  [[module.imports]]
    path = "github.com/theNewDynamic/hugo-module-tnd-seo"
  [[module.imports]]
    path = "github.com/user/theme"
```

Modules hỗ trợ:
- **Theme như module**: dễ dàng cập nhật và quản lý phiên bản, không cần git submodule
- **Import từ Git, Gitea, GitLab**: linh hoạt trong việc chia sẻ component
- **Mount configuration**: mount thư mục từ module vào project, cho phép tái sử dụng cấu trúc
- **Version pinning**: kiểm soát phiên bản chính xác thông qua go.sum
- **Proxy support**: sử dụng module proxy cho CI/CD:

```bash
hugo mod init github.com/user/project
hugo mod get github.com/theNewDynamic/hugo-module-tnd-seo
```

Modules hỗ trợ:
- **Theme như module**: dễ dàng cập nhật và quản lý phiên bản
- **Import từ Git, Gitea, GitLab**: linh hoạt trong việc chia sẻ
- **Mount configuration**: mount thư mục từ module vào project
- **Version pinning**: kiểm soát phiên bản chính xác

## Data Sources

Hugo cho phép sử dụng dữ liệu từ nhiều nguồn khác nhau để augment nội dung:

### Local Data
Đặt file JSON, TOML, YAML, CSV trong thư mục `data/`:

```json
{
  "social": {
    "github": "username",
    "twitter": "@username"
  }
}
```

Truy cập trong template: `{{ .Site.Data.social.github }}`

### Remote Data
Hugo có thể tải dữ liệu từ URL bất kỳ thông qua resources.GetRemote:

```go-html-template
{{ $data := resources.GetRemote "https://api.example.com/data.json" | transform.Unmarshal }}
{{ range $data.items }}
  <li>{{ .name }}</li>
{{ end }}
```

### Content Adapters
Từ Hugo 0.157.0, Content Adapters cho phép tạo trang từ dữ liệu mà không cần file nội dung:

```go-html-template
{{- /* layouts/_default/_markup/content-adapter.html */ -}}
{{- range .Site.Data.products -}}
  {{- .content -}}
{{- end -}}
```

## URL Management

Hugo cung cấp nhiều tùy chọn để kiểm soát cấu trúc URL:

```toml
[permalinks]
  posts = '/:year/:month/:slug/'
  pages = '/:filename/'
```

Các biến permalink:
- `:slug`: slug từ front matter
- `:title`: tiêu đề đã slug hóa
- `:year`, `:month`, `:day`: ngày tháng
- `:section`: section của trang
- `:filename`: tên file gốc

Ngoài ra, Hugo hỗ trợ:
- `aliases`: chuyển hướng URL cũ sang URL mới
- `canonical`: URL canonical cho SEO
- `slug`: front matter để custom slug
- `url`: front matter để custom URL hoàn toàn
- `sitemap`: cấu hình sitemap riêng cho từng trang

## SEO và Metadata

Hugo có hỗ trợ SEO tích hợp sẵn:

### Open Graph
```toml
[params]
  [params.seo]
    enable = true
    [params.seo.open_graph]
      enable = true
      locale = 'vi_VN'
```

### Sitemap
Hugo tự động tạo `sitemap.xml`:

```toml
[sitemap]
  changefreq = 'weekly'
  priority = 1.0
  filename = 'sitemap.xml'
```

### Robots.txt
Hugo có thể tạo robots.txt tự động với link đến sitemap.

### Schema.org
Hugo tự động chèn JSON-LD structured data cho bài viết, bao gồm:
- Article schema
- BreadcrumbList schema
- Organization schema
- Person/Author schema

## Syntax Highlighting

Hugo hỗ trợ syntax highlighting tích hợp sẵn thông qua Chroma (Go):

```toml
[markup]
  [markup.highlight]
    codeFences = true
    guessSyntax = false
    lineNos = true
    lineNumbersInTable = true
    noClasses = false
    style = 'monokai'
    tabWidth = 2
```

Sử dụng trong nội dung:

```markdown
```python { linenos=true, hl_lines=[3-5] }
def hello():
    print("Hello, Hugo!")
    # This line is highlighted
    return True
```
```

Hugo hỗ trợ hàng trăm ngôn ngữ lập trình và nhiều theme màu khác nhau như monokai, github, dracula, solarized.

## Caching và Performance

Hugo sử dụng cơ chế caching thông minh để tối ưu tốc độ build, đây là một trong những lý do khiến Hugo nhanh hơn hầu hết các SSG khác:

- **Page cache**: chỉ rebuild trang khi có thay đổi nội dung hoặc template liên quan. Hugo theo dõi dependency graph của từng trang và chỉ rebuild những gì thực sự cần.
- **Fragment cache**: cache từng phần của template với `partialCached`, giúp tránh render lại các thành phần giống nhau trên nhiều trang. Ví dụ, sidebar chỉ cần render một lần cho toàn bộ site.
- **File cache**: cache file đã xử lý như ảnh đã resize, CSS đã minify, font subset. Các file này được lưu trong thư mục `resources/_gen/` và chỉ được tạo lại khi source thay đổi.
- **Memory cache**: Hugo giữ IR (Intermediate Representation) trong RAM để tối ưu tốc độ build nhiều lần liên tiếp.

```go-html-template
{{ partialCached "header.html" . "header" }}
{{ partialCached "footer.html" . "footer" }}
{{ partialCached "sidebar.html" . "sidebar" }}
```

Bạn có thể xóa cache để force rebuild:

```bash
hugo --ignoreCache
rm -rf resources/_gen/
```

## Triển khai (Host và Deploy)

## Triển khai (Host và Deploy)

Hugo hỗ trợ nhiều nền tảng triển khai:

- **GitHub Pages**: tích hợp GitHub Actions, deploy tự động khi push
- **Netlify**: tích hợp sẵn, chỉ cần kết nối Git repository
- **Cloudflare Pages**: deploy edge, hiệu suất cao
- **AWS S3 + CloudFront**: cho hệ thống lớn
- **Firebase Hosting**: dễ dàng tích hợp với Firebase

Ví dụ GitHub Actions workflow cho Hugo:

```yaml
- uses: actions/checkout@v6
  with:
    submodules: recursive
- uses: peaceiris/actions-hugo@v3
  with:
    extended: true
- run: hugo --minify
- uses: actions/upload-pages-artifact@v5
  with:
    path: ./public
```

## Troubleshooting và Debug

Hugo cung cấp nhiều công cụ debug hữu ích:

```bash
hugo --verbose            # Log chi tiết
hugo --debug              # Debug mode
hugo --templateMetrics    # Hiển thị thời gian render template
hugo server --renderToDisk # Render trực tiếp ra disk
```

Các lỗi thường gặp và cách fix:
- **`can't evaluate field`**: template field không tồn tại trên object
- **`execute of template failed`**: lỗi cú pháp trong template
- **`.Site` deprecation**: `.Site.Data` → `hugo.Data`, `.Site.LanguageCode` → `.Site.Language.Locale`

## Cộng đồng và Hỗ trợ

Hugo có một cộng đồng lớn mạnh với:

- **Forum**: discourse.gohugo.io với hơn 20.000 chủ đề thảo luận
- **GitHub**: 89.000+ sao, phát triển tích cực
- **Themes**: 300+ theme miễn phí tại themes.gohugo.io
- **Sponsors**: JetBrains, CloudCannon và nhiều công ty công nghệ

## Kết luận

Hugo là một static site generator mạnh mẽ, nhanh và linh hoạt, phù hợp cho mọi loại website từ blog cá nhân đến trang web doanh nghiệp. Với tài liệu phong phú, cộng đồng lớn mạnh và hệ thống template linh hoạt, Hugo là lựa chọn tuyệt vời cho bất kỳ ai muốn xây dựng website tĩnh.

Tài liệu Hugo được cập nhật liên tục tại gohugo.io/documentation/, bao gồm hướng dẫn chi tiết từ cơ bản đến nâng cao. Cho dù bạn là người mới bắt đầu hay lập trình viên giàu kinh nghiệm, Hugo đều có công cụ và tài liệu phù hợp để giúp bạn xây dựng website một cách hiệu quả nhất.

Nếu bạn chưa từng thử Hugo, hãy bắt đầu ngay hôm nay với lệnh `hugo new project` và trải nghiệm sự khác biệt về tốc độ và hiệu suất mà Hugo mang lại.
