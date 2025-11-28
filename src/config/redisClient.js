const redis = require('redis');

const redisClient = redis.createClient({
    username: 'default',
    password: 'zdJI4QLGN8hxKhfXIFqVPyYhm3iwraYW',
    socket: {
        host: process.env.REDIS_HOST || 'redis-19102.c265.us-east-1-2.ec2.cloud.redislabs.com',
        port: process.env.REDIS_PORT || 19102
    }
});

redisClient.on('error', (err) => {
  console.error('Redis Client Error', err);
});

(async () => {
  try {
    await redisClient.connect();

    await redisClient.set('foo', 'bar');
    const result = await redisClient.get('foo');
    console.log(result)  // >>> bar
  } catch (err) {
    console.error('❌ Redis Cloud connection failed', err);
  }
})();

module.exports = redisClient;