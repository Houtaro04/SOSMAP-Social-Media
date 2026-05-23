# Nhật ký thay đổi (Changelog)

Tất cả các thay đổi đáng chú ý của dự án này sẽ được ghi lại trong tệp này.

## [Chưa phát hành] - 2026-05-23

### Thêm mới & Cập nhật
- **Tài liệu (Docs)**: Cập nhật tài liệu thiết kế hệ thống (`chapter3.md`), mô tả lại chính xác cơ chế **Đăng nhập không mật khẩu (Passwordless OTP)** thay vì đăng ký/đăng nhập truyền thống.
- **Tài liệu (Docs)**: Cập nhật file `tech.md` để bổ sung ngăn xếp công nghệ bản đồ (MapLibre, Nominatim Geocoding, OSRM Routing).
- **Trải nghiệm Bản đồ (Map UX)**:
  - Bổ sung cơ chế **Focus Mode** (Chế độ Dẫn đường): Khi bấm dẫn đường, tất cả các Marker khác trên bản đồ sẽ tự động được ẩn đi, chỉ giữ lại vị trí người bị nạn và đường đi màu xanh để tránh rối mắt.
  - Tự động thay đổi hệ số Zoom linh hoạt (Dynamic Zoom) dựa trên khoảng cách địa lý (Haversine Distance) giữa tình nguyện viên và nạn nhân.
  - Cập nhật giao diện bản đồ sang tông màu sáng (Positron Light Theme).
  - Gỡ bỏ thuộc tính `maxBounds`, cho phép người dùng thoải mái zoom out ra toàn thế giới.

### Sửa lỗi
- Khắc phục lỗi mất Icon Nạn nhân khi đang dẫn đường: Xây dựng cơ chế **Local Geocode Cache** (Bộ nhớ tạm cục bộ) để bảo toàn tọa độ của nạn nhân không bị ghi đè bởi dữ liệu gốc không có tọa độ từ cơ sở dữ liệu mỗi khi Refresh trạng thái.
- Tinh chỉnh thuật toán sinh dữ liệu Mock (Gen 1000 Data) để hiển thị trong phạm vi biên giới Việt Nam.

## [Chưa phát hành] - 2026-05-05

### Sửa lỗi & Cải thiện
- Sửa lỗi cuộn đến bài viết mục tiêu (Deep Linking) từ thông báo, đảm bảo hoạt động chính xác ngay cả sau khi tải lại trang (Reload).
- Triển khai tính năng tự động làm mới dữ liệu (Auto-refresh) và cuộn lên đầu trang khi người dùng nhấn lại vào mục "Bảng tin" trên thanh điều hướng.
- Sử dụng `location.key` để quản lý vòng đời component, giúp đồng bộ hóa trạng thái giao diện một cách nhất quán trên cả Desktop và Mobile.

## [Chưa phát hành] - 2026-05-02

### Thêm mới
- Triển khai điều hướng hồ sơ người dùng động (`/profile/:userId`) cho cả module Người dân và Tình nguyện viên.
- Tương tác hóa Avatar và Tên người dùng trong bảng tin và phần bình luận để dẫn đến trang cá nhân.
- Tự động nhận diện vai trò (CITIZEN/VOLUNTEER) trên trang cá nhân để hiển thị bộ số liệu thống kê (Stats) phù hợp:
    - **Tình nguyện viên**: Nhiệm vụ hoàn thành, Tổng nhiệm vụ, Tỷ lệ thành công, Lịch sử nhiệm vụ.
    - **Người dân**: Yêu cầu đã gửi, Yêu cầu hoàn thành, Yêu cầu đang xử lý, Lịch sử cứu trợ.
- Thêm nhãn trạng thái (Status Tag) trực quan cho danh sách lịch sử cứu trợ (ĐANG XỬ LÝ / ĐÃ HOÀN THÀNH).

### Sửa lỗi & Cải thiện
- Sửa lỗi điều hướng trang cá nhân của bản thân bị trống số liệu bằng cách tự động nhận diện `userId` hiện tại.
- Cải thiện `profileService` để hỗ trợ lọc dữ liệu thống kê và lịch sử theo `userId` thông qua `FilterJson`.
- Ẩn các chức năng chỉnh sửa và thông tin nhạy cảm khi xem hồ sơ của người dùng khác.
- Gỡ bỏ widget "Hoạt động tuần này" và thông tin người dùng thừa ở Sidebar theo yêu cầu tối giản giao diện.
- Sửa lỗi hiển thị ảnh bài viết bị cắt xén (object-fit: cover) để đảm bảo hiện đầy đủ nội dung ảnh.

## [Chưa phát hành] - 2026-04-30

### Thêm mới
- Thêm trường `fullName` và `phoneNumber` vào `SosReportResponse` trong `src/shared/entities/SosEntity.ts`.
- Hiển thị tên người yêu cầu (`fullName`) trong `SosDetailModal` và `AdminSosDetailModal`.
- Hiển thị tên người yêu cầu trong các thẻ yêu cầu cứu trợ tại `VolunteerRequestsView`.
- Hiển thị tên người yêu cầu trong danh sách sự cố và modal chi tiết tại `VolunteerMapView`.
- Hiển thị tên người yêu cầu trong popup sự cố tại `OperationMapView` (Giao diện Người dân).
- Thêm cột "Người yêu cầu" vào bảng báo cáo SOS trong `AdminDashboardView`.
- Thêm huy hiệu thông báo tin nhắn mới theo phong cách Instagram (chấm đỏ kèm số lượng) trên Sidebar và Bottom Navigation.
- Thêm nút "Phản hồi" cho bình luận và các phản hồi con, hỗ trợ tương tác phân cấp phẳng kiểu Instagram.
- Thay thế tab "Thành tích & Huy hiệu" bằng tab "Tin tức đã chia sẻ" trong Hồ sơ Tình nguyện viên.
- Triển khai logic `markMessagesAsRead` trong `notificationStore` để tự động xóa huy hiệu tin nhắn khi người dùng vào Hộp thư.

### Sửa lỗi & Cải thiện
- Cập nhật `sosService.submitSosRequest` để bao gồm `FullName` và `PhoneNumber` trong dữ liệu gửi lên API.
- Sửa lỗi `useAdminDashboardViewModel.ts` để ánh xạ chính xác tên người yêu cầu bằng cách kết hợp báo cáo SOS với danh sách người dùng.
- Gỡ bỏ huy hiệu "Tiết lộ tên ẩn danh" khỏi `SosFormModal.tsx` để đảm bảo tính minh bạch theo yêu cầu.
- Sửa lỗi cuộn trang trong `CitizenLayout` và `VolunteerLayout` bằng cách thêm `overflow-y: auto`.
- Gỡ bỏ thông tin "Giờ phục vụ" không chính xác khỏi Hồ sơ Tình nguyện viên.
- Triển khai tính năng tính toán thời gian thực cho số liệu thống kê hàng tuần trong Hồ sơ Tình nguyện viên.
- Sửa lỗi sắp xếp thông báo để luôn hiển thị những thông báo mới nhất ở đầu danh sách.
- Sửa các lỗi layout UI khiến tên người dùng và các nút điều hướng bị xuống dòng hoặc chồng chéo không hợp lý.
- Gỡ bỏ các nút "Thêm" (3 chấm) và "Chia sẻ" không có chức năng khỏi thanh hành động của bài viết.
- Sửa lỗi cú pháp JSX và cải thiện tính đồng nhất của mã nguồn trong các module mạng xã hội của Người dân và Tình nguyện viên.
