# Rental Property Management Software

Ung dung quan ly nha tro gom backend (Node.js + Express + SQLite) va frontend (React + Vite).

## Yeu cau moi truong

- Node.js >= 18
- npm >= 9

## Cai dat va chay du an

### 1. Cai dependencies

```bash
npm install
cd backend && npm install
cd ../frontend && npm install
```

### 2. Cau hinh backend env

Tao file `backend/.env` (co the copy tu `backend/.env.example`):

```env
PORT=5000
JWT_SECRET=replace_with_a_long_random_secret
JWT_REFRESH_SECRET=replace_with_another_long_random_secret
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d
```

Neu thieu `JWT_SECRET`, backend se khong khoi dong.

### 3. Chay backend

```bash
cd backend
npm start
```

### 4. Chay frontend

```bash
cd frontend
npm run dev
```

## Kiem thu

### Backend tests

```bash
cd backend
npm test -- --runInBand
```

## Cau truc co so du lieu hien tai

Database duoc tao/duy tri tai `backend/database.js` va mac dinh luu o `backend/rental.db`.

### 1) users

Luu thong tin nguoi dung va xac thuc.

| Column | Type | Not Null | Key | Mo ta |
| --- | --- | --- | --- | --- |
| id | INTEGER | Yes | PK | Khoa chinh tang tu dong |
| full_name | TEXT | Yes (default '') |  | Ho va ten |
| phone_number | TEXT | Yes (default '') |  | So dien thoai |
| name | TEXT | Yes |  | Truong tuong thich nguoc |
| email | TEXT | Yes | UNIQUE | Email dang nhap |
| password | TEXT | Yes |  | Mat khau da hash |
| role | TEXT | Yes |  | Vai tro nguoi dung |
| citizen_id | TEXT | No |  | CCCD |
| permanent_address | TEXT | No |  | Dia chi thuong tru |
| created_at | DATETIME | No (default CURRENT_TIMESTAMP) |  | Thoi gian tao |

### 2) rooms

Quan ly thong tin phong.

| Column | Type | Not Null | Key | Mo ta |
| --- | --- | --- | --- | --- |
| id | INTEGER | Yes | PK | Khoa chinh tang tu dong |
| name | TEXT | Yes |  | Ten phong |
| description | TEXT | No |  | Mo ta |
| category | TEXT | Yes (default 'Standard') |  | Loai phong |
| price | REAL | Yes |  | Gia thue |
| area | REAL | No |  | Dien tich |
| max_occupants | INTEGER | Yes (default 1) |  | Suc chua toi da |
| status | TEXT | Yes (default 'available') |  | Trang thai phong |
| landlord_id | INTEGER | Yes | FK -> users.id | Chu phong |
| created_at | DATETIME | No (default CURRENT_TIMESTAMP) |  | Thoi gian tao |
| updated_at | DATETIME | No (default CURRENT_TIMESTAMP) |  | Thoi gian cap nhat |

### 3) lease_contracts

Luu hop dong thue.

| Column | Type | Not Null | Key | Mo ta |
| --- | --- | --- | --- | --- |
| id | INTEGER | Yes | PK | Khoa chinh tang tu dong |
| tenant_id | INTEGER | Yes | FK -> users.id | Nguoi thue |
| room_id | INTEGER | Yes | FK -> rooms.id | Phong thue |
| start_date | DATE | Yes |  | Ngay bat dau |
| end_date | DATE | Yes |  | Ngay ket thuc |
| deposit | REAL | Yes |  | Tien coc |
| is_expired | INTEGER | Yes (default 0) |  | 0/1 het han |
| created_at | DATETIME | No (default CURRENT_TIMESTAMP) |  | Thoi gian tao |
| updated_at | DATETIME | No (default CURRENT_TIMESTAMP) |  | Thoi gian cap nhat |

### 4) meter_readings

Luu chi so dien nuoc theo phong.

