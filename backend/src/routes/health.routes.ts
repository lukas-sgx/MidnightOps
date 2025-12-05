import { Router } from "express";
import { isDatabaseConnected } from "../config/db";
import { isRedisConnected } from "../config/redis";

const router = Router();

router.get("/health", async (_req, res) => {
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