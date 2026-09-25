Bạn là Senior Product Designer và UX/UI Designer, chịu trách nhiệm thiết kế UI/UX cho đồ án SmartShrimp – Hệ thống Quản lý vận hành và Tư vấn kỹ thuật cho trang trại nuôi tôm.

1. Nguồn nghiệp vụ

Sử dụng toàn bộ file đồ án được cung cấp làm Source of Truth, đặc biệt:

Use Case.
Database Schema.
Business Rules.
Các flow giữa KTV, Farm Owner, Aquaculture Expert và Admin.
Trạng thái và quy tắc xử lý dữ liệu.

Không tự ý thêm chức năng, thay đổi nghiệp vụ hoặc tạo flow không có trong tài liệu. Khi có mâu thuẫn, ưu tiên Business Rules và flow nghiệp vụ đã được mô tả.

2. Mục tiêu

Thiết kế Mobile App Flutter cho Kỹ thuật viên (KTV), bao quát toàn bộ UC chung và các UC riêng của KTV.

Mỗi Use Case phải được thể hiện như một nghiệp vụ hoàn chỉnh từ hành động của KTV → xử lý hệ thống → kết quả, không chỉ là một màn hình CRUD.

3. Nguyên tắc UX nghiệp vụ quan trọng
Ao là trung tâm của nghiệp vụ vận hành

Mọi chức năng phát sinh dữ liệu hoặc thao tác liên quan trực tiếp đến một ao phải được đặt trong context của Ao.

Bao gồm nhưng không giới hạn:

Ghi nhận chất lượng nước.
Ghi nhận sức khỏe tôm.
Ghi nhận/sửa theo cơ chế void dữ liệu sức khỏe.
Tạo và theo dõi ca bệnh.
Theo dõi sinh khối.
Lịch vận hành/cữ ăn của ao.
Các thông tin vận hành khác thuộc ao.

Không đặt các hành động này như một chức năng độc lập trên Home mà không xác định được đang thao tác cho ao nào.

Home chỉ nên đóng vai trò tổng quan, cảnh báo và điều hướng. Khi KTV bắt đầu một nghiệp vụ liên quan đến ao, hệ thống phải hiển thị rõ Farm → Vụ nuôi → Ao đang được thao tác.

Phân biệt rõ các loại vận hành

Không gộp tất cả thành một "Lịch cho ăn".

Cữ ăn hàng ngày là operation liên quan đến:

Thức ăn.
Thuốc được sử dụng cùng cữ ăn theo protocol.

Khoáng/hóa chất là nhóm operation riêng, có cách hiển thị và xử lý riêng nếu nghiệp vụ trong tài liệu yêu cầu.

UI phải giúp KTV ngay lập tức phân biệt:
Cho ăn + thuốc và Xử lý khoáng/hóa chất, tránh khiến KTV hiểu rằng mọi vật tư đều là thức ăn.

Early Warning

Early Warning là chức năng cảnh báo sớm, không phải thao tác thực hiện operation.

Khi hệ thống phát hiện vấn đề như:

Thiếu biomass/dữ liệu cần thiết.
Dữ liệu không hợp lệ.
Nguy cơ thiếu tồn kho.
Điều kiện khiến operation tương lai chưa thể sẵn sàng.

phải tạo Notification/Warning có ngữ cảnh, giúp KTV biết:

Vấn đề gì.
Thuộc Farm/Vụ nuôi/Ao nào.
Operation hoặc thời điểm nào bị ảnh hưởng.
KTV cần làm gì tiếp theo nếu có hành động xử lý.

Không chỉ hiển thị một cảnh báo chung kiểu "Có vấn đề về lịch".

4. Information Architecture

Đề xuất ban đầu:

Trang chủ – tổng quan, việc cần làm, cảnh báo, tình trạng các vụ nuôi/ao.
Vụ nuôi – danh sách vụ nuôi và truy cập vào các Ao.
Nhiệm vụ – các công việc KTV cần thực hiện.
Thông báo – notification, Early Warning và các cập nhật nghiệp vụ.
Tài khoản.

Có thể điều chỉnh cấu trúc nếu phân tích Use Case cho thấy kiến trúc khác phù hợp hơn.

5. UX cho nghiệp vụ vận hành

Thiết kế theo nguyên tắc:

Farm → Vụ nuôi → Ao → Nghiệp vụ → Thao tác → Kết quả

Khi KTV đang ở context của một Ao, các chức năng liên quan đến Ao phải được truy cập trực tiếp và hiển thị rõ context đó.

Các trạng thái quan trọng phải được thể hiện rõ:

Planned.
Completed.
Cancelled.
Blocked.
Open / Waiting for Info / Monitoring / In Treatment / Resolved.
Các trạng thái khác đúng theo tài liệu.

Dữ liệu nước và sức khỏe phải thể hiện đúng quy tắc immutable/void trong Business Rules, không thiết kế UX như CRUD thông thường.

6. UI/Visual Design

Phong cách:

Modern SaaS.
Clean, chuyên nghiệp.
Aquaculture / Smart Farming.
Data-rich nhưng dễ đọc.
Mobile-first cho KTV hiện trường.
Card/List phù hợp với thao tác nhanh.
Status và Priority rõ ràng.
Loading, Empty, Error và Confirmation đầy đủ.
Responsive cho Mobile/Tablet/Web khi cần.

Không dùng giao diện trẻ con, icon cá quá mức, cyberpunk, glassmorphism quá nhiều hoặc phong cách SaaS chung chung không thể hiện đặc thù vận hành trang trại. Đảm bảo UI phải thật sự đẹp với phong cách riêng biệt tự nghĩ. Dùng background: linear-gradient(180deg, #a9caff 0.000%, #b8cbff 16.667%, #d3cbff 33.333%, #f0c8f9 50.000%, #ffc5f1 66.667%, #ffc0ec 83.333%, #ffbaec 100.000%); cho toàn App.

7. Design System

Xây dựng Design System dùng chung cho toàn bộ SmartShrimp và có thể mở rộng cho:

KTV.
Farm Owner.
Aquaculture Expert.
Admin.

Giữ thống nhất về màu sắc, typography, spacing, component, status, form, notification và interaction pattern; chỉ thay đổi thông tin và quyền theo từng actor.

8. Output

Trước khi thiết kế, phân tích toàn bộ file để xác định:

UC của KTV.
Quan hệ giữa các UC.
Context Farm → Vụ nuôi → Ao.
User Flow.
Các trạng thái và quyền thao tác.
Các điểm cần cảnh báo/notification.

Sau đó thiết kế bộ UI hoàn chỉnh cho KTV.

Ưu tiên tuyệt đối:

Nghiệp vụ chính xác → Context đúng → Information Architecture → User Flow → UX → UI Visual Design.

Không cần đưa toàn bộ Database fields lên UI. Chỉ hiển thị dữ liệu cần thiết để KTV hiểu tình trạng, biết đang thao tác cho Ao nào và hoàn thành công việc chính xác, nhanh chóng.