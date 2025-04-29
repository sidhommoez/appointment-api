import { DataSource, DataSourceOptions } from 'typeorm';
import { join } from 'path';
import 'dotenv/config';
import * as dotenv from 'dotenv';

dotenv.config();
const toEnvBoolean = (dataStr): boolean => {
  return (
    dataStr?.toLowerCase?.() === 'true' ||
    dataStr === true ||
    Number.parseInt(dataStr, 10) === 0
  );
};

const config = new DataSource({
  type: 'postgres',
  migrations: process.env.PSQL_MIGRATIONS_DIR
    ? (process.env.PSQL_MIGRATIONS_DIR?.split(',') || []).map((path) =>
        join(__dirname, ...path.split('/'), '*{.ts,.js}'),
      )
    : [],
  entities: [join(__dirname, '**', '*.entity.{ts,js}')],
  synchronize: false,
  logging: toEnvBoolean(process.env.DB_LOGGING) || false,
  migrationsRun: toEnvBoolean(process.env.PSQL_MIGRATION) || false,
  poolSize: parseInt(process.env.PSQL_POOL_SIZE ?? '10', 10),
  password: process.env.PSQL_PASSWORD,
  username: process.env.PSQL_USERNAME,
  database: process.env.PSQL_DB,
  host: process.env.PSQL_HOST,
  extra: {
    max: parseInt(process.env.PSQL_POOL_SIZE ?? '10', 10),
    connectionTimeoutMillis: parseInt(
      process.env.PSQL_CONN_TIMEOUT ?? '2000',
      10,
    ),
    idleTimeoutMillis: parseInt(process.env.PSQL_IDLE_TIMEOUT ?? '10000', 10),
  },
} as DataSourceOptions);

export default config;
