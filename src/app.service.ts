import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getInfo() {
    return {
      name: 'WoWe API',
      description: 'API cửa hàng thời trang nữ WoWe',
      version: '0.1.0',
      docs: '/api/docs',
    };
  }
}
