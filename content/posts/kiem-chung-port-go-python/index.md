---
title: 'Kiểm chứng bản port Go: bộ từ vựng khớp 6303/6304, sai số 0,0001'
slug: kiem-chung-port-go-python
date: 2026-08-01T10:01:12+07:00
draft: false
description: 'Cách kiểm chứng bản port Go từ Python: so bộ từ vựng 6303/6304, so điểm cosine sai lệch dưới 0,0001, và thứ tự bài liên quan khớp 103/120.'
tags:
  - golang
  - python
  - machine-learning
  - kiem-thu
  - migration
categories:
  - "cong-nghe"
resources:
  - name: featured-image
    src: featured-image.jpg
---

Khi tôi nói với một người bạn rằng mình vừa viết lại toàn bộ pipeline gợi ý bài viết từ [Python sang]({{< relurl "blog-tu-python-sang-go/" >}}) Go, câu hỏi đầu tiên của anh ấy không phải "nhanh hơn bao nhiêu?" mà là "làm sao mày biết nó vẫn chạy đúng?". Đó chính là câu hỏi đúng đắn nhất. Viết lại một thuật toán sang ngôn ngữ khác là một chuyện; chứng minh bản viết lại cho kết quả như bản gốc lại là chuyện hoàn toàn khác. Bài này kể về cách tôi trả lời câu hỏi đó — không bằng niềm tin, mà bằng ba con số: 6303/6304, 0,0001 và 103/120.

Đây là bài thứ hai trong chuỗi tiếp nối câu chuyện chuyển tech stack, sau khi đã mổ xẻ thuật toán TF-IDF ở bài trước.

## Tại sao "chạy được" chưa đủ

Cách kiểm chứng ngây thơ nhất — và cũng là cách dễ mắc bẫy nhất — là chạy bản mới lên, thấy nó in ra kết quả, rồi kết luận "vẫn hoạt động". Với một pipeline gợi ý bài viết, lỗi tinh vi sẽ không làm chương trình sập: nó chỉ khiến một vài bài liên quan bị chọn sai ở đâu đó, giữa hơn một trăm bài viết, và không một ai để ý trong nhiều tuần.

Vấn đề còn nghiêm trọng hơn vì bản gốc là scikit-learn — một thư viện học máy hoàn chỉnh với hàng nghìn dòng logic ẩn bên trong. Bạn không thể chắc chắn "tái hiện đúng" một thuật toán chỉ bằng cách đọc tài liệu; có những chi tiết hành vi chỉ tồn tại trong code thực tế. Vì vậy, chiến lược kiểm chứng được xây dựng theo nguyên tắc: đo mọi thứ có thể đo được, so sánh mọi thứ có thể so sánh được, và ghi chú lại những gì không thể khớp tuyệt đối.

## Kiểm chứng thứ nhất: bộ từ vựng phải giống nhau

Bước so sánh đầu tiên nằm ngay ở nền tảng: tokenizer. Trước khi tính điểm, hai hệ thống phải tách văn bản thành cùng một tập hợp các từ. Nếu bước này khác nhau, mọi bước sau sẽ khác nhau như hai dòng sông rẽ nhánh.

Vì vậy, tôi chạy cả hai chương trình trên cùng dữ liệu, ghi lại toàn bộ từ vựng của mỗi bản, rồi so hai tập hợp này với nhau. Kết quả: 6.303 từ khớp, chênh đúng một từ. Lỗi lệch duy nhất đến từ cơ chế phân hạng nội bộ của scikit-learn: khi hai từ có cùng thứ tự xuất hiện, thư viện dùng thuật toán sắp xếp quicksort của numpy để phân giải, và thứ tự sắp xếp của quicksort không phải là thứ tự ổn định — nó phụ thuộc vào cách numpy chọn trục chia. Đây là hành vi không thể (và không nên) tái hiện trong Go.

Quyết định được đưa ra tại thời điểm đó: bỏ hẳn giới hạn `max_features` mà bản Python dùng — một tham số cắt từ vựng xuống 5.000 từ. Vì bản Go chạy đủ nhanh, không cần giới hạn này nữa, và việc bỏ nó loại bỏ hoàn toàn vùng tranh chấp tie-break của numpy. Kết quả cuối cùng là hai bộ từ vựng khớp nhau 6303/6304 — với sự chênh lệch một từ duy nhất đã được xác định rõ nguyên nhân và chấp nhận được.

## Kiểm chứng thứ hai: điểm số phải gần như bằng nhau

Từ vựng khớp là điều kiện cần nhưng chưa đủ. Hai hệ thống có thể tách ra cùng một bộ từ, nhưng tính điểm khác nhau do sai lệch trong phép toán dấu phẩy động hoặc thứ tự phép tính.

