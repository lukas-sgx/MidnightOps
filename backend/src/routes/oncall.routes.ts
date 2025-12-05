import { pool } from "../config/db";
import { Router } from "express";

const router = Router();

router.get("/oncall", async (_req, res) => {
    await pool.query('SELECT * FROM oncall_shifts WHERE NOW() BETWEEN starts_at AND ends_at;').then((result) => {
        return res.status(200).json({ oncall: result.rows });
    }).catch((err) => {
        console.error('Error fetching on-call schedule from database', err);
        return res.status(500).json({ message: "Internal Server Error" });
    });
});

export default router;