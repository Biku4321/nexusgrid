const { createClient } = require('redis');
const logger = require('../logger');

let client;

async function connectRedis() {
  client = createClient({
    socket: {
      host: process.env.REDIS_HOST || 'redis',
      port: parseInt(process.env.REDIS_PORT) || 6379,
    },
    password: process.env.REDIS_PASSWORD || 'redissecret',
  });

  client.on('error', (err) => logger.error('Redis error', { error: err.message }));
  client.on('reconnecting', () => logger.warn('Redis reconnecting...'));

  await client.connect();
  logger.info('Redis connected');
}

function getRedis() {
  return client;
}

module.exports = { connectRedis, getRedis };