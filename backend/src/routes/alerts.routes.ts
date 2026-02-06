import { Router } from "express";
import { pool } from "../config/db";
import redisClient from '../config/redis';
import { authenticateToken } from "../middlewares/jwt";
import { notifyOncallUser } from "../utils/notifications";

const router = Router();

router.get("/alerts", async (req, res) => {
    const token = req.headers.authorization?.split(" ")[1] || "";
    const userData = authenticateToken(token);
    if (userData == null) {
        return res.status(401).json({ message: "Unauthorized" });
    }
    const blacklistedToken = await redisClient.get(`auth_token_${userData.email}`);
    if (blacklistedToken === token) {
        return res.status(401).json({ message: "Unauthorized" });
    }

    try {
        const alertsResult = await pool.query('SELECT * FROM alerts WHERE status != $1 ORDER BY created_at DESC LIMIT 4', ['RESOLVED']);
        return res.status(200).json({ alerts: alertsResult.rows });
    } catch (err) {
        console.error('Error fetching user data', err);
        return res.status(500).json({ message: "Internal Server Error" });
    }
});

async function fetchOncall() {
    try {
        const result = await pool.query('SELECT * FROM oncall_shifts WHERE NOW() BETWEEN starts_at AND ends_at;');
        return result.rows;
    } catch (err) {
        console.error('Error fetching on-call schedule from database', err);
        return [];
    }
}

router.post("/alerts/ingest", async (req, res) => {
    const { source, severity, message, correlation_key } = req.body;

    if (!source || !severity || !message || !correlation_key) {
        return res.status(400).json({ message: "Missing required fields" });
    }

    try {
        const duplicateCheck = await pool.query(
            'SELECT * FROM alerts WHERE correlation_key = $1 AND status != $2 AND created_at >= NOW() - INTERVAL \'10 minutes\'',
            [correlation_key, 'RESOLVED']
        );

        if (duplicateCheck.rows.length > 0) {
            return res.status(409).json({ message: "Duplicate alert" });
        }

        const incidentResult = await pool.query('INSERT INTO incidents (title, description, severity, status, created_at) VALUES ($1, $2, $3, $4, NOW()) RETURNING *',
            [source, message, severity, 'OPEN']
        );
        const incidentId = incidentResult.rows[0].id;

        const insertResult = await pool.query(
            'INSERT INTO alerts (source, severity, message, correlation_key, incident_id, status, created_at) VALUES ($1, $2, $3, $4, $5, $6, NOW()) RETURNING *',
            [source, severity, message, correlation_key, incidentId, 'OPEN']
        );

        fetchOncall().then(async (oncallShifts) => {
            for (const shift of oncallShifts) {
                const userId = shift.user_id;
                const userResult = await pool.query('SELECT * FROM users WHERE id = $1', [userId]);
                if (userResult.rows.length > 0) {
                    const user = userResult.rows[0];
                    notifyOncallUser(user.email, insertResult.rows[0].id, message, severity);
                }
            }
        });

        return res.status(201).json({ alert: insertResult.rows[0] });
    } catch (err) {
        console.error('Error inserting alert into database', err);
        return res.status(500).json({ message: `Internal Server Error: ${err}` });
    }
});
export default router;