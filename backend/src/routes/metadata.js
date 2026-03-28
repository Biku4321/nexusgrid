const router = require('express').Router();
const { pool } = require('../config/db');
const { cacheMiddleware, invalidateCache } = require('../middleware/cache');
const logger = require('../logger');

// POST /api/metadata — store metadata
router.post('/metadata', async (req, res) => {
  const { title, description, filePath } = req.body;

  if (!title) {
    return res.status(400).json({ error: 'title is required' });
  }

  const result = await pool.query(
    `INSERT INTO metadata (title, description, file_path)
     VALUES ($1, $2, $3)
     RETURNING id, title, description, file_path AS "filePath", created_at AS "createdAt"`,
    [title, description || null, filePath || null]
  );

  // Bust cache so next GET returns fresh data
  await invalidateCache('metadata');

  logger.info('Metadata stored', { id: result.rows[0].id, title });
  return res.status(201).json(result.rows[0]);
});

// GET /api/metadata — retrieve all metadata (cached)
router.get('/metadata', cacheMiddleware('metadata'), async (req, res) => {
  const result = await pool.query(
    `SELECT id, title, description, file_path AS "filePath", created_at AS "createdAt"
     FROM metadata
     ORDER BY created_at DESC`
  );

  return res.json(result.rows);
});

module.exports = router;