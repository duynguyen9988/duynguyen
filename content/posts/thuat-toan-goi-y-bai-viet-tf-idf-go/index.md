---
title: 'TF-IDF từ con số 0: thuật toán gợi ý bài viết trong Go'
slug: thuat-toan-goi-y-bai-viet-tf-idf-go
date: 2026-08-01T10:01:12+07:00
draft: false
description: 'Hiểu thuật toán gợi ý bài viết TF-IDF và cosine similarity trong Go: tokenizer, stop words, trọng số mục, và vì sao nó chạy nhanh gấp 10 lần bản Python.'
tags:
  - tf-idf
  - cosine-similarity
  - golang
  - machine-learning
  - thuật-toán
categories:
  - "cong-nghe"
resources:
  - name: featured-image
    src: featured-image.jpg
---

Mỗi khi bạn đọc xong một bài trên blog này, ở cuối trang có bốn bài viết khác hiện ra dưới dòng chữ "Có thể bạn sẽ thích". Với người đọc, đó là một chi tiết nhỏ bên lề trang. Với tôi, đó là một thuật toán học máy chạy bằng Go thuần, không một thư viện bên ngoài, và mỗi dòng code của nó đều có thể giải thích được từ gốc. Bài này sẽ mổ xẻ toàn bộ `tools/ml-related/main.go` — từ chữ đầu tiên đến dòng xuất JSON — để bạn thấy một hệ gợi ý nhỏ thực sự hoạt động ra sao.

Đây là bài đầu tiên trong chuỗi bài tiếp nối câu chuyện [blog chuyển từ Python sang Go]({{< relurl "blog-tu-python-sang-go/" >}}).

## Vấn đề: làm sao biết hai bài viết "gần nhau"

Câu hỏi mà thuật toán phải trả lời rất đơn giản: trong hơn một trăm bài viết của blog, bốn bài nào giống bài đang đọc nhất? Vấn đề là máy tính không hiểu tiếng Việt. Nó chỉ hiểu con số. Vì vậy, trước khi tính được độ giống nhau, chúng ta phải biến mỗi bài viết thành một dãy số — và dãy số đó phải mang ý nghĩa: những bài cùng chủ đề phải cho ra những dãy số gần nhau.

Toàn bộ bài toán gồm ba bước: tách văn bản thành các từ riêng lẻ, đếm độ quan trọng của từng từ trong mỗi bài, rồi đo khoảng cách giữa hai bài.

## Bước 1: Tokenizer — biến văn bản thành chuỗi từ

Đoạn code mở đầu là một hàm nhỏ tên `tokenize`, nhận vào một chuỗi bất kỳ và trả về danh sách các từ. Nó duyệt qua từng ký tự Unicode của chuỗi; nếu ký tự là chữ cái, chữ số hoặc gạch dưới thì gom vào một cụm, ngược lại thì "xả" cụm đang gom dở. Những cụm ngắn hơn hai ký tự bị bỏ đi, và mọi từ được chuyển về chữ thường.

Cách tách từ này không phải ngẫu nhiên — nó mô phỏng chính xác quy tắc `(?u)\b\w\w+\b` mặc định của scikit-learn, thư viện Python đã được dùng trước khi migration. Vì vậy, một từ tiếng Việt có dấu như "thuật" hay "toán" vẫn được nhận diện đúng như một cụm, nhờ xử lý theo ký tự Unicode chứ không theo byte.

## Bước 2: Stop words — những từ không mang ý nghĩa

Không phải từ nào cũng đáng tính điểm. Trong tiếng Việt, những từ như "và", "của", "một", "trong" xuất hiện trong hầu như mọi bài viết, nên chúng không giúp phân biệt chủ đề nào cả. File cấu hình khai báo một danh sách stop words gồm vài chục từ tiếng Việt lẫn tiếng Anh, và tokenizer bỏ qua chúng ngay từ bước đếm. Nhờ vậy, từ vựng còn lại của hệ thống chủ yếu là những từ mang nội dung thật: tên món ăn, tên phim, từ chuyên ngành.

## Bước 3: Trọng số — không phải chỗ nào trong bài cũng quan trọng như nhau

Một chi tiết tinh tế nằm trong hàm dựng văn bản: trước khi đếm, bài viết được "pha loãng" theo công thức riêng. Tiêu đề được lặp lại ba lần, thẻ tag và chuyên mục mỗi thứ được lặp lại hai lần, rồi mới đến phần thân đã được làm sạch. Cách làm này khiến những từ xuất hiện trong tiêu đề và tag có trọng số cao hơn hẳn từ trong phần thân — vì trên thực tế, tiêu đề và tag là nơi tác giả tự tóm tắt chủ đề bài viết một cách có chủ đích.

Phần thân được làm sạch bằng ba lần thay thế: xóa các thẻ HTML, xóa các ký tự đánh dấu của Markdown như `#`, `*`, `[`, `]`, rồi chuẩn hóa khoảng trắng liên tiếp. Sau đó, phần thân được cắt còn tối đa 5.000 ký tự — một chi tiết tưởng nhỏ nhưng từng gây ra lỗi thú vị, mà tôi sẽ kể trong một bài riêng về Unicode.

## Bước 4: TF-IDF — đo độ quan trọng của từ trong bối cảnh cả blog

Đây là phần lõi của thuật toán. Với mỗi bài viết, hệ thống đếm tần số của từng từ — số lần từ đó xuất hiện trong bài. Nhưng tần số thô không đủ: một từ xuất hiện nhiều lần chỉ trong một bài nên được đánh giá cao, còn một từ xuất hiện ở khắp mọi bài thì gần như vô nghĩa. Đó là lý do tồn tại của hai khái niệm TF và IDF.

