# 01 — Đặc tả yêu cầu phần mềm (SRS)

## 1. Giới thiệu

### 1.1 Mục đích
WoWe là hệ thống thương mại điện tử bán **quần áo & phụ kiện nữ**. Tài liệu này đặc tả yêu cầu chức năng và phi chức năng của hệ thống, làm cơ sở cho thiết kế, cài đặt và kiểm thử.

### 1.2 Phạm vi
Hệ thống cho phép khách hàng duyệt sản phẩm, tìm kiếm/lọc, quản lý giỏ hàng, đặt hàng, đánh giá, và quản lý tài khoản. Quản trị viên quản lý sản phẩm, danh mục, đơn hàng và mã giảm giá.

### 1.3 Định nghĩa
- **Sản phẩm (Product):** một mẫu quần áo, có nhiều **biến thể (Variant)** theo size/màu.
- **Biến thể (Variant):** tổ hợp size + màu, có tồn kho (stock) và SKU riêng.
- **Đơn hàng (Order):** yêu cầu mua gồm nhiều dòng hàng, có trạng thái vòng đời.

## 2. Tổng quan hệ thống

### 2.1 Tác nhân (Actors)
| Tác nhân | Mô tả |
|----------|-------|
| Khách vãng lai (Guest) | Duyệt, tìm kiếm, xem chi tiết sản phẩm & đánh giá. |
| Khách hàng (Customer) | Guest + đăng nhập, giỏ hàng, đặt hàng, đánh giá, wishlist, quản lý hồ sơ. |
| Quản trị viên (Admin) | Quản lý sản phẩm, danh mục, mã giảm giá, xử lý đơn hàng. |

### 2.2 Kiến trúc tổng thể
Client (Next.js) ⇄ REST API (NestJS) ⇄ MySQL. Redis dùng cache dữ liệu đọc nhiều (danh sách/chi tiết sản phẩm, cây danh mục). Sự kiện đơn hàng xử lý nền bằng event-emitter in-process.

## 3. Yêu cầu chức năng

### FR-1 — Xác thực & tài khoản
- FR-1.1 Đăng ký bằng email + mật khẩu (≥ 6 ký tự), họ tên, SĐT (tuỳ chọn).
- FR-1.2 Đăng nhập, cấp **access token** (15 phút) và **refresh token** (7 ngày).
- FR-1.3 Làm mới access token bằng refresh token.
- FR-1.4 Xem & cập nhật hồ sơ (họ tên, SĐT).
- FR-1.5 Quản lý sổ địa chỉ giao hàng (thêm/sửa/xoá, đặt mặc định).

### FR-2 — Danh mục
- FR-2.1 Danh mục phân cấp 2 tầng (cha → con), ví dụ: Áo → Áo thun.
- FR-2.2 Lấy cây danh mục (cache Redis 5 phút).
- FR-2.3 Admin CRUD danh mục.

### FR-3 — Sản phẩm
- FR-3.1 Danh sách sản phẩm có **phân trang**.
- FR-3.2 **Lọc** theo: từ khoá tên, danh mục, khoảng giá, size, màu, nổi bật.
- FR-3.3 **Sắp xếp**: mới nhất, bán chạy, giá tăng/giảm, đánh giá cao.
- FR-3.4 Chi tiết sản phẩm: nhiều ảnh, biến thể size/màu, tồn kho, chất liệu, đánh giá.
- FR-3.5 Sản phẩm liên quan (cùng danh mục).
- FR-3.6 Giá bán hiệu lực ưu tiên giá khuyến mãi (salePrice).
- FR-3.7 Admin CRUD sản phẩm (kèm ảnh & biến thể).

### FR-4 — Giỏ hàng
- FR-4.1 Mỗi khách hàng có một giỏ hàng.
- FR-4.2 Thêm biến thể vào giỏ; gộp số lượng nếu đã có.
- FR-4.3 Cập nhật số lượng (kiểm tra tồn kho), xoá dòng, xoá toàn bộ.
- FR-4.4 Tính tạm tính và số lượng.

### FR-5 — Đặt hàng
- FR-5.1 Thanh toán từ giỏ: nhập thông tin giao hàng, phương thức (COD/chuyển khoản/MoMo), mã giảm giá.
- FR-5.2 Phí ship: **miễn phí** khi (tạm tính − giảm giá) ≥ 500.000₫, ngược lại 30.000₫.
- FR-5.3 Trừ tồn kho **an toàn** trong transaction (khoá bi quan để tránh bán vượt).
- FR-5.4 Sinh mã đơn duy nhất; lưu snapshot sản phẩm/biến thể vào dòng đơn.
- FR-5.5 Sau khi tạo đơn, phát sự kiện `order.created` → tự động xác nhận & "gửi email" (mô phỏng).
- FR-5.6 Khách xem lịch sử đơn & chi tiết đơn của mình.
- FR-5.7 Khách huỷ đơn khi ở trạng thái *chờ xác nhận* hoặc *đã xác nhận* (hoàn tồn kho).
- FR-5.8 Admin xem tất cả đơn, cập nhật trạng thái; huỷ sẽ hoàn tồn kho, giao xong đánh dấu đã thanh toán.

### FR-6 — Mã giảm giá
- FR-6.1 Loại phần trăm (có trần giảm) hoặc số tiền cố định.
- FR-6.2 Điều kiện: đơn tối thiểu, hạn dùng, giới hạn lượt.
- FR-6.3 Kiểm tra & tính giảm giá khi thanh toán; tăng lượt đã dùng khi đặt thành công.

### FR-7 — Đánh giá
- FR-7.1 Khách hàng đánh giá sản phẩm (1–5 sao, tiêu đề, nội dung).
- FR-7.2 Tự động tính lại điểm trung bình & số lượt đánh giá của sản phẩm.
- FR-7.3 Hiển thị danh sách đánh giá (phân trang).

### FR-8 — Yêu thích (Wishlist)
- FR-8.1 Thêm/bỏ sản phẩm yêu thích; danh sách yêu thích của khách.

## 4. Yêu cầu phi chức năng

| Mã | Yêu cầu |
|----|---------|
| NFR-1 Bảo mật | Mật khẩu băm bcrypt; JWT; guard phân quyền theo vai trò; Helmet; validation đầu vào (class-validator). |
| NFR-2 Hiệu năng | Cache Redis cho danh sách/chi tiết sản phẩm & cây danh mục; phân trang mọi danh sách; giới hạn `limit ≤ 100`. |
| NFR-3 Chống lạm dụng | Rate limit 120 request/phút/IP (throttler). |
| NFR-4 Toàn vẹn dữ liệu | Trừ kho trong transaction có khoá; snapshot dữ liệu đơn hàng. |
| NFR-5 Khả dụng | Healthcheck `/api/health` kiểm tra DB & Redis. |
| NFR-6 Trải nghiệm | Responsive, ưu tiên mobile; ảnh có fallback khi lỗi; thông báo toast. |
| NFR-7 Bảo trì | Cấu hình qua biến môi trường; tài liệu API Swagger; seed dữ liệu mẫu. |
| NFR-8 Địa phương hoá | Giao diện tiếng Việt, tiền tệ VND. |

## 5. Ràng buộc
- CSDL quan hệ MySQL 8; ORM TypeORM (dev dùng `synchronize`, production dùng migration).
- Không dùng message broker riêng: kiến trúc monolith dùng event-emitter in-process cho tác vụ nền.
- Cổng dịch vụ có thể cấu hình (mặc định trên VPS: MySQL host 3457, Redis host 3456, API 4000, Client 3000).
