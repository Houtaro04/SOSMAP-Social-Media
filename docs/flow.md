# Luồng Dữ Liệu (Data Flow)

Dự án SOSMAP+SOCIAL sử dụng mô hình luồng dữ liệu một chiều (Unidirectional Data Flow) thông qua các lớp của MVVM và Shared Services. Điều này giúp đảm bảo dữ liệu luôn được kiểm soát chặt chẽ từ khi người dùng nhập vào cho đến khi được gửi đến Backend.

---

## 🔄 Quy trình nghiệp vụ cơ bản

Mọi tương tác của người dùng trên ứng dụng đều tuân theo quy trình 5 bước sau:

### 1. Phản hồi Tương tác (View)
- Người dùng thực hiện hành động trên giao diện (ví dụ: Click nút "Gửi Tin Nhắn").
- Giao diện (View) gọi hàm xử lý tương ứng từ ViewModel.

### 2. Xử lý Nghiệp vụ & Validation (ViewModel -> Entity)
- ViewModel tiếp nhận dữ liệu từ View.
- ViewModel khởi tạo **Entity** phù hợp (ví dụ: `MessageEntity`).
- Gọi phương thức `entity.validate()` để kiểm tra dữ liệu (như nội dung tin nhắn không được trống).
- Nếu dữ liệu không hợp lệ, ViewModel cập nhật trạng thái `Error` cho View hiển thị.

### 3. Giao tiếp API (ViewModel -> Service)
- Nếu dữ liệu hợp lệ, ViewModel ra lệnh cho **Service** thực hiện cuộc gọi API.
- Cập nhật trạng thái `Loading = true` để View hiển thị hiệu ứng chờ.

### 4. Chuẩn hóa & Xử lý Kết quả (Service -> ViewModel)
- Service gọi Backend qua HTTP/SignalR (`api.ts`).
- Service nhận phản hồi, chuẩn hóa dữ liệu thành `{ data: T }` và trả lại cho ViewModel.
- ViewModel cập nhật trạng thái `Loading = false`.

### 5. Cập nhật Trạng thái Toàn cục & Giao diện (ViewModel -> Store -> View)
- Nếu tác vụ cần ghi nhớ (như Lưu Token đăng nhập), ViewModel cập nhật dữ liệu vào **Global Store** (Zustand).
- ViewModel cập nhật State của chính nó (như danh sách tin nhắn mới).
- View tự động vẽ lại (re-render) để hiển thị thông tin mới nhất đến người dùng.

---

## 🛠️ Ví dụ minh họa: Luồng Gửi Yêu Cầu Cứu Trợ (SOS)

1.  **View**: `SosFormModal.tsx` nhận người dùng nhập thông tin địa chỉ, mô tả -> Click "Gửi Cứu Trợ".
2.  **ViewModel**: `useSosFormViewModel.ts` -> Khởi tạo `SosEntity` -> `validate()` kiểm tra địa chỉ có trống không.
3.  **Service**: `sosService.ts` -> Nhận dữ liệu SOS -> Call `POST /api/SosReport`.
4.  **ViewModel**: Nhận kết quả thành công từ Service -> Thông báo cho View đóng Modal.
5.  **View**: `SosFormModal` đóng lại, hiển thị thông báo "Đã gửi yêu cầu thành công!".

---

*(Kiến trúc này giúp chúng ta dễ dàng Mock dữ liệu (Stub/Mock) để Test ViewModel mà không cần quan tâm đến Giao diện hay API thật)*
