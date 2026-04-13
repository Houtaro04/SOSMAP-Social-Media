# SOSMAP+SOCIAL - Nền tảng kết nối cứu trợ cộng đồng

SOSMAP+SOCIAL là một ứng dụng web hiện đại được thiết kế để kết nối người dân đang gặp khó khăn (Citizen) với các tình nguyện viên và đội cứu hộ (Volunteer/Rescuer). Hệ thống hỗ trợ gửi yêu cầu cứu trợ (SOS), bản đồ thời gian thực, và nhắn tin tương tác trực tiếp.

## 🚀 Công nghệ sử dụng

- **Frontend Core**: React 18 + TypeScript + Vite
- **Styling**: Tailwind CSS + Vanilla CSS (Custom components)
- **State Management**: Zustand (Global Store)
- **Icons**: Lucide React
- **Real-time**: SignalR (Microsoft)
- **API Client**: Axios

## 🏗️ Kiến trúc dự án (Architecture)

Dự án tuân thủ mô hình **MVVM (Model-View-ViewModel)** kết hợp với **Shared Services** để tối ưu hóa việc tái sử dụng mã nguồn và quản lý logic nghiệp vụ tập trung.

- **Entity (Model)**: Khai báo cấu trúc dữ liệu và thực thi logic kiểm tra (Validation) ngay tại lớp dữ liệu.
- **Service**: Tầng giao tiếp API Backend, chuẩn hóa phản hồi theo mẫu `{ data: T }`.
- **ViewModel**: Lớp trung gian xử lý logic giữa Service/Store và Giao diện (View).
- **View**: Chỉ chịu trách nhiệm hiển thị giao diện và nhận tương tác từ người dùng.

## 📂 Cấu trúc thư mục chi tiết

```text
src/
├── assets/             # Hình ảnh, SVG, Fonts
├── core/               # Cấu hình hệ thống (Constants, Utils)
├── lib/                # Thư viện dùng chung (Axios instance - api.ts)
├── shared/             # Tài nguyên dùng chung cho toàn bộ module
│   ├── entities/       # Các Entity classes (Auth, Message, Volunteer...)
│   └── services/       # Các API Services tập trung
├── modules/            # Các phân hệ chức năng độc lập
│   ├── admin/          # Quản trị viên
│   ├── auth/           # Đăng ký, Đăng nhập
│   ├── citizen/        # Giao diện cho Người dân
│   └── volunteer/      # Giao diện cho Tình nguyện viên
│       ├── viewmodels/ # Logic nghiệp vụ của module
│       └── views/      # Giao diện React Components
├── store/              # Global state management (Zustand)
└── router/             # Cấu hình định tuyến (React Router)
```

## 🛠️ Hướng dẫn phát triển

### Cài đặt môi trường
1. Clone dự án.
2. Chạy lệnh cài đặt: `npm install`

### Chạy dự án (Development)
```bash
npm run dev
```

### Build sản phẩm (Production)
```bash
npm run build
```

---

*Để biết thêm chi tiết về cấu trúc và luồng dữ liệu, vui lòng tham khảo thư mục `/docs`.*
