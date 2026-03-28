const router = require('express').Router();
const multer = require('multer');
const { minioClient, BUCKET } = require('../config/minio');
const logger = require('../logger');

// Store files in memory before streaming to MinIO
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB
});

// POST /api/upload-file
router.post('/upload-file', upload.single('file'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file provided. Use field name "file".' });
  }

  const objectName = `${Date.now()}-${req.file.originalname.replace(/\s+/g, '_')}`;

  await minioClient.putObject(
    BUCKET,
    objectName,
    req.file.buffer,
    req.file.size,
    { 'Content-Type': req.file.mimetype }
  );

  const fileUrl = `/storage/${BUCKET}/${objectName}`;

  logger.info('File uploaded', { objectName, size: req.file.size });

  return res.status(201).json({
    message:    'File uploaded successfully',
    objectName,
    filePath:   fileUrl,
    size:       req.file.size,
    mimetype:   req.file.mimetype,
  });
});

// GET /api/get-file?name=<objectName>
router.get('/get-file', async (req, res) => {
  const { name } = req.query;

  if (!name) {
    return res.status(400).json({ error: 'Query param "name" is required' });
  }

  try {
    const stat = await minioClient.statObject(BUCKET, name);
    const stream = await minioClient.getObject(BUCKET, name);

    res.setHeader('Content-Type', stat.metaData['content-type'] || 'application/octet-stream');
    res.setHeader('Content-Length', stat.size);
    res.setHeader('Content-Disposition', `inline; filename="${name}"`);

    stream.pipe(res);

    logger.info('File retrieved', { name, size: stat.size });
  } catch (err) {
    if (err.code === 'NoSuchKey' || err.message?.includes('Not Found')) {
      return res.status(404).json({ error: 'File not found' });
    }
    throw err;
  }
});

module.exports = router;