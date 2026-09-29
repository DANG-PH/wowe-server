# WoWe Server

REST API cho **WoWe** — website bán quần áo nữ. Xây dựng bằng **NestJS 11 + TypeORM + MySQL + Redis**, sự kiện nền dùng `@nestjs/event-emitter`.

## Tính năng
- Xác thực JWT (access + refresh), phân quyền `customer` / `admin`.
- Danh mục phân cấp, sản phẩm (lọc/tìm/sắp xếp/phân trang) + cache Redis.
- Giỏ hàng, đặt hàng (trừ tồn kho an toàn trong transaction), mã giảm giá, phí ship.
- Đánh giá & rating, wishlist, sổ địa chỉ.
- Xử lý đơn nền qua event-emitter (tự xác nhận đơn, mô phỏng gửi email).
- Swagger tại `/api/docs`, healthcheck `/api/health`.

## Chạy nhanh
```bash
cp .env.example .env
npm install
docker compose up -d      # MySQL + Redis + Adminer
npm run seed              # dữ liệu mẫu tiếng Việt
npm run start:dev         # http://localhost:4000/api
```

Tài khoản demo: `admin@wowe.vn / Admin@123`, `khachhang@wowe.vn / 123456`.

## Công nghệ
NestJS 11 · TypeORM · MySQL 8 · Redis 7 · Passport/JWT · class-validator · Swagger · Docker Compose.

## Tài liệu
Xem thư mục [`docs/`](./docs/README.md): SRS, Use Case, ERD, Kiến trúc, API, Hướng dẫn cài đặt.

## Cấu trúc
`src/entities` (13 entity) · `src/modules` (auth, users, categories, products, cart, orders, reviews, wishlist, coupons, health) · `src/redis`, `src/database` (seed, data-source).
