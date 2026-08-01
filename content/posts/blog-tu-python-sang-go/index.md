---
title: 'Blog chuyển tech stack từ Python sang Go: câu chuyện có thật'
slug: blog-tu-python-sang-go
date: 2026-08-01T09:12:29+07:00
draft: false
description: 'Tech stack blog từ Python sang Go: vì sao rời bỏ scikit-learn, port thuật toán sang Go thuần, kết quả nhanh hơn 10 lần và CI gọn lại còn một lệnh.'
tags:
  - tech-stack
  - python
  - golang
  - scikit-learn
  - hugo
  - toi-uu-ci
categories:
  - "cong-nghe"
resources:
  - name: featured-image
    src: featured-image.jpg
---

Một buổi sáng, tôi mở terminal và gõ một lệnh duy nhất để build toàn bộ trang web này. Không còn `pip install`, không còn môi trường Python, không còn bước "chờ scikit-learn tải xong". Toàn bộ chuỗi công cụ — từ trình tạo trang tĩnh đến thuật toán gợi ý bài viết liên quan — giờ đây đều nói cùng một ngôn ngữ: Go.

Câu chuyện này có thật, và nó nằm ngay trong git log của blog.

## Một blog Hugo, nhưng có hai lớp Python

Blog này ra đời vào cuối tháng 7/2026 với công thức quen thuộc: Hugo — trình tạo trang tĩnh viết bằng Go — cộng với GitHub Pages và GitHub Actions. Ngay từ commit đầu tiên mang tên "Khởi tạo blog Hugo + GitHub Pages + Python", đã có một điều thú vị: hai lớp công nghệ tồn tại song song.

Phần xuất bản nội dung thuần Go: Hugo quét các thư mục bài viết, xử lý ảnh sang WebP, tạo HTML tĩnh rồi đẩy lên GitHub. Nhưng bên cạnh đó, một script nhỏ tên `deploy.py` đảm nhận vai trò điều phối: gọi Hugo, in ra hướng dẫn, chạy server xem thử. Máy tính phát triển blog này vì thế phải cài sẵn cả Python lẫn Go — một sự chia đôi tưởng chừng vô hại lúc ban đầu.

Lúc ấy, lý do chọn Python rất đơn giản: nó có sẵn, viết nhanh, và phù hợp với một script dăm chục dòng. Không ai nghĩ lớp Python này sẽ lớn lên. Cho đến khi nó lớn thật.

## "Có thể bạn sẽ thích": khi Python trở thành phần lõi

Cùng ngày blog ra đời, một tính năng quan trọng xuất hiện: mục "Có thể bạn sẽ thích" — gợi ý bốn bài viết liên quan ở cuối mỗi bài. Đây không phải là chọn ngẫu nhiên hay gắn nhãn thủ công, mà là một pipeline học máy thực thụ: `ml-related.py`, dài 103 dòng, dựa trên hai thư viện Python nổi tiếng là `scikit-learn` và `python-frontmatter`.

Cách nó hoạt động cũng là kỹ thuật kinh điển: mỗi bài viết được chuyển thành một "bức tranh" từ — tiêu đề được nhân ba lần trọng số, thẻ tag và chuyên mục nhân đôi, phần thân được làm sạch khỏi cú pháp Markdown rồi cắt gọn. Những "bức tranh" này được vector hóa bằng TF-IDF, rồi đo độ gần nhau bằng cosine similarity. Với mỗi bài, bốn bài "gần" nhất sẽ được chọn vào danh sách gợi ý, lưu ra file `data/related.json` trước khi Hugo build.

Với scikit-learn, toàn bộ việc này chỉ là vài dòng gọi API. Vấn đề không nằm ở code — mà nằm ở nơi code ấy được chạy.

## Vì sao phải rời xa scikit-learn

Mỗi lần build, pipeline phải chạy trước Hugo. Nghĩa là trên máy cục bộ và trong GitHub Actions, máy tính phải chuẩn bị đủ bộ ba Python: cài `python-frontmatter`, cài `scikit-learn`, rồi mới chạy được script 103 dòng.

Cái giá phải trả là một chuỗi CI dài dòng: bước "Setup Python", bước "Install Python deps", rồi mới đến bước chạy. Cứ mỗi lần deploy, runner của GitHub lại phải tải về và cài đặt những gói này — và với dự án nhỏ, cảm giác đó giống như thuê cả một kho hàng để cất một hộp giấy. Hệ sinh thái cũng rạn nứt theo: blog nói tiếng Go ở lớp build, tiếng Python ở lớp gợi ý, còn người viết phải nhớ cả hai.

Câu hỏi đặt ra rất thẳng thắn: một thuật toán gồm tokenize, đếm tần số và nhân ma trận — có thật sự cần một thư viện học máy khổng lồ và một ngôn ngữ thứ hai để chạy không?

## Bản port Go thuần và cuộc so sánh sòng phẳng

Câu trả lời được viết trong commit `41d1f29` sáng 1/8/2026: "migrate related-posts ML pipeline from Python/scikit-learn to Go". Toàn bộ `ml-related.py` bị xóa, thay bằng `tools/ml-related/main.go` — một chương trình Go thuần, chỉ dùng thư viện chuẩn, không một dependency bên ngoài.

