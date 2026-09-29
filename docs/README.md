# Tài liệu dự án WoWe

WoWe — website bán quần áo nữ (Women's Wear). Monorepo gồm:

- `wowe-client/` — Next.js 16 (App Router) — giao diện khách hàng + trang quản trị.
- `wowe-server/` — NestJS 11 + MySQL + Redis — REST API.

## Mục lục tài liệu

| # | Tài liệu | Nội dung |
|---|----------|----------|
| 01 | [SRS — Đặc tả yêu cầu](./01-SRS.md) | Phạm vi, tác nhân, yêu cầu chức năng & phi chức năng |
| 02 | [Use Case](./02-use-cases.md) | Sơ đồ use case + đặc tả các luồng chính |
| 03 | [ERD — Sơ đồ CSDL](./03-ERD.md) | Thực thể, quan hệ, mô tả bảng |
| 04 | [Kiến trúc hệ thống](./04-architecture.md) | Sơ đồ kiến trúc, luồng xử lý, quyết định kỹ thuật |
| 05 | [API Reference](./05-API.md) | Danh sách endpoint theo module |
| 06 | [Hướng dẫn cài đặt & chạy](./06-setup.md) | Docker, biến môi trường, seed, chạy dev |

## Tóm tắt công nghệ

| Thành phần | Công nghệ |
|-----------|-----------|
| Frontend | Next.js 16, React 19, Tailwind CSS v4, SWR, Zustand |
| Backend | NestJS 11, TypeScript, TypeORM |
| CSDL | MySQL 8 |
| Cache / Session | Redis 7 |
| Sự kiện nội bộ | @nestjs/event-emitter (thay cho message broker trong kiến trúc monolith) |
| Auth | JWT (access + refresh), Passport, bcrypt |
| API Docs | Swagger / OpenAPI (`/api/docs`) |
| Hạ tầng dev | Docker Compose (MySQL, Redis) |

## Tài khoản demo (sau khi seed)

- Admin: `admin@wowe.vn` / `Admin@123`
- Khách: `khachhang@wowe.vn` / `123456`
- Mã giảm giá: `WOWE10`, `NEWBIE`, `SALE50K`, `FREESHIP`
