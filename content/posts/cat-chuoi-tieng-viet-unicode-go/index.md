---
title: 'Cắt chuỗi tiếng Việt theo byte là sai: cái bẫy Unicode trong Go'
slug: cat-chuoi-tieng-viet-unicode-go
date: 2026-08-01T10:01:12+07:00
draft: false
description: 'Cái bẫy Unicode khi cắt chuỗi tiếng Việt trong Go: byte khác ký tự, lỗi NFD dấu rời, và cách sửa pipeline gợi ý bài viết bằng rune slice.'
tags:
  - golang
  - unicode
  - tieng-viet
  - utf-8
  - xu-ly-van-ban
categories:
  - "cong-nghe"
resources:
  - name: featured-image
    src: featured-image.jpg
---

Chuyện bắt đầu với một con số nhỏ nhưng có hậu quả lớn: 5.000. Con số ấy là giới hạn chiều dài phần thân bài viết khi tính toán bài liên quan — một bước "cắt gọn" để pipeline không phải xử lý bài dài cả nghìn dòng. Trong bản Python, dòng code chỉ đơn giản là `body[:5000]`. Khi tôi port sang Go, dòng đầu tiên viết ra cũng tương tự: `body[:5000]`. Đúng cú pháp, đúng ý định, và hoàn toàn sai. Bài này kể về vì sao câu lệnh ấy sai, và bài học Unicode mà tôi phải trả giá bằng một buổi tối truy tìm sự chênh lệch điểm số 0,0001.

Đây là bài thứ ba trong chuỗi tiếp nối câu chuyện chuyển tech stack, sau bài về [thuật toán]({{< relurl "thuat-toan-goi-y-bai-viet-tf-idf-go/" >}}) TF-IDF và quy trình [kiểm chứng]({{< relurl "kiem-chung-port-go-python/" >}}).

## Một ký tự có thể dài bốn byte

Ký tự tiếng Việt "ư" — với dấu ư nằm bên trong — không tồn tại trong bảng mã ASCII. Trong chuẩn UTF-8, nó chiếm tới 3 byte bộ nhớ, dù người đọc chỉ thấy một ký tự duy nhất. Chữ "ừ" có thêm dấu nặng, còn nhiều byte hơn nữa. Điều này vô hại với hầu hết ứng dụng — cho đến khi bạn cắt chuỗi theo vị trí.

Trong Python, `body[:5000]` cắt theo vị trí ký tự: nó đếm 5.000 ký tự đầu tiên theo đúng nghĩa con người hiểu. Trong Go, `body[:5000]` lại cắt theo byte: nó lấy 5.000 byte đầu tiên — tức khoảng 1.600 đến 2.500 ký tự tiếng Việt, tùy vào độ đậm đặc của dấu. Hậu quả gấp đôi: bản Go và bản Python cắt tại những vị trí khác nhau, làm lệch dữ liệu đầu vào của thuật toán; và tệ hơn, vị trí cắt có thể rơi ngay giữa một ký tự nhiều byte, cắt cụt "ư" thành nửa byte rác.

## Vì sao lỗi này khó phát hiện

Điều khiến lỗi này nguy hiểm nhất là sự âm thầm của nó. Chương trình vẫn chạy bình thường, không sập, không cảnh báo — nó chỉ cho ra những bài liên quan hơi khác ở một vài bài viết. Khi tôi chạy bộ so sánh định lượng giữa hai bản, sự lệch hiện ra dưới dạng những điểm số cosine chênh nhau vài phần vạn — không phải vài con số lớn sặc sỡ, mà là những khác biệt tinh vi đủ nhỏ để bị bỏ qua nếu không có phép đo chính xác.

Cách sửa rất ngắn gọn nhưng cần hiểu bản chất vấn đề: chuyển chuỗi sang mảng các ký tự Unicode — trong Go gọi là rune — rồi mới cắt. Đó là chuyển đổi sang một dãy các "đơn vị ký tự" trước khi lấy 5.000 phần tử đầu. Bản sửa chỉ thêm vài dòng, nhưng nó nói lên một nguyên tắc quan trọng: khi xử lý văn bản đa ngôn ngữ, bạn phải quyết định rõ "cắt theo cái gì" — byte, ký tự, hay từ ngữ — và luôn kiểm tra giả định của mình.

## Lỗi NFD: cùng một từ, hai cách viết

