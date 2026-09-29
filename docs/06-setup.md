# 06 — Hướng dẫn cài đặt & chạy

## Yêu cầu
- Node.js ≥ 20 (khuyến nghị 22/24), npm
- Docker + Docker Compose

## 1. Backend (`wowe-server`)

```bash
cd wowe-server
cp .env.example .env          # chỉnh nếu cần (cổng, mật khẩu, JWT secret)
npm install

# Khởi động hạ tầng: MySQL + Redis
docker compose up -d          # (npm run docker:up)

# Nạp dữ liệu mẫu (danh mục, ~85 sản phẩm có ảnh, mã giảm giá, tài khoản)
npm run seed                  # tạo lại từ đầu: npm run seed:reset

# Chạy API (watch mode)
npm run start:dev
```

- API: `http://localhost:4000/api`
- Swagger: `http://localhost:4000/api/docs`
- Healthcheck: `http://localhost:4000/api/health`
- Quản lý DB: dùng phpMyAdmin/DBeaver kết nối `localhost:3457` (user/pass theo `.env`). Trên VPS có thể trỏ phpMyAdmin sẵn có tới container `wowe-mysql` (qua host `3457` hoặc gắn vào network `wowe_wowe-net`, server `mysql`).

### Cổng mặc định (tránh xung đột trên VPS)
| Dịch vụ | Cổng host | Trong container |
|--------|-----------|-----------------|
| API NestJS | 4000 | 4000 |
| MySQL | **3457** | 3306 |
| Redis | **3456** | 6379 |

> Ứng dụng kết nối MySQL qua `localhost:3457`, Redis qua `localhost:3456` (đã đặt sẵn trong `.env`).

### Chạy toàn bộ backend trong Docker (tuỳ chọn)
```bash
docker compose --profile app up -d --build
```

## 2. Frontend (`wowe-client`)

```bash
cd wowe-client
# .env.local đã trỏ NEXT_PUBLIC_API_URL=http://localhost:4000/api
npm install
npm run dev
```

- Web: `http://localhost:3000`

## 3. Tài khoản & mã demo
| | |
|---|---|
| Admin | `admin@wowe.vn` / `Admin@123` |
| Khách | `khachhang@wowe.vn` / `123456` |
| Mã giảm giá | `WOWE10` (−10%, đơn ≥ 300k), `NEWBIE` (−15%, đơn ≥ 400k), `SALE50K` (−50k, đơn ≥ 500k), `FREESHIP` (−30k) |

## 4. Dữ liệu & ảnh sản phẩm
- Seed tạo catalog **tiếng Việt** (áo, đầm, quần, chân váy, đồ bộ, phụ kiện) với giá VND.
- Ảnh sản phẩm lấy realtime từ nguồn ảnh thời trang công khai khi seed; nếu không tải được sẽ tự dùng ảnh thay thế (không làm hỏng giao diện — client có fallback).
- **Nạp dữ liệu thật kèm ảnh từ Kaggle** (tuỳ chọn): dùng bộ *Fashion Product Images (Small)* (~44k sản phẩm, có ảnh + metadata), lọc `gender=Women`. Cần `kaggle.json`; đặt file ảnh vào `uploads/` và viết script import theo `src/database/seed.ts`.

## 5. Lệnh hữu ích (server)
| Lệnh | Tác dụng |
|------|----------|
| `npm run start:dev` | Chạy API watch |
| `npm run build` | Build production |
| `npm run seed` / `seed:reset` | Nạp / nạp lại dữ liệu mẫu |
| `npm run docker:up` / `docker:down` | Bật / tắt hạ tầng |
| `npm run docker:logs` | Xem log container |

## 6. Ghi chú production
- Đặt `DB_SYNCHRONIZE=false` và dùng migration TypeORM (`npm run migration:generate`, `migration:run`) thay cho auto-sync.
- Đổi toàn bộ `JWT_*` secret và mật khẩu DB/Redis.
- Bật HTTPS, giới hạn CORS theo domain thật (`CLIENT_URL`).
