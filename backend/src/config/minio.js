const Minio = require('minio');
const logger = require('../logger');

const minioClient = new Minio.Client({
  endPoint:  process.env.MINIO_ENDPOINT  || 'minio',
  port:      parseInt(process.env.MINIO_PORT) || 9000,
  useSSL:    process.env.MINIO_USE_SSL === 'true',
  accessKey: process.env.MINIO_ROOT_USER     || 'minioadmin',
  secretKey: process.env.MINIO_ROOT_PASSWORD || 'minioadmin123',
});

const BUCKET = process.env.MINIO_BUCKET || 'nexusgrid-files';

async function initMinio() {
  // Retry loop — MinIO may take a moment to start
  for (let attempt = 1; attempt <= 10; attempt++) {
    try {
      const exists = await minioClient.bucketExists(BUCKET);
      if (!exists) {
        await minioClient.makeBucket(BUCKET, 'us-east-1');
        logger.info(`MinIO bucket "${BUCKET}" created`);
      } else {
        logger.info(`MinIO bucket "${BUCKET}" already exists`);
      }

      // Set public read policy so /storage/* proxy works
      const policy = JSON.stringify({
        Version: '2012-10-17',
        Statement: [{
          Effect: 'Allow',
          Principal: { AWS: ['*'] },
          Action:    ['s3:GetObject'],
          Resource:  [`arn:aws:s3:::${BUCKET}/*`],
        }],
      });
      await minioClient.setBucketPolicy(BUCKET, policy);
      logger.info('MinIO initialized successfully');
      return;
    } catch (err) {
      logger.warn(`MinIO init attempt ${attempt} failed: ${err.message}`);
      await new Promise(r => setTimeout(r, 2000));
    }
  }
  throw new Error('MinIO failed to initialize after 10 attempts');
}

module.exports = { minioClient, BUCKET, initMinio };