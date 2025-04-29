export default () => ({
  environment: process.env.NODE_ENV,
  port: parseInt(process.env.PORT ?? '3000', 10),
  timezone: process.env.TZ,
  initContainer: process.env.INIT_CONTAINER,
});
