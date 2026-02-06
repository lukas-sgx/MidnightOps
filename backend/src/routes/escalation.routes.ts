import { Router } from "express";
import { pool } from "../config/db";
import { authenticateToken } from "../middlewares/jwt";

const router = Router();

router.get("/escalation-policies", async (req, res) => {
    if (authenticateToken(req.headers.authorization?.split(" ")[1] || "") == null) {
        return res.status(401).json({ message: "Unauthorized" });
    }

    try {
        const result = await pool.query(`
            SELECT ep.*, s.name as service_name 
            FROM escalation_policies ep
            LEFT JOIN services s ON ep.service_id = s.id
            ORDER BY ep.created_at DESC
        `);
        res.status(200).json({ policies: result.rows });
    } catch (err) {
        console.error("Error fetching escalation policies:", err);
        res.status(500).json({ message: "Internal Server Error" });
    }
});

router.post("/escalation-policies", async (req, res) => {
    if (authenticateToken(req.headers.authorization?.split(" ")[1] || "") == null) {
        return res.status(401).json({ message: "Unauthorized" });
    }

    const { name, description, service_id } = req.body;
    if (!name) return res.status(400).json({ message: "Name is required" });

    try {
        const result = await pool.query(
            "INSERT INTO escalation_policies (name, description, service_id) VALUES ($1, $2, $3) RETURNING *",
            [name, description, service_id]
        );
        res.status(201).json({ policy: result.rows[0] });
    } catch (err) {
        console.error("Error creating escalation policy:", err);
        res.status(500).json({ message: "Internal Server Error" });
    }
});

router.delete("/escalation-policies/:id", async (req, res) => {
    if (authenticateToken(req.headers.authorization?.split(" ")[1] || "") == null) {
        return res.status(401).json({ message: "Unauthorized" });
    }

    const { id } = req.params;
    try {
        await pool.query("DELETE FROM escalation_policies WHERE id = $1", [id]);
        res.status(200).json({ message: "Policy deleted" });
    } catch (err) {
        console.error("Error deleting escalation policy:", err);
        res.status(500).json({ message: "Internal Server Error" });
    }
});

// Escalation Policy Levels CRUD
router.get("/escalation-policies/:id/levels", async (req, res) => {
    if (authenticateToken(req.headers.authorization?.split(" ")[1] || "") == null) {
        return res.status(401).json({ message: "Unauthorized" });
    }

    const { id } = req.params;
    try {
        const result = await pool.query(`
            SELECT epl.*, u.name as user_name, t.name as team_name
            FROM escalation_policy_levels epl
            LEFT JOIN users u ON epl.user_id = u.id
            LEFT JOIN teams t ON epl.team_id = t.id
            WHERE escalation_policy_id = $1
            ORDER BY level_index ASC
        `, [id]);
        res.status(200).json({ levels: result.rows });
    } catch (err) {
        console.error("Error fetching policy levels:", err);
        res.status(500).json({ message: "Internal Server Error" });
    }
});

router.post("/escalation-policies/:id/levels", async (req, res) => {
    if (authenticateToken(req.headers.authorization?.split(" ")[1] || "") == null) {
        return res.status(401).json({ message: "Unauthorized" });
    }

    const { id } = req.params;
    const { level_index, delay_minutes, user_id, team_id } = req.body;

    if (level_index === undefined || delay_minutes === undefined) {
        return res.status(400).json({ message: "Missing required fields" });
    }

    try {
        const result = await pool.query(
            "INSERT INTO escalation_policy_levels (escalation_policy_id, level_index, delay_minutes, user_id, team_id) VALUES ($1, $2, $3, $4, $5) RETURNING *",
            [id, level_index, delay_minutes, user_id, team_id]
        );
        res.status(201).json({ level: result.rows[0] });
    } catch (err) {
        console.error("Error creating policy level:", err);
        res.status(500).json({ message: "Internal Server Error" });
    }
});

router.delete("/escalation-levels/:levelId", async (req, res) => {
    if (authenticateToken(req.headers.authorization?.split(" ")[1] || "") == null) {
        return res.status(401).json({ message: "Unauthorized" });
    }

    const { levelId } = req.params;
    try {
        await pool.query("DELETE FROM escalation_policy_levels WHERE id = $1", [levelId]);
        res.status(200).json({ message: "Level deleted" });
    } catch (err) {
        console.error("Error deleting policy level:", err);
        res.status(500).json({ message: "Internal Server Error" });
    }
});

export default router;
