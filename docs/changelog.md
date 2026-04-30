# Nhật ký thay đổi (Changelog)

Tất cả các thay đổi đáng chú ý của dự án này sẽ được ghi lại trong tệp này.

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
