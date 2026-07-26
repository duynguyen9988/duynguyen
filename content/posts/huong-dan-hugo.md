---
title: 'Hướng dẫn Hugo Static Site Generator'
date: 2026-07-25T06:00:00+07:00
draft: false
description: 'Tìm hiểu cách xây dựng website tĩnh với Hugo - framework nhanh nhất thế giới'
tags:
  - hugo
  - tutorial
categories:
  - Lập trình
featuredimage: 'https://images.unsplash.com/photo-1518432031352-d6fc5c10da5a?w=800'
---

Hugo là một trong những static site generator nhanh nhất hiện nay, được viết bằng Go.

## Tại sao chọn Hugo?

- **Tốc độ**: Build hàng nghìn trang trong vài giây
- **Linh hoạt**: Hỗ trợ templates, shortcodes, và nhiều tính năng mạnh mẽ
- **Dễ dàng**: Triển khai lên GitHub Pages, Netlify, Vercel

## Cài đặt

Trên macOS, cài Hugo qua Homebrew:

```bash
brew install hugo
```

## Tạo site mới

```bash
hugo new site my-blog
cd my-blog
git init
```
