require('express-async-errors');
require('dotenv').config();

const express = require('express');
const cors    = require('cors');
const helmet  = require('helmet');
const logger  = require('./logger');

const { connectDB }    = require('./config/db');
const { connectRedis } = require('./config/redis');
const { initMinio }    = require('./config/minio');

const auditLogger = require('./middleware/auditLogger');

const healthRouter   = require('./routes/health');
const metadataRouter = require('./routes/metadata');
const filesRouter    = require('./routes/files');
const auditRouter    = require('./routes/audit');
const metricsRouter  = require('./routes/metrics');

const app  = express();
const PORT = process.env.PORT || 3000;

// ── Security & parsing ─────────────────────────────────────────────
app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors());
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));

// ── Request audit logging ──────────────────────────────────────────
app.use(auditLogger);

// ── HTTP request logger ────────────────────────────────────────────
app.use((req, _res, next) => {
  logger.info(`${req.method} ${req.originalUrl}`, { ip: req.ip });
  next();
});

// ── Routes ─────────────────────────────────────────────────────────
app.use('/api', healthRouter);
app.use('/api', metadataRouter);
app.use('/api', filesRouter);
app.use('/api', auditRouter);
app.use('/api', metricsRouter);

// ── 404 ────────────────────────────────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// ── Global error handler ───────────────────────────────────────────
app.use((err, _req, res, _next) => {
  logger.error('Unhandled error', { error: err.message, stack: err.stack });
  res.status(500).json({ error: 'Internal server error', message: err.message });
});

// ── Bootstrap ──────────────────────────────────────────────────────
async function bootstrap() {
  try {
    logger.info('Connecting to services...');
    await connectDB();
    await connectRedis();
    await initMinio();

    app.listen(PORT, '0.0.0.0', () => {
      logger.info(`NexusGrid backend running on port ${PORT}`);
    });
  } catch (err) {
    logger.error('Bootstrap failed', { error: err.message });
    process.exit(1);
  }
}

bootstrap();
