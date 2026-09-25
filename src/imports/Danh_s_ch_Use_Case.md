**USE CASE TỐI ƯU**

SmartShrimp Platform

**Phạm vi:** KTV mobile, Owner mobile, Expert web và Admin web

**Cấu trúc:** Danh sách tên Use Case đã tối ưu;

**Tổng số:** 108 Use Case logic không lặp theo actor

&nbsp;

# **0\. Kết luận rà soát và quyết định**

- Admin tạo Owner trước; KTV/Expert thuộc đúng một Owner và tự kích hoạt tài khoản bằng mã email.
- Không có phân công nhân sự vào Farm: quan hệ managed_by_owner_id tạo tập nhân sự hợp lệ; quyền dữ liệu vận hành vẫn theo phân công vụ.
- Hợp nhất phác đồ nuôi áp dụng và phác đồ điều trị thành protocols/protocol_items; phác đồ nuôi mẫu vẫn là aggregate tái sử dụng riêng.
- Chỉ Owner duyệt phác đồ; phiên bản đã duyệt bất biến và điều chỉnh bằng phiên bản thay thế.
- Cho phép Expert dừng khẩn cấp phác đồ điều trị: bắt buộc lý do, giữ lịch đã hoàn tất và hủy lịch chưa thực hiện; KTV chỉ gửi cảnh báo khẩn.
- Lịch vận hành được sinh theo rolling window 3-7 ngày; liều động dùng sinh khối mới nhất
- DB chỉ giữ ràng buộc tĩnh và trigger updated_at; Application Service quản lý phân quyền, state machine, transaction và orchestration.
- Không có chuyển đàn/chuyển ao, mở lại Disease Case, đa kho, chi phí, generic audit log hoặc Admin review phản hồi AI.
- KTV chỉ đánh giá câu trả lời Chatbox bằng 1-5 sao và bình luận tùy chọn; Admin chỉ xem thống kê tổng hợp hai module AI.

# **1\. Danh sách Use Case tối ưu**

## **1.1. Dùng chung cho cho KTV, Expert và Owner, Admin không có feature Hồ sơ (7 UC)**

| STT | Nhóm chức năng | Tên Use Case           |
| :-: | -------------- | ---------------------- |
|  1  | **Xác thực**   | Đăng nhập              |
|  2  | Xác thực       | Quên mật khẩu          |
|  3  | Xác thực       | Đăng xuất              |
|  4  | Xác thực       | Kích hoạt tài khoản    |
|  5  | **Hồ sơ**      | Xem hồ sơ cá nhân      |
|  6  | Hồ sơ          | Cập nhật hồ sơ cá nhân |
|  7  | Hồ sơ          | Đổi mật khẩu           |

## **1.2. Thông báo dùng chung cho KTV, Expert và Owner (3 UC)**

| STT | Nhóm chức năng | Tên Use Case              |
| :-: | -------------- | ------------------------- |
|  1  | **Thông báo**  | Xem danh sách thông báo   |
|  2  | Thông báo      | Xem chi tiết thông báo    |
|  3  | Thông báo      | Đánh dấu thông báo đã đọc |

## **1.3. Kỹ thuật viên \- KTV (29 UC)**