Để kiểm tra lớp này, tôi so sánh điểm số cosine của từng cặp bài liên quan giữa hai bản. Tiêu chí được đặt ra là sai số dưới 0,0001 — ngưỡng sai số làm tròn của số dấu phẩy động, đủ nhỏ để đảm bảo hai phép toán "giống nhau về thực chất". Kết quả: toàn bộ điểm số nằm trong ngưỡng. Điều này xác nhận cả công thức TF-IDF lẫn phép tính cosine đều được chuyển dịch chính xác.

Có một chi tiết đáng chú ý trong lần kiểm tra này: bản Python cắt phần thân bài viết theo số lượng ký tự, còn bản Go đầu tiên cắt theo số byte — và vì tiếng Việt có dấu nên hai cách cắt này cho ra hai vị trí khác nhau, làm sai lệch điểm số. Lỗi này được phát hiện chính nhờ kiểm chứng định lượng, và được sửa bằng cách chuyển sang cắt theo ký tự Unicode. Đó là minh chứng rõ ràng nhất cho giá trị của việc đo lường: không có con số so sánh, lỗi tinh vi này sẽ chui thẳng vào production.

## Kiểm chứng thứ ba: thứ tự bài liên quan

Kiểm chứng cuối cùng cũng là kiểm chứng gần nhất với trải nghiệm thực tế của người đọc: với mỗi bài viết, bốn bài liên quan được gợi ý phải xuất hiện đúng thứ tự như bản cũ. Có 120 vị trí cần khớp (mỗi bài viết có 4 vị trí gợi ý, nhân với số bài viết), và kết quả là 103 vị trí khớp chính xác.

17 vị trí lệch không phải lỗi của bản port — chúng đến từ một lỗi chính tả trong nội dung một bài viết cũ: một từ có dấu tiếng Việt được viết theo dạng ký tự tổ hợp (NFD) khác với chuẩn. Vì bản Python và bản Go xử lý ký tự Unicode theo hai cách khác nhau, bài viết này được gợi ý hơi khác. Với một dự án thật, đây là kết quả có thể chấp nhận được: lỗi nằm ở dữ liệu, không nằm ở chương trình, và nó được ghi chú lại để sửa trong một lần dọn nội dung sau.

## Vì sao ba tầng kiểm chứng này có giá trị

Ba phép so sánh này tạo thành ba lớp bảo vệ, mỗi lớp bắt một loại lỗi khác nhau: bộ từ vựng bắt lỗi tokenizer, điểm số bắt lỗi công thức toán, và thứ tự bài bắt lỗi tổng hợp cũng như lỗi dữ liệu. Chúng bổ sung cho nhau, và nếu chỉ làm một trong ba, sẽ có những lỗi lọt lưới.

Quan trọng hơn, cách tiếp cận này tạo ra một tư duy có thể lặp lại: mỗi lần sửa code trong tương lai, tôi có thể chạy lại toàn bộ bộ so sánh để đảm bảo không có gì thay đổi ngoài ý muốn. Bài học lớn nhất của lần migration này không phải là "viết lại xong rồi tin là đúng", mà là "đo lường mọi thứ rồi mới tin". Điều này cũng gợi nhớ một bài học lớn hơn về việc chuyển tech stack của blog: nâng cấp có bằng chứng luôn đáng giá hơn nâng cấp theo cảm tính.

## Thông tin nhanh

| Phép kiểm chứng | Tiêu chí | Kết quả |
|---|---|---|
| **Bộ từ vựng** | hai bản tách ra cùng tập từ | khớp 6303/6304 từ |
| **Điểm cosine** | sai số trong ngưỡng làm tròn | sai < 0,0001 |
| **Thứ tự gợi ý** | 4 vị trí × số bài viết | khớp 103/120 |
| **Tốc độ** | thời gian chạy pipeline | nhanh hơn ~10 lần |

## Điểm cộng và điều cần biết

| Điểm cộng | Điều cần biết |
|---|---|
| Ba tầng kiểm chứng bắt được ba lớp lỗi khác nhau | Tie-break của numpy quicksort không thể tái hiện — phải bỏ max_features |
| Phát hiện lỗi cắt chuỗi theo byte nhờ đo lường | 17 vị trí lệch do lỗi chính tả NFD trong bài cũ |
| Quy trình lặp lại được cho mọi thay đổi tương lai | Kiểm chứng cần giữ dữ liệu cũ để so sánh |

Muốn hiểu lỗi cắt chuỗi theo byte nguy hiểm thế nào với tiếng Việt — và vì sao "một ký tự" không phải lúc nào cũng là "một byte" — bài tiếp theo trong chuỗi sẽ kể về cái [bẫy Unicode]({{< relurl "cat-chuoi-tieng-viet-unicode-go/" >}}) khi cắt chuỗi tiếng Việt.
