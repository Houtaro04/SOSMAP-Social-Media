# Công Nghệ & Công Cụ (Technology Stack)

SOSMAP+SOCIAL được xây dựng dựa trên các công nghệ tiên tiến nhất hiện nay cho phát triển ứng dụng web hiện đại (Modern Web Applications).

---

## 💻 Frontend Core
- **React 18**: Thư viện chính cho việc xây dựng UI với kiến trúc Component-based.
- **TypeScript**: Giúp kiểm soát kiểu dữ liệu nghiêm ngặt từ Backend đến Frontend, giảm thiểu lỗi runtime.
- **Vite**: Công cụ đóng gói (Build tool) thế hệ mới mang lại tốc độ cực nhanh trong quá trình phát triển (HMR).

## 🎨 Styling & Responsive Design
- **Tailwind CSS**: Framework CSS tiện ích cho việc thiết kế giao diện linh hoạt và nhanh chóng.
- **Vanilla CSS Components**: Sử dụng kết hợp CSS thuần cho các thành phần UI tùy chỉnh phức tạp đạt mức độ chỉnh chu cao nhất.
- **Mobile-first Strategy**: Thiết kế ưu tiên cho thiết bị di động với hệ thống Grid và Flexbox linh hoạt.
- **Dynamic Theming**: Sử dụng CSS Variables để quản lý đồng nhất màu sắc và kích thước màn hình (Breakpoints).

## 🧠 State Management & Real-time
- **Zustand**: Giải pháp quản lý trạng thái toàn cục nhẹ nhàng, hiệu năng cao và dễ dàng tích hợp.
- **Axios**: Thư viện HTTP Client phổ biến dùng để giao tiếp với các API RESTful từ Backend.
- **Microsoft SignalR**: Hỗ trợ giao tiếp hai chiều thời gian thực.
    - **Messaging**: Truyền tải tin nhắn tức thời.
    - **Real-time Presence**: Theo dõi và cập nhật trạng thái hoạt động (Online/Offline) của người dùng toàn hệ thống.

## 🛠️ Project Patterns & Utilities
- **MVVM Pattern**: Mô hình phân tách lớp dữ liệu, logic nghiệp vụ và giao diện.
- **Centralized Entity Validation**: Tận dụng Class-based Entities để đồng bộ hóa quy tắc kiểm tra dữ liệu toàn dự án.
- **Clean Service Pattern**: Chuẩn hóa phản hồi API `{ data: T }` cho toàn bộ các layer nghiệp vụ.
- **Optimistic UI Updates**: Kỹ thuật cập nhật giao diện lập tức mang lại trải nghiệm mượt mà không độ trễ.
- **Notification Badge System**: Tích hợp đếm thông báo chưa đọc toàn cục thông qua Zustand Store và SignalR, hiển thị huy hiệu (badges) đa thiết bị.
- **Flat Threading Architecture**: Kiến trúc bình luận phân cấp phẳng (kiểu Instagram) giúp tối ưu hóa giao diện di động và tăng hiệu năng render.

---

*(Tài liệu này sẽ được cập nhật định kỳ khi dự án có sự thay đổi về công cụ hỗ trợ)*
