import { Router } from "express";
import { pool } from "../config/db";
import { authenticateToken } from "../middlewares/jwt";

const router = Router();

router.get("/me", async (req, res) => {
    const token = req.headers.authorization?.split(" ")[1] || "";
    const userData = authenticateToken(token);
    if (userData == null) {
        return res.status(401).json({ message: "Unauthorized" });
    }

    try {
        const result = await pool.query(
            'SELECT id, email, name, role, created_at FROM users WHERE id = $1',
            [userData.userId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ message: "User not found" });
        }

        return res.status(200).json({ user: result.rows[0] });
    } catch (err) {
        console.error('Error fetching user data', err);
        return res.status(500).json({ message: "Internal Server Error" });
    }
});

export default router;