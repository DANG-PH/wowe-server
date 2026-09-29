# 05 — API Reference

- Base URL: `http://localhost:4000/api`
- Tài liệu tương tác (Swagger): `http://localhost:4000/api/docs`
- Xác thực: header `Authorization: Bearer <accessToken>`
- 🔓 công khai · 🔑 cần đăng nhập · 👑 cần quyền admin

## Auth
| Method | Path | Quyền | Mô tả |
|--------|------|-------|-------|
| POST | `/auth/register` | 🔓 | Đăng ký, trả token + hồ sơ |
| POST | `/auth/login` | 🔓 | Đăng nhập |
| POST | `/auth/refresh` | 🔓 | Làm mới access token |
| GET | `/auth/me` | 🔑 | Hồ sơ hiện tại |

## Users
| Method | Path | Quyền | Mô tả |
|--------|------|-------|-------|
| GET | `/users/me` | 🔑 | Xem hồ sơ |
| PATCH | `/users/me` | 🔑 | Cập nhật họ tên/SĐT |
| GET | `/users/me/addresses` | 🔑 | Danh sách địa chỉ |
| POST | `/users/me/addresses` | 🔑 | Thêm địa chỉ |
| PATCH | `/users/me/addresses/:id` | 🔑 | Sửa địa chỉ |
| DELETE | `/users/me/addresses/:id` | 🔑 | Xoá địa chỉ |

## Categories
| Method | Path | Quyền | Mô tả |
|--------|------|-------|-------|
| GET | `/categories/tree` | 🔓 | Cây danh mục (cache) |
| GET | `/categories` | 🔓 | Danh sách phẳng |
| GET | `/categories/:slug` | 🔓 | Chi tiết theo slug |
| POST | `/categories` | 👑 | Tạo |
| PATCH | `/categories/:id` | 👑 | Sửa |
| DELETE | `/categories/:id` | 👑 | Xoá |

## Products
| Method | Path | Quyền | Mô tả |
|--------|------|-------|-------|
| GET | `/products` | 🔓 | Danh sách + lọc + sắp xếp + phân trang |
| GET | `/products/:slug` | 🔓 | Chi tiết (ảnh, biến thể, danh mục) |
| GET | `/products/:slug/related` | 🔓 | Sản phẩm liên quan |
| POST | `/products` | 👑 | Tạo (kèm ảnh & biến thể) |
| PATCH | `/products/:id` | 👑 | Sửa |
| DELETE | `/products/:id` | 👑 | Xoá |

**Query của `/products`:** `page, limit, q, category` (slug), `minPrice, maxPrice, size, color, isFeatured`, `sort` ∈ `newest|best_selling|price_asc|price_desc|rating`.

## Cart 🔑
| Method | Path | Mô tả |
|--------|------|-------|
| GET | `/cart` | Xem giỏ (kèm tạm tính, số lượng) |
| POST | `/cart/items` | Thêm `{ variantId, quantity }` |
| PATCH | `/cart/items/:id` | Đổi số lượng (`0` = xoá) |
| DELETE | `/cart/items/:id` | Xoá 1 dòng |
| DELETE | `/cart` | Xoá toàn bộ |

## Orders 🔑
| Method | Path | Quyền | Mô tả |
|--------|------|-------|-------|
| POST | `/orders/checkout` | 🔑 | Đặt hàng từ giỏ |
| GET | `/orders` | 🔑 | Đơn của tôi (phân trang) |
| GET | `/orders/:code` | 🔑 | Chi tiết đơn (chủ đơn hoặc admin) |
| POST | `/orders/:code/cancel` | 🔑 | Huỷ đơn |
| GET | `/orders/admin/all` | 👑 | Tất cả đơn (lọc `status`) |
| PATCH | `/orders/admin/:code/status` | 👑 | Cập nhật trạng thái |

## Reviews
| Method | Path | Quyền | Mô tả |
|--------|------|-------|-------|
| GET | `/reviews?productId=` | 🔓 | Danh sách đánh giá của sản phẩm |
| POST | `/reviews` | 🔑 | Tạo `{ productId, rating, title?, content? }` |

## Wishlist 🔑
| Method | Path | Mô tả |
|--------|------|-------|
| GET | `/wishlist` | Danh sách yêu thích |
| POST | `/wishlist/:productId` | Thêm |
| DELETE | `/wishlist/:productId` | Bỏ |

## Coupons
| Method | Path | Quyền | Mô tả |
|--------|------|-------|-------|
| POST | `/coupons/validate` | 🔑 | Kiểm tra & tính giảm `{ code, subtotal }` |
| GET | `/coupons` | 👑 | Danh sách |
| POST | `/coupons` | 👑 | Tạo |
| DELETE | `/coupons/:id` | 👑 | Xoá |

## Health
| Method | Path | Quyền | Mô tả |
|--------|------|-------|-------|
| GET | `/health` | 🔓 | Trạng thái DB & Redis |

## Ví dụ

```bash
# Đăng nhập
curl -X POST http://localhost:4000/api/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"khachhang@wowe.vn","password":"123456"}'

# Danh sách đầm, sắp giá tăng dần
curl "http://localhost:4000/api/products?category=dam&sort=price_asc&limit=12"

# Thêm vào giỏ (cần token)
curl -X POST http://localhost:4000/api/cart/items \
  -H "Authorization: Bearer $TOKEN" -H 'Content-Type: application/json' \
  -d '{"variantId":"<uuid>","quantity":1}'
```
