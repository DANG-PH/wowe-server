import { ValueTransformer } from 'typeorm';

/**
 * MySQL trả về cột DECIMAL dưới dạng chuỗi. Transformer này chuyển về number
 * khi đọc ra, giúp API trả JSON số thay vì chuỗi.
 */
export class NumericTransformer implements ValueTransformer {
  to(value: number | null): number | null {
    return value;
  }

  from(value: string | null): number | null {
    if (value === null || value === undefined) return null;
    return parseFloat(value);
  }
}

export const numericTransformer = new NumericTransformer();
