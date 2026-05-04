# Cấu Trúc Dự Án (Project Structure)

Dự án được tổ chức theo mô hình **MVVM (Model-View-ViewModel)** kế hợp với **Shared Resources**, nhằm tối ưu hóa khả năng tái sử dụng mã nguồn và tính độc lập của các phân hệ chức năng.

## 📂 Tổng quan thư mục `src/`

```text
src/
├── assets/                 # Nơi chứa Hình ảnh, SVG, fonts.
├── core/                   # Các chức năng cốt lõi (Core global)
│   └── constants/          # Các biến hằng số hệ thống
├── lib/                    # Các thư viện & cấu hình HTTP core
│   └── api.ts              # Axios instance, Interceptors, HTTP wrappers
├── router/                 # Cấu hình định tuyến (React Router)
├── store/                  # Trạng thái toàn cục (Zustand Global State)
├── shared/                 # Tầng tài nguyên dùng chung cho toàn bộ dự án
│   ├── components/         # Các UI Components dùng chung (Ví dụ: BottomNav)
│   ├── dtos/               # Định nghĩa Data Transfer Objects từ Backend
│   ├── types/              # Các kiểu dữ liệu TypeScript dùng chung
│   ├── entities/           # (Model - Class) Chứa Class Entity và Logic Validation
│   └── services/           # (Service) Các dịch vụ gọi API Backend tập trung
├── styles/                 # Chứa các file CSS toàn cục và component styles
└── modules/                # Các phân hệ tính năng độc lập (Ví dụ: auth, citizen, volunteer)
    ├── <module_name>/      # Tên phân hệ (admin, auth, citizen, volunteer)
    │   ├── viewmodels/     # (ViewModel) Logic điều phối View, Entity và Service
    │   └── views/          # (View) Giao diện React Components & CSS components
```

### 📱 Hệ thống Responsive (Tối ưu hóa Mobile)
Toàn bộ dự án tuân theo chiến lược **Mobile-responsive**. 
- **Breakpoints**: Được cấu hình tập trung tại `src/index.css` thông qua các biến CSS.
- **Shared Components**: Các thành phần điều hướng linh hoạt như `BottomNav.tsx` giúp chuyển đổi trải nghiệm giữa Desktop (Sidebar) và Mobile (Bottom Navigation) một cách mượt mà.

## 🧩 Vai trò cụ thể của các thư mục chính

### 1. `src/shared/entities` (Model)
Đây là nơi chứa "luật chơi" của dữ liệu. Các Entity không chỉ là interface thô, mà là các class có khả năng tự kiểm tra tính đúng đắn (`validate()`) trước khi dữ liệu được gửi đi hoặc lưu lại.
- **Ví dụ**: `AuthEntity.ts`, `MessageEntity.ts`.

### 2. `src/shared/services` (Service)
Chuyên trách việc giao tiếp với Backend qua HTTP. Tất cả Service trong thư mục này đều được chuẩn hóa để trả về kết quả theo mẫu `{ data: T }`, giúp ViewModel dễ dàng xử lý mà không cần quan tâm đến chi tiết HTTP mapping.
- **Ví dụ**: `messageService.ts`, `authService.ts`, `rescueTaskService.ts`, `profileService.ts`.

### 3. `src/modules/<domain>/viewmodels` (ViewModel)
ViewModel là "bộ não" của mỗi trang hoặc tính năng. Nó nhận sự kiện từ View, ra lệnh cho Service thực thi, và xử lý kết quả trả về để cập nhật lại View thông qua State.
- **Ví dụ**: `useMessageViewModel.ts`, `useSosFormViewModel.ts`.

### 4. `src/modules/<domain>/views` (View)
Lớp hiển thị giao diện người dùng. View nhận dữ liệu và hàm xử lý từ ViewModel. View được giữ "sạch" nhất có thể: không chứa logic kiểm tra dữ liệu hay logic gọi API trực tiếp.
- **Ví dụ**: `HomeView.tsx`, `ChatView.tsx`.

---

## 💡 Lợi ích của cấu trúc mới
- **Tập trung hóa (Centralization)**: Entities và Services dùng chung được gom vào `shared`, tránh việc khai báo chồng chéo ở nhiều module.
- **Tính tự bao hàm (Self-contained)**: Mỗi module chỉ quan tâm đến ViewModel và View của riêng mình.
- **Nguyên lý Đơn Trách Nhiệm (Single Responsibility Principle)**: Giúp mã nguồn dễ bảo trì, mở rộng và kiểm thử (Unit Test) cho từng lớp riêng biệt.

*(Để hiểu rõ hơn về cách các tầng này tương tác, hãy xem `docs/architecture_roles.md`)*
