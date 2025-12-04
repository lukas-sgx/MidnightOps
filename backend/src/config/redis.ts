import { createClient } from "redis";

const redisClient = createClient({
    url: `redis://${process.env.REDIS_HOST}:${process.env.REDIS_PORT}`
});

async function connectRedis() {
    await redisClient.connect();
    console.log(`Connected to Redis on ${process.env.REDIS_HOST}:${process.env.REDIS_PORT}`);
}

export default redisClient;
export { connectRedis };