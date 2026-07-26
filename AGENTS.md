# Rules

- Khi viết bài mới, `date` trong frontmatter PHẢI được kiểm tra với giờ thực tế. Không bao giờ đặt `date` ở tương lai. Dùng `TZ=Asia/Saigon date +"%Y-%m-%dT%H:%M:%S+07:00"` để lấy giờ hiện tại và đặt `date` sớm hơn ít nhất 1 phút so với thời điểm commit.
- Không bao giờ tự ý đặt ngày tháng mà không kiểm tra thời gian thực.
- Tuân thủ cấu trúc bài viết có sẵn (frontmatter, categories, tags).
