const router = require('express').Router();
const { pool } = require('../config/db');
const { getRedis } = require('../config/redis');
const { minioClient, BUCKET } = require('../config/minio');

router.get('/health', async (req, res) => {
  const checks = {};
  let allOk = true;

  // PostgreSQL
  try {
    await pool.query('SELECT 1');
    checks.postgres = 'ok';
  } catch {
    checks.postgres = 'error';
    allOk = false;
  }

  // Redis
  try {
    const redis = getRedis();
    await redis.ping();
    checks.redis = 'ok';
  } catch {
    checks.redis = 'error';
    allOk = false;
  }

  // MinIO
  try {
    await minioClient.bucketExists(BUCKET);
    checks.minio = 'ok';
  } catch {
    checks.minio = 'error';
    allOk = false;
  }

  const statusCode = allOk ? 200 : 503;
  return res.status(statusCode).json({
    status: allOk ? 'ok' : 'degraded',
    timestamp: new Date().toISOString(),
    services: checks,
  });
});

module.exports = router;