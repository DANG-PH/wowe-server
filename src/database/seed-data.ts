import { DiscountType } from '../common/enums/coupon.enum';

export const COLORS = [
  'Đen',
  'Trắng',
  'Be',
  'Hồng pastel',
  'Xanh navy',
  'Nâu',
  'Xám',
  'Đỏ đô',
];

export const SIZES = ['S', 'M', 'L', 'XL'];
export const SHOE_SIZES = ['35', '36', '37', '38', '39'];

export type PoolKey = 'top' | 'dress' | 'bag' | 'shoe';

export interface CategorySeed {
  name: string;
  description?: string;
  children?: string[];
}

export const CATEGORIES: CategorySeed[] = [
  {
    name: 'Áo',
    description: 'Áo thun, sơ mi, áo kiểu, áo khoác nữ',
    children: ['Áo thun', 'Áo sơ mi', 'Áo kiểu', 'Áo khoác'],
  },
  {
    name: 'Quần',
    description: 'Quần jean, quần tây, quần short nữ',
    children: ['Quần jean', 'Quần tây', 'Quần short'],
  },
  {
    name: 'Váy & Đầm',
    description: 'Đầm, chân váy nữ đa dạng phong cách',
    children: ['Đầm', 'Chân váy'],
  },
  { name: 'Đồ bộ', description: 'Set đồ phối sẵn thời trang' },
  { name: 'Đồ ngủ & Mặc nhà', description: 'Đồ ngủ, đồ mặc nhà thoải mái' },
  {
    name: 'Phụ kiện',
    description: 'Túi xách, giày dép nữ',
    children: ['Túi xách', 'Giày'],
  },
];

export interface ProductGroup {
  category: string;
  poolKey: PoolKey;
  material: string;
  priceRange: [number, number];
  sizes: string[];
  colors?: string[];
  names: string[];
}

