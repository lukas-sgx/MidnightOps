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

    const blacklistedToken = await redisClient.get(`auth_token_${userData.email}`);
    if (blacklistedToken === token) {
        return res.status(401).json({ message: "Unauthorized" });
    }

    const query = `
        SELECT s.id, u.name as user_name, u.email as user_email, t.name as team_name, s.starts_at, s.ends_at
        FROM oncall_shifts s
        JOIN users u ON s.user_id = u.id
        JOIN oncall_schedules os ON s.schedule_id = os.id
        JOIN teams t ON os.team_id = t.id
        WHERE NOW() BETWEEN s.starts_at AND s.ends_at
    `;

    try {
        const result = await pool.query(query);
        return res.status(200).json({ oncall: result.rows });
    } catch (err) {
        console.error('Error fetching on-call schedule from database', err);
        return res.status(500).json({ message: "Internal Server Error" });
    }
});

// CRUD for On-Call Schedules
router.post("/oncall/schedules", async (req, res) => {
    if (authenticateToken(req.headers.authorization?.split(" ")[1] || "") == null) {
        return res.status(401).json({ message: "Unauthorized" });
    }
    const { name, description, team_id } = req.body;
    try {
        const result = await pool.query(
            "INSERT INTO oncall_schedules (name, description, team_id) VALUES ($1, $2, $3) RETURNING *",
            [name, description, team_id]
        );
        res.status(201).json({ schedule: result.rows[0] });
    } catch (err) {
        console.error("Error creating on-call schedule", err);
        res.status(500).json({ message: "Internal Server Error" });
    }
});

router.get("/oncall/schedules", async (req, res) => {
    if (authenticateToken(req.headers.authorization?.split(" ")[1] || "") == null) {
        return res.status(401).json({ message: "Unauthorized" });
    }
    try {
        const result = await pool.query("SELECT * FROM oncall_schedules");
        res.status(200).json({ schedules: result.rows });
    } catch (err) {
        console.error("Error fetching on-call schedules", err);
        res.status(500).json({ message: "Internal Server Error" });
    }
});

router.post("/oncall/shifts", async (req, res) => {
    if (authenticateToken(req.headers.authorization?.split(" ")[1] || "") == null) {
        return res.status(401).json({ message: "Unauthorized" });
    }
    const { schedule_id, user_id, starts_at, ends_at } = req.body;
    try {
        const result = await pool.query(
            "INSERT INTO oncall_shifts (schedule_id, user_id, starts_at, ends_at) VALUES ($1, $2, $3, $4) RETURNING *",
            [schedule_id, user_id, starts_at, ends_at]
        );
        res.status(201).json({ shift: result.rows[0] });
    } catch (err) {
        console.error("Error creating on-call shift", err);
        res.status(500).json({ message: "Internal Server Error" });
    }
});

router.delete("/oncall/shifts/:id", async (req, res) => {
    if (authenticateToken(req.headers.authorization?.split(" ")[1] || "") == null) {
        return res.status(401).json({ message: "Unauthorized" });
    }
    try {
        await pool.query("DELETE FROM oncall_shifts WHERE id = $1", [req.params.id]);
        res.status(200).json({ message: "Shift deleted" });
    } catch (err) {
        console.error("Error deleting shift", err);
        res.status(500).json({ message: "Internal Server Error" });
    }
});

export default router;