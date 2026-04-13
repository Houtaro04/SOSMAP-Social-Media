# Chi Tiết Vai Trò Các Thành Phần (Architecture Roles)

Tài liệu này giải thích cụ thể "phần này để làm gì, phần kia để làm gì" trong kiến trúc **MVVM + Shared Resources** mới nhất của dự án. 

---

## 1. Tầng Model (Entity)
**Vị trí:** `src/shared/entities/*.ts`
- **Để làm gì?** 
  - Là "khuôn mẫu" của dữ liệu ứng dụng.
  - Chứa logic nghiệp vụ liên quan đến dữ liệu (như validate dữ liệu đầu vào).
- **Hoạt động ra sao?** 
  - Một Entity không chỉ là interface thô. Nó là một **Class** có hành vi. Ví dụ, `AuthEntity.ts` không chỉ khai báo các trường email, phone mà còn có phương thức `.validate()` để kiểm tra xem mật khẩu có khớp hay email có đúng định dạng không trước khi được xử lý tiếp.
  - Lợi ích: Logic kiểm tra dữ liệu nằm tập trung tại Entity, giúp toàn bộ dự án dùng chung một bộ quy tắc.

## 2. Tầng Service
**Vị trí:** `src/shared/services/*.ts`
- **Để làm gì?**
  - Chuyên môn hóa việc giao tiếp với Backend qua API (HTTP/WebSocket).
- **Hoạt động ra sao?**
  - Nhận yêu cầu từ ViewModel, thực hiện gọi API (thông qua `api.ts`), xử lý phản hồi và trả về dữ liệu chuẩn hóa dạng `{ data: T }`.
  - Service không quan tâm đến giao diện (View). Nó chỉ tập trung vào việc lấy và gửi dữ liệu một cách an toàn nhất.

## 3. Tầng ViewModel 
**Vị trí:** `src/modules/<domain>/viewmodels/*.ts`
- **Để làm gì?**
  - Đóng vai trò là "Người điều phối" (Orchestrator). Nó chắp nối Entity, Service và Global Store lại với nhau để phục vụ cho giao diện cụ thể.
- **Hoạt động ra sao?**
  - Hứng dữ liệu từ người dùng nhập qua View.
  - Khởi tạo Entity để kiểm soát tính đúng đắn (`entity.validate()`).
  - Ra lệnh cho Service thực thi logic nghiệp vụ (như gửi tin nhắn, cập nhật hồ sơ).
  - Cập nhật Global Store (Zustand) nếu cần thiết để đồng bộ dữ liệu toàn cục.
  - Quản lý trạng thái Loading, Error cho View hiển thị.

## 4. Tầng View (Giao Diện)
**Vị trí:** `src/modules/<domain>/views/*.tsx` (kèm file `.css`)
- **Để làm gì?**
  - Chuyên trách vẽ giao diện người dùng và nhận tương tác (click, type). 
- **Hoạt động ra sao?**
  - View "ngu ngốc" (Dumb UI): Nó không hề biết API gọi ra sao hay dữ liệu được validate thế nào. Nó chỉ tiêu thụ các `State` và gọi các `Handler` được cung cấp từ ViewModel tương ứng.
  - Giúp việc thay đổi thiết kế giao diện trở nên cực kỳ dễ dàng mà không ảnh hưởng đến logic nghiệp vụ bên dưới.

## 5. Tầng Global Store
**Vị trí:** `src/store/*.ts`
- **Để làm gì?**
  - Ghi nhớ các trạng thái cần dùng ở nhiều nơi trong toàn bộ ứng dụng (như thông tin User đã đăng nhập, Token...).
- **Hoạt động ra sao?**
  - Sử dụng Zustand để quản lý trạng thái tập trung. Store được ViewModel cập nhật sau khi hoàn thành các tác vụ nghiệp vụ quan trọng.

---

*(Để hiểu rõ hơn về luồng dữ liệu, hãy xem `docs/flow.md`)*
