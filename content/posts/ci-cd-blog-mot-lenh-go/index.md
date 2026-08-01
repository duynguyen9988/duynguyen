---
title: 'CI/CD blog chỉ còn một lệnh: từ setup-python đến go run'
slug: ci-cd-blog-mot-lenh-go
date: 2026-08-01T10:01:12+07:00
draft: false
description: 'GitHub Actions cho blog tĩnh: bỏ setup-python, bỏ pip install, pipeline gợi ý bài viết còn một lệnh go run — CI gọn và tái lập được.'
tags:
  - github-actions
  - ci-cd
  - golang
  - devops
  - hugo
categories:
  - "cong-nghe"
resources:
  - name: featured-image
    src: featured-image.jpg
---

Có một khoảnh khắc mà mọi quyết định kỹ thuật của blog này được thử thách: khoảnh khắc commit và đẩy code lên GitHub. Mỗi lần push, một workflow tự động chạy — và nếu một bước nào đó thất bại, trang web sẽ không được cập nhật. Trước khi diễn ra cuộc migration sang Go, quy trình đó gồm những bước nặng nề: khởi tạo môi trường Python, cài scikit-learn, cài các gói phụ trợ, rồi mới đến lượt chạy pipeline và build Hugo. Mỗi lần deploy là một lần chờ đợi trong lo lắng. Bài này kể về cách toàn bộ quy trình đó gọn lại còn một lệnh duy nhất.

Đây là bài cuối cùng trong chuỗi tiếp nối [câu chuyện chuyển tech stack]({{< relurl "blog-tu-python-sang-go/" >}}), sau bài về [thuật toán]({{< relurl "thuat-toan-goi-y-bai-viet-tf-idf-go/" >}}), [kiểm chứng bản port]({{< relurl "kiem-chung-port-go-python/" >}}) và [cái bẫy Unicode]({{< relurl "cat-chuoi-tieng-viet-unicode-go/" >}}).

## Cái giá của hai ngôn ngữ trong một quy trình build

Mỗi bài viết mới trên blog này đi qua một chuỗi xử lý trước khi trở thành HTML: pipeline gợi ý bài viết liên quan chạy trước, sinh ra dữ liệu JSON, rồi Hugo mới đọc dữ liệu đó để build toàn bộ trang tĩnh. Về bản chất, thứ tự này không thể thay đổi — bài liên quan phải được tính trước khi trang được tạo ra.

Vấn đề nằm ở chỗ: pipeline đó từng là Python, còn Hugo là Go. Trên máy phát triển cục bộ, điều đó nghĩa là phải cài đủ hai bộ công cụ. Trên CI của GitHub Actions, mỗi lần push nghĩa là chạy "Setup Python", chạy "Install Python dependencies" với vài gói nặng như scikit-learn — một thư viện học máy khổng lồ được tải xuống từng lần — rồi mới đến các bước thực sự của công việc. Quy trình build cứ thế phình ra với những bước mang tính "chuẩn bị" nhiều hơn là "thực hiện".

## Một lệnh duy nhất thay cho một dãy bước

Khi pipeline gợi ý được viết lại bằng Go thuần — không một dependency ngoài thư viện chuẩn — cấu trúc của quy trình CI thay đổi tận gốc. Hai bước thiết lập Python biến mất hoàn toàn: không còn setup-python, không còn pip install, không còn scikit-learn được tải xuống mỗi lần deploy. Workflow giờ đây chỉ cần khởi tạo một ngôn ngữ duy nhất — Go — và chạy một lệnh duy nhất: `go run ./tools/ml-related`.

Điều đáng nói là tính chất của lệnh này: `go run` tự biên dịch và chạy chương trình từ mã nguồn, nên không cần bước "build riêng" hay "cài đặt riêng". Mã nguồn Go trong kho chính là môi trường thực thi — đây là điều không có được với Python, nơi mã nguồn và môi trường là hai thứ tách rời. Nhờ vậy, bất kỳ ai clone kho này về đều có thể tái lập toàn bộ quy trình build chỉ với một công cụ duy nhất đã được cài đặt sẵn.

## Toàn bộ quy trình, bây giờ trông như thế nào

Workflow deploy hiện tại của blog gồm bốn giai đoạn chính: lấy mã nguồn, sinh dữ liệu phiên bản, sinh dữ liệu bài liên quan, và build trang tĩnh. Bước lấy mã nguồn cần chú ý một chi tiết: theme của blog là một git submodule, nên việc lấy code phải kéo cả submodule về, cùng với toàn bộ lịch sử commit — lịch sử này là dữ liệu đầu vào cho bước phiên bản.

