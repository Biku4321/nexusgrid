const router = require('express').Router();
const { pool } = require('../config/db');

// GET /api/audit — last 100 requests
router.get('/audit', async (req, res) => {
  const limit = Math.min(parseInt(req.query.limit) || 100, 500);

  const result = await pool.query(
    `SELECT id, method, path, status_code AS "statusCode",
            ip_address AS "ipAddress", duration_ms AS "durationMs",
            created_at AS "createdAt"
     FROM audit_logs
     ORDER BY created_at DESC
     LIMIT $1`,
    [limit]
  );

  return res.json({ count: result.rows.length, logs: result.rows });
});

module.exports = router;