import { pool } from "../config/db";
import { Router } from "express";
import { authenticateToken } from "../middlewares/jwt";
import redisClient from "../config/redis";

const router = Router();

router.get("/services", async (req, res) => {
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
        SELECT s.id, s.name, s.description, t.name as team_name,
        (SELECT count(*) FROM incidents i WHERE i.service_id = s.id AND i.status != 'RESOLVED') as active_incidents
        FROM services s
        LEFT JOIN teams t ON s.team_id = t.id
        ORDER BY s.name ASC
    `;

    try {
        const result = await pool.query(query);
        return res.status(200).json({ services: result.rows });
    } catch (err) {
        console.error('Error fetching services from database', err);
        return res.status(500).json({ message: "Internal Server Error" });
    }
});

router.post("/services", async (req, res) => {
    const token = req.headers.authorization?.split(" ")[1] || "";
    const userData = authenticateToken(token);
    if (userData == null) {
        return res.status(401).json({ message: "Unauthorized" });
    }

    const { name, description, team_id } = req.body;
    try {
        const result = await pool.query(
            "INSERT INTO services (name, description, team_id) VALUES ($1, $2, $3) RETURNING *",
            [name, description, team_id]
        );
        res.status(201).json({ service: result.rows[0] });
    } catch (err) {
        console.error('Error creating service', err);
        res.status(500).json({ message: "Internal Server Error" });
    }
});

router.delete("/services/:id", async (req, res) => {
    const token = req.headers.authorization?.split(" ")[1] || "";
    const userData = authenticateToken(token);
    if (userData == null) {
        return res.status(401).json({ message: "Unauthorized" });
    }

    const { id } = req.params;
    try {
        await pool.query("DELETE FROM services WHERE id = $1", [id]);
        res.status(204).send();
    } catch (err) {
        console.error('Error deleting service', err);
        res.status(500).json({ message: "Internal Server Error" });
    }
});

export default router;
