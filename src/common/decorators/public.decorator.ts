import { SetMetadata } from '@nestjs/common';

export const IS_PUBLIC_KEY = 'isPublic';

/** Đánh dấu route bỏ qua JwtAuthGuard toàn cục. */
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