export const PRODUCT_GROUPS: ProductGroup[] = [
  {
    category: 'Áo thun',
    poolKey: 'top',
    material: 'Cotton 100% co giãn 4 chiều',
    priceRange: [120_000, 280_000],
    sizes: SIZES,
    names: [
      'Áo Thun Cotton Basic',
      'Áo Thun Croptop Tay Ngắn',
      'Áo Thun Oversize In Hình',
      'Áo Phông Cổ Tròn Trơn',
      'Áo Thun Baby Tee Ôm',
      'Áo Thun Tay Lỡ Form Rộng',
      'Áo Thun Cổ Tim Nữ Tính',
      'Áo Thun Kẻ Sọc Ngang',
    ],
  },
  {
    category: 'Áo sơ mi',
    poolKey: 'top',
    material: 'Lụa tổng hợp mềm mịn',
    priceRange: [250_000, 480_000],
    sizes: SIZES,
    names: [
      'Áo Sơ Mi Trắng Công Sở',
      'Áo Sơ Mi Lụa Tay Dài',
      'Áo Sơ Mi Kẻ Sọc Thanh Lịch',
      'Áo Sơ Mi Oversize Phối Túi',
      'Áo Sơ Mi Voan Tay Bồng',
      'Áo Sơ Mi Croptop Cách Điệu',
      'Áo Sơ Mi Cổ Đức Dáng Suông',
      'Áo Sơ Mi Nơ Cổ Điệu Đà',
    ],
  },
  {
    category: 'Áo kiểu',
    poolKey: 'top',
    material: 'Chất liệu dệt kim cao cấp',
    priceRange: [180_000, 420_000],
    sizes: SIZES,
    names: [
      'Áo Kiểu Tay Bồng Nữ Tính',
      'Áo Croptop Dệt Kim',
      'Áo Kiểu Trễ Vai Gợi Cảm',
      'Áo Peplum Nhún Eo',
      'Áo Kiểu Cổ Vuông Tiểu Thư',
      'Áo Camisole Lụa Hai Dây',
      'Áo Kiểu Buộc Dây Eo',
      'Áo Bẹt Vai Bo Chun',
    ],
  },
  {
    category: 'Áo khoác',
    poolKey: 'top',
    material: 'Vải dạ / kaki dày dặn',
    priceRange: [350_000, 890_000],
    sizes: SIZES,
    names: [
      'Áo Khoác Blazer Dáng Suông',
      'Áo Khoác Cardigan Len',
      'Áo Khoác Jean Bò',
      'Áo Khoác Bomber Cá Tính',
      'Áo Khoác Dạ Dáng Dài',
      'Áo Vest Nữ Công Sở',
      'Áo Khoác Hoodie Nỉ Bông',
      'Áo Cardigan Dệt Kim Mỏng',
    ],
  },
  {
    category: 'Quần jean',
    poolKey: 'top',
    material: 'Denim co giãn',
    priceRange: [280_000, 550_000],
    sizes: SIZES,
    names: [
      'Quần Jean Ống Rộng Lưng Cao',
      'Quần Jean Skinny Ôm Dáng',
      'Quần Jean Baggy Trẻ Trung',
      'Quần Jean Rách Gối',
      'Quần Jean Ống Loe',
      'Quần Jean Wide Leg',
    ],
  },
  {
    category: 'Quần tây',
    poolKey: 'top',
    material: 'Vải tuyết mưa cao cấp',
    priceRange: [220_000, 460_000],
    sizes: SIZES,
    names: [
      'Quần Tây Ống Suông Công Sở',
      'Quần Âu Lưng Cao',
      'Quần Tây Ống Loe',
      'Quần Baggy Vải Cạp Chun',
      'Quần Culottes Vải',
    ],
  },
  {
    category: 'Quần short',
    poolKey: 'top',
    material: 'Kaki mềm',
    priceRange: [150_000, 320_000],
    sizes: SIZES,
    names: [
      'Quần Short Vải Cạp Cao',
      'Quần Đùi Kaki Năng Động',
      'Quần Short Xếp Ly',
      'Quần Short Jean Rách',
    ],
  },
  {
    category: 'Chân váy',
    poolKey: 'dress',
    material: 'Vải xốp Hàn Quốc',
    priceRange: [200_000, 450_000],
    sizes: SIZES,
    names: [
      'Chân Váy Chữ A Xếp Ly',
      'Chân Váy Bút Chì Công Sở',
      'Chân Váy Denim Trẻ Trung',
      'Chân Váy Midi Xòe',
      'Chân Váy Da PU Cá Tính',
      'Chân Váy Tennis Năng Động',
      'Chân Váy Dài Lụa',
    ],
  },
  {
    category: 'Đầm',
    poolKey: 'dress',
    material: 'Voan lụa cao cấp',
    priceRange: [300_000, 750_000],
    sizes: SIZES,
    names: [
      'Đầm Voan Hoa Nhí Tay Bồng',
      'Đầm Suông Dáng Rộng',
      'Đầm Body Ôm Tôn Dáng',
      'Đầm Maxi Đi Biển',
      'Đầm Xòe Dự Tiệc',
      'Đầm Sơ Mi Thắt Eo',
      'Đầm Hai Dây Lụa',
      'Đầm Babydoll Dễ Thương',
      'Đầm Cổ Vuông Xếp Ly',
      'Đầm Len Dệt Kim Thu Đông',
    ],
  },
  {
    category: 'Đồ bộ',
    poolKey: 'dress',
    material: 'Cotton / lụa tơ',
    priceRange: [250_000, 590_000],
    sizes: SIZES,
    names: [
      'Set Đồ Bộ Mặc Nhà Cotton',
      'Set Áo + Chân Váy Thanh Lịch',
      'Set Blazer + Quần Âu',
      'Set Croptop + Quần Ống Rộng',
      'Set Đồ Bộ Lụa Tơ Cao Cấp',
      'Set Áo Thun + Short Thể Thao',
    ],
  },
  {
    category: 'Đồ ngủ & Mặc nhà',
    poolKey: 'dress',
    material: 'Lụa satin / thun lạnh',
    priceRange: [150_000, 380_000],
    sizes: SIZES,
    names: [
      'Đồ Ngủ Lụa Hai Dây',
      'Váy Ngủ Ren Quyến Rũ',
      'Bộ Pijama Cotton Dễ Thương',
      'Đồ Mặc Nhà Thun Lạnh',
    ],
  },
  {
    category: 'Túi xách',
    poolKey: 'bag',
    material: 'Da PU / canvas',
    priceRange: [180_000, 690_000],
    sizes: ['Freesize'],
    colors: ['Đen', 'Trắng', 'Be', 'Nâu'],
    names: [
      'Túi Tote Vải Canvas',
      'Túi Đeo Chéo Da PU',
      'Túi Xách Tay Công Sở',
      'Túi Bucket Mini',
      'Túi Clutch Dự Tiệc',
      'Balo Nữ Thời Trang',
    ],
  },
  {
    category: 'Giày',
    poolKey: 'shoe',
    material: 'Da tổng hợp',
    priceRange: [250_000, 650_000],
    sizes: SHOE_SIZES,
    colors: ['Đen', 'Trắng', 'Be', 'Nâu'],
    names: [
      'Giày Cao Gót Mũi Nhọn',
      'Giày Sandal Quai Mảnh',
      'Giày Sneaker Trắng',
      'Giày Búp Bê Bệt',
      'Giày Loafer Da',
    ],
  },
];

