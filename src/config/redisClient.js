// src/config/redisClient.js
const { createClient } = require('redis');

const redisClient = createClient({
  username: 'default',
  password: '3THSm82DR3CgzHKfTtXFmoNHQ2zNTfY4',
  socket: {
    host: 'redis-11593.crce217.ap-south-1-1.ec2.cloud.redislabs.com',
    port: 11593,
    // tls: true, // only if your Redis Cloud db says TLS is required
    connectTimeout: 10000,
    keepAlive: 30000,
  },
});

// just log, don't throw
redisClient.on('error', (err) => {
  console.error('Redis Client Error:', err.message);
});

// expose a safe init function
async function connectRedis() {
  if (redisClient.isOpen || redisClient.isReady) return;

  try {
    await redisClient.connect();
    console.log('✅ Redis connected');

    // optional smoke-test; you can remove this entirely
    // await redisClient.set('foo', 'bar');
    // console.log('Redis test:', await redisClient.get('foo'));
  } catch (error) {
    console.error('❌ Redis connect failed:', error.message);
    // DO NOT rethrow – app should still run without Redis
  }
}

module.exports = {
  redisClient,
  connectRedis,
};
