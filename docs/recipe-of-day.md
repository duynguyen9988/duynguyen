# Công thức hôm nay

Workflow recipe-of-day.yml tạo tối đa một bài lúc 07:05 theo giờ Việt Nam. Nó chỉ dùng brief trong data/recipe-briefs.json, không lấy, dịch hoặc diễn đạt lại công thức từ một nhà xuất bản khác.

## Thiết lập xuất bản tự động

1. Tạo API key có quyền dùng OpenAI Responses API.
2. Trong GitHub repository, vào Settings → Secrets and variables → Actions → New repository secret.
3. Tạo secret tên OPENAI_API_KEY và dán API key. Không đặt key trong file nội dung hoặc commit.
4. Chạy Actions → Publish recipe of the day với dry_run bật để kiểm tra. Sau đó chạy lại khi dry_run tắt, hoặc chờ lịch hằng ngày.

Một lần chạy hợp lệ sẽ tạo bài tiếng Việt mới, chọn ảnh gốc từ Wikimedia Commons chỉ khi metadata là CC0, Public Domain, CC BY hoặc CC BY-SA, lưu ảnh cục bộ để Hugo chuyển thành WebP, rồi ghi tác giả, license và nguồn ảnh trong bài. Commit mới sẽ kích hoạt GitHub Pages deploy hiện có.

Hiện có 24 brief, mỗi brief chỉ xuất bản một lần để tránh nội dung trùng. Hãy bổ sung brief mới trước khi dùng hết.

## Phím tắt rc cho bài có quyền sử dụng

rc dành cho một hướng dẫn nấu ăn mà bạn có quyền dịch, tái xuất bản và dùng ảnh. Lệnh không nhận bài của nguồn chưa được cấp phép: cờ --confirm-rights là bắt buộc, đồng thời phải nêu quyền của bài gốc và ảnh.

Ví dụ với text bạn đã lưu tại /private/tmp/recipe-source.txt:

    OPENAI_API_KEY='...' ./rc --input /private/tmp/recipe-source.txt --title 'Tên bài gốc' --source-name 'Tên chủ sở hữu quyền' --source-url 'https://example.com/recipe' --source-license 'Văn bản cho phép tái xuất bản ngày 29/07/2026' --image-url 'https://example.com/original.jpg' --image-source-url 'https://example.com/image-license' --image-credit 'Tên tác giả ảnh' --image-license 'CC BY 4.0' --confirm-rights

Hoặc đọc một URL bạn đã có quyền sử dụng:

    OPENAI_API_KEY='...' ./rc --url 'https://example.com/licensed-recipe' --source-name 'Tên chủ sở hữu quyền' --source-license 'CC BY-SA 4.0' --image-url 'https://example.com/original.jpg' --image-source-url 'https://example.com/image-license' --image-credit 'Tên tác giả ảnh' --image-license 'CC BY 4.0' --confirm-rights

Thêm --dry-run để kiểm tra dịch và tải ảnh nhưng không tạo file. Khi thành công, bài được tạo trong content/posts với category am-thuc, ảnh local và khối Nguồn và bản quyền ở cuối bài.
