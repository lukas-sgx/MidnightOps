import { Router } from "express";
import pool from "../config/db";
import redisClient from "../config/redis";

const router = Router();

async function isDatabaseConnected(): Promise<boolean> {
    try {
        await pool.query('SELECT 1');
        return true;
    } catch (_err) {
        return false;
    }
}

async function isRedisConnected(): Promise<boolean> {
    try {
        await redisClient.ping();
        return true;
    } catch (_err) {
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
    if (await isDatabaseConnected() == true) {
        result.services.postgres = true;
    }
    if (await isRedisConnected() == true) {
        result.services.redis = true;
    }
    if (result.services.api == true && result.services.postgres == true && result.services.redis == true) {
        result.status = "OK";
        result.message = "Service is healthy";
    } else {
        return res.status(500).json(result);
    }
  return res.status(200).json(result); 
});

export default router;