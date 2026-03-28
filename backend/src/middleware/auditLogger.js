const { pool } = require('../config/db');
const logger = require('../logger');

function auditLogger(req, res, next) {
  const start = Date.now();

  res.on('finish', async () => {
    const duration = Date.now() - start;
    try {
      await pool.query(
        `INSERT INTO audit_logs (method, path, status_code, ip_address, duration_ms)
         VALUES ($1, $2, $3, $4, $5)`,
        [
          req.method,
          req.originalUrl,
          res.statusCode,
          req.headers['x-real-ip'] || req.ip,
          duration,
        ]
      );
    } catch (err) {
      logger.warn('Audit log insert failed', { error: err.message });
    }
  });

  next();
}

module.exports = auditLogger;