Điều làm tôi tâm đắc nhất là cách bản port được kiểm chứng. Không phải "viết lại rồi tin là đúng", mà là một cuộc so sánh sòng phẳng giữa hai thế hệ code:

- Bộ từ vựng khớp **6303/6304** từ — chênh đúng một từ vì cơ chế phân hạng nội bộ của scikit-learn dựa trên thuật toán sắp xếp của numpy, không thể tái hiện chính xác, nên giới hạn `max_features` đã được bỏ hẳn.
- Điểm tương đồng sai lệch **dưới 0,0001** — trong ngưỡng sai số làm tròn.
- Thứ tự bài gợi ý khớp **103/120**; chênh lệch duy nhất bắt nguồn từ một lỗi chính tả trong nội dung một bài cũ, được ghi chú lại để sửa sau.
- Tốc độ nhanh hơn **khoảng 10 lần**.

Những con số này không chỉ chứng minh bản port "đủ tốt" — chúng chứng minh nó *đúng*, theo nghĩa đo lường được. Tokenizer trong Go mô phỏng chính xác quy tắc tách từ mặc định của scikit-learn, còn phép cắt phần thân 5.000 ký tự được sửa để đếm theo ký tự Unicode thay vì byte — trước đây vốn có thể cắt cụt giữa chừng một từ tiếng Việt.

## Lợi ích thực tế: CI còn lại một lệnh

Sau migration, workflow deploy ngắn đi thấy rõ. Hai bước "Setup Python" và "Install Python deps" biến mất khỏi GitHub Actions; `pip install scikit-learn` không còn nữa. Pipeline gợi ý giờ là một lệnh: `go run ./tools/ml-related`. Và vì Hugo cũng là một chương trình Go, cả chuỗi build giờ đây chỉ cần một ngôn ngữ duy nhất trên mọi máy — cục bộ hay CI.

Với người đọc, mọi thứ vẫn y hệt: bốn bài liên quan vẫn hiện ra sau mỗi bài viết, độ chính xác gần như không đổi. Nhưng phía sau, blog đã nhẹ đi một lớp: hết quản lý môi trường Python, hết cài gói, hết hai ngôn ngữ trong một dự án. Việc `deploy.py` chuyển từ `python3 ml-related.py` sang `go run ./tools/ml-related` nghe có vẻ nhỏ, nhưng nó là đòn bẩy: giờ đây bất kỳ ai clone repo về đều build được blog chỉ với Go, không cần thêm bất kỳ thứ gì.

## Bài học: migration không phải viết lại, mà là port có kiểm chứng

Câu chuyện này gợi nhớ đến [những câu chuyện kỹ thuật của các công ty lớn]({{< relurl "dropbox-cau-chuyen-khoi-nghiep-va-su-lang-quen/" >}}), nơi một lớp code viết nhanh ban đầu dần trở thành gánh nặng hạ tầng, rồi được thay thế bằng một ngôn ngữ chuyên cho phần lõi hiệu năng. Blog này không ở quy mô đó, nhưng bài học thì giống nhau: hãy để ngôn ngữ phục vụ hệ sinh thái đang có, đừng bắt hệ sinh thái phục vụ hai ngôn ngữ.

Quan trọng hơn, đây là lần đầu tiên blog có một quy trình "nâng cấp có bằng chứng": kết quả cũ và mới được đặt cạnh nhau, đo bằng cùng một thước đo, và quyết định được đưa ra dựa trên con số. Điều đó đáng giá hơn bất kỳ lời quảng cáo "nhanh hơn" nào.

Buổi sáng hôm sau, tôi chạy build thử. Vài trăm mili-giây sau, trang web hoàn tất — và trong dòng log, không còn một dòng `pip` nào. Từ giờ, nơi này nói tiếng Go.

## Thông tin nhanh

| Mục | Trước (Python) | Sau (Go) |
|---|---|---|
| **Pipeline bài liên quan** | `ml-related.py` (103 dòng) | `tools/ml-related/main.go` |
| **Thư viện** | scikit-learn + python-frontmatter | Go stdlib (0 dependency) |
| **CI** | setup-python@v5 + `pip install` | `go run ./tools/ml-related` |
| **Độ chính xác** | chuẩn gốc | vocab khớp 6303/6304, score sai < 0,0001 |
| **Tốc độ** | — | nhanh hơn khoảng 10 lần |
| **Build cục bộ** | cần Python + Go | chỉ cần Go |

## Điểm cộng và điều cần biết

| Điểm cộng | Điều cần biết |
|---|---|
| Toàn bộ toolchain còn một ngôn ngữ (Go) | Bản port cần kiểm chứng định lượng, không phải "viết lại là xong" |
| CI gọn: bỏ setup-python, bỏ pip install | Một số hành vi nội bộ (tie-break sắp xếp) của scikit-learn không thể tái hiện 100% |
| Nhanh hơn ~10 lần, không dependency | Vẫn còn một lỗi chính tả trong nội dung bài cũ cần sửa |

[Quá trình nâng cấp kỹ thuật của blog này]({{< relurl "cai-tien-ky-thuat-blog-duy-nguyen/" >}}) không dừng ở giao diện và tốc độ tải trang — nó còn đi sâu vào cả bên dưới lớp vỏ, nơi những quyết định về ngôn ngữ lập trình thay đổi cách cả một dự án được vận hành mỗi ngày.
