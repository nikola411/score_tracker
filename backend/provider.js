const { Redis } = require('@upstash/redis');

const redis = new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL,
    token: process.env.UPSTASH_REDIS_REST_TOKEN,
});

// Upstash auto-serializes/deserializes JSON — no manual JSON.parse/stringify needed
const readCache = async (key) => {
    const val = await redis.get(key);
    return val ?? null;
};

const writeCache = async (key, data) => {
    await redis.set(key, data);
};

const appendCache = async (key, data) => {
    const existing = await redis.get(key) || [];
    existing.push(data);
    await redis.set(key, existing);
};

module.exports = { readCache, writeCache, appendCache };
