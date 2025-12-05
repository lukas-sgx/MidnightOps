import { Router } from "express";
import { isDatabaseConnected, pool } from "../config/db";

const router = Router();

router.get("/incidents", async (_req, res) => {
    await pool.query('SELECT * FROM incidents').then((result) => {
        return res.status(200).json({ incidents: result.rows });
    }).catch((err) => {
        console.error('Error fetching incidents from database', err);
        return res.status(500).json({ message: "Internal Server Error" });
    });
});

router.post("/incidents", async (req, res) => {
    const { title, description, severity } = req.body;

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

export default router;