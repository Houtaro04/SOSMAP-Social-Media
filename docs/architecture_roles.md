# Chi Tiết Vai Trò Các Thành Phần (Architecture Roles)

Tài liệu này giải thích cụ thể "phần này để làm gì, phần kia để làm gì" trong kiến trúc **MVVM + Shared Resources** mới nhất của dự án. 

---

## 1. Tầng Model (Entity)
**Vị trí:** `src/shared/entities/*.ts`
- **Để làm gì?** 
  - Là "khuôn mẫu" của dữ liệu ứng dụng.
  - Chứa logic nghiệp vụ liên quan đến dữ liệu (như validate dữ liệu đầu vào).
- **Hoạt động ra sao?** 
  - Một Entity không chỉ là interface thô. Nó là một **Class** có hành vi. Ví dụ, `AuthEntity.ts` không chỉ khai báo các trường email, phone mà còn có phương thức `.validate()` để kiểm tra dữ liệu trước khi xử lý.

## 2. Tầng Service
**Vị trí:** `src/shared/services/*.ts`
- **Để làm gì?**
  - Chuyên môn hóa việc giao tiếp với Backend qua API (HTTP/SignalR).
- **Hoạt động ra sao?**
  - Nhận yêu cầu từ ViewModel, thực hiện gọi API, xử lý phản hồi và trả về dữ liệu chuẩn hóa dạng `{ data: T }`.

## 3. Tầng ViewModel 
**Vị trí:** `src/modules/<domain>/viewmodels/*.ts`
- **Để làm gì?**
  - Đóng vai trò là "Người điều phối" (Orchestrator). Nó chắp nối Entity, Service và Global Store lại với nhau.
- **Hoạt động ra sao?**
  - Quản lý logic nghiệp vụ cho View, trạng thái Loading, và tương tác với SignalR Hub để cập nhật dữ liệu thời gian thực.

## 4. Tầng View & Layout (Giao Diện)
**Vị trí:** `src/modules/<domain>/views/*.tsx`
- **Để làm gì?**
  - Đảm nhiệm hiển thị và tương tác người dùng. 
- **Cấu trúc Responsive:**
  - **Layout Layer**: `VolunteerLayout` và `CitizenLayout` đóng vai trò khung xương. Chúng quyết định việc hiển thị **Sidebar** (Desktop) hay **BottomNav** (Mobile) dựa trên kích thước màn hình.
  - **Adaptive Views**: Các View thành phần (như `VolunteerMapView`) tự điều chỉnh bố cục (chuyển sang dạng Drawer/Bottom Sheet) để tối ưu hóa không gian hiển thị trên thiết bị cầm tay.

## 5. Tầng Global Store
**Vị trí:** `src/store/*.ts`
- **Để làm gì?**
  - Ghi nhớ các trạng thái cần dùng ở nhiều nơi (Auth, Token, Global Settings).

---

*(Để hiểu rõ hơn về luồng dữ liệu, hãy xem `docs/flow.md`)*
