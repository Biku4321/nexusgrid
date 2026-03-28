const { getRedis } = require('../config/redis');
const logger = require('../logger');

const TTL = parseInt(process.env.CACHE_TTL_SECONDS) || 60;

function cacheMiddleware(keyPrefix) {
  return async (req, res, next) => {
    const redis = getRedis();
    const key = `${keyPrefix}:${req.originalUrl}`;

    try {
      const cached = await redis.get(key);
      if (cached) {
        logger.info('Cache HIT', { key });
        return res.json({ ...JSON.parse(cached), _cache: 'HIT' });
      }
    } catch (err) {
      logger.warn('Cache read failed, bypassing', { error: err.message });
    }

    // Intercept res.json to store response in cache
    const originalJson = res.json.bind(res);
    res.json = async (body) => {
      try {
        await redis.setEx(key, TTL, JSON.stringify(body));
        logger.info('Cache SET', { key, ttl: TTL });
      } catch (err) {
        logger.warn('Cache write failed', { error: err.message });
      }
      return originalJson(body);
    };

    next();
  };
}

async function invalidateCache(keyPrefix) {
  const redis = getRedis();
  try {
    const keys = await redis.keys(`${keyPrefix}:*`);
    if (keys.length > 0) {
      await redis.del(keys);
      logger.info('Cache invalidated', { prefix: keyPrefix, count: keys.length });
    }
  } catch (err) {
    logger.warn('Cache invalidation failed', { error: err.message });
  }
}

module.exports = { cacheMiddleware, invalidateCache };