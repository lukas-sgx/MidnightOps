import { createClient } from "redis";

const redisClient = createClient({
    url: `redis://${process.env.REDIS_HOST}:${process.env.REDIS_PORT}`,
    socket: {
        connectTimeout: 10000,
    }
});

async function connectRedis() {
    await redisClient.connect();
    console.log(`Connected to Redis on ${process.env.REDIS_HOST}:${process.env.REDIS_PORT}`);
}

redisClient.on('error', (err) => {
    console.error('Unexpected error on idle client', err);
})

export default redisClient;
export { connectRedis };