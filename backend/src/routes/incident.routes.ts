import { Router } from "express";
import { pool } from "../config/db";
import { authenticateToken } from "../middlewares/jwt";
import redisClient from '../config/redis';

const router = Router();

router.get("/incidents", async (req, res) => {
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
    await pool.query('SELECT * FROM incidents WHERE status != $1 ORDER BY created_at DESC LIMIT 2', ['RESOLVED']).then((result) => {
        return res.status(200).json({ incidents: result.rows });
    }).catch((err) => {
        console.error('Error fetching incidents from database', err);
        return res.status(500).json({ message: "Internal Server Error" });
    });
});

router.post("/incidents", async (req, res) => {
    const { title, description, severity } = req.body;

    if (!authenticateToken(req.headers.authorization?.split(" ")[1] || "") != null) {
        return res.status(401).json({ message: "Unauthorized" });
    }

    if (!title || !description || !severity) {
        return res.status(400).json({ message: "Missing required fields" });
    }

    const query = 'INSERT INTO incidents (title, description, severity, status, created_at) VALUES ($1, $2, $3, $4, NOW()) RETURNING *';
    const values = [title, description, severity, 'open'];

    await pool.query(query, values).then((result) => {
        return res.status(201).json({ incident: result.rows[0] });
    }).catch((err) => {
        console.error('Error inserting incident into database', err);
        return res.status(500).json({ message: "Internal Server Error" });
    });
});

router.get("/incidents/:id", async (req, res) => {
    const { id } = req.params;

    if (!authenticateToken(req.headers.authorization?.split(" ")[1] || "") != null) {
        return res.status(401).json({ message: "Unauthorized" });
    }

    await pool.query('SELECT * FROM incidents WHERE id = $1', [id]).then((result) => {
        if (result.rows.length === 0) {
            return res.status(404).json({ message: "Incident not found" });
        }
        return res.status(200).json({ incident: result.rows[0] });
    }).catch((err) => {
        console.error('Error fetching incident from database', err);
        return res.status(500).json({ message: "Internal Server Error" });
    });
});

router.get("/incidents/:id/alerts", async (req, res) => {
    const { id } = req.params;
    if (!authenticateToken(req.headers.authorization?.split(" ")[1] || "") != null) {
        return res.status(401).json({ message: "Unauthorized" });
    }
    await pool.query('SELECT * FROM alerts WHERE incident_id = $1', [id]).then((result) => {
        return res.status(200).json({ alerts: result.rows });
    }).catch((err) => {
        console.error('Error fetching alerts from database', err);
        return res.status(500).json({ message: "Internal Server Error" });
    });
});

export default router;