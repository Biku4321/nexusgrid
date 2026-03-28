const router = require('express').Router();
const { pool } = require('../config/db');
const { getRedis } = require('../config/redis');
const os = require('os');

// GET /api/metrics — system observability snapshot
router.get('/metrics', async (req, res) => {
  const [metadataCount, auditCount, recentErrors, avgResponseTime] = await Promise.all([
    pool.query('SELECT COUNT(*) FROM metadata'),
    pool.query('SELECT COUNT(*) FROM audit_logs'),
    pool.query(
      `SELECT COUNT(*) FROM audit_logs
       WHERE status_code >= 400 AND created_at > NOW() - INTERVAL '1 hour'`
    ),
    pool.query(
      `SELECT ROUND(AVG(duration_ms)) AS avg_ms
       FROM audit_logs
       WHERE created_at > NOW() - INTERVAL '1 hour'`
    ),
  ]);

  const redis = getRedis();
  const redisInfo = await redis.info('memory');
  const redisMemMatch = redisInfo.match(/used_memory_human:(\S+)/);
  const redisMemory = redisMemMatch ? redisMemMatch[1] : 'unknown';

  return res.json({
    timestamp: new Date().toISOString(),
    system: {
      uptime:     Math.floor(process.uptime()),
      memoryUsed: `${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)}MB`,
      cpuLoad:    os.loadavg()[0].toFixed(2),
    },
    database: {
      metadataRecords: parseInt(metadataCount.rows[0].count),
      auditRecords:    parseInt(auditCount.rows[0].count),
    },
    performance: {
      errorsLastHour:      parseInt(recentErrors.rows[0].count),
      avgResponseTimeMs:   parseInt(avgResponseTime.rows[0].avg_ms) || 0,
    },
    cache: {
      redisMemory,
    },
  });
});

module.exports = router;