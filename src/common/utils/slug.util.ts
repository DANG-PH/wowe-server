/**
 * Tạo slug thân thiện URL, hỗ trợ tiếng Việt (bỏ dấu, xử lý đ/Đ).
 * Ví dụ: "Đầm Voan Hoa Nhí" -> "dam-voan-hoa-nhi"
 */
export function slugify(input: string): string {
  return input
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '') // bỏ dấu thanh
    .replace(/đ/g, 'd')
    .replace(/[^a-z0-9]+/g, '-') // ký tự khác -> gạch nối
    .replace(/(^-|-$)+/g, '') // bỏ gạch nối thừa ở đầu/cuối
    .slice(0, 200);
}

/** Thêm hậu tố ngắn để tránh trùng slug. */
export function uniqueSlug(input: string, suffix: string): string {
  return `${slugify(input)}-${suffix}`.slice(0, 210);
}