Cái bẫy Unicode thứ hai tinh vi hơn nhiều, và nó không nằm trong code mà nằm trong dữ liệu. Trong tiếng Việt, ký tự "ờ" có thể được biểu diễn theo hai cách: một ký tự duy nhất đã có sẵn dấu, hoặc hai ký tự — chữ "o" và dấu "móc" tách rời. Hai cách biểu diễn này hiển thị giống hệt nhau trên màn hình, nhưng trong bộ nhớ máy tính, chúng là những chuỗi byte hoàn toàn khác nhau. Cách viết thứ hai, gọi là NFD, là kết quả khi nội dung bị dán từ nhiều nguồn khác nhau trên web.

Trong quá trình kiểm chứng bản port, có một bài viết cũ trong blog sử dụng dạng NFD cho một vài từ. Vì bản Python và bản Go xử lý chuỗi ký tự ở mức độ khác nhau, bài viết này được gợi ý khác đi — và đó chính là nguồn gốc của 17 vị trí lệch mà tôi đã nhắc đến ở bài kiểm chứng. Lỗi không nằm ở chương trình mà nằm ở dữ liệu, và đúng như triết lý của blog: nâng cấp có bằng chứng, lỗi được ghi chú lại để sửa sau.

## Cách phòng tránh: một quy tắc và một bước kiểm tra

Bài học đầu tiên gói gọn trong một quy tắc: trong Go, khi cần thao tác theo "ký tự", hãy chuyển chuỗi về mảng rune trước. Cắt chuỗi trực tiếp chỉ an toàn khi bạn chắc chắn dữ liệu chỉ chứa ký tự ASCII — một giả định hiếm khi đúng với văn bản tiếng Việt.

Bài học thứ hai là về dữ liệu đầu vào: bất kỳ nội dung nào được thu thập từ nhiều nguồn (gõ tay, dán từ web, chuyển từ tài liệu) đều có nguy cơ chứa hỗn hợp NFD và NFC. Trước khi đưa vào xử lý, nội dung cần được chuẩn hóa về một dạng duy nhất — và trong trường hợp blog này, một bước quét đã được thêm vào để rà soát toàn bộ nội dung, tìm ra những từ viết theo dạng NFD và ghi lại vị trí của chúng. Kết quả quét giúp xác định chính xác bài nào cần sửa.

## Unicode là thứ vô hình nhưng phổ biến

Hai cái bẫy này có một điểm chung: chúng hoạt động ngầm, không báo lỗi, và chỉ lộ ra khi bạn đặt hai kết quả cạnh nhau và đo. Đó là lý do văn bản đa ngôn ngữ là một trong những lĩnh vực mà "nó chạy được" là câu trả lời nguy hiểm nhất. Cũng giống như việc chuyển toàn bộ công cụ sang Go buộc phải nghĩ lại về môi trường build, việc xử lý tiếng Việt buộc bạn phải nghĩ lại về đơn vị dữ liệu — byte không phải là ký tự, và hai văn bản "nhìn giống nhau" chưa chắc là hai chuỗi giống nhau.

## Thông tin nhanh

| Câu hỏi | Trả lời |
|---|---|
| **`body[:5000]` trong Python** | cắt 5.000 ký tự Unicode đầu tiên |
| **`body[:5000]` trong Go** | cắt 5.000 byte đầu — sai với tiếng Việt |
| **Cách sửa** | chuyển sang mảng rune rồi cắt theo phần tử |
| **NFD là gì** | dấu tiếng Việt viết thành ký tự tách rời |
| **Hậu quả** | điểm số lệch, bài liên quan đổi thứ tự |

## Điểm cộng và điều cần biết

| Điểm cộng | Điều cần biết |
|---|---|
| Lỗi được phát hiện bằng phép đo, không phải may mắn | Chỉ cắt chuỗi trực tiếp khi chắc chắn là ASCII |
| Bản sửa ngắn gọn: vài dòng rune slice | Nội dung dán từ web có thể chứa NFD ẩn |
| Quy tắc phòng ngừa áp dụng được mọi nơi | Cần chuẩn hóa dữ liệu đầu vào một lần khi nhập |

Câu chuyện cuối cùng trong chuỗi bài này nói về phía bên kia của hành trình: khi toàn bộ công cụ đã là Go, quy trình CI/CD của blog gọn lại còn một lệnh — và những bài học về môi trường build giảm xuống tối thiểu.
