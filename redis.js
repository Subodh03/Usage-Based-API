let redis = null

try {
  const Redis = require('ioredis')
  redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379', {
    lazyConnect: true,
    connectTimeout: 3000,
    maxRetriesPerRequest: 1,
  })
  redis.on('connect', () => console.log('Redis connected'))
  redis.on('error', () => {
    redis = null 
  })
} catch (e) {
  redis = null
}

module.exports = {
  get: async (key) => redis ? redis.get(key) : null,
  set: async (key, val, ...args) => redis ? redis.set(key, val, ...args) : null,
  del: async (key) => redis ? redis.del(key) : null,
  incr: async (key) => redis ? redis.incr(key) : null,
  expire: async (key, ttl) => redis ? redis.expire(key, ttl) : null,
}
