import { Router } from "express";
import { pool } from "../config/db";
import redisClient from '../config/redis';
import { authenticateToken } from "../middlewares/jwt";

const router = Router();

router.get("/alerts", async (req, res) => {
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
        const alertsResult = await pool.query('SELECT * FROM alerts WHERE status != $1 ORDER BY created_at DESC LIMIT 4', ['RESOLVED']);
        return res.status(200).json({ alerts: alertsResult.rows });
    } catch (err) {
        console.error('Error fetching user data', err);
        return res.status(500).json({ message: "Internal Server Error" });
    }
});

export default router;