| STT                        | Nhóm chức năng        | Tên Use Case                         |
| -------------------------- | --------------------- | ------------------------------------ |
| 1                          | **Vụ nuôi**           | Xem danh sách vụ nuôi được phân công |
| 2                          | Vụ nuôi               | Xem chi tiết vụ nuôi                 |
| 3                          | **Chất lượng nước**   | Nhập nhật ký đo nước                 |
| 4                          | Chất lượng nước       | Xem danh sách nhật ký đo nước        |
| 5                          | Chất lượng nước       | Xem chi tiết nhật ký đo nước         |
| 6                          | Chất lượng nước       | Hủy hiệu lực nhật ký đo nước         |
| 7                          | Chất lượng nước       | Xem thống kê chất lượng nước         |
| 8                          | **Vận hành**          | Xem danh sách kế hoạch vận hành      |
| 9                          | Vận hành              | Xem chi tiết kế hoạch vận hành       |
| 10                         | Vận hành              | Ghi nhận thực hiện hoạt động         |
| 11                         | Vận hành              | Xem thống kê vận hành                |
| 12                         | **Sức khỏe tôm**      | Ghi nhận sức khỏe tôm                |
| 13                         | Sức khỏe tôm          | Xem danh sách ghi nhận sức khỏe      |
| 14                         | Sức khỏe tôm          | Xem chi tiết ghi nhận sức khỏe       |
| &nbsp;&nbsp;&nbsp;&nbsp;15 | Sức khỏe tôm          | Hủy hiệu lực bản ghi sức khỏe        |
| 16                         | Sức khỏe tôm          | Xem thống kê sức khỏe và tăng trưởng |
| 17                         | **AI nhận diện bệnh** | Yêu cầu AI nhận diện dấu hiệu bệnh   |
| 18                         | AI nhận diện bệnh     | Xem danh sách lịch sử nhận diện AI   |
| 19                         | AI nhận diện bệnh     | Xem chi tiết kết quả nhận diện AI    |
| 20                         | **RAG Chatbox**       | Gửi câu hỏi tới Chatbox              |
| 21                         | RAG Chatbox           | Xem chi tiết hội thoại Chatbox       |
| 22                         | RAG Chatbox           | Đánh giá câu trả lời Chatbox         |
| 23                         | **Disease Case**      | Tạo Disease Case                     |
| 24                         | Disease Case          | Xem danh sách Disease Case           |
| 25                         | Disease Case          | Xem chi tiết Disease Case            |
| 26                         | Disease Case          | Phản hồi Disease Case                |
| 27                         | **Nhiệm vụ**          | Xem danh sách nhiệm vụ               |
| 28                         | Nhiệm vụ              | Xem chi tiết nhiệm vụ                |
| 29                         | Nhiệm vụ              | Cập nhật trạng thái nhiệm vụ         |

## **1.4. Chuyên gia thủy sản \- Expert (22 UC)**

| STT | Nhóm chức năng                      | Tên Use Case                               |
| :-: | ----------------------------------- | ------------------------------------------ |
|  1  | **Phác đồ nuôi mẫu**                | Xem danh sách phác đồ nuôi mẫu             |
|  2  | Phác đồ nuôi mẫu                    | Xem chi tiết phác đồ nuôi mẫu              |
|  3  | Phác đồ nuôi mẫu                    | Tạo phác đồ nuôi mẫu                       |
|  4  | Phác đồ nuôi mẫu                    | Cập nhật phác đồ nuôi mẫu                  |
|  5  | Phác đồ nuôi mẫu                    | Lưu trữ/Khôi phục phác đồ nuôi mẫu         |
|  6  | **Vụ nuôi & Phác đồ nuôi của vụ**   | Xem danh sách vụ nuôi được phân công       |
|  7  | Vụ nuôi & Phác đồ nuôi của vụ       | Xem thông tin và chỉ số chuyên môn vụ nuôi |
|  8  | Vụ nuôi & Phác đồ nuôi của vụ       | Xem chi tiết phác đồ nuôi của vụ           |
|  9  | Vụ nuôi & Phác đồ nuôi của vụ       | Tạo phác đồ nuôi cho vụ                    |
| 10  | Vụ nuôi & Phác đồ nuôi của vụ       | Cập nhật bản nháp phác đồ nuôi             |
| 11  | Vụ nuôi & Phác đồ nuôi của vụ       | Gửi phác đồ nuôi cho Owner duyệt           |
| 12  | Vụ nuôi & Phác đồ nuôi của vụ       | Xóa bản nháp phác đồ nuôi                  |
| 13  | **Disease Case & Phác đồ điều trị** | Xem danh sách Disease Case được giao       |
| 14  | Disease Case & Phác đồ điều trị     | Xem chi tiết Disease Case                  |
| 15  | Disease Case & Phác đồ điều trị     | Phản hồi Disease Case                      |
| 16  | Disease Case & Phác đồ điều trị     | Đánh dấu Disease Case đã giải quyết        |
| 17  | Disease Case & Phác đồ điều trị     | Xem chi tiết phác đồ điều trị              |
| 18  | Disease Case & Phác đồ điều trị     | Tạo phác đồ điều trị                       |
| 19  | Disease Case & Phác đồ điều trị     | Cập nhật phác đồ điều trị                  |
| 20  | Disease Case & Phác đồ điều trị     | Gửi phác đồ điều trị cho Owner duyệt       |
| 21  | Disease Case & Phác đồ điều trị     | Xóa bản nháp phác đồ điều trị              |
| 22  | Disease Case & Phác đồ điều trị     | Dừng khẩn cấp phác đồ điều trị             |

