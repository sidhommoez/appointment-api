import process from 'process';

export const configuration = () => ({
  environment: process.env.NODE_ENV,
  port: parseInt(process.env.PORT ?? '3000', 10),
  timezone: process.env.TZ,
  winstonLogLevel: process.env.LOG_LEVEL,
  redis: {
    host: process.env.REDIS_HOST,
    port: Number(process.env.REDIS_PORT),
    db: Number(process.env.REDIS_DB),
  },
  initContainer: process.env.INIT_CONTAINER,
});
