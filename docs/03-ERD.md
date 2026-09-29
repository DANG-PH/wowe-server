# 03 — Sơ đồ quan hệ thực thể (ERD)

## 3.1 Sơ đồ

```mermaid
erDiagram
  User ||--o{ Address : "có"
  User ||--o| Cart : "sở hữu"
  User ||--o{ Order : "đặt"
  User ||--o{ Review : "viết"
  User ||--o{ Wishlist : "lưu"
  Category ||--o{ Category : "cha–con"
  Category ||--o{ Product : "chứa"
  Brand ||--o{ Product : "thuộc"
  Product ||--o{ ProductImage : "có"
  Product ||--o{ ProductVariant : "có"
  Product ||--o{ Review : "nhận"
  Product ||--o{ Wishlist : "được thích"
  Cart ||--o{ CartItem : "gồm"
  CartItem }o--|| ProductVariant : "chọn"
  CartItem }o--|| Product : "tham chiếu"
  Order ||--o{ OrderItem : "gồm"
  OrderItem }o--o| Product : "snapshot"
  OrderItem }o--o| ProductVariant : "snapshot"

  User {
    uuid id PK
    string email UK
    string passwordHash
    string fullName
    string phone
    enum role "customer|admin"
    bool isActive
  }
  Address {
    uuid id PK
    uuid userId FK
    string recipientName
    string phone
    string line
    string ward
    string district
    string province
    bool isDefault
  }
  Category {
    uuid id PK
    string name
    string slug UK
    uuid parentId FK "nullable"
    int sortOrder
    bool isActive
  }
  Brand {
    uuid id PK
    string name
    string slug UK
  }
  Product {
    uuid id PK
    string name
    string slug UK
    text description
    string material
    decimal price
    decimal salePrice "nullable"
    uuid categoryId FK
    uuid brandId FK "nullable"
    int soldCount
    float ratingAvg
    int ratingCount
    enum status "active|draft|archived"
    bool isFeatured
    json tags
  }
  ProductImage {
    uuid id PK
    uuid productId FK
    string url
    int sortOrder
  }
  ProductVariant {
    uuid id PK
    uuid productId FK
    string size
    string color
    string sku UK
    decimal priceOverride "nullable"
    int stock
  }
  Cart {
    uuid id PK
    uuid userId FK UK
  }
  CartItem {
    uuid id PK
    uuid cartId FK
    uuid productId FK
    uuid variantId FK
    int quantity
  }
  Order {
    uuid id PK
    string code UK
    uuid userId FK "nullable"
    decimal subtotal
    decimal shippingFee
    decimal discount
    decimal total
    enum status
    enum paymentMethod
    enum paymentStatus
    string recipientName
    string phone
    text shippingAddress
    string couponCode "nullable"
  }
  OrderItem {
    uuid id PK
    uuid orderId FK
    uuid productId FK "nullable"
    uuid variantId FK "nullable"
    string productName
    string variantInfo
    decimal price
    int quantity
  }
  Review {
    uuid id PK
    uuid productId FK
    uuid userId FK "nullable"
    string authorName
    tinyint rating "1..5"
    string title
    text content
  }
  Wishlist {
    uuid id PK
    uuid userId FK
    uuid productId FK
  }
  Coupon {
    uuid id PK
    string code UK
    enum type "percent|fixed"
    decimal value
    decimal minOrder
    decimal maxDiscount "nullable"
    datetime expiresAt "nullable"
    int usageLimit
    int usedCount
    bool isActive
  }
```

> **Ghi chú:** `Coupon` là bảng độc lập; `Order.couponCode` lưu snapshot mã đã dùng (không ràng buộc khoá ngoại) để giữ lịch sử ngay cả khi mã bị xoá.

## 3.2 Mô tả thực thể

| Bảng | Vai trò | Quan hệ chính |
|------|---------|---------------|
| `users` | Tài khoản (khách/admin). Mật khẩu băm bcrypt, cột `passwordHash` không select mặc định. | 1–n Address/Order/Review/Wishlist; 1–1 Cart |
| `addresses` | Sổ địa chỉ giao hàng của khách. | n–1 User |
| `categories` | Danh mục phân cấp (tự tham chiếu cha–con). | 1–n Product; tự quan hệ |
| `brands` | Thương hiệu (tuỳ chọn). | 1–n Product |
| `products` | Sản phẩm gốc; giá & khuyến mãi, rating tổng hợp, trạng thái, nổi bật. | n–1 Category/Brand; 1–n Image/Variant/Review |
| `product_images` | Ảnh sản phẩm, có thứ tự. | n–1 Product |
| `product_variants` | Biến thể size/màu, SKU, tồn kho. | n–1 Product |
| `carts` / `cart_items` | Giỏ hàng mỗi khách và các dòng trong giỏ. | Cart 1–n CartItem; CartItem → Variant/Product |
| `orders` / `order_items` | Đơn hàng và dòng đơn (lưu **snapshot** tên/biến thể/giá/ảnh tại thời điểm mua). | Order 1–n OrderItem |
| `reviews` | Đánh giá sản phẩm, dùng để tính `ratingAvg`/`ratingCount`. | n–1 Product/User |
| `wishlists` | Sản phẩm yêu thích (ràng buộc duy nhất user+product). | n–1 User/Product |
| `coupons` | Mã giảm giá theo % hoặc số tiền, kèm điều kiện. | độc lập |

## 3.3 Quy tắc toàn vẹn
- Xoá `Product`/`Category`/`Brand` → ảnh & biến thể xoá theo (CASCADE); tham chiếu ở đơn hàng dùng `SET NULL` nhờ đã có snapshot.
- Trừ/hoàn tồn kho luôn thực hiện trong transaction.
- `Product.price`/`salePrice` là `DECIMAL(12,2)`; giá bán hiệu lực = `COALESCE(salePrice, price)`.
