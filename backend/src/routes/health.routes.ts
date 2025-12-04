import { Router } from "express";
import pool from "../config/db";
import redisClient from "../config/redis";

const router = Router();

function isDatabaseConnected(): any {
    pool.query('SELECT 1', (err) => {
        if (err) {
            return false;
        }
    });
    return true;
}

async function isRedisConnected(): Promise<boolean> {
    try {
        await redisClient.ping();
        return true;
    } catch (err) {
        return false;
    }
}

router.get("/", async (_req, res) => {
    var result = {
        status: "FAIL",
        message: "Service is unhealthy",
        services: {
            api : true,
            postgres: false,
            redis: false,
        }
    };
    if (isDatabaseConnected() == true) {
        result.services.postgres = true;
    }
    if (await isRedisConnected() == true) {
        result.services.redis = true;
    }
    if (result.services.api == true && result.services.postgres == true && result.services.redis == true) {
        result.status = "OK";
        result.message = "Service is healthy";
    }
  return res.status(200).json(result); 
});

export default router;