import { Router } from "express";
import { isDatabaseConnected } from "../config/db";
import redisClient, { isRedisConnected } from "../config/redis";
import { authenticateToken } from "../middlewares/jwt";

const router = Router();

router.get("/health", async (req, res) => {
    var result = {
        status: "FAIL",
        message: "Service is unhealthy",
        services: {
            api: true,
            postgres: false,
            redis: false,
        }
    };
    const token = req.headers.authorization?.split(" ")[1] || "";
    const userData = authenticateToken(token);
    if (userData == null) {
        return res.status(401).json({ message: "Unauthorized" });
    }
    await redisClient.get(`auth_token_${userData.email}`).then((storedToken) => {
        if (storedToken === token) {
            return res.status(401).json({ message: "Unauthorized" });
        }
    });
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