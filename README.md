# Duy Nguyen Blog

Personal blog built with Hugo + GitHub Pages.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Static Site Generator** | [Hugo](https://gohugo.io/) (Extended) |
| **Theme** | [LoveIt](https://github.com/dillonzq/LoveIt) |
| **Hosting** | [GitHub Pages](https://pages.github.com/) |
| **CI/CD** | GitHub Actions (auto-build & deploy on push) |
| **Search** | Fuse.js (client-side, no backend) |
| **CSS** | SCSS (Hugo pipe) |
| **Font** | System font stack (Segoe UI, Roboto, Noto Sans, system-ui, sans-serif) |
| **Icons** | Font Awesome (free) |
| **Image Loading** | Lazysizes (lazy load + blur placeholder) |
| **Automation** | Go (tools/deploy + tools/ml-related) |

## Development

```bash
# Dev server
hugo server

# Build
go run ./tools/deploy

# Deploy (push to main → GitHub Actions auto-deploys)
git push origin main
```
