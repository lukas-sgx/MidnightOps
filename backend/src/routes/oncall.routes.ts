import { pool } from "../config/db";
import { Router } from "express";
import { authenticateToken } from "../middlewares/jwt";
import redisClient from "../config/redis";

const router = Router();

router.get("/oncall", async (req, res) => {
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

    await pool.query('SELECT * FROM oncall_shifts WHERE NOW() BETWEEN starts_at AND ends_at;').then((result) => {
        return res.status(200).json({ oncall: result.rows });
    }).catch((err) => {
        console.error('Error fetching on-call schedule from database', err);
        return res.status(500).json({ message: "Internal Server Error" });
    });
});

export default router;