| Column | Type | Not Null | Key | Mo ta |
| --- | --- | --- | --- | --- |
| id | INTEGER | Yes | PK | Khoa chinh tang tu dong |
| room_id | INTEGER | Yes | FK -> rooms.id | Phong |
| electricity_index | REAL | Yes |  | Chi so dien |
| water_index | REAL | Yes |  | Chi so nuoc |
| recorded_date | DATE | Yes |  | Ngay ghi nhan |
| created_at | DATETIME | No (default CURRENT_TIMESTAMP) |  | Thoi gian tao |

### 5) invoices

Luu hoa don thanh toan.

| Column | Type | Not Null | Key | Mo ta |
| --- | --- | --- | --- | --- |
| id | INTEGER | Yes | PK | Khoa chinh tang tu dong |
| room_id | INTEGER | Yes | FK -> rooms.id | Phong |
| reading_id | INTEGER | No | FK -> meter_readings.id | Ban ghi chi so dien nuoc |
| total_amount | REAL | Yes |  | Tong tien |
| payment_status | TEXT | Yes (default 'Unpaid') |  | Trang thai thanh toan |
| due_date | DATE | Yes |  | Han thanh toan |
| created_at | DATETIME | No (default CURRENT_TIMESTAMP) |  | Thoi gian tao |
| updated_at | DATETIME | No (default CURRENT_TIMESTAMP) |  | Thoi gian cap nhat |

### 6) maintenance_requests

Luu yeu cau bao tri.

| Column | Type | Not Null | Key | Mo ta |
| --- | --- | --- | --- | --- |
| id | INTEGER | Yes | PK | Khoa chinh tang tu dong |
| tenant_id | INTEGER | Yes | FK -> users.id | Nguoi bao cao |
| staff_id | INTEGER | No | FK -> users.id | Nhan vien ky thuat |
| description | TEXT | Yes |  | Mo ta su co |
| issue_photo | TEXT | No |  | Anh/URL minh hoa |
| priority | TEXT | Yes (default 'Medium') |  | Muc uu tien |
| status | TEXT | Yes (default 'Pending') |  | Trang thai xu ly |
| created_at | DATETIME | No (default CURRENT_TIMESTAMP) |  | Thoi gian tao |
| updated_at | DATETIME | No (default CURRENT_TIMESTAMP) |  | Thoi gian cap nhat |

### 7) refresh_tokens

Luu refresh token dang hoat dong/phat sinh boi auth.

| Column | Type | Not Null | Key | Mo ta |
| --- | --- | --- | --- | --- |
| id | INTEGER | Yes | PK | Khoa chinh tang tu dong |
| user_id | INTEGER | Yes | FK -> users.id | Chu token |
| token_hash | TEXT | Yes | UNIQUE | Hash SHA-256 cua refresh token |
| jti | TEXT | Yes | UNIQUE | JWT ID |
| expires_at | DATETIME | Yes |  | Han token |
| revoked | INTEGER | Yes (default 0) |  | 0/1 da revoke |
| created_at | DATETIME | No (default CURRENT_TIMESTAMP) |  | Thoi gian tao |
| revoked_at | DATETIME | No |  | Thoi gian revoke |
| replaced_by_jti | TEXT | No |  | JTI moi sau rotate |
| last_used_at | DATETIME | No |  | Lan su dung cuoi |

### 8) revoked_access_tokens

Blacklist access token da logout/revoke.

| Column | Type | Not Null | Key | Mo ta |
| --- | --- | --- | --- | --- |
| jti | TEXT | Yes | PK | JWT ID cua access token |
| user_id | INTEGER | Yes | FK -> users.id | Chu token |
| expires_at | DATETIME | Yes |  | Han token |
| created_at | DATETIME | No (default CURRENT_TIMESTAMP) |  | Thoi gian tao |

## Ghi chu tuong thich

- He thong dang duoc thiet ke de tuong thich nguoc voi mot so key cu trong API response (vi du: `id`, `name`, `capacity`) trong khi da bo sung key moi (`userID`, `roomID`, `fullName`, `maxOccupants`).
- Cac migration cot bo sung duoc xu ly tu dong trong `backend/database.js` bang `ensureColumn`.
