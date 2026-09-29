import { Controller, Get } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { DataSource } from 'typeorm';
import { Public } from '../../common/decorators/public.decorator';
import { RedisService } from '../../redis/redis.service';

@ApiTags('health')
@Controller('health')
export class HealthController {
  constructor(
    private readonly dataSource: DataSource,
    private readonly redis: RedisService,
  ) {}

  @Public()
  @Get()
  async check() {
    const db = await this.dataSource
      .query('SELECT 1')
      .then(() => true)
      .catch(() => false);
    const redis = await this.redis
      .getClient()
      .ping()
      .then((r) => r === 'PONG')
      .catch(() => false);
    return {
      status: db && redis ? 'ok' : 'degraded',
      db,
      redis,
      timestamp: new Date().toISOString(),
    };
  }
}
