import { pool } from "../config/db";
import { Router } from "express";
import { authenticateToken } from "../middlewares/jwt";
import "../config/redis";
import redisClient from "../config/redis";

const router = Router();

router.get("/metrics", async (req, res) => {
    const token = req.headers.authorization?.split(" ")[1] || "";
    const userData = authenticateToken(token);

    if (userData == null) {
        return res.status(401).json({ message: "Unauthorized" });
    }

    const blacklistedToken = await redisClient.get(`auth_token_${userData.email}`);
    if (blacklistedToken === token) {
        return res.status(401).json({ message: "Unauthorized" });
    }
    
    try {
        const [redisMetrics, errorsRes, totalUsersRes, activeUsersRes] = await Promise.all([
            redisClient.hGetAll("arch"),
            pool.query("SELECT COUNT(*) FROM incidents WHERE created_at >= (NOW() - INTERVAL '1 DAY')"),
            pool.query("SELECT COUNT(*) FROM users"),
            pool.query("SELECT COUNT(*) FROM users WHERE last_active >= (NOW() - INTERVAL '1 DAY')")
        ]);

        const parseMetric = (value?: string) => {
            if (!value) return 0;
            try {
                return JSON.parse(value);
            } catch (_err) {
                return Number(value) || 0;
            }
        };

        const cpu = parseMetric(redisMetrics.cpu);
        const memory = parseMetric(redisMetrics.memory);
        const deployments = parseMetric(redisMetrics.deployments);
        const timestamp = parseMetric(redisMetrics.timestamp);
        const errors = errorsRes.rows[0].count;
        const totalUsers = totalUsersRes.rows[0].count;
        const activeUsers = activeUsersRes.rows[0].count;
        const uptime = parseMetric(redisMetrics.uptime);

        return res.status(200).json({ cpu, memory, deployments, timestamp, errors, totalUsers, activeUsers, uptime });
    } catch (err) {
        console.error("Error fetching metrics", err);
        return res.status(500).json({ message: "Internal Server Error" });
    }
});

export default router;