TF, viết tắt của term frequency, là tần số của từ trong bài. Thay vì dùng tần số thô, hệ thống áp dụng phép biến đổi phụ tuyến tính: điểm TF = 1 + log(tần số). Phép log này làm "dẹt" sự chênh lệch: một từ xuất hiện 50 lần không được tính cao gấp 50 lần từ xuất hiện 1 lần, mà chỉ hơn một chút. Điều này phản ánh đúng bản chất ngôn ngữ — việc lặp từ nhiều lần trong bài không làm chủ đề "đậm đặc" hơn theo tỉ lệ tuyến tính.

IDF, viết tắt của inverse document frequency, đo độ hiếm của từ trong toàn bộ blog: nếu từ xuất hiện trong ít bài thì IDF cao, xuất hiện trong nhiều bài thì IDF thấp. Công thức chuẩn được áp dụng với phép làm trơn: IDF = log((1 + N) / (1 + số bài chứa từ)) + 1, trong đó N là tổng số bài viết. Phép cộng 1 ở cả tử và mẫu đảm bảo không có từ nào bị chia cho số 0.

Ngoài ra còn một bộ lọc phòng thủ: bất kỳ từ nào xuất hiện trong hơn 85% số bài đều bị loại khỏi từ vựng hoàn toàn — một lớp lọc stop words tự động thứ hai, đón những từ lọt qua danh sách thủ công.

## Bước 5: Cosine similarity — đo độ gần giữa hai bài

Mỗi bài giờ đây là một vector: mỗi chiều ứng với một từ trong toàn bộ từ vựng của blog, và giá trị tại chiều đó là TF-IDF của từ trong bài. Hai bài giống nhau khi hai vector của chúng cùng "nhìn về một hướng" — và đó chính là định nghĩa của cosine similarity: góc giữa hai vector, tính qua tích vô hướng chia cho tích chuẩn của chúng.

Trong code, mỗi vector được chuẩn hóa về độ dài đơn vị trước khi so sánh — nhờ vậy, phép đo chỉ còn lại tích vô hướng của hai vector. Giá trị này nằm giữa 0 và 1, với 1 là trùng khớp hoàn toàn. Mỗi bài được so với toàn bộ các bài còn lại, sắp xếp giảm dần theo điểm số, rồi lấy bốn bài đứng đầu — hệ số này được khai báo ngay ở đầu file với tên gọi rõ ràng: `topN = 4`.

## Bước 6: Xuất kết quả

Cuối cùng, kết quả được ghi ra file `data/related.json` — một map, mỗi khóa là slug của một bài viết, mỗi giá trị là danh sách bốn bài liên quan kèm điểm số làm tròn đến bốn chữ số thập phân. Hugo đọc file này lúc build và dùng nó để hiển thị mục "Có thể bạn sẽ thích". Toàn bộ quá trình — từ đọc file đến ghi JSON — chỉ tốn vài trăm mili-giây cho hơn một trăm bài viết.

## Vì sao Go, và vì sao phải tự viết

Như tôi đã viết trong [bài chuyển tech stack]({{< relurl "blog-tu-python-sang-go/" >}}), lý do rời scikit-learn không phải vì tốc độ trong bước build — mà vì cả một hệ sinh thái Python phải cài đặt trên máy cục bộ lẫn CI chỉ để chạy 103 dòng code. Bản Go hoàn chỉnh này chỉ dùng thư viện chuẩn: `regexp` cho các biểu thức làm sạch, `unicode` cho việc tách ký tự, `sort` cho việc xếp hạng, và `encoding/json` cho việc xuất dữ liệu.

Không có dependency bên ngoài nghĩa là không có bản vá bảo mật bắt buộc, không có xung đột phiên bản, không có bước cài đặt nào trước khi build. Một lệnh `go run ./tools/ml-related` — và bạn có một hệ gợi ý bài viết hoàn chỉnh.

## Thông tin nhanh

| Thành phần | Chi tiết |
|---|---|
| **Tokenizer** | chữ cái/số/gạch dưới, ≥ 2 ký tự, chữ thường |
| **Stop words** | ~80 từ tiếng Việt và tiếng Anh, lọc thủ công |
| **Trọng số mục** | title ×3, tags ×2, categories ×2, body ×1 |
| **TF** | phụ tuyến tính: 1 + log(tần số) |
| **IDF** | log((1+N)/(1+df)) + 1, bộ lọc max_df = 0.85 |
| **Khoảng cách** | cosine similarity, vector L2 chuẩn hóa |
| **Kết quả** | top 4 bài/trang, ghi `data/related.json` |

## Điểm cộng và điều cần biết

| Điểm cộng | Điều cần biết |
|---|---|
| Go thuần, 0 dependency — build được mọi nơi | Phải tự viết lại mọi thứ mà thư viện cho sẵn |
| Chạy ~10 lần nhanh hơn bản Python | So sánh với bản cũ cần kiểm chứng định lượng |
| Mỗi bước đều giải thích được từ gốc | Trọng số title/tag là quyết định thiết kế chủ quan |
| Không có gì chạy ngầm — code đọc là hiểu | — |

Nếu bạn muốn biết những con số này đã được kiểm chứng thế nào khi chuyển từ Python sang Go — bộ từ vựng khớp 6303/6304, điểm sai lệch dưới 0,0001 — thì bài tiếp theo trong chuỗi sẽ kể toàn bộ quá trình [kiểm chứng bản port Go]({{< relurl "kiem-chung-port-go-python/" >}}).
