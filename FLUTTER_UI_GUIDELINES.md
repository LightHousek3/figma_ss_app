# Quy ước UI Flutter — SmartShrimp

Tài liệu này là nguồn thống nhất khi chuyển prototype sang Flutter. Mục tiêu là giao diện Owner và KTV dùng cùng ngôn ngữ hình ảnh, không phụ thuộc icon tải từ mạng và không gọi thông báo hệ điều hành trực tiếp cho các phản hồi trong ứng dụng.

## Icon

- Dùng `Icons` có sẵn trong `package:flutter/material.dart`, ưu tiên biến thể `*_rounded` để đồng nhất với prototype.
- Bật `uses-material-design: true` trong `pubspec.yaml`.
- Không trộn nhiều bộ icon và không dùng emoji làm icon chức năng.
- Dùng `Icons.adaptive.arrow_back` và các icon adaptive khi Flutter cung cấp biến thể theo nền tảng.
- Mọi `IconButton` phải có `tooltip`; icon chỉ mang thông tin phải có nhãn ngữ nghĩa phù hợp.

| Ngữ nghĩa | Flutter icon |
| --- | --- |
| Trang chủ | `Icons.home_rounded` |
| Trang trại | `Icons.agriculture_rounded` |
| Ao / nước | `Icons.water_drop_rounded` |
| Vụ nuôi | `Icons.layers_rounded` |
| Nhiệm vụ | `Icons.checklist_rounded` |
| Thông báo | `Icons.notifications_rounded` |
| Nhân sự | `Icons.groups_rounded` |
| Kho vật tư | `Icons.inventory_2_rounded` |
| Phác đồ | `Icons.assignment_rounded` |
| Điều trị | `Icons.medication_rounded` |
| Ca bệnh | `Icons.health_and_safety_rounded` |
| Tìm kiếm | `Icons.search_rounded` |
| Bộ lọc | `Icons.tune_rounded` |
| Chỉnh sửa | `Icons.edit_rounded` |
| Xóa | `Icons.delete_outline_rounded` |
| Thành công | `Icons.check_circle_rounded` |
| Cảnh báo | `Icons.warning_amber_rounded` |
| Lỗi | `Icons.error_outline_rounded` |
| Thông tin | `Icons.info_outline_rounded` |

## Thông báo dùng chung

Ứng dụng Flutter nên có một `AppNoticeService` duy nhất thay vì gọi rải rác `ScaffoldMessenger`, `showDialog` hoặc thông báo native.

- CRUD thành công, cảnh báo ngắn: Material 3 `SnackBar`, có icon, tiêu đề ngắn, nội dung và thao tác hoàn tác khi nghiệp vụ hỗ trợ.
- Lỗi validation ngay tại trường nhập; lỗi toàn form dùng banner/dialog chung, không chỉ dùng SnackBar.
- Popup thông tin/chặn thao tác: component `AppDialog` dựa trên `AlertDialog`.
- Xác nhận hủy/xóa: `AppConfirmDialog`. Trước tiên kiểm tra nghiệp vụ; nếu còn ràng buộc thì hiện toàn bộ danh sách cần xử lý và không hiển thị nút xóa. Khi hợp lệ mới hiện nút xác nhận mang màu nguy hiểm.
- `showModalBottomSheet` chỉ dành cho lựa chọn nhanh hoặc nội dung phụ; flow nhiều bước phải đi sang màn hình riêng.

Bốn mức phản hồi dùng chung:

| Mức | Màu | Dùng cho |
| --- | --- | --- |
| success | xanh lá | Tạo/cập nhật/xóa thành công |
| info | xanh biển | Thông tin trung tính, hướng dẫn bước tiếp theo |
| warning | vàng | Thiếu điều kiện, cần chú ý nhưng chưa gây lỗi dữ liệu |
| danger | đỏ | Lỗi, hành động phá hủy, dữ liệu không hợp lệ |

## Quy tắc xóa theo schema hiện tại

- Farm, ao và vật tư: soft-delete; phải kiểm tra ràng buộc và xác nhận trước khi cập nhật `is_deleted`.
- Vụ nuôi: không có soft-delete trong schema. Không đặt nhãn “Xóa vụ”; dùng “Hủy vụ nuôi”, bắt buộc lý do và giữ lịch sử vận hành.
- Chỉ hiển thị nút xác nhận xóa khi danh sách ràng buộc rỗng. Dialog bị chặn phải nêu từng đối tượng cần xử lý, không dùng câu chung chung “Không thể xóa”.

