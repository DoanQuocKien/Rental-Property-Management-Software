# Rental Property Management Software

Phần mềm quản lý nhà trọ - Sprint 1

## Tính năng (Sprint 1)

| ID | User Story | Mô tả | Story Points |
|----|------------|-------|--------------|
| US1 | Đăng ký tài khoản | Người thuê/chủ trọ đăng ký để sử dụng hệ thống | 3 |
| US2 | Đăng nhập | Người dùng đăng nhập để quản lý thông tin | 3 |
| US3 | Quản lý phòng | Chủ trọ thêm/sửa/xóa thông tin phòng | 5 |
| US4 | Xem phòng trống | Chủ trọ xem danh sách phòng còn trống | 3 |

**Tổng: 14 Story Points**

## Cài đặt

### Yêu cầu
- Node.js >= 18

### Backend

```bash
cd backend
npm install
npm start        # Chạy ở port 5000
npm run dev      # Chạy với nodemon (auto-reload)
npm test         # Chạy tests
```

### Frontend

```bash
cd frontend
npm install
npm run dev      # Chạy ở port 5173
npm run build    # Build production
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Đăng ký tài khoản (US1)
- `POST /api/auth/login` - Đăng nhập (US2)

### Rooms (yêu cầu xác thực với vai trò chủ trọ)
- `GET /api/rooms` - Lấy danh sách tất cả phòng (US3)
- `GET /api/rooms/available` - Lấy danh sách phòng trống (US4)
- `POST /api/rooms` - Thêm phòng mới (US3)
- `PUT /api/rooms/:id` - Cập nhật thông tin phòng (US3)
- `DELETE /api/rooms/:id` - Xóa phòng (US3)

## Tech Stack

- **Backend**: Node.js + Express.js + SQLite
- **Frontend**: React + Vite
- **Auth**: JWT (JSON Web Tokens)
- **Password hashing**: bcryptjs
