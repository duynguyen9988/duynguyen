# Runbook tên miền, hosting, đo lường và quảng cáo

Phần mã nguồn đã sẵn sàng để chuyển sang domain riêng: các liên kết nội bộ dùng shortcode `relurl`, schema và canonical lấy từ `baseURL`, còn ảnh OG được sinh khi build. Các bước dưới đây cần quyền sở hữu domain, DNS, hosting và tài khoản Google; không thực hiện chúng bằng cách commit mã nguồn.

## Trạng thái trong repo

- Trust pages, hồ sơ tác giả, byline và publisher schema đã có.
- Google Analytics và AdSense đều **tắt**. Không có request đến Google Analytics hoặc quảng cáo khi các giá trị này để trống/tắt.
- Consent banner chỉ xuất hiện khi Analytics hoặc AdSense được bật; Analytics chỉ tải sau khi người đọc đồng ý.
- Tất cả URL nội bộ trong Markdown dùng `{{< relurl "..." >}}`; build thử với `--baseURL https://example.com/` cho kết quả đúng ở root domain.

## 1. Chuyển sang domain và hosting phù hợp

1. Chọn và đăng ký domain. Xác nhận điều khoản của nhà cung cấp hosting cho phép mục đích thương mại dự kiến; GitHub Pages có [các giới hạn sử dụng riêng](https://docs.github.com/en/enterprise-cloud%40latest/pages/getting-started-with-github-pages/github-pages-limits).
2. Tạo project static-site tại nhà cung cấp mới, kết nối repository và cấu hình build command `hugo --minify`, output directory `public` và Hugo Extended v0.163.1 trở lên.
3. Gắn domain, thiết lập DNS theo hướng dẫn của nhà cung cấp, bật HTTPS và chỉ chuyển traffic khi chứng chỉ hợp lệ.
4. Thay `baseURL` trong `hugo.toml` bằng `https://ten-mien-cua-ban/`, chạy `hugo --cleanDestinationDir --minify`, rồi kiểm tra canonical, sitemap, RSS, og:image và các trang chính trên domain mới.
5. Duy trì URL cũ trong giai đoạn chuyển đổi và thiết lập redirect 301 ở lớp hosting/CDN nếu nhà cung cấp hỗ trợ. Sau đó xác minh domain mới trong Search Console, gửi sitemap mới và theo dõi lỗi 404/canonical.

## 2. Bật GA4 sau khi domain mới hoạt động

1. Tạo GA4 property và web data stream cho **domain mới**; lấy Measurement ID dạng `G-XXXXXXXXXX`.
2. Trong `hugo.toml`, đặt:

   ```toml
   [params.analytics]
     enable = true
     [params.analytics.google]
       id = "G-XXXXXXXXXX"
       respectDoNotTrack = true
   ```

3. Deploy, mở website trong cửa sổ riêng tư và kiểm tra Network: trước khi chọn đồng ý không được có request `googletagmanager.com/gtag/js`; sau khi chọn “Chỉ cho phép phân tích”, GA4 mới được tải.
4. Kiểm tra consent bằng Tag Assistant, Realtime của GA4 và Privacy Policy đã deploy. Lưu ý: banner nội bộ là basic consent cho Analytics; nó chưa phải CMP được chứng nhận cho AdSense.

## 3. Thiết lập baseline Core Web Vitals

1. Chạy PageSpeed Insights cho trang chủ và ít nhất ba bài có ảnh lớn ở cả mobile/desktop sau deploy.
2. Ghi baseline LCP, INP, CLS, FCP và TTFB vào tài liệu vận hành; kiểm tra lại sau mỗi batch ảnh, script hoặc quảng cáo.
3. Sau khi đủ dữ liệu thực tế, dùng Search Console/GA4 để theo dõi mục tiêu 75th percentile: LCP ≤ 2.5 giây, INP ≤ 200 ms và CLS ≤ 0.1.
4. Chạy Rich Results Test trên một URL bài viết thật sau deploy; kiểm tra `BlogPosting`, `author`, `datePublished`, `dateModified`, `image` và `publisher.logo` theo [hướng dẫn Article của Google](https://developers.google.com/search/docs/appearance/structured-data/article).

## 4. Chỉ bật AdSense khi sẵn sàng

1. Hoàn tất trust pages, domain/hosting mới, nội dung có nguồn, baseline CWV và tài khoản AdSense được chấp thuận.
2. Với người dùng tại EEA, Vương quốc Anh hoặc Thụy Sĩ, chọn và tích hợp CMP được Google chứng nhận trước khi thêm ad tag. Không thay CMP bằng banner nội bộ trong repo.
3. Cập nhật `params.adsense` và tạo ad slots sau khi CMP hoạt động; tải ad tag chỉ sau consent, gắn nhãn quảng cáo rõ ràng và giữ khoảng cách với nội dung/CTA.
4. Kiểm tra lại trải nghiệm mobile, layout shift và chính sách trước khi tăng số lượng vị trí quảng cáo.

## 5. Nội dung đang chờ rà soát thủ công

Không thể tự động thêm trải nghiệm thật, ảnh tự chụp hoặc nguồn chính thức cho bài cũ. Mọi thay đổi dạng này cần bằng chứng do tác giả cung cấp. Xem [`docs/content-review-backlog.md`](content-review-backlog.md) và checklist biên tập trước khi cập nhật.
