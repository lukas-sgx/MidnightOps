import { Router } from "express";
import { authenticateToken } from "./jwt";
import redisClient from '../config/redis';

const router = Router();

router.post("/logout", async (req, res) => {
    const token = req.headers.authorization?.split(" ")[1] || "";
    const userData = authenticateToken(token);
    
    if (userData == null) {
        return res.status(401).json({ message: "Unauthorized" });
    }
    await redisClient.set(`auth_token_${userData.email}`, token, { EX: 3600 * 24 });
    res.status(200).json({ message: "Logged out successfully" });
});

export default router;