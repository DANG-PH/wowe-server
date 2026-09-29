import 'reflect-metadata';
import 'dotenv/config';
import { join } from 'path';
import { DataSource } from 'typeorm';
import configuration from '../config/configuration';

const cfg = configuration();

/** DataSource dùng cho TypeORM CLI (sinh & chạy migration) và cho script seed. */
export const AppDataSource = new DataSource({
  type: 'mysql',
  host: cfg.database.host,
  port: cfg.database.port,
  username: cfg.database.username,
  password: cfg.database.password,
  database: cfg.database.database,
  entities: [join(__dirname, '..', 'entities', '*.entity.{ts,js}')],
  migrations: [join(__dirname, 'migrations', '*.{ts,js}')],
  charset: 'utf8mb4',
  timezone: 'Z',
});

export default AppDataSource;
