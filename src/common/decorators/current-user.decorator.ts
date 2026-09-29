import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export interface JwtUser {
  id: string;
  email: string;
  role: string;
}

/** Lấy user đã xác thực từ request (do JwtStrategy gắn vào). */
export const CurrentUser = createParamDecorator(
  (data: keyof JwtUser | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user as JwtUser | undefined;
    return data ? user?.[data] : user;
  },
);