## **1.5. Chủ trang trại \- Owner (40 UC)**

| STT | Nhóm chức năng        | Tên Use Case                              |
| :-: | --------------------- | ----------------------------------------- |
|  1  | **Farm**              | Xem danh sách Farm                        |
|  2  | Farm                  | Xem chi tiết Farm                         |
|  3  | Farm                  | Tạo Farm                                  |
|  4  | Farm                  | Cập nhật Farm                             |
|  5  | Farm                  | Lưu trữ/Khôi phục Farm                    |
|  6  | **Ao nuôi**           | Xem danh sách ao của Farm                 |
|  7  | Ao nuôi               | Xem chi tiết ao                           |
|  8  | Ao nuôi               | Tạo ao                                    |
|  9  | Ao nuôi               | Cập nhật ao                               |
| 10  | Ao nuôi               | Lưu trữ/Khôi phục ao                      |
| 11  | **Vụ nuôi**           | Xem danh sách vụ nuôi                     |
| 12  | Vụ nuôi               | Xem chi tiết vụ nuôi                      |
| 13  | Vụ nuôi               | Tạo vụ nuôi                               |
| 14  | Vụ nuôi               | Cập nhật vụ nuôi                          |
| 15  | Vụ nuôi               | Kích hoạt vụ nuôi                         |
| 16  | Vụ nuôi               | Hủy vụ nuôi                               |
| 17  | **Thu hoạch**         | Xem danh sách lần thu hoạch               |
| 18  | Thu hoạch             | Xem chi tiết lần thu hoạch                |
| 19  | Thu hoạch             | Ghi nhận thu hoạch                        |
| 20  | **Nhân sự**           | Xem danh sách nhân sự do Owner quản lý    |
| 21  | Nhân sự               | Xem chi tiết nhân sự do Owner quản lý     |
| 22  | Nhân sự               | Phân công nhân sự vào vụ                  |
| 23  | Nhân sự               | Thay nhân sự phụ trách vụ                 |
| 24  | **Nhiệm vụ**          | Xem danh sách nhiệm vụ                    |
| 25  | Nhiệm vụ              | Xem chi tiết nhiệm vụ                     |
| 26  | Nhiệm vụ              | Tạo và giao nhiệm vụ                      |
| 27  | Nhiệm vụ              | Cập nhật nhiệm vụ                         |
| 28  | Nhiệm vụ              | Hủy nhiệm vụ                              |
| 29  | **Phê duyệt phác đồ** | Xem danh sách phác đồ chờ duyệt           |
| 30  | Phê duyệt phác đồ     | Xem chi tiết phác đồ chờ duyệt            |
| 31  | Phê duyệt phác đồ     | Phê duyệt hoặc từ chối phác đồ            |
| 32  | **Disease Case**      | Xem danh sách Disease Case                |
| 33  | Disease Case          | Xem chi tiết Disease Case                 |
| 34  | **Kho vật tư**        | Xem danh sách vật tư và tồn kho           |
| 35  | Kho vật tư            | Xem chi tiết vật tư                       |
| 36  | Kho vật tư            | Tạo vật tư                                |
| 37  | Kho vật tư            | Cập nhật vật tư                           |
| 38  | Kho vật tư            | Lưu trữ/Khôi phục vật tư                  |
| 39  | Kho vật tư            | Ghi nhận nhập kho hoặc điều chỉnh tồn kho |
| 40  | Kho vật tư            | Xem lịch sử biến động kho                 |

## **1.6. Quản trị viên hệ thống \- Admin (7 UC)**

| STT | Nhóm chức năng          | Tên Use Case                          |
| :-: | ----------------------- | ------------------------------------- |
|  1  | **Dashboard & Báo cáo** | Xem tổng quan hệ thống                |
|  2  | Dashboard & Báo cáo     | Xuất báo cáo thống kê hệ thống        |
|  3  | **Tài khoản**           | Xem danh sách tài khoản               |
|  4  | Tài khoản               | Xem chi tiết tài khoản                |
|  5  | Tài khoản               | Tạo tài khoản                         |
|  6  | Tài khoản               | Cập nhật và gửi lại lời mời kích hoạt |
|  7  | Tài khoản               | Thay đổi trạng thái tài khoản         |