Bước sinh dữ liệu phiên bản là một dòng lệnh nhỏ nhưng có câu chuyện riêng: nó lấy commit gần nhất và ghi vào một file JSON hiển thị trên trang web như một huy hiệu phiên bản. Trong lần đầu tiên chạy trên CI, bước này từng thất bại vì thư mục chứa file đó không tồn tại trong máy chạy CI — GitHub Actions chỉ kiểm tra các file được theo dõi trong kho, còn thư mục dữ liệu tự sinh thì không. Bài học rút ra rất thực tế: bất kỳ bước nào ghi file vào thư mục tự sinh đều phải tự tạo thư mục trước — một chi tiết nhỏ nhưng là lỗi CI kinh điển mà ai làm deploy tĩnh cũng gặp một lần.

## Nghệ thuật giảm tải: build nhẹ hơn, thất bại ít hơn

Cách đặt vấn đề đúng đắn về CI không phải là "làm cho nó chạy nhanh hơn" mà là "làm cho nó ít có cơ hội thất bại hơn". Mỗi bước thiết lập môi trường là một điểm có thể hỏng: bản cập nhật của scikit-learn có thể đổi API, phiên bản Python có thể bị gỡ khỏi kho lưu trữ, môi trường ảo có thể hết dung lượng. Khi môi trường Python bị loại khỏi quy trình, toàn bộ nhóm rủi ro này biến mất cùng nó.

Điều thú vị là lợi ích không chỉ nằm ở phía CI. Quy trình cục bộ cũng được tái lập với cùng một cấu trúc: một lệnh duy nhất chạy toàn bộ chuỗi — sinh phiên bản, sinh bài liên quan, build Hugo — và một người dùng mới chỉ cần cài Go và Hugo là có thể build được blog. Cùng một quy trình ở hai nơi: đây là định nghĩa thực sự của "tái lập được", thứ quan trọng hơn nhiều so với việc tối ưu từng bước riêng lẻ.

## Bài học đằng sau một lệnh duy nhất

Nhìn lại, cuộc migration này không chỉ là chuyện một script được viết lại bằng ngôn ngữ khác. Nó là một chuỗi quyết định nhất quán: chọn công cụ phù hợp với hệ sinh thái hiện có, kiểm chứng bằng phép đo, và cắt giảm mọi thứ không thật sự cần thiết. Mỗi bước một mình đều nhỏ — nhưng cộng lại, chúng làm cho cả quy trình vận hành của blog nhẹ đi đáng kể.

Đối với những ai đang vận hành một blog tĩnh với CI phức tạp không cần thiết, thông điệp của chuỗi bài này có thể tóm gọn trong một câu: hãy để một lệnh duy nhất nói lên toàn bộ quy trình build của bạn. Nếu cần hơn một câu lệnh, hãy hỏi tại sao. Blog này đã trải qua [hành trình thay đổi tech stack]({{< relurl "blog-tu-python-sang-go/" >}}) để có được câu trả lời đơn giản ấy — và mỗi lần push code, tôi lại nhận ra sự đơn giản đó đáng giá thế nào.

## Thông tin nhanh

| Thành phần | Trước (Python) | Sau (Go) |
|---|---|---|
| **Thiết lập ngôn ngữ** | setup-python + pip install | setup-go |
| **Pipeline gợi ý** | `python3 ml-related.py` | `go run ./tools/ml-related` |
| **Dependency** | scikit-learn + phụ trợ | 0 (Go stdlib) |
| **Build** | hugo (sau khi cài đủ) | hugo (chỉ cần Go) |
| **Cục bộ** | cần Python + Go | chỉ cần Go |

## Điểm cộng và điều cần biết

| Điểm cộng | Điều cần biết |
|---|---|
| CI ít bước hơn → ít điểm thất bại hơn | File tự sinh cần thư mục được tạo trước khi ghi |
| Môi trường cục bộ giống hệt CI | `go run` biên dịch mỗi lần — chấp nhận được với dự án nhỏ |
| Bất kỳ ai clone về đều build được | Thứ tự chạy pipeline trước Hugo là bắt buộc |

Bốn bài trong chuỗi này đã đi trọn một vòng: từ [thuật toán TF-IDF]({{< relurl "thuat-toan-goi-y-bai-viet-tf-idf-go/" >}}), qua [kiểm chứng định lượng]({{< relurl "kiem-chung-port-go-python/" >}}) và [cái bẫy Unicode]({{< relurl "cat-chuoi-tieng-viet-unicode-go/" >}}), đến quy trình CI gọn như ngày hôm nay. Tất cả xuất phát từ một quyết định duy nhất: [chuyển tech stack của blog sang Go]({{< relurl "blog-tu-python-sang-go/" >}}).
