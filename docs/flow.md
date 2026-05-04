# Luồng Dữ Liệu (Data Flow)

Dự án SOSMAP+SOCIAL sử dụng mô hình luồng dữ liệu một chiều (Unidirectional Data Flow) thông qua các lớp của MVVM và Shared Services.

---

## 🔄 Quy trình nghiệp vụ cơ bản

Mọi tương tác của người dùng trên ứng dụng đều tuân theo quy trình 5 bước:
1.  **Phản hồi Tương tác (View)**: Người dùng thực hiện hành động.
2.  **Xử lý & Validation (ViewModel -> Entity)**: Kiểm tra tính hợp lệ dữ liệu.
3.  **Giao tiếp API (ViewModel -> Service)**: Gọi Backend qua HTTP/SignalR.
4.  **Chuẩn hóa Kết quả (Service -> ViewModel)**: Trả về dữ liệu chuẩn `{ data: T }`.
5.  **Cập nhật UI (ViewModel -> Store -> View)**: Re-render giao diện.

---

## 🟢 Luồng Trạng thái Hoạt động (Real-time Presence Flow)

Hệ thống theo dõi trạng thái On/Off của người dùng theo thời gian thực:

1.  **Kết nối**: Khi người dùng đăng nhập, Frontend kết nối tới `ChatHub` kèm JWT Token.
2.  **Sự kiện Hub**: Hub nhận diện `UserId` từ Token và phát tín hiệu "User Online" tới các client liên quan.
3.  **Lắng nghe (ViewModel)**: `useMessageViewModel` lắng nghe sự kiện `UserPresenceUpdate` từ SignalR.
4.  **Cập nhật**: ViewModel cập nhật thuộc tính `isOnline` trong danh sách hội thoại.
5.  **View**: Trạng thái chấm xanh (Online) hoặc xám (Offline) được cập nhật ngay lập tức trên UI.

---

## 🔴 Luồng Thông báo & Badge (Notification & Badge Flow)

Quản lý hiển thị huy hiệu thông báo tin nhắn mới:

1.  **Incoming Message**: Hub nhận tin nhắn mới và phát sự kiện `ReceiveMessage`.
2.  **State Update**: `useNotificationHub` bắt được sự kiện, tạo thông báo mới loại `MESSAGE` và đưa vào `notificationStore`.
3.  **Counter Logic**: Store tự động tính toán lại `unreadMessageCount` dựa trên các thông báo `isRead: false`.
4.  **Badge Display**: Sidebar và BottomNav lắng nghe store này và hiển thị số lượng tin nhắn chưa đọc ngay lập tức.
5.  **Clear Badge**: Khi người dùng truy cập trang Tin nhắn, ViewModel gọi `markMessagesAsRead()` để đặt lại trạng thái và ẩn badge.

---

## 📱 Luồng Chuyển đổi Giao diện (Responsive Switch Flow)

Cơ chế thích ứng đa thiết bị:

1.  **Detection**: CSS Media Queries theo dõi độ rộng Viewport.
2.  **Layout Switch**: 
    - `Desktop (> 1024px)`: Hiển thị Sidebar đầy đủ.
    - `Tablet (768px - 1024px)`: Sidebar tự động thu gọn (chỉ hiện icon).
    - `Mobile (< 768px)`: Ẩn hoàn toàn Sidebar, kích hoạt `BottomNav` ở dưới cùng màn hình.
3.  **Messenger Flow**: 
    - Trên Mobile, logic `conv-selected` trong ViewModel sẽ điều khiển việc ẩn danh sách để hiện khung chat và ngược lại (Single Column Navigation).

## 👤 Luồng Điều hướng Profile (Dynamic Profile Flow)
Cơ chế hiển thị trang cá nhân dựa trên vai trò và tham số:

1.  **Trigger**: Người dùng bấm vào Avatar hoặc Tên tại bài viết/bình luận.
2.  **Navigation**: Router chuyển hướng tới `/profile/:userId`. Nếu là bản thân, điều hướng tới `/profile` (không param).
3.  **Role Identity**: `ProfileView` lấy thông tin cơ bản từ API `getUserById`.
4.  **Conditional Loading**: 
    - Nếu Role = `VOLUNTEER`: Gọi API `getVolunteerStats` và `getVolunteerHistory` (từ `RescueTask`).
    - Nếu Role = `CITIZEN`: Gọi API `getStats` và `getHistory` (từ `SosReport`).
5.  **Dynamic Display**: View render giao diện tương ứng (Thống kê cứu hộ vs Thống kê SOS) và quản lý quyền chỉnh sửa (Edit button) dựa trên việc so sánh `userId` với `currentUser.id`.

---


## 🛠️ Ví dụ: Optimistic UI Updates
Đối với các hành động như "Thích" hoặc "Bình luận", hệ thống cập nhật React State ngay lập tức trước khi chờ API phản hồi, giúp tăng tốc độ cảm nhận cho người dùng.

---

*(Kiến trúc này đảm bảo tính dự đoán cao và dễ dàng bảo trì)*
