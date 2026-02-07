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
    
    const { status, severity, team_id } = req.query;
    
    let query = `
        SELECT i.*, s.name as service_name, t.name as team_name, u.name as acknowledged_by_name
        FROM incidents i
        LEFT JOIN services s ON i.service_id = s.id
        LEFT JOIN teams t ON s.team_id = t.id
        LEFT JOIN users u ON i.acknowledged_by = u.id
        WHERE 1=1
    `;
    const params: any[] = [];

    if (status) {
        params.push(status);
        query += ` AND i.status = $${params.length}`;
    } else {
        query += " AND i.status != 'RESOLVED'";
    }

    if (severity) {
        params.push(severity);
        query += ` AND i.severity = $${params.length}`;
    }

    if (team_id) {
        params.push(team_id);
        query += ` AND s.team_id = $${params.length}`;
    }

    query += ' ORDER BY i.created_at DESC LIMIT 50';

    pool.query(query, params).then((result) => {
        return res.status(200).json({ incidents: result.rows });
    }).catch((err) => {
        console.error('Error fetching incidents from database', err);
        return res.status(500).json({ message: "Internal Server Error" });
    });
});

router.post("/incidents", async (req, res) => {
    const { title, description, severity, service_id } = req.body;
    const token = req.headers.authorization?.split(" ")[1] || "";
    const userData = authenticateToken(token);
    if (userData == null) {
        return res.status(401).json({ message: "Unauthorized" });
    }

    if (!title || !description || !severity) {
        return res.status(400).json({ message: "Missing required fields" });
    }

    const query = 'INSERT INTO incidents (title, description, severity, status, created_at, service_id) VALUES ($1, $2, $3, $4, NOW(), $5) RETURNING *';
    const values = [title, description, severity, 'OPEN', service_id];

    await pool.query(query, values).then((result) => {
        return res.status(201).json({ incident: result.rows[0] });
    }).catch((err) => {
        console.error('Error inserting incident into database', err);
        return res.status(500).json({ message: "Internal Server Error" });
    });
});

router.get("/incidents/:id", async (req, res) => {
    const { id } = req.params;

    if (authenticateToken(req.headers.authorization?.split(" ")[1] || "") == null) {
        return res.status(401).json({ message: "Unauthorized" });
    }

    const query = `
        SELECT i.*, s.name as service_name, t.name as team_name, u.name as acknowledged_by_name
        FROM incidents i
        LEFT JOIN services s ON i.service_id = s.id
        LEFT JOIN teams t ON s.team_id = t.id
        LEFT JOIN users u ON i.acknowledged_by = u.id
        WHERE i.id = $1
    `;

    await pool.query(query, [id]).then((result) => {
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

router.patch("/incidents/:id/status", async (req, res) => {
    const { id } = req.params;
    const { status, postmortem } = req.body;
    const token = req.headers.authorization?.split(" ")[1] || "";
    const userData = authenticateToken(token);
    if (userData == null) {
        return res.status(401).json({ message: "Unauthorized" });
    }

    if (status === undefined && postmortem === undefined) {
        return res.status(400).json({ message: "Missing required fields" });
    }

    try {
        const updates: string[] = [];
        const params: any[] = [];

        if (status) {
            updates.push(`status = $${params.length + 1}`);
            params.push(status);

            if (status === 'ACKNOWLEDGED') {
                updates.push(`acknowledged_at = NOW()`);
                updates.push(`acknowledged_by = $${params.length + 1}`);
                params.push(userData.userId);
            } else if (status === 'RESOLVED') {
                updates.push(`resolved_at = NOW()`);
            }
        }

        if (postmortem !== undefined) {
            updates.push(`postmortem = $${params.length + 1}`);
            params.push(postmortem);
        }

        if (updates.length === 0) {
             return res.status(400).json({ message: "Nothing to update" });
        }

        params.push(id);
        const query = `UPDATE incidents SET ${updates.join(', ')} WHERE id = $${params.length} RETURNING *`;

        const result = await pool.query(query, params);
        if (result.rows.length === 0) {
            return res.status(404).json({ message: "Incident not found" });
        }

        if (status === 'RESOLVED') {
            pool.query('UPDATE alerts SET status = $1 WHERE incident_id = $2 AND status != $1', [status, id]).catch((err) => {
                console.error('Error updating related alerts status', err);
            });
        }

        const joinedQuery = `
            SELECT i.*, s.name as service_name, t.name as team_name, u.name as acknowledged_by_name
            FROM incidents i
            LEFT JOIN services s ON i.service_id = s.id
            LEFT JOIN teams t ON s.team_id = t.id
            LEFT JOIN users u ON i.acknowledged_by = u.id
            WHERE i.id = $1
        `;
        const joinedResult = await pool.query(joinedQuery, [id]);

        return res.status(200).json({ incident: joinedResult.rows[0] });
    } catch (err) {
        console.error('Error updating incident status', err);
        return res.status(500).json({ message: "Internal Server Error" });
    }
});

export default router;