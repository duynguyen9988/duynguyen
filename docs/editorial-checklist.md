# Checklist biên tập cho Duy Nguyen Blog

Áp dụng cho mọi bài mới và mọi lần cập nhật nội dung đáng kể. Đây là **cổng tự rà soát của người viết**, không phải điều kiện kỹ thuật chặn Hugo build hay deploy.

Mục tiêu là giúp mỗi bài trả lời rõ ba câu hỏi: **ai viết, viết như thế nào và viết để giúp ai**. Checklist này được điều chỉnh cho blog từ [Google Search Essentials](https://developers.google.com/search/docs/essentials) và hướng dẫn [nội dung hữu ích, đáng tin cậy, ưu tiên con người](https://developers.google.com/search/docs/fundamentals/creating-helpful-content).

## 1. Chọn đúng loại bài trước khi viết

Chọn **một** loại chính và giữ lời hứa đó trong nội dung:

- [ ] **Tổng hợp có nguồn:** giải thích hoặc đặt thông tin vào bối cảnh. Nêu nguồn rõ; không giả vờ đã trải nghiệm, thử nghiệm hay phỏng vấn.
- [ ] **Trải nghiệm/đánh giá:** tác giả thực sự đã đến, dùng hoặc xem sản phẩm/dịch vụ/tác phẩm. Nêu thời điểm, phạm vi trải nghiệm, tiêu chí và giới hạn; dùng ảnh hoặc ghi chép gốc nếu có.
- [ ] **Phân tích/hướng dẫn:** kết luận dựa trên nguồn đã dẫn, dữ liệu hoặc quá trình tự làm có thể mô tả lại. Phân biệt dữ kiện với nhận định.
- [ ] **Tin/cập nhật:** dùng nguồn gốc hoặc nguồn chính thức; ghi ngày kiểm tra thông tin. Không biến tin chưa xác nhận thành sự thật.

**Không được tạo ra trải nghiệm, ảnh, trích dẫn, số liệu, chuyến đi, thử nghiệm hay ý kiến của người khác mà tác giả không thực sự có.** Với bài được giao chỉ dựa trên Wikipedia hoặc văn bản nguồn, mọi dữ kiện vẫn phải bám sát nguồn được giao; bài đó nên được thể hiện trung thực là một bài tổng hợp có nguồn.

## 2. Trước khi soạn: xác định giá trị cho độc giả

- [ ] Viết một câu: “Bài này giúp **[nhóm độc giả cụ thể]** làm rõ/ra quyết định/thực hiện **[mục tiêu cụ thể]**.”
- [ ] Có lý do hợp lý để đăng trên blog ngay cả khi không có lượt tìm kiếm từ Google.
- [ ] Tiêu đề mô tả đúng nội dung, không giật gân và không hứa điều bài không chứng minh được.
- [ ] Bài trả lời đủ câu hỏi chính của người đọc, không kéo dài chỉ để đạt số từ hoặc chèn từ khóa.
- [ ] Nếu chủ đề nằm ngoài kinh nghiệm của tác giả, phạm vi bài được thu hẹp về tổng hợp có nguồn hoặc bài được người có chuyên môn rà soát.

## 3. Nguồn, dữ kiện và tính cập nhật

- [ ] Mọi dữ kiện có thể kiểm chứng (con số, ngày tháng, giá, giờ mở cửa, thông số, trích dẫn, lịch chiếu, tình trạng sản phẩm) đều có nguồn phù hợp.
- [ ] Ưu tiên nguồn gốc cho thông tin có thể thay đổi: website đơn vị cung cấp, tài liệu chính thức, công bố của tổ chức, báo cáo/dữ liệu gốc. Wikipedia chỉ nên là điểm khởi đầu, không phải nguồn duy nhất cho giá, lịch, thông số hoặc tin mới.
- [ ] Với bài tổng hợp dựa trên nguồn được giao, không thêm dữ kiện ngoài nguồn đó. Khi thiếu bằng chứng, bỏ nhận định thay vì suy đoán.
- [ ] Có mục `## Nguồn và phương pháp` ở cuối bài nếu bài dùng dữ kiện hoặc đánh giá: liệt kê liên kết nguồn, ngày truy cập/kiểm tra khi thông tin biến động, và cách thực hiện trải nghiệm hoặc so sánh.
- [ ] Trích dẫn đặt gần nhận định mà nó chứng minh; không biến quảng cáo, nội dung tài trợ hay liên kết tiếp thị thành thông tin biên tập độc lập.
- [ ] Chỉ đổi `lastmod` khi nội dung thực sự được xem xét hoặc cập nhật; ghi rõ ngày kiểm tra với thông tin biến động.

Mẫu tối thiểu:

```md
## Nguồn và phương pháp

- Nguồn chính: [Tên nguồn](https://example.com/) — kiểm tra ngày 2026-07-28.
- Trải nghiệm của tác giả: [địa điểm/sản phẩm], thực hiện ngày [ngày]; [phạm vi và giới hạn].
```

Xóa các dòng không áp dụng; không điền thông tin minh họa như thể là thật.

## 4. Giá trị nguyên bản: phải có ít nhất một

- [ ] Trải nghiệm trực tiếp có bằng chứng và bối cảnh.
- [ ] Phân tích, so sánh hoặc diễn giải riêng dựa trên các nguồn đã nêu.
- [ ] Dữ liệu, ảnh, ghi chép, bảng kiểm hoặc quy trình do tác giả thực hiện.
- [ ] Hướng dẫn có thể làm theo, kèm điều kiện áp dụng và giới hạn.
- [ ] Góc nhìn địa phương hữu ích cho độc giả Việt Nam/Sài Gòn.

Chỉ viết lại hoặc dịch một nguồn thứ cấp, kể cả khi câu văn trôi chảy, **chưa đủ** giá trị nguyên bản. Nếu chưa có giá trị bổ sung xác thực, xuất bản nó như một bản tổng hợp ngắn, minh bạch về nguồn và đưa vào danh sách cần bổ sung sau.

## 5. Tác giả, quy trình và tính minh bạch

- [ ] Front matter có `author` đúng với người chịu trách nhiệm nội dung; byline dẫn đến hồ sơ tác giả khi trang hồ sơ đã có.
- [ ] Tác giả có thể giải thích mình biết điều này từ đâu, đã làm gì, đã dùng nguồn nào và đâu là giới hạn của bài.
- [ ] Ảnh do tác giả tự chụp được ghi chú phù hợp; ảnh minh họa/nguồn bên thứ ba có quyền sử dụng rõ ràng.
- [ ] Nếu AI hoặc tự động hóa tạo phần đáng kể của bài, việc sử dụng được biên tập viên kiểm tra dữ kiện và được minh bạch ở nơi người đọc hợp lý sẽ mong đợi.
- [ ] Nội dung tài trợ, liên kết tiếp thị, quà tặng hoặc xung đột lợi ích được gắn nhãn rõ và tách khỏi kết luận biên tập.

## 6. Kiểm tra bản thảo và trải nghiệm đọc

- [ ] Mở bài nêu vấn đề/góc nhìn và cho người đọc biết họ sẽ nhận được gì.
- [ ] Mỗi H2/H3 có chức năng rõ; đoạn văn, ảnh, chú thích và liên kết nội bộ giúp đọc tiếp thay vì lặp lại từ khóa.
- [ ] Sửa lỗi chính tả, câu mơ hồ, dữ kiện mâu thuẫn và liên kết hỏng.
- [ ] Liên kết nội bộ dùng đường dẫn `/duynguyen/slug/`; liên kết ngoài có mô tả đúng đích đến.
- [ ] Front matter tuân thủ các quy tắc hiện hành: `slug` khớp thư mục; `categories` và `tags` là danh sách; không đặt ngày tương lai; ảnh là page resource local và được Hugo xử lý WebP.
- [ ] Nội dung có thể đọc và hiểu mà không cần bấm qua nhiều trang khác.

## 7. Cổng xuất bản

**Dừng xuất bản** cho đến khi sửa nếu có một trong các điều sau:

- [ ] Dữ kiện quan trọng không có nguồn hoặc không thể kiểm chứng.
- [ ] Trải nghiệm, ảnh, trích dẫn, review hay thử nghiệm được tạo dựng.
- [ ] Tiêu đề/mô tả đánh lừa hoặc kết luận mạnh hơn bằng chứng.
- [ ] Giá, lịch, thông số hay tin mới không có nguồn chính thức và ngày kiểm tra.
- [ ] Bài gần như chỉ viết lại một nguồn mà không nói rõ đó là bài tổng hợp.

Trước khi bấm publish, người biên tập ghi một dòng trong PR/commit hoặc ghi chú nội bộ: `Đã rà checklist biên tập — [loại bài] — [người rà] — [ngày]`.

## 8. Áp dụng cho kho bài hiện có

Không sửa ngày hoặc viết lại hàng loạt chỉ để tạo tín hiệu “mới”. Lập danh sách cải thiện theo ba nhãn:

1. **Giữ dạng tổng hợp:** thêm nguồn rõ, chỉnh các kết luận vượt nguồn và ghi phạm vi bài.
2. **Nâng cấp bằng giá trị gốc:** chỉ khi tác giả có trải nghiệm thật, ảnh/góc nhìn/dữ liệu có thể kiểm chứng.
3. **Cập nhật hoặc gỡ kết luận biến động:** ưu tiên bài về giá, địa điểm, sản phẩm công nghệ, tài chính, sự kiện và dự báo.

Ưu tiên kiểm tra thủ công các bài có tiêu đề “top”, “so sánh”, “2026/2030”, tài chính, sức khỏe, công nghệ hoặc địa điểm; những chủ đề này dễ có thông tin thay đổi nhanh hoặc ảnh hưởng quyết định của người đọc.
