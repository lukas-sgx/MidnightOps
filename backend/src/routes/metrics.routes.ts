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

    await redisClient.get(`auth_token_${userData.email}`).then((storedToken) => {
        if (storedToken === token) {
            return res.status(401).json({ message: "Unauthorized" });
        }
    });
    
    try {
        const redisMetrics = await redisClient.hGetAll("arch");

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
        const errors = await pool.query("select COUNT(*) from incidents WHERE created_at BETWEEN (NOW() - INTERVAL '1 DAY') AND NOW()");
        const totalUsers = await pool.query("SELECT COUNT(*) FROM users");
        const activeUsers = await pool.query("SELECT COUNT(*) FROM users WHERE last_active >= (NOW() - INTERVAL '1 DAY')");
        const uptime = parseMetric(redisMetrics.uptime);

        return res.status(200).json({ cpu, memory, deployments, timestamp, errors: errors.rows[0].count, totalUsers: totalUsers.rows[0].count, activeUsers: activeUsers.rows[0].count, uptime });
    } catch (err) {
        console.error("Error fetching metrics", err);
        return res.status(500).json({ message: "Internal Server Error" });
    }
});

export default router;