export interface CouponSeed {
  code: string;
  type: DiscountType;
  value: number;
  minOrder?: number;
  maxDiscount?: number;
  usageLimit?: number;
}

export const COUPONS: CouponSeed[] = [
  {
    code: 'WOWE10',
    type: DiscountType.PERCENT,
    value: 10,
    minOrder: 300_000,
    maxDiscount: 100_000,
  },
  {
    code: 'NEWBIE',
    type: DiscountType.PERCENT,
    value: 15,
    minOrder: 400_000,
    maxDiscount: 150_000,
  },
  { code: 'SALE50K', type: DiscountType.FIXED, value: 50_000, minOrder: 500_000 },
  { code: 'FREESHIP', type: DiscountType.FIXED, value: 30_000, minOrder: 0 },
];

export interface ReviewSeed {
  authorName: string;
  rating: number;
  title: string;
  content: string;
}

export const SAMPLE_REVIEWS: ReviewSeed[] = [
  {
    authorName: 'Ngọc Anh',
    rating: 5,
    title: 'Rất ưng ý',
    content: 'Vải đẹp, form chuẩn, mặc lên xinh lắm ạ. Sẽ ủng hộ shop tiếp!',
  },
  {
    authorName: 'Minh Thư',
    rating: 4,
    title: 'Đẹp nhưng hơi rộng',
    content: 'Chất vải mềm, màu đúng hình. Mình cao 1m58 mặc size S hơi rộng chút.',
  },
  {
    authorName: 'Thu Hà',
    rating: 5,
    title: 'Giao hàng nhanh',
    content: 'Đóng gói cẩn thận, giao nhanh. Mặc rất thích, đáng tiền.',
  },
  {
    authorName: 'Phương Linh',
    rating: 4,
    title: 'Ổn trong tầm giá',
    content: 'So với giá tiền thì ok. Đường may đẹp, không bị lỗi.',
  },
  {
    authorName: 'Bảo Trân',
    rating: 3,
    title: 'Tạm ổn',
    content: 'Màu hơi khác hình một chút nhưng vẫn chấp nhận được.',
  },
  {
    authorName: 'Khánh Vy',
    rating: 5,
    title: 'Xinh xỉu',
    content: 'Mặc lên dáng cực xinh, được nhiều người khen. 10 điểm!',
  },
  {
    authorName: 'Hải Yến',
    rating: 5,
    title: 'Chất lượng tốt',
    content: 'Vải dày dặn, mặc mát. Sẽ mua thêm màu khác.',
  },
  {
    authorName: 'Diệu Linh',
    rating: 4,
    title: 'Hài lòng',
    content: 'Sản phẩm đúng mô tả, shop tư vấn nhiệt tình.',
  },
];

export const ADMIN_USER = {
  email: 'admin@wowe.vn',
  password: 'Admin@123',
  fullName: 'Quản trị WoWe',
};

export const DEMO_CUSTOMER = {
  email: 'khachhang@wowe.vn',
  password: '123456',
  fullName: 'Nguyễn Thị An',
  phone: '0901234567',
};
